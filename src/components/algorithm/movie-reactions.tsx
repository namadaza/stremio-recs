"use client";

import { useQuery } from "@tanstack/react-query";
import { Film, LoaderCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import Image from "next/image";

import { getAlgorithmMovieReactions } from "@/actions/algorithm-actions";
import { QUERY_KEYS } from "@/lib/query-keys";
import type { MovieReaction } from "@/services/search-feedback-service";

export function MovieReactions() {
  const reactions = useQuery({
    queryKey: QUERY_KEYS.algorithmMovieReactions(),
    queryFn: getAlgorithmMovieReactions,
  });

  if (reactions.isPending) {
    return (
      <div className="mt-10 flex min-h-48 items-center justify-center border border-white/8 bg-white/[0.015] text-stone-600">
        <LoaderCircle className="mr-2 size-4 animate-spin" />
        <span className="text-[10px] tracking-[0.14em] uppercase">Loading taste signals</span>
      </div>
    );
  }

  if (reactions.isError) {
    return (
      <p className="mt-10 border border-red-300/15 bg-red-300/[0.04] p-4 text-sm text-red-200/70">
        {reactions.error instanceof Error
          ? reactions.error.message
          : "Unable to load your movie reactions."}
      </p>
    );
  }

  const liked = reactions.data.filter((item) => item.value === "up");
  const disliked = reactions.data.filter((item) => item.value === "down");

  return (
    <div className="mt-10 grid gap-10 xl:grid-cols-2 xl:gap-8">
      <ReactionCollection
        title="Liked"
        description="Titles the algorithm should move toward."
        items={liked}
        value="up"
      />
      <ReactionCollection
        title="Disliked"
        description="Titles the algorithm should learn to avoid."
        items={disliked}
        value="down"
      />
    </div>
  );
}

type ReactionItem = Awaited<ReturnType<typeof getAlgorithmMovieReactions>>[number];

function ReactionCollection({
  title,
  description,
  items,
  value,
}: {
  title: string;
  description: string;
  items: ReactionItem[];
  value: MovieReaction;
}) {
  const Icon = value === "up" ? ThumbsUp : ThumbsDown;

  return (
    <section>
      <header className="flex items-end justify-between border-b border-white/8 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-amber-100/55 uppercase">
            <Icon className="size-3.5" /> {title}
          </div>
          <p className="mt-2 text-xs text-stone-600">{description}</p>
        </div>
        <span className="font-mono text-xs text-stone-600">{items.length}</span>
      </header>

      {items.length === 0 ? (
        <div className="grid min-h-36 place-items-center border-b border-white/8 text-center">
          <div>
            <Film className="mx-auto size-5 text-stone-700" strokeWidth={1.25} />
            <p className="mt-3 text-xs text-stone-600">No {title.toLowerCase()} movies yet.</p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-white/8">
          {items.map((item) => (
            <article key={item.id} className="flex gap-4 py-4">
              <div className="relative aspect-[2/3] w-16 shrink-0 overflow-hidden rounded-sm bg-white/[0.04]">
                {item.posterUrl ? (
                  <Image
                    src={item.posterUrl}
                    alt={`Poster for ${item.title}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-stone-700">
                    <Film className="size-5" strokeWidth={1} />
                  </div>
                )}
              </div>
              <div className="min-w-0 py-1">
                <p className="text-[9px] tracking-[0.16em] text-amber-100/40 uppercase">
                  {item.releaseDate?.slice(0, 4) || "Unknown year"}
                  {item.language ? ` · ${item.language}` : ""}
                </p>
                <h3 className="mt-1 truncate font-heading text-lg text-stone-100">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-stone-600">
                  {item.overview || "No synopsis is available for this title."}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
