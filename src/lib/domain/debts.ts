/** Debt engine: pure functions, integer cents only. */
import type { Cents } from "../utils/money";

export type DebtStatus = "open" | "partial" | "paid" | "written_off";
export interface DebtLike { id: string; customerId: string; amountCents: Cents; balanceCents: Cents; status: DebtStatus; createdAt: string }
export interface PaymentAllocation { debtId: string; appliedCents: Cents; newBalanceCents: Cents; newStatus: DebtStatus }

export class OverpaymentError extends Error {
  readonly outstandingCents: Cents;
  readonly attemptedCents: Cents;
  constructor(outstandingCents: Cents, attemptedCents: Cents) {
    super(`Payment of ${attemptedCents} exceeds outstanding ${outstandingCents}`);
    this.outstandingCents = outstandingCents;
    this.attemptedCents = attemptedCents;
  }
}

export function statusFor(amount: Cents, balance: Cents): DebtStatus {
  if (balance <= 0) return "paid";
  if (balance < amount) return "partial";
  return "open";
}

export function outstanding(debts: readonly DebtLike[]): Cents {
  return debts.filter((d) => d.status === "open" || d.status === "partial").reduce((a, d) => a + d.balanceCents, 0);
}

/**
 * Apply a payment across a customer's open debts, OLDEST FIRST.
 * Throws OverpaymentError unless allowOverpay (then the surplus is returned as credit).
 */
export function allocatePayment(
  debts: readonly DebtLike[],
  paymentCents: Cents,
  opts: { allowOverpay?: boolean } = {},
): { allocations: PaymentAllocation[]; surplusCents: Cents } {
  if (!Number.isInteger(paymentCents) || paymentCents <= 0) throw new Error("Payment must be positive integer cents");
  const open = debts
    .filter((d) => (d.status === "open" || d.status === "partial") && d.balanceCents > 0)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const total = open.reduce((a, d) => a + d.balanceCents, 0);
  if (paymentCents > total && !opts.allowOverpay) throw new OverpaymentError(total, paymentCents);

  let remaining = paymentCents;
  const allocations: PaymentAllocation[] = [];
  for (const d of open) {
    if (remaining <= 0) break;
    const applied = Math.min(remaining, d.balanceCents);
    const newBalance = d.balanceCents - applied;
    allocations.push({ debtId: d.id, appliedCents: applied, newBalanceCents: newBalance, newStatus: statusFor(d.amountCents, newBalance) });
    remaining -= applied;
  }
  return { allocations, surplusCents: Math.max(0, remaining) };
}

/** Settle everything the customer owes. */
export function settleAll(debts: readonly DebtLike[]) {
  const total = outstanding(debts);
  if (total === 0) return { allocations: [] as PaymentAllocation[], surplusCents: 0, totalCents: 0 };
  return { ...allocatePayment(debts, total), totalCents: total };
}

export type AgingBucket = "0-7" | "8-30" | "30+";
export function ageInDays(createdAt: string, now: Date = new Date()): number {
  return Math.max(0, Math.floor((now.getTime() - new Date(createdAt).getTime()) / 86_400_000));
}
export function bucketOf(days: number): AgingBucket {
  return days <= 7 ? "0-7" : days <= 30 ? "8-30" : "30+";
}
export function agingReport(debts: readonly DebtLike[], now: Date = new Date()) {
  const buckets: Record<AgingBucket, { count: number; cents: Cents }> = {
    "0-7": { count: 0, cents: 0 }, "8-30": { count: 0, cents: 0 }, "30+": { count: 0, cents: 0 },
  };
  for (const d of debts) {
    if (d.status !== "open" && d.status !== "partial") continue;
    const b = buckets[bucketOf(ageInDays(d.createdAt, now))];
    b.count++; b.cents += d.balanceCents;
  }
  return buckets;
}

/** Polite Swahili reminder copy (§6.5). */
export function reminderSms(p: { name: string; balanceCents: Cents; hotelName: string; till: string }): string {
  const kes = Math.round(p.balanceCents / 100).toLocaleString("en-KE");
  return `Habari ${p.name}! Kumbusho ya deni KSh ${kes} ya ${p.hotelName}. Lipa kwa M-Pesa Till ${p.till}. Asante! 🙏`;
}
export function receiptSms(p: { name: string; paidCents: Cents; balanceCents: Cents; hotelName: string }): string {
  const paid = Math.round(p.paidCents / 100).toLocaleString("en-KE");
  if (p.balanceCents <= 0) return `Asante ${p.name}! Tumepokea KSh ${paid}. Deni lako kwa ${p.hotelName} limelipwa lote. 🎉`;
  const bal = Math.round(p.balanceCents / 100).toLocaleString("en-KE");
  return `Asante ${p.name}! Tumepokea KSh ${paid}. Salio la deni: KSh ${bal}. (${p.hotelName})`;
}
