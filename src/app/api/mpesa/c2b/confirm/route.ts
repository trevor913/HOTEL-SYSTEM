import { parseC2B } from "@/lib/integrations/mpesa/daraja";
import { webhookAuthorized } from "@/lib/integrations/mpesa";
import { saveMpesaTxn } from "@/lib/db/server";

export const dynamic = "force-dynamic";

/** Daraja C2B confirmation → upsert mpesa_txns (live) and echo the normalized txn (mock/simulator). */
export async function POST(req: Request) {
  if (!webhookAuthorized(req)) return Response.json({ ResultCode: 1, ResultDesc: "Rejected" }, { status: 401 });
  const txn = parseC2B(await req.json().catch(() => null));
  if (!txn) return Response.json({ ResultCode: 1, ResultDesc: "Bad payload" }, { status: 400 });
  const saved = await saveMpesaTxn(txn).catch((e: unknown) => ({ persisted: false, reason: String(e) }));
  return Response.json({ ResultCode: 0, ResultDesc: "Accepted", txn, ...saved });
}