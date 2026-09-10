import { MovieSearch } from "@/components/search/movie-search";

export default function SearchPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <p className="text-[10px] tracking-[0.22em] text-amber-100/55 uppercase">
        Shape your taste
      </p>
      <h1 className="mt-4 font-heading text-5xl text-stone-50 sm:text-6xl">
        Search for a film.
      </h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-stone-500">
        Find movies across TMDB, then tell Taste what belongs in your world—and what does not.
      </p>
      <MovieSearch />
    </section>
  );
}
