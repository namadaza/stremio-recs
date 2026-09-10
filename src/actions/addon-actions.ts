"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getOrCreateAddonInstallation, rotateAddonInstallation } from "@/services/addon-service";
import { getOrCreateProfile } from "@/services/profile-service";

async function installationContext() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user) throw new Error("Unauthorized");

  const profile = await getOrCreateProfile(session.user.id);
  if (!profile) throw new Error("Unable to create profile");

  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  if (!host) throw new Error("Unable to determine the add-on URL");

  const publicHost = host.replace(/^localhost(?=:|$)/, "127.0.0.1");
  const protocol =
    requestHeaders.get("x-forwarded-proto") ??
    (publicHost.startsWith("127.0.0.1") ? "http" : "https");
  const firstName =
    profile.data.firstName?.trim() || session.user.name.trim().split(/\s+/)[0] || "My";

  return { profile, firstName, origin: `${protocol}://${publicHost}` };
}

function installationDto(origin: string, token: string, catalogName: string) {
  const manifestUrl = `${origin}/api/stremio/${encodeURIComponent(token)}/manifest.json`;
  return {
    manifestUrl,
    installUrl: manifestUrl.replace(/^https?:\/\//, "stremio://"),
    catalogName,
    isSecure: manifestUrl.startsWith("https://") || manifestUrl.includes("127.0.0.1"),
  };
}

export async function getAddonInstallation() {
  const { profile, firstName, origin } = await installationContext();
  const installation = await getOrCreateAddonInstallation(profile.id, firstName);
  return installationDto(origin, installation.token, installation.catalogName);
}

export async function regenerateAddonInstallation() {
  const { profile, firstName, origin } = await installationContext();
  const installation = await rotateAddonInstallation(profile.id, firstName);
  return installationDto(origin, installation.token, installation.catalogName);
}
