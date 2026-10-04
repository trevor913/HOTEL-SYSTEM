/**
 * Safaricom Daraja helpers (§7.1). Pure functions shared by the live adapter, the webhook
 * routes and the on-device simulator, so a simulated C2B goes through the exact same parser.
 */
import { normalizePhone } from "../../utils/phone";

export const DARAJA_BASE = { sandbox: "https://sandbox.safaricom.co.ke", production: "https://api.safaricom.co.ke" } as const;

export interface ParsedTxn {
  providerTxId: string; type: "c2b" | "stk"; phone: string; amountCents: number; payerName: string; createdAt: string;
  reference?: string; shortcode?: string;
}

const p2 = (n: number) => String(n).padStart(2, "0");
const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

/** Daraja timestamps are YYYYMMDDHHmmss in Nairobi time (EAT, UTC+3). */
export function darajaTimestamp(d: Date = new Date()): string {
  const e = new Date(d.getTime() + 3 * 3_600_000);
  return `${e.getUTCFullYear()}${p2(e.getUTCMonth() + 1)}${p2(e.getUTCDate())}${p2(e.getUTCHours())}${p2(e.getUTCMinutes())}${p2(e.getUTCSeconds())}`;
}

export function parseDarajaTime(ts: unknown, fallback: Date = new Date()): string {
  const m = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(str(ts));
  if (!m) return fallback.toISOString();
  return new Date(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}+03:00`).toISOString();
}

/** STK password = base64(shortcode + passkey + timestamp). */
export function stkPassword(shortcode: string, passkey: string, timestamp: string): string {
  return btoa(`${shortcode}${passkey}${timestamp}`);
}

/** C2B confirmation/validation body → normalized txn. Null if it is not a usable payment. */
export function parseC2B(body: unknown): ParsedTxn | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const providerTxId = str(b.TransID);
  const amount = Number(str(b.TransAmount));
  if (!providerTxId || !(amount > 0)) return null;
  const rawPhone = str(b.MSISDN);
  const payerName = [b.FirstName, b.MiddleName, b.LastName].map(str).filter(Boolean).join(" ").toUpperCase() || "M-PESA";
  return {
    providerTxId, type: "c2b", phone: normalizePhone(rawPhone) ?? rawPhone, amountCents: Math.round(amount * 100), payerName,
    createdAt: parseDarajaTime(b.TransTime), reference: str(b.BillRefNumber) || undefined, shortcode: str(b.BusinessShortCode) || undefined,
  };
}

export interface StkResult { checkoutRequestId: string; merchantRequestId: string; ok: boolean; resultCode: number; resultDesc: string; txn: ParsedTxn | null }

/** STK callback body ({ Body: { stkCallback } }) → result + txn when paid. */
export function parseStkCallback(body: unknown): StkResult | null {
  const cb = (body as { Body?: { stkCallback?: Record<string, unknown> } } | null)?.Body?.stkCallback;
  if (!cb) return null;
  const items = (cb.CallbackMetadata as { Item?: { Name: string; Value?: unknown }[] } | undefined)?.Item ?? [];
  const get = (n: string) => items.find((i) => i.Name === n)?.Value;
  const resultCode = Number(cb.ResultCode);
  const ok = resultCode === 0;
  const rawPhone = str(get("PhoneNumber"));
  const amount = Number(str(get("Amount")));
  return {
    checkoutRequestId: str(cb.CheckoutRequestID), merchantRequestId: str(cb.MerchantRequestID), ok, resultCode, resultDesc: str(cb.ResultDesc),
    txn: ok && str(get("MpesaReceiptNumber")) && amount > 0
      ? { providerTxId: str(get("MpesaReceiptNumber")), type: "stk", phone: normalizePhone(rawPhone) ?? rawPhone, amountCents: Math.round(amount * 100), payerName: "STK PUSH", createdAt: parseDarajaTime(get("TransactionDate")) }
      : null,
  };
}