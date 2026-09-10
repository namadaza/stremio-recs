import { getPersonalAddon, recordAddonAccess } from "@/services/addon-service";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { token } = await context.params;
  const addon = await getPersonalAddon(token);
  if (!addon) {
    return Response.json({ error: "Add-on not found" }, { status: 404, headers: CORS_HEADERS });
  }

  await recordAddonAccess(addon.installationId, false);
  return Response.json(addon.manifest, { headers: CORS_HEADERS });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
