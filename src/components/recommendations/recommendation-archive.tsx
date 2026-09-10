"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Film, LoaderCircle, Sparkles } from "lucide-react";
import Image from "next/image";

import { getRecommendationHistory } from "@/actions/recommendation-actions";
import { QUERY_KEYS } from "@/lib/query-keys";
import { cn } from "@/lib/utils";

type Batch = Awaited<ReturnType<typeof getRecommendationHistory>>[number];

export function RecommendationArchive() {
  const history = useQuery({
    queryKey: QUERY_KEYS.recommendations.history,
    queryFn: getRecommendationHistory,
  });

  if (history.isPending) {
    return (
      <div className="mt-10 grid min-h-52 place-items-center border border-white/8 bg-white/[0.015] text-stone-600">
        <div className="text-center">
          <LoaderCircle className="mx-auto size-5 animate-spin" />
          <p className="mt-4 text-[10px] tracking-[0.16em] uppercase">
            Loading recommendation archive
          </p>
        </div>
      </div>
    );
  }

  if (history.isError) {
    return (
      <p className="mt-10 border border-red-300/15 bg-red-300/[0.04] p-4 text-sm text-red-200/70">
        {history.error instanceof Error
          ? history.error.message
          : "Unable to load your recommendation archive."}
      </p>
    );
  }

  if (history.data.length === 0) {
    return (
      <div className="mt-10 grid min-h-52 place-items-center border-y border-white/8 px-6 text-center">
        <div>
          <Film className="mx-auto size-6 text-stone-700" strokeWidth={1.25} />
          <p className="mt-4 text-xs tracking-[0.14em] text-stone-600 uppercase">
            No recommendation batches yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-12">
      {history.data.map((batch) => (
        <BatchArchive key={batch.batchId} batch={batch} />
      ))}
    </div>
  );
}

function BatchArchive({ batch }: { batch: Batch }) {
  const generatedAt = new Date(batch.completedAt ?? batch.createdAt);

  return (
    <article>
      <header className="flex flex-col justify-between gap-4 border-b border-white/8 pb-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            {batch.status === "failed" ? (
              <AlertTriangle className="size-3.5 text-red-200/60" />
            ) : (
              <Sparkles className="size-3.5 text-amber-100/55" />
            )}
            <p className="text-[10px] tracking-[0.18em] text-amber-100/55 uppercase">
              Batch {String(batch.batchId).padStart(3, "0")}
            </p>
            <StatusBadge status={batch.status} active={batch.isActive} />
          </div>
          <h2 className="mt-3 font-heading text-2xl text-stone-100">
            {generatedAt.toLocaleDateString(undefined, {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </h2>
        </div>
        <div className="text-left text-[9px] tracking-[0.14em] text-stone-600 uppercase sm:text-right">
          <p>{batch.recommendations.length} films</p>
          <p className="mt-1">{batch.trigger} · {batch.model ?? "No model recorded"}</p>
        </div>
      </header>

      {batch.error && (
        <p className="mt-4 border-l border-red-300/20 pl-4 text-xs leading-5 text-red-200/60">
          {batch.error}
        </p>
      )}

      {batch.recommendations.length > 0 ? (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {batch.recommendations.map((movie, index) => (
            <div key={movie.recommendationId} className="min-w-0">
              <div className="relative aspect-[2/3] overflow-hidden rounded-sm border border-white/8 bg-white/[0.025]">
                {movie.posterUrl ? (
                  <Image
                    src={movie.posterUrl}
                    alt={`Poster for ${movie.title}`}
                    fill
                    sizes="(min-width: 1280px) 16vw, (min-width: 640px) 25vw, 50vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-stone-700">
                    <Film className="size-6" strokeWidth={1} />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-transparent" />
                <span className="absolute top-3 left-3 font-mono text-[8px] text-white/60">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div className="absolute inset-x-0 bottom-0 p-3">
                  <p className="text-[8px] tracking-[0.14em] text-amber-100/45 uppercase">
                    {movie.releaseDate?.slice(0, 4) || "Unknown"}
                    {movie.language ? ` · ${movie.language}` : ""}
                  </p>
                  <h3 className="mt-1 line-clamp-2 font-heading text-base text-stone-100">
                    {movie.title}
                  </h3>
                </div>
              </div>
              <p className="mt-2 line-clamp-1 text-[9px] tracking-[0.1em] text-stone-600 uppercase">
                {movie.reason}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-xs text-stone-700">No movies were saved for this batch.</p>
      )}
    </article>
  );
}

function StatusBadge({ status, active }: { status: Batch["status"]; active: boolean }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[8px] tracking-[0.12em] uppercase",
        status === "failed"
          ? "border-red-300/15 text-red-200/60"
          : active
            ? "border-amber-100/20 bg-amber-100/[0.05] text-amber-100/60"
            : "border-white/10 text-stone-600",
      )}
    >
      {active ? "Current" : status}
    </span>
  );
}
