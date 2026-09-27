import { describe, expect, it } from "vitest";
import { autoMatch } from "@/lib/domain/automatch";
import { estimatedDemand, moneyLeftOnTable, planTomorrow } from "@/lib/domain/planner";

const ctx = {
  customers: [{ id: "c1", name: "Otieno", phone: "254711000111" }],
  debts: [{ id: "d1", customerId: "c1", balanceCents: 25000 }],
  orders: [{ id: "o1", code: "KB-1042", customerPhone: "254722000222", totalCents: 36000, paymentStatus: "unpaid" as const, createdAt: "2026-09-28T09:00:00Z" }],
};

describe("auto-match", () => {
  it("matches order by phone + amount", () =>
    expect(autoMatch({ id: "t1", phone: "254722000222", amountCents: 36000, payerName: "JANE", createdAt: "" }, ctx)).toMatchObject({ status: "matched", entity: "order", entityId: "o1" }));
  it("matches debt by customer phone", () =>
    expect(autoMatch({ id: "t2", phone: "254711000111", amountCents: 10000, payerName: "OTIENO", createdAt: "" }, ctx)).toMatchObject({ status: "matched", entity: "debt", entityId: "d1" }));
  it("suggests on amount-only", () => {
    const r = autoMatch({ id: "t3", phone: "254733000333", amountCents: 25000, payerName: "X", createdAt: "" }, ctx);
    expect(r.status).toBe("unmatched");
    if (r.status === "unmatched") expect(r.suggestions[0]?.entityId).toBe("d1");
  });
});

describe("planner", () => {
  it("extrapolates early sell-outs", () => {
    const r = { date: "2026-09-25", itemId: "pilau", soldQty: 40, cookedQty: 40, soldoutAt: "2026-09-25T13:30:00", wasteQty: 0 };
    expect(estimatedDemand(r)).toBeGreaterThan(40);
    expect(moneyLeftOnTable(r, 15000)).toBeGreaterThan(0);
  });
  it("suggests more after sell-outs", () => {
    const hist = Array.from({ length: 14 }, (_, i) => ({
      date: `2026-09-${String(10 + i).padStart(2, "0")}`, itemId: "pilau", soldQty: 30, cookedQty: 30,
      soldoutAt: `2026-09-${String(10 + i).padStart(2, "0")}T14:00:00`, wasteQty: 0,
    }));
    const [s] = planTomorrow(hist, new Date("2026-09-29"));
    expect(s?.suggestedQty).toBeGreaterThan(30);
  });
});
