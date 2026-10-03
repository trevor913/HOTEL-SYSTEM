import { debtNudges, eveningPulse, morningBrief } from "@/lib/domain/briefs";
import { generateSeed } from "@/lib/store/seed";

export const dynamic = "force-dynamic";

/**
 * Daily proactive run (§6.5). Netlify schedules call this at 05:30 (?run=morning) and 18:30 (?run=evening) EAT.
 * MOCK_MODE: data lives on each device, so this returns the briefs for the demo seed (the app computes the
 * real ones on-device on Leo). Live mode: load the hotel from Supabase and send via WhatsApp/SMS adapters.
 * Debt nudges are never auto-sent: they are queued for the owner's 1-tap approval.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  const run = new URL(req.url).searchParams.get("run") ?? "all";
  const now = new Date();
  const s = { ...generateSeed(now), sms: [] };
  return Response.json({
    mode: process.env.MOCK_MODE === "false" ? "live" : "mock",
    generatedAt: now.toISOString(),
    ...(run !== "morning" ? { eveningPulse: eveningPulse(s, now) } : {}),
    ...(run !== "evening" ? { morningBrief: morningBrief(s, now) } : {}),
    debtNudges: { requiresApproval: true, items: debtNudges(s, now).map(({ name, balanceCents, days, body }) => ({ name, balanceCents, days, body })) },
  });
}