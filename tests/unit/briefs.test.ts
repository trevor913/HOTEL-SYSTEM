import { describe, expect, it } from "vitest";
import { generateSeed } from "@/lib/store/seed";
import { debtNudges, eveningPulse, morningBrief } from "@/lib/domain/briefs";
import { parseIntent } from "@/lib/ai/intents";
import { sanitizeHistory } from "@/lib/ai/agent";
import { DEMO_CATALOG as C } from "@/lib/demo/catalog";

const now = new Date(2026, 9, 2, 19, 0);
const seed = { ...generateSeed(now), sms: [] };

describe("§6.5 proactive briefs", () => {
  it("nudges only debts older than 7 days that have a phone", () => {
    const n = debtNudges(seed, now);
    expect(n.length).toBeGreaterThan(0);
    for (const x of n) { expect(x.days).toBeGreaterThan(7); expect(x.phone).toBeTruthy(); expect(x.sentToday).toBe(false); }
  });
  it("marks a nudge as sent once reminded today", () => {
    const first = debtNudges(seed, now)[0]!;
    const sms = [{ id: "x", to: first.phone, toName: first.name, body: "", kind: "reminder" as const, status: "sent" as const, createdAt: now.toISOString() }];
    expect(debtNudges({ ...seed, sms }, now)[0]!.sentToday).toBe(true);
  });
  it("evening pulse narrates the day's P&L", () => expect(eveningPulse(seed, now).text).toMatch(/faida −?KSh/));
  it("morning brief lists low stock to buy", () => {
    const b = morningBrief(seed, new Date(2026, 9, 2, 6, 0));
    expect(b.shopping.map((i) => i.id)).toContain("i-mchele");
    expect(b.plan.length).toBeGreaterThan(0);
  });
});

describe("parser gaps fixed", () => {
  it("prefix quantities", () => expect(parseIntent("Nimeuza 2 chapati na chai moja cash", C)).toMatchObject({ kind: "log_sale", items: [{ itemId: "m-chapati", qty: 2 }, { itemId: "m-chai", qty: 1 }] }));
  it("cook before tomorrow", () => expect(parseIntent("What should I cook tomorrow?", C)).toEqual({ kind: "plan_tomorrow" }));
});

describe("live agent history", () => {
  it("starts with user and alternates", () => {
    const h = sanitizeHistory([{ role: "assistant", content: "hi" }, { role: "user", content: "a" }, { role: "user", content: "b" }, { role: "assistant", content: "c" }]);
    expect(h.map((m) => m.role)).toEqual(["user", "assistant"]);
    expect(h[0]!.content).toBe("a\nb");
  });
});
