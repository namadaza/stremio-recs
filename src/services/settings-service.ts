import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profiles, user } from "@/db/schema";
import { getOrCreateProfile } from "@/services/profile-service";

export async function getUserSettings(authUserId: string) {
  const [authUser, profile] = await Promise.all([
    db.query.user.findFirst({ where: eq(user.id, authUserId) }),
    getOrCreateProfile(authUserId),
  ]);
  if (!authUser || !profile) throw new Error("Unable to load settings");

  const nameParts = authUser.name.trim().split(/\s+/);
  return {
    firstName: profile.data.firstName ?? nameParts[0] ?? "",
    lastName: profile.data.lastName ?? nameParts.slice(1).join(" "),
    email: authUser.email,
  };
}

export async function updateUserSettings(authUserId: string, firstName: string, lastName: string) {
  const profile = await getOrCreateProfile(authUserId);
  if (!profile) throw new Error("Unable to update settings");

  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  await Promise.all([
    db.update(user).set({ name: fullName }).where(eq(user.id, authUserId)),
    db
      .update(profiles)
      .set({
        data: {
          ...profile.data,
          firstName,
          lastName,
          displayName: fullName,
        },
      })
      .where(eq(profiles.id, profile.id)),
  ]);

  return { firstName, lastName };
}
