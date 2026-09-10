import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/db";
import * as schema from "@/db/schema";

const vercelHosts = [
  process.env.VERCEL_URL,
  process.env.VERCEL_BRANCH_URL,
  process.env.VERCEL_PROJECT_PRODUCTION_URL,
].filter((host): host is string => Boolean(host));

const fallbackHost =
  process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
const fallbackURL = fallbackHost
  ? `https://${fallbackHost}`
  : "http://localhost:3000";

export const auth = betterAuth({
  appName: "Taste",
  baseURL: {
    allowedHosts: ["localhost:*", "127.0.0.1:*", ...vercelHosts],
    protocol: "auto",
    fallback: fallbackURL,
  },
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
  },
  plugins: [nextCookies()],
});
