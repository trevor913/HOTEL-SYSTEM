"use client";
/**
 * Reconcile simulator (§7.1 mock): fabricate a Daraja C2B body, push it through the real
 * /api/mpesa/c2b/confirm route (same parser as production), then ingest on-device.
 * Offline → parse locally so the demo never breaks.
 */
import { useApp } from "../../store/app-store";
import { buildMockC2B } from "./mock";
import { parseC2B, type ParsedTxn } from "./daraja";

export async function simulateC2B() {
  const s = useApp.getState();
  const body = buildMockC2B(s);
  let txn: ParsedTxn | null = null;
  try {
    const r = await fetch("/api/mpesa/c2b/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) txn = ((await r.json()) as { txn?: ParsedTxn }).txn ?? null;
  } catch { /* offline */ }
  txn ??= parseC2B(body);
  if (!txn) throw new Error("bad simulated payload");
  return useApp.getState().ingestMpesa(txn);
}