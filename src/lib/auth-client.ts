import { createAuthClient } from "better-auth/react";

// No baseURL is needed: the client uses the current origin in both local
// development and Vercel preview/production deployments.
export const authClient = createAuthClient();
