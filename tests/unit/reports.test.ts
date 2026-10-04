import { describe, expect, it } from "vitest";
import { generateSeed, STAFF } from "@/lib/store/seed";
import { dayTotals } from "@/lib/store/selectors";
import { buildReport, delta, periodRange, previousRange, salesCsv, toCsv } from "@/lib/domain/reports";

const now = new Date(2026, 9, 2, 19, 0);
const seed = generateSeed(now);

describe("§8.8 reports", () => {
  it("period ranges", () => {
    expect(periodRange("leo", now).days).toBe(1);
    expect(periodRange("wiki", now).days).toBe(7);
    const c = periodRange("custom", now, { from: "2026-09-20", to: "2026-09-14" });
    expect(c.days).toBe(7);
    expect(c.start.getHours()).toBe(5);
    expect(previousRange(c).end.getTime()).toBe(c.start.getTime());
  });
  it("week totals agree with dayTotals", () => {
    const r = buildReport(seed, periodRange("wiki", now));
    let profit = 0, exp = 0;
    for (let i = 0; i < 7; i++) { const d = dayTotals(seed, i, now); profit += d.profitCents; exp += d.expensesCents; }
    expect(r.totals.profitCents).toBe(profit);
    expect(r.totals.expensesCents).toBe(exp);
    expect(r.series).toHaveLength(7);
    expect(r.totals.cashCents + r.totals.mpesaCents + r.totals.debtSalesCents).toBe(r.totals.revenueCents);
  });
  it("today is hourly", () => {
    const r = buildReport(seed, periodRange("leo", now));
    expect(r.hourly).toBe(true);
    expect(r.series.every((b) => b.hour !== null)).toBe(true);
    expect(r.best.length).toBeGreaterThan(0);
  });
  it("delta", () => { expect(delta(110, 100)).toBe(10); expect(delta(5, 0)).toBeNull(); });
  it("csv escapes", () => expect(toCsv([["a,b", 'say "hi"', 3]])).toBe('"a,b","say ""hi""",3'));
  it("sales csv has header + rows", () => {
    const csv = salesCsv({ ...seed, staff: STAFF }, periodRange("leo", now)).split("\n");
    expect(csv[0]).toMatch(/^Date,Time,Receipt/);
    expect(csv.length).toBeGreaterThan(5);
  });
});

import { DISHES, slugify } from "@/lib/demo/dishes";
describe("§8.10 onboarding data", () => {
  it("20 dishes with unique keys and prices", () => {
    expect(DISHES).toHaveLength(20);
    expect(new Set(DISHES.map((d) => d.key)).size).toBe(20);
    expect(DISHES.every((d) => d.kes > 0)).toBe(true);
  });
  it("slugify", () => { expect(slugify("Mama Wanjiru's Hotel!")).toBe("mama-wanjiru-s-hotel"); expect(slugify("  ")).toBe("hotel"); });
});
