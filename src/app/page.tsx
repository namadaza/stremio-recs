import { Clapperboard, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

const frames = [
  { number: "01", title: "Noir", className: "frame-noir" },
  { number: "02", title: "Drama", className: "frame-drama" },
  { number: "03", title: "Auteur", className: "frame-auteur" },
];

export default function Home() {
  return (
    <main className="cinema-shell relative isolate flex min-h-svh flex-col overflow-hidden bg-background text-foreground">
      <div className="cinema-light" aria-hidden="true" />
      <div className="cinema-grain" aria-hidden="true" />
      <div className="cinema-lines" aria-hidden="true" />

      <header className="relative z-20 flex w-full items-center justify-between border-b border-white/8 px-5 py-5 sm:px-8 lg:px-12">
        <a
          href="#top"
          className="group flex items-center gap-3 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Taste home"
        >
          <span className="grid size-8 place-items-center rounded-full border border-white/15 bg-white/[0.04] font-heading text-sm italic text-stone-100 transition-colors group-hover:border-amber-100/40">
            T
          </span>
          <span className="text-[11px] font-medium tracking-[0.28em] text-stone-200 uppercase">
            Taste
          </span>
        </a>

        <div className="flex items-center gap-2.5 text-[10px] font-medium tracking-[0.2em] text-stone-500 uppercase sm:text-[11px]">
          <span className="status-dot" aria-hidden="true" />
          In production
        </div>
      </header>

      <section
        id="top"
        className="relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 grid-cols-1 items-center gap-12 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,1.04fr)_minmax(420px,.96fr)] lg:gap-10 lg:px-12 lg:py-10 xl:px-20"
      >
        <div className="hero-copy flex flex-col items-start lg:pb-10">
          <div className="mb-7 flex items-center gap-3 text-[10px] tracking-[0.28em] text-amber-100/55 uppercase sm:mb-9">
            <Clapperboard className="size-3.5" strokeWidth={1.5} />
            Your next favorite, before you know it
          </div>

          <h1 className="font-heading text-[clamp(5.5rem,24vw,9rem)] leading-[0.7] font-normal tracking-[-0.075em] text-stone-50 sm:text-[10rem] lg:text-[clamp(9rem,14vw,14.5rem)]">
            Taste<span className="text-amber-200">.</span>
          </h1>

          <div className="mt-9 max-w-xl border-l border-amber-100/25 pl-5 sm:mt-12 sm:pl-7">
            <p className="text-balance text-xl leading-snug font-light tracking-[-0.02em] text-stone-200 sm:text-2xl lg:text-[1.7rem]">
              Curated recommendations for your Stremio account.
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-stone-500 sm:text-[15px]">
              Less scrolling. Better watching. A private, considered selection
              shaped by the stories you already love.
            </p>
          </div>

          <div className="mt-8 flex w-full flex-col gap-4 sm:mt-10 sm:w-auto sm:flex-row sm:items-center">
            <Button
              size="lg"
              disabled
              className="h-12 cursor-default rounded-full bg-stone-100 px-6 text-[11px] tracking-[0.16em] text-stone-950 uppercase opacity-100 shadow-[0_10px_50px_rgba(255,255,255,0.08)] disabled:opacity-100"
            >
              Launching soon
              <Sparkles data-icon="inline-end" />
            </Button>
            <span className="text-center text-[10px] tracking-[0.18em] text-stone-600 uppercase sm:text-left">
              Coming soon · 2026
            </span>
          </div>
        </div>

        <div className="showcase-wrap relative mx-auto w-full max-w-[660px] lg:mx-0 lg:ml-auto">
          <div className="showcase-glow" aria-hidden="true" />
          <div className="film-rail film-rail-top" aria-hidden="true" />

          <div className="relative grid grid-cols-3 gap-2.5 py-5 sm:gap-4 sm:py-7">
            {frames.map((frame, index) => (
              <article
                key={frame.number}
                className={`film-frame ${frame.className} ${index === 1 ? "film-frame-featured" : ""}`}
              >
                <div className="frame-image" aria-hidden="true">
                  <span className="frame-orb" />
                  <span className="frame-horizon" />
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-linear-to-t from-black/95 via-black/45 to-transparent p-3 pt-10 sm:p-5 sm:pt-16">
                  <div>
                    <p className="mb-1 text-[7px] tracking-[0.22em] text-white/40 uppercase sm:text-[9px]">
                      Selection
                    </p>
                    <h2 className="font-heading text-lg italic text-stone-100 sm:text-2xl">
                      {frame.title}
                    </h2>
                  </div>
                  <span className="font-mono text-[8px] text-white/35 sm:text-[10px]">
                    {frame.number}
                  </span>
                </div>
              </article>
            ))}
          </div>

          <div className="film-rail film-rail-bottom" aria-hidden="true" />

          <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-[9px] tracking-[0.22em] text-stone-600 uppercase sm:mt-7 sm:text-[10px]">
            <span>Selected for you</span>
            <span className="flex items-center gap-2 text-stone-400">
              <Sparkles className="size-3 text-amber-200/60" />
              Personal by design
            </span>
          </div>
        </div>
      </section>

      <footer className="relative z-20 flex items-center justify-between border-t border-white/8 px-5 py-4 text-[9px] tracking-[0.18em] text-stone-700 uppercase sm:px-8 lg:px-12">
        <span>Made for movie people</span>
        <span className="hidden sm:inline">Independent · Private · Intentional</span>
        <span>© {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
