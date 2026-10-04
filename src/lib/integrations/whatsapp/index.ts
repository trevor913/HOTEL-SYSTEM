/** Meta WhatsApp Cloud API adapter (§7.3). Server only. */
import { createHmac, timingSafeEqual } from "node:crypto";

export interface WaIncoming { from: string; name: string; text: string; id: string }
export interface WhatsAppAdapter { mode: "mock" | "live"; sendText(to: string, body: string): Promise<{ ok: boolean; error?: string }> }

/** X-Hub-Signature-256 = "sha256=" + HMAC-SHA256(appSecret, rawBody). */
export function verifySignature(rawBody: string, header: string | null, appSecret: string): boolean {
  if (!header?.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", appSecret).update(rawBody).digest("hex"));
  const got = Buffer.from(header.slice(7));
  return expected.length === got.length && timingSafeEqual(expected, got);
}

/** Pull text messages out of a Cloud API webhook body. */
export function extractMessages(body: unknown): WaIncoming[] {
  type Change = { value?: { contacts?: { wa_id: string; profile?: { name?: string } }[]; messages?: { from: string; id: string; type: string; text?: { body?: string }; button?: { text?: string }; interactive?: { button_reply?: { title?: string } } }[] } };
  const entries = (body as { entry?: { changes?: Change[] }[] } | null)?.entry ?? [];
  const out: WaIncoming[] = [];
  for (const e of entries) for (const c of e.changes ?? []) {
    const v = c.value ?? {};
    for (const m of v.messages ?? []) {
      const text = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? "";
      if (!text.trim()) continue;
      out.push({ from: m.from, id: m.id, text, name: v.contacts?.find((x) => x.wa_id === m.from)?.profile?.name ?? "" });
    }
  }
  return out;
}

const mockWa: WhatsAppAdapter = { mode: "mock", async sendText(to, body) { console.info(`[whatsapp:mock] → ${to}: ${body.slice(0, 80)}`); return { ok: true }; } };
const liveWa: WhatsAppAdapter = {
  mode: "live",
  async sendText(to, body) {
    const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST", headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body, preview_url: true } }),
    });
    return { ok: r.ok, error: r.ok ? undefined : `HTTP ${r.status}` };
  },
};
export const whatsappConfigured = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
export function whatsapp(): WhatsAppAdapter { return process.env.MOCK_MODE === "false" && whatsappConfigured() ? liveWa : mockWa; }