import "server-only";

import { createHash, createHmac, randomUUID } from "node:crypto";

import { addonBuilder, type Manifest, type MetaDetail, type MetaPreview } from "stremio-addon-sdk";
import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { addonInstallations, profiles, user } from "@/db/schema";
import { getCurrentRecommendations } from "@/services/recommendations";

const CATALOG_ID = "taste-recommendations";
const ADDON_VERSION = "1.0.0";

type AddonGet = (
  resource: string,
  type: string,
  id: string,
  extra?: Record<string, string | number>,
) => Promise<unknown>;

type InstallationData = {
  catalogName?: string;
  lastCatalogAccessAt?: string;
  tokenId?: string;
};

function signingSecret() {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error("BETTER_AUTH_SECRET is required to issue add-on URLs");
  return secret;
}

function signTokenId(tokenId: string) {
  return createHmac("sha256", signingSecret()).update(tokenId).digest("base64url");
}

function buildToken(tokenId: string) {
  return `${tokenId}.${signTokenId(tokenId)}`;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function firstNameFrom(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "My";
}

function catalogName(firstName: string) {
  return `${firstName}'s Taste`;
}

export async function getOrCreateAddonInstallation(profileId: number, firstName: string) {
  const existing = await db.query.addonInstallations.findFirst({
    where: and(
      eq(addonInstallations.profileId, profileId),
      eq(addonInstallations.isActive, true),
    ),
  });
  const existingData = existing?.data as InstallationData | undefined;

  if (existing && existingData?.tokenId) {
    return {
      token: buildToken(existingData.tokenId),
      catalogName: catalogName(firstName),
    };
  }

  const tokenId = randomUUID();
  const token = buildToken(tokenId);
  const data: InstallationData = {
    ...existingData,
    tokenId,
    catalogName: catalogName(firstName),
  };

  if (existing) {
    await db
      .update(addonInstallations)
      .set({
        tokenHash: hashToken(token),
        tokenPrefix: token.slice(0, 8),
        data,
      })
      .where(eq(addonInstallations.id, existing.id));
  } else {
    await db.insert(addonInstallations).values({
      profileId,
      tokenHash: hashToken(token),
      tokenPrefix: token.slice(0, 8),
      data,
    });
  }

  return { token, catalogName: data.catalogName! };
}

export async function rotateAddonInstallation(profileId: number, firstName: string) {
  await db
    .update(addonInstallations)
    .set({ isActive: false })
    .where(
      and(
        eq(addonInstallations.profileId, profileId),
        eq(addonInstallations.isActive, true),
      ),
    );

  return getOrCreateAddonInstallation(profileId, firstName);
}

async function getInstallation(token: string) {
  return db
    .select({
      installationId: addonInstallations.id,
      profileId: profiles.id,
      installationData: addonInstallations.data,
      profileData: profiles.data,
      userName: user.name,
    })
    .from(addonInstallations)
    .innerJoin(profiles, eq(addonInstallations.profileId, profiles.id))
    .innerJoin(user, eq(profiles.authUserId, user.id))
    .where(
      and(
        eq(addonInstallations.tokenHash, hashToken(token)),
        eq(addonInstallations.isActive, true),
      ),
    )
    .limit(1)
    .then((rows) => rows[0]);
}

function recommendationMeta(
  movie: NonNullable<Awaited<ReturnType<typeof getCurrentRecommendations>>>["recommendations"][number],
): MetaDetail {
  return {
    id: `tmdb:${movie.tmdbId}`,
    type: "movie",
    name: movie.title,
    poster: movie.posterUrl,
    posterShape: "regular",
    description: movie.overview,
    releaseInfo: movie.releaseDate?.slice(0, 4),
    released: movie.releaseDate ? new Date(`${movie.releaseDate}T00:00:00Z`).toISOString() : undefined,
    language: movie.language,
    imdbRating: movie.rating ? movie.rating.toFixed(1) : undefined,
  };
}

export async function getPersonalAddon(token: string) {
  const installation = await getInstallation(token);
  if (!installation) return null;

  const firstName =
    installation.profileData.firstName?.trim() || firstNameFrom(installation.userName);
  const name = catalogName(firstName);
  const tokenId = (installation.installationData as InstallationData).tokenId;
  if (!tokenId) return null;

  const current = await getCurrentRecommendations(installation.profileId);
  const metas = (current?.recommendations ?? []).map(recommendationMeta);
  const metaById = new Map(metas.map((meta) => [meta.id, meta]));

  const manifest: Manifest = {
    id: `com.taste.personal.${tokenId.replaceAll("-", "")}`,
    version: ADDON_VERSION,
    name,
    description: `Private movie recommendations curated by Taste for ${firstName}.`,
    resources: ["catalog", "meta"],
    types: ["movie"],
    idPrefixes: ["tmdb:"],
    catalogs: [{ type: "movie", id: CATALOG_ID, name }],
    behaviorHints: { adult: false, p2p: false },
  };

  const builder = new addonBuilder(manifest);
  builder.defineCatalogHandler(async ({ type, id }) => ({
    metas: type === "movie" && id === CATALOG_ID ? (metas as MetaPreview[]) : [],
    cacheMaxAge: 300,
    staleRevalidate: 3600,
    staleError: 86400,
  }));
  builder.defineMetaHandler(async ({ type, id }) => ({
    meta:
      type === "movie" && metaById.has(id)
        ? metaById.get(id)!
        : ({ id, type: "movie", name: "Not found" } as MetaDetail),
    cacheMaxAge: 300,
  }));

  const addonInterface = builder.getInterface();

  return {
    manifest: addonInterface.manifest,
    get: addonInterface.get as unknown as AddonGet,
    installationId: installation.installationId,
  };
}

export async function recordAddonAccess(installationId: number, isCatalogAccess: boolean) {
  const installation = await db.query.addonInstallations.findFirst({
    where: eq(addonInstallations.id, installationId),
  });
  if (!installation) return;

  const now = new Date();
  await db
    .update(addonInstallations)
    .set({
      lastAccessedAt: now,
      data: isCatalogAccess
        ? { ...installation.data, lastCatalogAccessAt: now.toISOString() }
        : installation.data,
    })
    .where(eq(addonInstallations.id, installationId));
}
