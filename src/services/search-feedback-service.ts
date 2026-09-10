import "server-only";

import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { movies, recommendationFeedback } from "@/db/schema";
import { getOrCreateProfile } from "@/services/profile-service";
import { getTmdbMovie } from "@/services/tmbd";

export type MovieReaction = "up" | "down";

export async function getProfileMovieReactions(profileId: number) {
  const rows = await db
    .select({
      id: movies.id,
      providerId: movies.providerId,
      data: movies.data,
      value: recommendationFeedback.value,
    })
    .from(recommendationFeedback)
    .innerJoin(movies, eq(recommendationFeedback.movieId, movies.id))
    .where(
      and(
        eq(recommendationFeedback.profileId, profileId),
        eq(movies.provider, "tmdb"),
        inArray(recommendationFeedback.value, ["up", "down"]),
      ),
    )
    .orderBy(desc(recommendationFeedback.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    tmdbId: Number(row.providerId),
    title: row.data.title,
    overview: row.data.overview,
    posterUrl: row.data.posterUrl,
    releaseDate: row.data.releaseDate,
    language: row.data.language,
    value: row.value as MovieReaction,
  }));
}

export async function getMovieReactions(profileId: number, tmdbIds: number[]) {
  if (tmdbIds.length === 0) return {} as Record<number, MovieReaction>;

  const rows = await db
    .select({
      providerId: movies.providerId,
      value: recommendationFeedback.value,
    })
    .from(recommendationFeedback)
    .innerJoin(movies, eq(recommendationFeedback.movieId, movies.id))
    .where(
      and(
        eq(recommendationFeedback.profileId, profileId),
        eq(movies.provider, "tmdb"),
        inArray(movies.providerId, tmdbIds.map(String)),
      ),
    );

  return Object.fromEntries(
    rows
      .filter((row): row is typeof row & { value: MovieReaction } =>
        row.value === "up" || row.value === "down",
      )
      .map((row) => [Number(row.providerId), row.value]),
  );
}

export async function saveMovieReaction(
  authUserId: string,
  tmdbId: number,
  value: MovieReaction,
) {
  const [profile, movie] = await Promise.all([
    getOrCreateProfile(authUserId),
    getTmdbMovie(tmdbId),
  ]);

  if (!profile) throw new Error("Unable to create profile");

  const [savedMovie] = await db
    .insert(movies)
    .values({
      provider: "tmdb",
      providerId: String(movie.id),
      data: {
        title: movie.title,
        overview: movie.overview || undefined,
        posterUrl: movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : undefined,
        backdropUrl: movie.backdrop_path
          ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
          : undefined,
        releaseDate: movie.release_date || undefined,
        language: movie.original_language,
        rating: movie.vote_average,
      },
    })
    .onConflictDoUpdate({
      target: [movies.provider, movies.providerId],
      set: {
        data: {
          title: movie.title,
          overview: movie.overview || undefined,
          posterUrl: movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : undefined,
          backdropUrl: movie.backdrop_path
            ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
            : undefined,
          releaseDate: movie.release_date || undefined,
          language: movie.original_language,
          rating: movie.vote_average,
        },
      },
    })
    .returning({ id: movies.id });

  if (!savedMovie) throw new Error("Unable to save movie");

  await db
    .insert(recommendationFeedback)
    .values({
      profileId: profile.id,
      movieId: savedMovie.id,
      value,
      data: { source: "search" },
    })
    .onConflictDoUpdate({
      target: [recommendationFeedback.profileId, recommendationFeedback.movieId],
      set: { value, data: { source: "search" } },
    });

  return { tmdbId, value };
}
