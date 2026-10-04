import { parseC2B } from "@/lib/integrations/mpesa/daraja";
import { webhookAuthorized } from "@/lib/integrations/mpesa";

export const dynamic = "force-dynamic";

/** Daraja C2B validation: accept any positive payment to our till. */
export async function POST(req: Request) {
  if (!webhookAuthorized(req)) return Response.json({ ResultCode: "C2B00016", ResultDesc: "Rejected" }, { status: 401 });
  const txn = parseC2B(await req.json().catch(() => null));
  return Response.json(txn ? { ResultCode: "0", ResultDesc: "Accepted" } : { ResultCode: "C2B00013", ResultDesc: "Invalid Amount" });
}