"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Clock3,
  Film,
  History,
  LoaderCircle,
  Plus,
  Search,
  Shuffle,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";

import { addMovieToCurrentBatch } from "@/actions/recommendation-actions";
import {
  getOnDemandRecommendations,
  reactToMovie,
  searchMovies,
} from "@/actions/search-actions";
import { Button } from "@/components/ui/button";
import { QUERY_KEYS } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { MovieReaction } from "@/services/search-feedback-service";

type RecommendationKind = Parameters<typeof getOnDemandRecommendations>[0]["kind"];
type ResultSource = "recommendations" | "search";

type MovieResult = {
  id: number;
  title: string;
  overview: string;
  posterUrl?: string;
  releaseDate: string;
  originalLanguage: string;
  reason?: string;
};

const EXPLORATION_OPTIONS = [
  {
    kind: "recent" as const,
    label: "Recent likes",
    description: "More like the films you have loved lately.",
    icon: Clock3,
  },
  {
    kind: "historical" as const,
    label: "Long-time taste",
    description: "Rediscover patterns across your older favorites.",
    icon: History,
  },
  {
    kind: "wildcard" as const,
    label: "Wildcards",
    description: "Ten thoughtful surprises just outside your usual orbit.",
    icon: Shuffle,
  },
  {
    kind: "custom" as const,
    label: "Describe it",
    description: "Tell Taste exactly what kind of watch you need.",
    icon: Sparkles,
  },
];

export function MovieSearch() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<ResultSource>();
  const [selectedKind, setSelectedKind] = useState<RecommendationKind | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [reactionOverrides, setReactionOverrides] = useState<Record<number, MovieReaction>>({});
  const [addedIds, setAddedIds] = useState<number[]>([]);

  const search = useQuery({
    queryKey: QUERY_KEYS.movieSearch(query),
    queryFn: () => searchMovies(query),
    enabled: query.length > 0,
  });

  const recommendations = useMutation({
    mutationFn: getOnDemandRecommendations,
    onSuccess: () => {
      setReactionOverrides({});
      setAddedIds([]);
    },
  });

  const reaction = useMutation({
    mutationFn: reactToMovie,
    onSuccess: ({ tmdbId, value }) => {
      setReactionOverrides((current) => ({ ...current, [tmdbId]: value }));
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movieSearch(query) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.algorithmMovieReactions() }),
      ]);
    },
  });

  const addToBatch = useMutation({
    mutationFn: addMovieToCurrentBatch,
    onSuccess: async (selection, tmdbId) => {
      setAddedIds((current) => [...new Set([...current, tmdbId])]);
      queryClient.setQueryData(QUERY_KEYS.recommendations.current, selection);
      queryClient.setQueryData<Awaited<ReturnType<typeof searchMovies>>>(
        QUERY_KEYS.movieSearch(query),
        (current) =>
          current
            ? {
                ...current,
                currentBatchMovieIds: [...new Set([tmdbId, ...current.currentBatchMovieIds])],
              }
            : current,
      );
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.recommendations.history,
      });
    },
  });

  function chooseRecommendationKind(kind: RecommendationKind) {
    recommendations.reset();
    setSelectedKind(kind);
    setSource("recommendations");
    if (kind !== "custom") recommendations.mutate({ kind });
  }

  function requestCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const prompt = customPrompt.trim();
    if (!prompt) return;
    setSource("recommendations");
    recommendations.mutate({ kind: "custom", prompt });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = input.trim();
    if (!nextQuery) return;
    setSource("search");
    setReactionOverrides({});
    setAddedIds([]);
    if (nextQuery === query) {
      void search.refetch();
    } else {
      setQuery(nextQuery);
    }
  }

  const recommendationMovies: MovieResult[] =
    recommendations.data?.recommendations.map((movie) => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterUrl: movie.posterPath
        ? `https://image.tmdb.org/t/p/w342${movie.posterPath}`
        : undefined,
      releaseDate: movie.releaseDate,
      originalLanguage: movie.originalLanguage,
      reason: movie.reason,
    })) ?? [];
  const searchResultMovies: MovieResult[] =
    search.data?.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      overview: movie.overview,
      posterUrl: movie.poster_path
        ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
        : undefined,
      releaseDate: movie.release_date,
      originalLanguage: movie.original_language,
    })) ?? [];
  const movies = source === "recommendations" ? recommendationMovies : searchResultMovies;
  const resultData = source === "recommendations" ? recommendations.data : search.data;
  const isLoading =
    (source === "recommendations" && recommendations.isPending) ||
    (source === "search" && search.isFetching);
  const error =
    source === "recommendations"
      ? recommendations.error
      : source === "search"
        ? search.error
        : null;
  const currentBatchId = resultData?.currentBatchId;
  const currentBatchMovieIds = resultData?.currentBatchMovieIds ?? [];
  const reactions = resultData?.reactions ?? {};

  return (
    <>
      <section className="mt-10" aria-labelledby="recommendation-explorer-heading">
        <div>
          <h2 id="recommendation-explorer-heading" className="font-heading text-2xl text-stone-100">
            Find something for tonight.
          </h2>
          <p className="mt-2 text-xs leading-6 text-stone-600">
            Generate a fresh set of ten without changing your current selection.
          </p>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {EXPLORATION_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = selectedKind === option.kind && source === "recommendations";
            return (
              <button
                key={option.kind}
                type="button"
                aria-pressed={active}
                onClick={() => chooseRecommendationKind(option.kind)}
                disabled={recommendations.isPending}
                className={cn(
                  "min-h-28 rounded-sm border p-4 text-left transition disabled:cursor-wait disabled:opacity-60",
                  active
                    ? "border-amber-100/25 bg-amber-100/[0.055]"
                    : "border-white/8 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.035]",
                )}
              >
                <Icon className={cn("size-4", active ? "text-amber-100/70" : "text-stone-600")} />
                <span className="mt-3 block text-xs text-stone-200">{option.label}</span>
                <span className="mt-1 block text-[10px] leading-4 text-stone-600">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {selectedKind === "custom" && (
          <form onSubmit={requestCustom} className="mt-4 flex max-w-3xl gap-2">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Describe what you want to watch</span>
              <input
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value)}
                maxLength={500}
                placeholder="A tense 90-minute mystery, but nothing too bleak…"
                className="h-11 w-full rounded-sm border border-white/10 bg-white/[0.035] px-4 text-sm text-stone-100 outline-none transition placeholder:text-stone-700 focus:border-amber-100/30"
              />
            </label>
            <Button
              type="submit"
              disabled={!customPrompt.trim() || recommendations.isPending}
              className="h-11 rounded-sm px-5 text-[10px] tracking-[0.14em] uppercase"
            >
              <Sparkles /> Find films
            </Button>
          </form>
        )}
      </section>

      <div className="mt-8">
        <p className="text-xs leading-6 text-stone-600">Search the catalog directly.</p>
        <form onSubmit={submitSearch} className="mt-3 flex max-w-3xl gap-2">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search for a movie</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone-600" />
            <input
              type="search"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Search by title…"
              maxLength={200}
              className="h-12 w-full rounded-sm border border-white/10 bg-white/[0.035] pr-4 pl-11 text-sm text-stone-100 outline-none transition placeholder:text-stone-700 focus:border-amber-100/30 focus:bg-white/[0.05]"
            />
          </label>
          <Button
            type="submit"
            disabled={!input.trim() || search.isFetching}
            className="h-12 rounded-sm px-6 text-[10px] tracking-[0.14em] uppercase"
          >
            <Search /> Search
          </Button>
        </form>
      </div>

      <section className="mt-8 border-t border-white/8 pt-8" aria-live="polite">
        {isLoading && <ResultsLoading />}

        {!isLoading && error && (
          <p className="border border-red-300/15 bg-red-300/[0.04] p-4 text-sm text-red-200/70">
            {error instanceof Error ? error.message : "Unable to find movies."}
          </p>
        )}

        {!isLoading && !error && resultData && (
          <>
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-[10px] tracking-[0.18em] text-stone-600 uppercase">
                {source === "search"
                  ? `${search.data?.total_results.toLocaleString() ?? 0} results for “${query}”`
                  : `${movies.length} suggestions`}
              </p>
            </div>
            {movies.length > 0 ? (
              <MovieResultGrid
                movies={movies}
                reactions={reactions}
                reactionOverrides={reactionOverrides}
                currentBatchId={currentBatchId}
                currentBatchMovieIds={currentBatchMovieIds}
                addedIds={addedIds}
                addingId={addToBatch.isPending ? addToBatch.variables : undefined}
                reactingId={reaction.isPending ? reaction.variables?.tmdbId : undefined}
                onAdd={(tmdbId) => addToBatch.mutate(tmdbId)}
                onReact={(tmdbId, value) => reaction.mutate({ tmdbId, value })}
              />
            ) : (
              <div className="py-8 text-sm text-stone-600">
                No movies matched. Try another bucket or a broader search.
              </div>
            )}
          </>
        )}

        {!isLoading && !error && !resultData && (
          <div className="py-8 text-xs leading-6 text-stone-600">
            Choose a recommendation angle or search TMDB to find your next film.
          </div>
        )}

        {(addToBatch.isError || reaction.isError) && (
          <p className="mt-6 border border-red-300/15 bg-red-300/[0.04] p-4 text-sm text-red-200/70">
            {(addToBatch.error ?? reaction.error) instanceof Error
              ? (addToBatch.error ?? reaction.error)?.message
              : "Unable to update that film."}
          </p>
        )}

        {resultData && !currentBatchId && (
          <p className="mt-6 text-xs leading-5 text-stone-600">
            Generate a recommendation batch first, then you can add these results to it.
          </p>
        )}
      </section>
    </>
  );
}

function ResultsLoading() {
  return (
    <div className="grid min-h-52 place-items-center bg-white/[0.015] text-stone-600">
      <div className="text-center">
        <LoaderCircle className="mx-auto size-5 animate-spin" />
        <p className="mt-4 text-[10px] tracking-[0.16em] uppercase">Finding films</p>
      </div>
    </div>
  );
}

function MovieResultGrid({
  movies,
  reactions,
  reactionOverrides,
  currentBatchId,
  currentBatchMovieIds,
  addedIds,
  addingId,
  reactingId,
  onAdd,
  onReact,
}: {
  movies: MovieResult[];
  reactions: Record<number, MovieReaction>;
  reactionOverrides: Record<number, MovieReaction>;
  currentBatchId?: number;
  currentBatchMovieIds: number[];
  addedIds: number[];
  addingId?: number;
  reactingId?: number;
  onAdd: (tmdbId: number) => void;
  onReact: (tmdbId: number, value: MovieReaction) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {movies.map((movie) => {
        const selected = reactionOverrides[movie.id] ?? reactions[movie.id];
        const inCurrentBatch =
          currentBatchMovieIds.includes(movie.id) || addedIds.includes(movie.id);
        return (
          <MovieResultCard
            key={movie.id}
            movie={movie}
            selected={selected}
            inCurrentBatch={inCurrentBatch}
            hasCurrentBatch={Boolean(currentBatchId)}
            adding={addingId === movie.id}
            reacting={reactingId === movie.id}
            onAdd={() => onAdd(movie.id)}
            onReact={(value) => onReact(movie.id, value)}
          />
        );
      })}
    </div>
  );
}

function MovieResultCard({
  movie,
  selected,
  inCurrentBatch,
  hasCurrentBatch,
  adding,
  reacting,
  onAdd,
  onReact,
}: {
  movie: MovieResult;
  selected?: MovieReaction;
  inCurrentBatch: boolean;
  hasCurrentBatch: boolean;
  adding: boolean;
  reacting: boolean;
  onAdd: () => void;
  onReact: (value: MovieReaction) => void;
}) {
  const year = movie.releaseDate?.slice(0, 4) || "Unknown year";

  return (
    <article className="flex min-h-52 overflow-hidden rounded-sm border border-white/9 bg-white/[0.025]">
      <div className="relative w-32 shrink-0 bg-white/[0.03]">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`Poster for ${movie.title}`}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-stone-700">
            <Film className="size-8" strokeWidth={1} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="text-[9px] tracking-[0.16em] text-amber-100/45 uppercase">
          {year} · {movie.originalLanguage}
        </p>
        <h2 className="mt-2 font-heading text-xl text-stone-100">{movie.title}</h2>
        <p className="mt-2 line-clamp-4 text-xs leading-5 text-stone-500">
          {movie.overview || "No synopsis is available for this title."}
        </p>
        {movie.reason && (
          <p className="mt-2 line-clamp-1 text-[9px] tracking-[0.1em] text-stone-600 uppercase">
            {movie.reason}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={!hasCurrentBatch || inCurrentBatch || adding}
            onClick={onAdd}
            title={
              hasCurrentBatch ? undefined : "Generate recommendations before adding a movie"
            }
            className="mr-auto h-8 rounded-full border-white/10 bg-white/[0.025] px-3 text-[9px] tracking-[0.1em] uppercase disabled:opacity-50"
          >
            {adding ? (
              <LoaderCircle className="animate-spin" />
            ) : inCurrentBatch ? (
              <Check />
            ) : (
              <Plus />
            )}
            {inCurrentBatch ? "Added" : "Add"}
          </Button>
          <ReactionButton
            label={`Like ${movie.title}`}
            selected={selected === "up"}
            disabled={reacting}
            onClick={() => onReact("up")}
          >
            <ThumbsUp />
          </ReactionButton>
          <ReactionButton
            label={`Dislike ${movie.title}`}
            selected={selected === "down"}
            disabled={reacting}
            onClick={() => onReact("down")}
          >
            <ThumbsDown />
          </ReactionButton>
        </div>
      </div>
    </article>
  );
}

function ReactionButton({
  children,
  label,
  selected,
  disabled = false,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-full border transition disabled:cursor-wait disabled:opacity-40 [&_svg]:size-3.5",
        selected
          ? "border-amber-100/40 bg-amber-100/10 text-amber-100"
          : "border-white/10 text-stone-600 hover:border-white/25 hover:text-stone-200",
      )}
    >
      {children}
    </button>
  );
}
