"use server";

import { headers } from "next/headers";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile-service";
import {
  generateOnDemandRecommendations,
  getCurrentRecommendations,
} from "@/services/recommendations";
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
const recommendationRequestSchema = z
  .object({
    kind: z.enum(["recent", "historical", "wildcard", "custom"]),
    prompt: z.string().trim().max(500).optional(),
  })
  .superRefine((input, context) => {
    if (input.kind === "custom" && !input.prompt) {
      context.addIssue({
        code: "custom",
        path: ["prompt"],
        message: "Describe what you are looking for",
      });
    }
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

  const [reactions, current] = await Promise.all([
    getMovieReactions(
      profile.id,
      response.results.map((movie) => movie.id),
    ),
    getCurrentRecommendations(profile.id),
  ]);

  return {
    ...response,
    reactions,
    currentBatchId: current?.batchId,
    currentBatchMovieIds: current?.recommendations.map((movie) => movie.tmdbId) ?? [],
  };
}

export async function getOnDemandRecommendations(input: {
  kind: "recent" | "historical" | "wildcard" | "custom";
  prompt?: string;
}) {
  const user = await requireUser();
  const request = recommendationRequestSchema.parse(input);
  const profile = await getOrCreateProfile(user.id);
  if (!profile) throw new Error("Unable to create profile");

  const recommendations = await generateOnDemandRecommendations(
    profile.id,
    request.kind,
    request.prompt,
  );
  const [reactions, current] = await Promise.all([
    getMovieReactions(
      profile.id,
      recommendations.map((movie) => movie.id),
    ),
    getCurrentRecommendations(profile.id),
  ]);

  return {
    recommendations,
    reactions,
    currentBatchId: current?.batchId,
    currentBatchMovieIds: current?.recommendations.map((movie) => movie.tmdbId) ?? [],
  };
}

export async function reactToMovie(input: { tmdbId: number; value: "up" | "down" }) {
  const user = await requireUser();
  const reaction = reactionSchema.parse(input);
  return saveMovieReaction(user.id, reaction.tmdbId, reaction.value);
}
