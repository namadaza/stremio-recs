import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type ProfileData = {
  displayName?: string;
  onboardingCompleted?: boolean;
  nextRefreshAt?: string;
};

export type RecommendationConfigData = {
  favoriteGenres: string[];
  excludedGenres: string[];
  languages: string[];
  releaseYear?: { from?: number; to?: number };
  discovery: "familiar" | "balanced" | "adventurous";
  popularity: "mainstream" | "balanced" | "hidden-gems";
  instructions?: string;
  recommendationCount: number;
};

export type MovieData = {
  title: string;
  overview?: string;
  posterUrl?: string;
  backdropUrl?: string;
  releaseDate?: string;
  genres?: string[];
  runtimeMinutes?: number;
  language?: string;
  rating?: number;
};

export type RecommendationBatchData = {
  model?: string;
  promptVersion?: string;
  candidateCount?: number;
  seed?: string;
  sampledMovieIds?: number[];
  inputTokens?: number;
  outputTokens?: number;
  error?: string;
};

export type RecommendationData = {
  reason: string;
  score?: number;
  signals?: string[];
};

export type FeedbackData = {
  source?: "feed" | "history" | "search" | "stremio";
  note?: string;
};

export type AddonInstallationData = {
  catalogName?: string;
  lastCatalogAccessAt?: string;
};

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

// Better Auth owns these tables and uses string identifiers by design.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_user_id_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const profiles = pgTable(
  "profiles",
  {
    id: serial("id").primaryKey(),
    authUserId: text("auth_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    data: jsonb("data").$type<ProfileData>().default({}).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("profiles_auth_user_id_idx").on(table.authUserId)],
);

export const recommendationConfigs = pgTable(
  "recommendation_configs",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    version: integer("version").default(1).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    data: jsonb("data").$type<RecommendationConfigData>().notNull(),
    ...timestamps,
  },
  (table) => [index("recommendation_configs_profile_id_idx").on(table.profileId)],
);

export const movies = pgTable(
  "movies",
  {
    id: serial("id").primaryKey(),
    provider: text("provider").default("tmdb").notNull(),
    providerId: text("provider_id").notNull(),
    imdbId: text("imdb_id"),
    data: jsonb("data").$type<MovieData>().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("movies_provider_id_idx").on(table.provider, table.providerId),
    index("movies_imdb_id_idx").on(table.imdbId),
  ],
);

export const recommendationBatches = pgTable(
  "recommendation_batches",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    configId: integer("config_id").references(() => recommendationConfigs.id, {
      onDelete: "set null",
    }),
    trigger: text("trigger").$type<"onboarding" | "manual" | "scheduled">().notNull(),
    status: text("status")
      .$type<"pending" | "generating" | "completed" | "failed">()
      .default("pending")
      .notNull(),
    isActive: boolean("is_active").default(false).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    data: jsonb("data").$type<RecommendationBatchData>().default({}).notNull(),
    ...timestamps,
  },
  (table) => [index("recommendation_batches_profile_id_idx").on(table.profileId)],
);

export const recommendations = pgTable(
  "recommendations",
  {
    id: serial("id").primaryKey(),
    batchId: integer("batch_id")
      .notNull()
      .references(() => recommendationBatches.id, { onDelete: "cascade" }),
    movieId: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    rank: integer("rank").notNull(),
    data: jsonb("data").$type<RecommendationData>().notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("recommendations_batch_movie_idx").on(table.batchId, table.movieId),
    index("recommendations_batch_rank_idx").on(table.batchId, table.rank),
  ],
);

export const recommendationFeedback = pgTable(
  "recommendation_feedback",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    movieId: integer("movie_id")
      .notNull()
      .references(() => movies.id, { onDelete: "cascade" }),
    recommendationId: integer("recommendation_id").references(() => recommendations.id, {
      onDelete: "set null",
    }),
    value: text("value").$type<"up" | "down" | "hidden">().notNull(),
    data: jsonb("data").$type<FeedbackData>().default({}).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("recommendation_feedback_profile_movie_idx").on(
      table.profileId,
      table.movieId,
    ),
  ],
);

export const addonInstallations = pgTable(
  "addon_installations",
  {
    id: serial("id").primaryKey(),
    profileId: integer("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    tokenPrefix: text("token_prefix").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
    data: jsonb("data").$type<AddonInstallationData>().default({}).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("addon_installations_token_hash_idx").on(table.tokenHash),
    index("addon_installations_profile_id_idx").on(table.profileId),
  ],
);
