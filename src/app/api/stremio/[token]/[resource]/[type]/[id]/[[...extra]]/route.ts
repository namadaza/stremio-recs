import { getPersonalAddon, recordAddonAccess } from "@/services/addon-service";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function parseExtra(parts?: string[]) {
  if (!parts?.length) return {};
  const value = parts.join("/").replace(/\.json$/, "");
  return Object.fromEntries(new URLSearchParams(value));
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      token: string;
      resource: string;
      type: string;
      id: string;
      extra?: string[];
    }>;
  },
) {
  const { token, resource, type, id: rawId, extra } = await context.params;
  const id = rawId.replace(/\.json$/, "");
  const addon = await getPersonalAddon(token);

  if (!addon) {
    return Response.json({ error: "Add-on not found" }, { status: 404, headers: CORS_HEADERS });
  }

  if (resource !== "catalog" && resource !== "meta") {
    return Response.json({ error: "Resource not found" }, { status: 404, headers: CORS_HEADERS });
  }

  try {
    const result = await addon.get(resource, type, id, parseExtra(extra));
    await recordAddonAccess(addon.installationId, resource === "catalog");
    return Response.json(result, {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600, stale-if-error=86400",
      },
    });
  } catch {
    return Response.json({ error: "Unable to load add-on resource" }, { status: 500, headers: CORS_HEADERS });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
