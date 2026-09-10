import { ArrowRight, RefreshCw, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";

const selections = [
  { title: "The Double Life", year: "1991", genre: "Drama", tone: "from-[#3b3027] to-[#090807]" },
  { title: "After the Storm", year: "2016", genre: "Drama", tone: "from-[#243331] to-[#080a09]" },
  { title: "Columbus", year: "2017", genre: "Independent", tone: "from-[#384039] to-[#090a09]" },
  { title: "Decision to Leave", year: "2022", genre: "Mystery", tone: "from-[#26343a] to-[#070809]" },
];

export default function RecommendationsPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col justify-between gap-6 border-b border-white/8 pb-8 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.22em] text-amber-100/55 uppercase">
            <Sparkles className="size-3.5" /> Week 01 · Preview
          </div>
          <h1 className="mt-4 font-heading text-5xl tracking-[-0.035em] text-stone-50 sm:text-6xl">Your selection.</h1>
          <p className="mt-5 max-w-xl text-sm leading-7 text-stone-500">
            A considered set of films, shaped by your preferences and every reaction you leave.
          </p>
        </div>
        <Button variant="outline" disabled className="h-10 rounded-full border-white/10 bg-white/[0.03] px-4 text-[10px] tracking-[0.14em] uppercase opacity-100">
          <RefreshCw /> Refresh selection
        </Button>
      </div>

      <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {selections.map((movie, index) => (
          <article key={movie.title} className="group">
            <div className={`relative aspect-[2/3] overflow-hidden rounded-sm border border-white/10 bg-linear-to-br ${movie.tone}`}>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(235,216,176,.18),transparent_35%)]" />
              <span className="absolute top-4 left-4 font-mono text-[9px] text-white/35">0{index + 1}</span>
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black via-black/60 to-transparent p-5 pt-24">
                <p className="text-[9px] tracking-[0.2em] text-amber-100/45 uppercase">{movie.genre} · {movie.year}</p>
                <h2 className="mt-2 font-heading text-2xl italic text-stone-50">{movie.title}</h2>
                <p className="mt-3 text-xs leading-5 text-stone-500">Selected for its quiet tension and precise visual language.</p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1">
                <button aria-label={`Like ${movie.title}`} className="grid size-8 place-items-center rounded-full border border-white/10 text-stone-600 transition hover:border-amber-100/30 hover:text-amber-100"><ThumbsUp className="size-3.5" /></button>
                <button aria-label={`Dislike ${movie.title}`} className="grid size-8 place-items-center rounded-full border border-white/10 text-stone-600 transition hover:border-white/25 hover:text-stone-200"><ThumbsDown className="size-3.5" /></button>
              </div>
              <button className="flex items-center gap-1.5 text-[9px] tracking-[0.14em] text-stone-600 uppercase transition hover:text-stone-300">Details <ArrowRight className="size-3" /></button>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-10 border-l border-amber-100/20 pl-4 text-xs leading-5 text-stone-600">
        Preview content is shown while your recommendation pipeline is being connected.
      </p>
    </section>
  );
}
