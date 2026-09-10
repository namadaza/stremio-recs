import { MovieReactions } from "@/components/algorithm/movie-reactions";

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
        Every reaction becomes a signal. Review the films guiding your recommendations and the
        ones steering them away.
      </p>
      <MovieReactions />
    </section>
  );
}
