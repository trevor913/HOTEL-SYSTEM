import { extractMessages, verifySignature, whatsapp } from "@/lib/integrations/whatsapp";
import { whatsappReply } from "@/lib/domain/whatsapp-bot";
import { HOTEL, MENU } from "@/lib/store/seed";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Meta verification handshake. */
export function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  if (q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === (process.env.WHATSAPP_VERIFY_TOKEN || "hotel-system-verify"))
    return new Response(q.get("hub.challenge") ?? "", { status: 200 });
  return new Response("forbidden", { status: 403 });
}

/** Incoming customer messages → WhatsApp bot (menu, hours, orders) → reply. */
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (secret && !verifySignature(raw, req.headers.get("x-hub-signature-256"), secret)) return new Response("bad signature", { status: 401 });
  let body: unknown = null;
  try { body = JSON.parse(raw); } catch { return new Response("bad json", { status: 400 }); }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const wa = whatsapp();
  const replies = [];
  for (const m of extractMessages(body)) {
    const r = whatsappReply(m.text, { hotel: HOTEL, menu: MENU, appUrl });
    const text = r.text.replace("{CODE}", "inathibitishwa");
    replies.push({ to: m.from, kind: r.kind, ...(await wa.sendText(m.from, text)) });
  }
  return Response.json({ ok: true, mode: wa.mode, handled: replies.length, replies });
}