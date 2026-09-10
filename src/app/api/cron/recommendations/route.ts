import { generateScheduledRecommendations } from "@/services/scheduled-recommendations";

export const maxDuration = 300;

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured");
    return Response.json({ error: "Cron is not configured" }, { status: 500 });
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await generateScheduledRecommendations();
    return Response.json({ ok: summary.failed === 0, ...summary });
  } catch (error) {
    console.error("Scheduled recommendation generation failed", error);
    return Response.json(
      { error: "Unable to generate scheduled recommendations" },
      { status: 500 },
    );
  }
}
