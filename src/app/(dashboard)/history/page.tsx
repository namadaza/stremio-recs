export default function HistoryPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <p className="text-[10px] tracking-[0.22em] text-amber-100/55 uppercase">Your archive</p>
      <h1 className="mt-4 font-heading text-5xl text-stone-50 sm:text-6xl">
        Previously considered.
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-stone-500">
        Every recommendation batch and reaction will remain here, creating a record of how your
        taste evolves.
      </p>
      <div className="mt-10 border-t border-white/8 py-8 text-xs tracking-[0.14em] text-stone-700 uppercase">
        No archived selections yet
      </div>
    </section>
  );
}
