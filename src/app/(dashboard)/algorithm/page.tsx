export default function AlgorithmPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <p className="text-[10px] tracking-[0.22em] text-amber-100/55 uppercase">
        Recommendation profile
      </p>
      <h1 className="mt-4 font-heading text-5xl text-stone-50 sm:text-6xl">
        Define your algorithm.
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-stone-500">
        Choose the genres, eras, languages, and degree of discovery that shape each weekly
        selection.
      </p>
      <div className="mt-10 min-h-64 max-w-3xl border border-dashed border-white/10 bg-white/[0.015] p-6 sm:p-8">
        <p className="text-xs tracking-[0.14em] text-stone-700 uppercase">
          Configuration controls coming next
        </p>
      </div>
    </section>
  );
}
