"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Film,
  LoaderCircle,
  RefreshCw,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  getCurrentRecommendationSelection,
  refreshRecommendations,
} from "@/actions/recommendation-actions";
import { reactToMovie } from "@/actions/search-actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { QUERY_KEYS } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { MovieReaction } from "@/services/search-feedback-service";

type RecommendationSelectionData = NonNullable<
  Awaited<ReturnType<typeof getCurrentRecommendationSelection>>
>;

export function RecommendationSelection() {
  const queryClient = useQueryClient();
  const current = useQuery({
    queryKey: QUERY_KEYS.recommendations.current,
    queryFn: getCurrentRecommendationSelection,
  });
  const refresh = useMutation({
    mutationKey: QUERY_KEYS.recommendations.refresh,
    mutationFn: refreshRecommendations,
    onSuccess: async (selection) => {
      queryClient.setQueryData(QUERY_KEYS.recommendations.current, selection);
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.recommendations.history,
      });
    },
  });
  const reaction = useMutation({
    mutationFn: reactToMovie,
    onMutate: async ({ tmdbId, value }) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.recommendations.current,
      });
      const previous = queryClient.getQueryData<RecommendationSelectionData | null>(
        QUERY_KEYS.recommendations.current,
      );

      queryClient.setQueryData<RecommendationSelectionData | null>(
        QUERY_KEYS.recommendations.current,
        (selection) =>
          selection
            ? {
                ...selection,
                recommendations: selection.recommendations.map((movie) =>
                  movie.tmdbId === tmdbId ? { ...movie, reaction: value } : movie,
                ),
              }
            : selection,
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(QUERY_KEYS.recommendations.current, context?.previous);
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.recommendations.current }),
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.algorithmMovieReactions(),
        }),
      ]);
    },
  });

  const recommendations = current.data?.recommendations ?? [];

  function react(tmdbId: number, value: MovieReaction) {
    reaction.mutate({ tmdbId, value });
  }

  return (
    <div className="w-full">
      <div className="flex flex-col justify-between gap-6 border-b border-white/8 pb-8 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] text-amber-100/55 uppercase">
            <Sparkles className="size-3.5" /> AI curation
          </div>
          <h1 className="mt-4 font-heading text-5xl tracking-[-0.035em] text-stone-50 sm:text-6xl">
            Your selection.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-stone-500">
            A considered set of films, shaped by your preferences and every reaction you leave.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/search"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-10 rounded-full border-white/10 bg-white/[0.03] px-4 text-[10px] tracking-[0.14em] uppercase",
            )}
          >
            <Search /> Search movies
          </Link>
          <Button
            type="button"
            variant="outline"
            onClick={() => refresh.mutate()}
            disabled={refresh.isPending}
            className="h-10 rounded-full border-white/10 bg-white/[0.03] px-4 text-[10px] tracking-[0.14em] uppercase opacity-100"
          >
            {refresh.isPending ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <RefreshCw />
            )}
            {refresh.isPending ? "Curating selection" : "Refresh recommendations"}
          </Button>
        </div>
      </div>

      {(current.isError || refresh.isError) && (
        <p className="mt-8 border border-red-300/15 bg-red-300/[0.04] p-4 text-sm text-red-200/70 sm:col-span-2">
          {(refresh.error ?? current.error) instanceof Error
            ? (refresh.error ?? current.error)?.message
            : "Unable to load recommendations."}
        </p>
      )}

      {(current.isPending || refresh.isPending) && recommendations.length === 0 && (
        <div className="mt-9 grid min-h-72 place-items-center border border-white/8 bg-white/[0.015] text-stone-600">
          <div className="text-center">
            <LoaderCircle className="mx-auto size-5 animate-spin" />
            <p className="mt-4 text-[10px] tracking-[0.16em] uppercase">
              Reading your taste and searching TMDB
            </p>
          </div>
        </div>
      )}

      {recommendations.length > 0 ? (
        <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {recommendations.map((movie, index) => (
            <RecommendationCard
              key={movie.tmdbId}
              movie={movie}
              index={index}
              reacting={reaction.isPending && reaction.variables?.tmdbId === movie.tmdbId}
              onReact={react}
            />
          ))}
        </div>
      ) : !current.isPending && !refresh.isPending ? (
        <div className="mt-9 grid min-h-60 place-items-center border border-white/8 bg-white/[0.015] px-6 text-center">
          <div>
            <Film className="mx-auto size-6 text-stone-700" strokeWidth={1.25} />
            <p className="mt-4 font-heading text-xl text-stone-300">
              Your selection is ready to be curated.
            </p>
            <p className="mt-2 max-w-md text-xs leading-6 text-stone-600">
              Refresh recommendations to turn your liked and disliked movies into a new TMDB
              selection.
            </p>
          </div>
        </div>
      ) : null}

      {reaction.isError && (
        <p className="mt-6 text-xs text-red-200/70">
          {reaction.error instanceof Error
            ? reaction.error.message
            : "Unable to save that reaction."}
        </p>
      )}

      {current.data && (
        <p className="mt-10 border-l border-amber-100/20 pl-4 text-xs leading-5 text-stone-600">
          Generated {new Date(current.data.generatedAt).toLocaleDateString()}. Refresh again for
          a different seeded selection.
        </p>
      )}
    </div>
  );
}

function RecommendationCard({
  movie,
  index,
  reacting,
  onReact,
}: {
  movie: RecommendationSelectionData["recommendations"][number];
  index: number;
  reacting: boolean;
  onReact: (tmdbId: number, value: MovieReaction) => void;
}) {
  const year = movie.releaseDate?.slice(0, 4) || "Unknown year";

  return (
    <article className="group">
      <div className="relative aspect-[2/3] overflow-hidden rounded-sm border border-white/10 bg-linear-to-br from-[#302b25] to-[#080807]">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`Poster for ${movie.title}`}
            fill
            sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full place-items-center text-stone-700">
            <Film className="size-10" strokeWidth={1} />
          </div>
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/25 to-transparent" />
        <span className="absolute top-4 left-4 font-mono text-[9px] text-white/60">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/75 to-transparent p-5 pt-24">
          <p className="text-[9px] tracking-[0.2em] text-amber-100/55 uppercase">
            {movie.source === "manual" ? "Added by you" : movie.exploration[0]} · {year}
            {movie.language ? ` · ${movie.language}` : ""}
          </p>
          <h2 className="mt-2 font-heading text-2xl italic text-stone-50">{movie.title}</h2>
          <p className="mt-3 line-clamp-3 text-xs leading-5 text-stone-400">
            {movie.overview || "No synopsis is available for this title."}
          </p>
          <p className="mt-3 line-clamp-1 text-[9px] tracking-[0.12em] text-amber-100/45 uppercase">
            {movie.reason}
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-1">
          <ReactionButton
            label={`Like ${movie.title}`}
            selected={movie.reaction === "up"}
            disabled={reacting}
            onClick={() => onReact(movie.tmdbId, "up")}
          >
            <ThumbsUp />
          </ReactionButton>
          <ReactionButton
            label={`Dislike ${movie.title}`}
            selected={movie.reaction === "down"}
            disabled={reacting}
            onClick={() => onReact(movie.tmdbId, "down")}
          >
            <ThumbsDown />
          </ReactionButton>
        </div>
        <span className="font-mono text-[9px] text-stone-600">
          {movie.rating && movie.rating > 0 ? movie.rating.toFixed(1) : "—"} TMDB
        </span>
      </div>
    </article>
  );
}

function ReactionButton({
  children,
  label,
  selected,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  selected: boolean;
  disabled: boolean;
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
          : "border-white/10 text-stone-600 hover:border-amber-100/30 hover:text-amber-100",
      )}
    >
      {children}
    </button>
  );
}
