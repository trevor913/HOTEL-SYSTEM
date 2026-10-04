import { parseStkCallback } from "@/lib/integrations/mpesa/daraja";
import { webhookAuthorized } from "@/lib/integrations/mpesa";
import { saveMpesaTxn } from "@/lib/db/server";

export const dynamic = "force-dynamic";

/** Daraja STK result → record the paid txn (live). Always ACK so Safaricom stops retrying. */
export async function POST(req: Request) {
  if (!webhookAuthorized(req)) return Response.json({ ResultCode: 1, ResultDesc: "Rejected" }, { status: 401 });
  const res = parseStkCallback(await req.json().catch(() => null));
  if (res?.txn) await saveMpesaTxn(res.txn).catch((e: unknown) => console.error("[mpesa/stk/callback]", e));
  return Response.json({ ResultCode: 0, ResultDesc: "Accepted", result: res });
}