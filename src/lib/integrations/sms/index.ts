/** Africa's Talking SMS adapter (§7.2). Mock = the on-device SMS Outbox; live = AT REST API. Server only. */
export interface SmsAdapter { mode: "mock" | "live"; send(to: string, body: string): Promise<{ ok: boolean; id?: string; error?: string }> }

const mockSms: SmsAdapter = { mode: "mock", async send() { return { ok: true, id: `mock-${Date.now()}` }; } };

const liveSms: SmsAdapter = {
  mode: "live",
  async send(to, body) {
    const username = process.env.AT_USERNAME ?? "sandbox";
    const host = username === "sandbox" ? "https://api.sandbox.africastalking.com" : "https://api.africastalking.com";
    const form = new URLSearchParams({ username, to: to.startsWith("+") ? to : `+${to}`, message: body });
    if (process.env.AT_SENDER_ID) form.set("from", process.env.AT_SENDER_ID);
    const r = await fetch(`${host}/version1/messaging`, { method: "POST", headers: { apiKey: process.env.AT_API_KEY ?? "", Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" }, body: form });
    const j = (await r.json().catch(() => null)) as { SMSMessageData?: { Recipients?: { messageId: string; status: string }[] } } | null;
    const rec = j?.SMSMessageData?.Recipients?.[0];
    return { ok: r.ok && rec?.status === "Success", id: rec?.messageId, error: rec?.status ?? `HTTP ${r.status}` };
  },
};

export const smsConfigured = () => !!process.env.AT_API_KEY;
export function sms(): SmsAdapter { return process.env.MOCK_MODE === "false" && smsConfigured() ? liveSms : mockSms; }