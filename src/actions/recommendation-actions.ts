"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile-service";
import {
  generateAndSaveRecommendations,
  getCurrentRecommendations,
  getRecommendationBatchHistory,
  type CurrentRecommendations,
} from "@/services/recommendations";

async function requireProfile() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");

  const profile = await getOrCreateProfile(session.user.id);
  if (!profile) throw new Error("Unable to create profile");
  return profile;
}

function toRecommendationDto(current: CurrentRecommendations | null) {
  if (!current) return null;

  return {
    batchId: current.batchId,
    generatedAt: current.generatedAt.toISOString(),
    seed: current.seed,
    recommendations: current.recommendations,
  };
}

export async function getCurrentRecommendationSelection() {
  const profile = await requireProfile();
  return toRecommendationDto(await getCurrentRecommendations(profile.id));
}

export async function refreshRecommendations() {
  const profile = await requireProfile();
  return toRecommendationDto(await generateAndSaveRecommendations(profile.id));
}

export async function getRecommendationHistory() {
  const profile = await requireProfile();
  const batches = await getRecommendationBatchHistory(profile.id);

  return batches.map((batch) => ({
    ...batch,
    createdAt: batch.createdAt.toISOString(),
    completedAt: batch.completedAt?.toISOString(),
  }));
}
