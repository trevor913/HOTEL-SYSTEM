/**
 * Server-side persistence for webhooks (live mode only). In MOCK_MODE data lives on each device,
 * so webhooks just parse + acknowledge and the client ingests the txn.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ParsedTxn } from "../integrations/mpesa/daraja";

let client: SupabaseClient | null = null;
export function adminDb(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (process.env.MOCK_MODE !== "false" || !url || !key) return null;
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export async function saveMpesaTxn(t: ParsedTxn): Promise<{ persisted: boolean; reason?: string }> {
  const db = adminDb();
  if (!db) return { persisted: false, reason: "mock_mode" };
  const till = t.shortcode ?? process.env.MPESA_SHORTCODE ?? "";
  const { data: hotel } = await db.from("hotels").select("id").eq("till_number", till).maybeSingle();
  if (!hotel) return { persisted: false, reason: "unknown_shortcode" };
  const { error } = await db.from("mpesa_txns").upsert(
    { hotel_id: hotel.id, provider_tx_id: t.providerTxId, type: t.type, phone: t.phone, amount_cents: t.amountCents, payer_name: t.payerName, status: "unmatched", created_at: t.createdAt },
    { onConflict: "provider_tx_id", ignoreDuplicates: true },
  );
  return error ? { persisted: false, reason: error.message } : { persisted: true };
}