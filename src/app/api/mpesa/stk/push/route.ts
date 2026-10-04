import { z } from "zod";
import { mpesa } from "@/lib/integrations/mpesa";
import { normalizePhone } from "@/lib/utils/phone";

export const dynamic = "force-dynamic";

const Body = z.object({ phone: z.string().max(20), amountKes: z.number().int().positive().max(150_000), reference: z.string().max(40), description: z.string().max(60).optional() });

/** Lipa na M-Pesa STK push (public menu checkout). Mock mode → instant fake success. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad_request" }, { status: 400 });
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return Response.json({ error: "invalid_phone" }, { status: 400 });
  const adapter = mpesa();
  try {
    const r = await adapter.stkPush({ phone, amountCents: parsed.data.amountKes * 100, reference: parsed.data.reference, description: parsed.data.description ?? "Hotel order" });
    return Response.json({ ...r, mode: adapter.mode }, { status: r.ok ? 200 : 502 });
  } catch (e) {
    console.error("[mpesa/stk]", e);
    return Response.json({ ok: false, error: "stk_failed", mode: adapter.mode }, { status: 502 });
  }
}