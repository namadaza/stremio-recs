import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="cinema-shell relative isolate grid min-h-svh place-items-center overflow-hidden px-5 py-12 text-foreground">
      <div className="cinema-light" aria-hidden="true" />
      <div className="cinema-grain" aria-hidden="true" />
      <div className="cinema-lines" aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-10 flex items-center justify-center gap-3">
          <span className="grid size-9 place-items-center rounded-full border border-amber-100/20 font-heading italic text-stone-100">
            T
          </span>
          <span className="text-[11px] tracking-[0.28em] text-stone-200 uppercase">Taste</span>
        </Link>
        <section className="border border-white/10 bg-black/25 p-6 shadow-2xl backdrop-blur-sm sm:p-9">
          {children}
        </section>
      </div>
    </main>
  );
}
