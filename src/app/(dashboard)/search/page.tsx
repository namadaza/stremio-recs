import { MovieSearch } from "@/components/search/movie-search";

export default function SearchPage() {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <p className="text-[10px] tracking-[0.22em] text-amber-100/55 uppercase">
        Explore on demand
      </p>
      <h1 className="mt-4 font-heading text-5xl text-stone-50 sm:text-6xl">
        What should you watch?
      </h1>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-stone-500">
        Browse quick recommendations shaped by recent likes, long-time favorites, or a wildcard
        mood—or search TMDB directly. Like, dislike, or add any film to your current selection.
      </p>
      <MovieSearch />
    </section>
  );
}
