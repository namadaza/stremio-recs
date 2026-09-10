import "server-only";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_REQUEST_TIMEOUT_MS = 10_000;
const TMDB_MAX_ATTEMPTS = 3;
const TMDB_MAX_CONCURRENT_REQUESTS = 4;
const TMDB_DEFAULT_RETRY_MS = 1_000;
const TMDB_MAX_RETRY_MS = 10_000;

let activeRequests = 0;
let rateLimitedUntil = 0;
const requestWaiters: Array<() => void> = [];

export type TmdbMovie = {
  adult: boolean;
  backdrop_path: string | null;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string | null;
  release_date: string;
  title: string;
  video: boolean;
  vote_average: number;
  vote_count: number;
};

export type TmdbKeyword = {
  id: number;
  name: string;
};

export type TmdbGenre = {
  id: number;
  name: string;
};

type TmdbPagedResponse<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

type TmdbGenreResponse = {
  genres: TmdbGenre[];
};

export type TmdbDiscoverMoviesOptions = {
  page?: number;
  sortBy?:
    | "popularity.desc"
    | "vote_average.desc"
    | "primary_release_date.desc"
    | "revenue.desc";
  keywordIds?: number[];
  keywordMatch?: "all" | "any";
  excludedKeywordIds?: number[];
  genreIds?: number[];
  excludedGenreIds?: number[];
  originalLanguage?: string;
  releaseYear?: { from?: number; to?: number };
  minimumVoteCount?: number;
};

export class TmdbRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly retryable = false,
  ) {
    super(message);
    this.name = "TmdbRequestError";
  }
}

function getApiKey() {
  // Keep supporting the original misspelled variable while accepting TMDB's name.
  const apiKey = process.env.TMDB_API_KEY ?? process.env.TMBD_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY (or legacy TMBD_API_KEY) is not configured");
  }

  return apiKey;
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function acquireRequestSlot() {
  if (activeRequests < TMDB_MAX_CONCURRENT_REQUESTS) {
    activeRequests += 1;
    return;
  }

  // A released slot is transferred directly to the next waiter.
  await new Promise<void>((resolve) => requestWaiters.push(resolve));
}

function releaseRequestSlot() {
  const next = requestWaiters.shift();
  if (next) next();
  else activeRequests -= 1;
}

function retryDelay(response: Response, attempt: number) {
  const retryAfter = response.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) return Math.min(seconds * 1_000, TMDB_MAX_RETRY_MS);

    const dateDelay = Date.parse(retryAfter) - Date.now();
    if (Number.isFinite(dateDelay)) return Math.min(Math.max(dateDelay, 0), TMDB_MAX_RETRY_MS);
  }

  return Math.min(TMDB_DEFAULT_RETRY_MS * 2 ** attempt, TMDB_MAX_RETRY_MS);
}

function updateRateLimitWindow(response: Response) {
  const remainingHeader = response.headers.get("x-ratelimit-remaining");
  const resetHeader = response.headers.get("x-ratelimit-reset");
  if (!remainingHeader || !resetHeader) return;

  const remaining = Number(remainingHeader);
  const reset = Number(resetHeader);
  if (remaining === 0 && Number.isFinite(reset)) {
    // TMDB-style reset headers are epoch seconds.
    rateLimitedUntil = Math.max(rateLimitedUntil, reset * 1_000);
  }
}

async function requestTmdb<T>(url: URL) {
  url.searchParams.set("api_key", getApiKey());
  let lastError: unknown;

  for (let attempt = 0; attempt < TMDB_MAX_ATTEMPTS; attempt += 1) {
    await acquireRequestSlot();
    try {
      const waitForRateLimit = rateLimitedUntil - Date.now();
      if (waitForRateLimit > 0) await sleep(Math.min(waitForRateLimit, TMDB_MAX_RETRY_MS));

      const response = await fetch(url, {
        headers: { accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(TMDB_REQUEST_TIMEOUT_MS),
      });
      updateRateLimitWindow(response);

      if (response.ok) return (await response.json()) as T;

      const retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      const delay = retryDelay(response, attempt);
      if (response.status === 429) rateLimitedUntil = Math.max(rateLimitedUntil, Date.now() + delay);

      const error = new TmdbRequestError(
        `TMDB request failed with status ${response.status}`,
        response.status,
        retryable,
      );
      if (!retryable || attempt === TMDB_MAX_ATTEMPTS - 1) throw error;
      lastError = error;
      await sleep(delay);
    } catch (error) {
      if (error instanceof TmdbRequestError && !error.retryable) throw error;
      lastError = error;
      if (attempt === TMDB_MAX_ATTEMPTS - 1) break;
      await sleep(Math.min(TMDB_DEFAULT_RETRY_MS * 2 ** attempt, TMDB_MAX_RETRY_MS));
    } finally {
      releaseRequestSlot();
    }
  }

  const timedOut = lastError instanceof Error && lastError.name === "TimeoutError";
  throw new TmdbRequestError(
    timedOut ? "TMDB request timed out after retries" : "TMDB request failed after retries",
    lastError instanceof TmdbRequestError ? lastError.status : undefined,
    true,
  );
}

export async function searchTmdbMovies(query: string, page = 1) {
  const url = new URL(`${TMDB_API_URL}/search/movie`);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", String(page));

  return requestTmdb<TmdbPagedResponse<TmdbMovie>>(url);
}

export async function searchTmdbKeywords(query: string, page = 1) {
  const url = new URL(`${TMDB_API_URL}/search/keyword`);
  url.searchParams.set("query", query);
  url.searchParams.set("page", String(page));

  return requestTmdb<TmdbPagedResponse<TmdbKeyword>>(url);
}

export async function getTmdbMovieGenres() {
  const url = new URL(`${TMDB_API_URL}/genre/movie/list`);
  url.searchParams.set("language", "en");

  return requestTmdb<TmdbGenreResponse>(url);
}

export async function discoverTmdbMovies(options: TmdbDiscoverMoviesOptions = {}) {
  const url = new URL(`${TMDB_API_URL}/discover/movie`);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("include_video", "false");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", String(options.page ?? 1));
  url.searchParams.set("sort_by", options.sortBy ?? "popularity.desc");

  if (options.keywordIds?.length) {
    url.searchParams.set(
      "with_keywords",
      options.keywordIds.join(options.keywordMatch === "all" ? "," : "|"),
    );
  }
  if (options.excludedKeywordIds?.length) {
    url.searchParams.set("without_keywords", options.excludedKeywordIds.join(","));
  }
  if (options.genreIds?.length) {
    url.searchParams.set("with_genres", options.genreIds.join("|"));
  }
  if (options.excludedGenreIds?.length) {
    url.searchParams.set("without_genres", options.excludedGenreIds.join(","));
  }
  if (options.originalLanguage) {
    url.searchParams.set("with_original_language", options.originalLanguage);
  }
  if (options.releaseYear?.from) {
    url.searchParams.set("primary_release_date.gte", `${options.releaseYear.from}-01-01`);
  }
  if (options.releaseYear?.to) {
    url.searchParams.set("primary_release_date.lte", `${options.releaseYear.to}-12-31`);
  }
  if (options.minimumVoteCount) {
    url.searchParams.set("vote_count.gte", String(options.minimumVoteCount));
  }

  return requestTmdb<TmdbPagedResponse<TmdbMovie>>(url);
}

export async function getTmdbMovie(movieId: number) {
  const url = new URL(`${TMDB_API_URL}/movie/${movieId}`);
  url.searchParams.set("language", "en-US");

  return requestTmdb<TmdbMovie>(url);
}
