"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile-service";
import {
  getMovieReactions,
  saveMovieReaction,
} from "@/services/search-feedback-service";
import { searchTmdbMovies } from "@/services/tmbd";

const searchSchema = z.string().trim().min(1).max(200);
const reactionSchema = z.object({
  tmdbId: z.number().int().positive(),
  value: z.enum(["up", "down"]),
});

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function searchMovies(input: string) {
  const user = await requireUser();
  const query = searchSchema.parse(input);
  const response = await searchTmdbMovies(query);
  const profile = await getOrCreateProfile(user.id);
  if (!profile) throw new Error("Unable to create profile");

  const reactions = await getMovieReactions(
    profile.id,
    response.results.map((movie) => movie.id),
  );

  return { ...response, reactions };
}

export async function reactToMovie(input: { tmdbId: number; value: "up" | "down" }) {
  const user = await requireUser();
  const reaction = reactionSchema.parse(input);
  return saveMovieReaction(user.id, reaction.tmdbId, reaction.value);
}
