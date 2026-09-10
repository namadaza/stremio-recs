"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { getUserSettings, updateUserSettings } from "@/services/settings-service";

const settingsSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(80),
  lastName: z.string().trim().max(80),
});

async function requireUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getSettings() {
  return getUserSettings(await requireUserId());
}

export async function saveSettings(input: { firstName: string; lastName: string }) {
  const values = settingsSchema.parse(input);
  const result = await updateUserSettings(await requireUserId(), values.firstName, values.lastName);
  revalidatePath("/", "layout");
  return result;
}
