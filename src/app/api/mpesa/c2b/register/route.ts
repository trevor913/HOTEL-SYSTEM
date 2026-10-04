import { mpesaConfigured, registerC2BUrls } from "@/lib/integrations/mpesa/live";

export const dynamic = "force-dynamic";

/** One-time C2B URL registration (protected by CRON_SECRET). */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "unauthorized" }, { status: 401 });
  if (!mpesaConfigured()) return Response.json({ error: "mpesa_not_configured" }, { status: 501 });
  return Response.json(await registerC2BUrls());
}