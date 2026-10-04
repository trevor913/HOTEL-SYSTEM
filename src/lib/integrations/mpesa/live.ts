/** Live Daraja adapter: OAuth token caching, STK push, C2B URL registration. Server only. */
import { DARAJA_BASE, darajaTimestamp, stkPassword } from "./daraja";
import type { MpesaAdapter } from "./types";

const env = (k: string) => process.env[k] ?? "";
const base = () => (env("MPESA_ENV") === "production" ? DARAJA_BASE.production : DARAJA_BASE.sandbox);
let token: { value: string; exp: number } | null = null;

export function mpesaConfigured(): boolean {
  return !!(env("MPESA_CONSUMER_KEY") && env("MPESA_CONSUMER_SECRET") && env("MPESA_SHORTCODE") && env("MPESA_PASSKEY") && env("MPESA_CALLBACK_BASE_URL"));
}

async function accessToken(): Promise<string> {
  if (token && token.exp > Date.now() + 60_000) return token.value;
  const auth = btoa(`${env("MPESA_CONSUMER_KEY")}:${env("MPESA_CONSUMER_SECRET")}`);
  const r = await fetch(`${base()}/oauth/v1/generate?grant_type=client_credentials`, { headers: { Authorization: `Basic ${auth}` }, cache: "no-store" });
  if (!r.ok) throw new Error(`daraja oauth ${r.status}`);
  const j = (await r.json()) as { access_token: string; expires_in: string | number };
  token = { value: j.access_token, exp: Date.now() + Number(j.expires_in) * 1000 };
  return token.value;
}

const callbackUrl = (path: string) => {
  const u = new URL(path, env("MPESA_CALLBACK_BASE_URL"));
  if (env("MPESA_WEBHOOK_SECRET")) u.searchParams.set("secret", env("MPESA_WEBHOOK_SECRET"));
  return u.toString();
};

export const liveMpesa: MpesaAdapter = {
  mode: "live",
  async stkPush({ phone, amountCents, reference, description }) {
    const ts = darajaTimestamp();
    const shortcode = env("MPESA_SHORTCODE");
    const r = await fetch(`${base()}/mpesa/stkpush/v1/processrequest`, {
      method: "POST", headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        BusinessShortCode: shortcode, Password: stkPassword(shortcode, env("MPESA_PASSKEY"), ts), Timestamp: ts,
        TransactionType: env("MPESA_TRANSACTION_TYPE") || "CustomerPayBillOnline", Amount: Math.ceil(amountCents / 100),
        PartyA: phone, PartyB: env("MPESA_PARTY_B") || shortcode, PhoneNumber: phone, CallBackURL: callbackUrl("/api/mpesa/stk/callback"),
        AccountReference: reference.slice(0, 12), TransactionDesc: description.slice(0, 13),
      }),
    });
    const j = (await r.json().catch(() => ({}))) as { CheckoutRequestID?: string; ResponseCode?: string; CustomerMessage?: string; errorMessage?: string };
    return { ok: r.ok && j.ResponseCode === "0", checkoutRequestId: j.CheckoutRequestID ?? "", customerMessage: j.CustomerMessage ?? j.errorMessage ?? `HTTP ${r.status}` };
  },
};

/** One-time: tell Daraja where to send C2B validation/confirmation for the till. */
export async function registerC2BUrls() {
  const r = await fetch(`${base()}/mpesa/c2b/v1/registerurl`, {
    method: "POST", headers: { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ShortCode: env("MPESA_SHORTCODE"), ResponseType: "Completed", ConfirmationURL: callbackUrl("/api/mpesa/c2b/confirm"), ValidationURL: callbackUrl("/api/mpesa/c2b/validate") }),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
}