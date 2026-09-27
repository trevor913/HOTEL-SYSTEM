/** M-Pesa auto-match engine (§7.1). Pure & deterministic. */
import type { Cents } from "../utils/money";

export interface IncomingTxn { id: string; phone: string; amountCents: Cents; payerName: string; createdAt: string }
export interface MatchCandidateCustomer { id: string; name: string; phone: string | null }
export interface OpenDebt { id: string; customerId: string; balanceCents: Cents }
export interface OpenOrder { id: string; code: string; customerPhone: string | null; totalCents: Cents; paymentStatus: "unpaid" | "paid" | "pay_on_delivery"; createdAt: string }

type Suggestion = { entity: "order" | "debt"; entityId: string; confidence: number; reason: string };
export type MatchResult =
  | ({ status: "matched" } & Suggestion)
  | { status: "unmatched"; suggestions: Suggestion[] };

export function autoMatch(
  txn: IncomingTxn,
  ctx: { customers: MatchCandidateCustomer[]; debts: OpenDebt[]; orders: OpenOrder[] },
): MatchResult {
  const suggestions: Suggestion[] = [];
  const unpaid = ctx.orders.filter((o) => o.paymentStatus !== "paid");

  // 1. Order: same phone + exact amount → certain
  for (const o of unpaid) {
    const phone = o.customerPhone === txn.phone;
    const amount = o.totalCents === txn.amountCents;
    if (phone && amount) return { status: "matched", entity: "order", entityId: o.id, confidence: 0.99, reason: `Simu na kiasi vinalingana na oda ${o.code}` };
    if (amount) suggestions.push({ entity: "order", entityId: o.id, confidence: 0.6, reason: `Kiasi kinalingana na oda ${o.code}` });
    else if (phone) suggestions.push({ entity: "order", entityId: o.id, confidence: 0.5, reason: `Simu ya oda ${o.code}` });
  }

  // 2. Debt: phone → customer → open debt
  const customer = ctx.customers.find((c) => c.phone === txn.phone);
  if (customer) {
    const debts = ctx.debts.filter((d) => d.customerId === customer.id && d.balanceCents > 0);
    const total = debts.reduce((a, d) => a + d.balanceCents, 0);
    if (debts.length && txn.amountCents <= total) {
      return { status: "matched", entity: "debt", entityId: debts[0]!.id, confidence: 0.95, reason: `${customer.name} analipa deni` };
    }
    if (debts.length) suggestions.push({ entity: "debt", entityId: debts[0]!.id, confidence: 0.55, reason: `${customer.name} amelipa zaidi ya deni` });
  }

  // 3. Debt by exact balance (different phone, e.g. paid by a friend)
  for (const d of ctx.debts) {
    if (d.balanceCents === txn.amountCents) {
      const c = ctx.customers.find((x) => x.id === d.customerId);
      suggestions.push({ entity: "debt", entityId: d.id, confidence: 0.45, reason: `Kiasi sawa na deni la ${c?.name ?? "mteja"}` });
    }
  }
  suggestions.sort((a, b) => b.confidence - a.confidence);
  return { status: "unmatched", suggestions: suggestions.slice(0, 3) };
}
