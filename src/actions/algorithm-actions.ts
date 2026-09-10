"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getOrCreateProfile } from "@/services/profile-service";
import { getProfileMovieReactions } from "@/services/search-feedback-service";

export async function getAlgorithmMovieReactions() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) throw new Error("Unauthorized");

  const profile = await getOrCreateProfile(session.user.id);
  if (!profile) throw new Error("Unable to create profile");

  return getProfileMovieReactions(profile.id);
}
