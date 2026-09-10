"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Film, LoaderCircle, Search, ThumbsDown, ThumbsUp } from "lucide-react";
import Image from "next/image";
import { FormEvent, useState } from "react";

import { reactToMovie, searchMovies } from "@/actions/search-actions";
import { Button } from "@/components/ui/button";
import { QUERY_KEYS } from "@/lib/query-keys";
import { cn } from "@/lib/utils";
import type { MovieReaction } from "@/services/search-feedback-service";

export function MovieSearch() {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  const search = useQuery({
    queryKey: QUERY_KEYS.movieSearch(query),
    queryFn: () => searchMovies(query),
    enabled: query.length > 0,
  });

  const reaction = useMutation({
    mutationFn: reactToMovie,
    onMutate: async ({ tmdbId, value }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.movieSearch(query) });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof searchMovies>>>(
        QUERY_KEYS.movieSearch(query),
      );

      queryClient.setQueryData<Awaited<ReturnType<typeof searchMovies>>>(
        QUERY_KEYS.movieSearch(query),
        (current) =>
          current
            ? { ...current, reactions: { ...current.reactions, [tmdbId]: value } }
            : current,
      );

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEYS.movieSearch(query), context.previous);
      }
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.movieSearch(query) }),
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.algorithmMovieReactions() }),
      ]);
    },
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = input.trim();
    if (nextQuery) setQuery(nextQuery);
  }

  function toggleReaction(tmdbId: number, value: MovieReaction) {
    reaction.mutate({ tmdbId, value });
  }

  return (
    <>
      <form onSubmit={submit} className="mt-9 flex max-w-3xl gap-2">
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
          {search.isFetching ? <LoaderCircle className="animate-spin" /> : <Search />}
          Search
        </Button>
      </form>

      {search.isError && (
        <p className="mt-8 border border-red-300/15 bg-red-300/[0.04] p-4 text-sm text-red-200/70">
          {search.error instanceof Error ? search.error.message : "Unable to search TMDB."}
        </p>
      )}

      {search.data && (
        <div className="mt-10">
          <p className="mb-5 text-[10px] tracking-[0.18em] text-stone-600 uppercase">
            {search.data.total_results.toLocaleString()} results for “{query}”
          </p>
          {search.data.results.length === 0 ? (
            <div className="border-t border-white/8 py-8 text-sm text-stone-600">
              No movies matched your search.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {search.data.results.map((movie) => {
                const selected = search.data.reactions[movie.id];
                const year = movie.release_date?.slice(0, 4) || "Unknown year";

                return (
                  <article
                    key={movie.id}
                    className="flex min-h-52 overflow-hidden rounded-sm border border-white/9 bg-white/[0.025]"
                  >
                    <div className="relative w-32 shrink-0 bg-white/[0.03]">
                      {movie.poster_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
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
                        {year} · {movie.original_language}
                      </p>
                      <h2 className="mt-2 font-heading text-xl text-stone-100">{movie.title}</h2>
                      <p className="mt-2 line-clamp-4 text-xs leading-5 text-stone-500">
                        {movie.overview || "No synopsis is available for this title."}
                      </p>
                      <div className="mt-auto flex gap-2 pt-4">
                        <ReactionButton
                          label={`Like ${movie.title}`}
                          selected={selected === "up"}
                          onClick={() => toggleReaction(movie.id, "up")}
                        >
                          <ThumbsUp />
                        </ReactionButton>
                        <ReactionButton
                          label={`Dislike ${movie.title}`}
                          selected={selected === "down"}
                          onClick={() => toggleReaction(movie.id, "down")}
                        >
                          <ThumbsDown />
                        </ReactionButton>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!query && (
        <div className="mt-12 border-t border-white/8 py-8 text-xs leading-6 text-stone-600">
          Search TMDB and react to films to give your recommendation profile stronger signals.
        </div>
      )}
    </>
  );
}

function ReactionButton({
  children,
  label,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-full border transition [&_svg]:size-3.5",
        selected
          ? "border-amber-100/40 bg-amber-100/10 text-amber-100"
          : "border-white/10 text-stone-600 hover:border-white/25 hover:text-stone-200",
      )}
    >
      {children}
    </button>
  );
}
