import { mpesaConfigured } from "@/lib/integrations/mpesa/live";
import { smsConfigured } from "@/lib/integrations/sms";
import { whatsappConfigured } from "@/lib/integrations/whatsapp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which live capabilities this deployment has (booleans only; no secrets exposed). */
export function GET() {
  const live = process.env.MOCK_MODE === "false";
  return Response.json(
    { chat: !!process.env.ANTHROPIC_API_KEY, voice: !!process.env.OPENAI_API_KEY, mpesa: live && mpesaConfigured(), sms: live && smsConfigured(), whatsapp: live && whatsappConfigured() },
    { headers: { "Cache-Control": "no-store" } },
  );
}