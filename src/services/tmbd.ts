import "server-only";

const TMDB_API_URL = "https://api.themoviedb.org/3";

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

function getApiKey() {
  const apiKey = process.env.TMBD_API_KEY;

  if (!apiKey) {
    throw new Error("TMBD_API_KEY is not configured");
  }

  return apiKey;
}

async function requestTmdb<T>(url: URL) {
  url.searchParams.set("api_key", getApiKey());

  const response = await fetch(url, {
    headers: { accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
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
    url.searchParams.set(
      "primary_release_date.gte",
      `${options.releaseYear.from}-01-01`,
    );
  }
  if (options.releaseYear?.to) {
    url.searchParams.set(
      "primary_release_date.lte",
      `${options.releaseYear.to}-12-31`,
    );
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
