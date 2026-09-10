import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles } from "@/db/schema";

export async function getOrCreateProfile(authUserId: string) {
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.authUserId, authUserId),
  });

  if (existing) return existing;

  const [profile] = await db
    .insert(profiles)
    .values({ authUserId })
    .onConflictDoNothing({ target: profiles.authUserId })
    .returning();

  if (profile) return profile;

  return db.query.profiles.findFirst({
    where: eq(profiles.authUserId, authUserId),
  });
}
