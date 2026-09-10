import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

// A non-routable fallback lets Next.js inspect modules during local builds before
// Vercel/Neon environment variables are connected. Requests still require DATABASE_URL.
const connectionString =
  process.env.DATABASE_URL ?? "postgresql://unused:unused@127.0.0.1:5432/taste";

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });
