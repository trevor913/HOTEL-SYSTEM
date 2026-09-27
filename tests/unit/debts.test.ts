import { describe, expect, it } from "vitest";
import { agingReport, allocatePayment, OverpaymentError, reminderSms, settleAll, type DebtLike } from "@/lib/domain/debts";

const debts: DebtLike[] = [
  { id: "d2", customerId: "c1", amountCents: 30000, balanceCents: 30000, status: "open", createdAt: "2026-09-20T10:00:00Z" },
  { id: "d1", customerId: "c1", amountCents: 25000, balanceCents: 10000, status: "partial", createdAt: "2026-08-01T10:00:00Z" },
];

describe("debt engine", () => {
  it("applies oldest first, partial", () => {
    const { allocations } = allocatePayment(debts, 15000);
    expect(allocations).toEqual([
      { debtId: "d1", appliedCents: 10000, newBalanceCents: 0, newStatus: "paid" },
      { debtId: "d2", appliedCents: 5000, newBalanceCents: 25000, newStatus: "partial" },
    ]);
  });
  it("guards overpayment", () => expect(() => allocatePayment(debts, 50000)).toThrow(OverpaymentError));
  it("allows overpay as credit when asked", () => expect(allocatePayment(debts, 50000, { allowOverpay: true }).surplusCents).toBe(10000));
  it("settles all", () => {
    const r = settleAll(debts);
    expect(r.totalCents).toBe(40000);
    expect(r.allocations.every((a) => a.newStatus === "paid")).toBe(true);
  });
  it("buckets by age", () => {
    const r = agingReport(debts, new Date("2026-09-28T00:00:00Z"));
    expect(r["0-7"].cents).toBe(30000);
    expect(r["30+"].cents).toBe(10000);
  });
  it("writes polite Swahili reminders", () =>
    expect(reminderSms({ name: "Otieno", balanceCents: 25000, hotelName: "Mama Mary's", till: "832100" })).toBe(
      "Habari Otieno! Kumbusho ya deni KSh 250 ya Mama Mary's. Lipa kwa M-Pesa Till 832100. Asante! 🙏"));
});
