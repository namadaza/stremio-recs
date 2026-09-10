import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  recommendationBatches,
  recommendationConfigs,
  recommendationFeedback,
} from "@/db/schema";
import { generateAndSaveRecommendations } from "@/services/recommendations";

const GENERATION_CONCURRENCY = 3;

type ScheduledGenerationResult = {
  profileId: number;
  status: "completed" | "failed" | "skipped";
  batchId?: number;
  error?: string;
};

async function generateForProfile(profileId: number): Promise<ScheduledGenerationResult> {
  const inProgress = await db.query.recommendationBatches.findFirst({
    columns: { id: true },
    where: and(
      eq(recommendationBatches.profileId, profileId),
      eq(recommendationBatches.status, "generating"),
    ),
  });

  if (inProgress) {
    return { profileId, status: "skipped", error: "Generation already in progress" };
  }

  const config = await db.query.recommendationConfigs.findFirst({
    where: and(
      eq(recommendationConfigs.profileId, profileId),
      eq(recommendationConfigs.isActive, true),
    ),
    orderBy: (configs, { desc }) => [desc(configs.version)],
  });

  try {
    const recommendations = await generateAndSaveRecommendations(profileId, {
      config: config?.data,
      trigger: "scheduled",
    });

    if (!recommendations) {
      throw new Error("Generation completed without an active recommendation batch");
    }

    return {
      profileId,
      status: "completed",
      batchId: recommendations.batchId,
    };
  } catch (error) {
    return {
      profileId,
      status: "failed",
      error: error instanceof Error ? error.message : "Generation failed",
    };
  }
}

export async function generateScheduledRecommendations() {
  const eligibleProfiles = await db
    .selectDistinct({ profileId: recommendationFeedback.profileId })
    .from(recommendationFeedback)
    .where(eq(recommendationFeedback.value, "up"));

  const results: ScheduledGenerationResult[] = [];
  let nextProfileIndex = 0;

  async function worker() {
    while (nextProfileIndex < eligibleProfiles.length) {
      const profile = eligibleProfiles[nextProfileIndex];
      nextProfileIndex += 1;
      if (profile) results.push(await generateForProfile(profile.profileId));
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(GENERATION_CONCURRENCY, eligibleProfiles.length) },
      () => worker(),
    ),
  );

  return {
    eligible: eligibleProfiles.length,
    completed: results.filter((result) => result.status === "completed").length,
    failed: results.filter((result) => result.status === "failed").length,
    skipped: results.filter((result) => result.status === "skipped").length,
    results,
  };
}
