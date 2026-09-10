import { Copy, Tv } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function InstallationPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <p className="text-[10px] tracking-[0.22em] text-amber-100/55 uppercase">Stremio add-on</p>
      <h1 className="mt-4 font-heading text-5xl text-stone-50 sm:text-6xl">
        Take Taste with you.
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-stone-500">
        Your private manifest will make the current selection available as a movie catalog in
        Stremio.
      </p>
      <div className="mt-10 max-w-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Tv className="size-5 text-amber-100/65" />
          <p className="text-[10px] tracking-[0.18em] text-stone-400 uppercase">
            Personal manifest
          </p>
        </div>
        <div className="mt-6 rounded-sm border border-white/8 bg-black/30 p-4 font-mono text-xs text-stone-600">
          Generated after your first recommendation batch
        </div>
        <Button
          disabled
          className="mt-4 h-10 rounded-full px-5 text-[10px] tracking-[0.14em] uppercase"
        >
          <Copy /> Copy manifest URL
        </Button>
      </div>
    </section>
  );
}
