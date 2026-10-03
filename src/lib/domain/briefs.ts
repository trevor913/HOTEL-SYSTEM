/**
 * Proactive intelligence (§6.5): Evening Pulse (18:30), Morning Brief (05:30) and debt nudges.
 * Pure functions over store-shaped data so they run on-device, in tests and in /api/cron/daily.
 */
import { reminderSms } from "./debts";
import { planTomorrow } from "./planner";
import { avgProfit, bestSellers, dayTotals, debtors, planHistory } from "../store/selectors";
import { formatKES } from "../utils/money";
import { inBusinessDay } from "../utils/dates";
import type { SeedData } from "../store/seed";
import type { SmsMessage } from "../types";

export type BriefInput = Pick<SeedData, "hotel" | "sales" | "expenses" | "debts" | "customers" | "debtPayments" | "inventory" | "menu"> & { sms: SmsMessage[] };

export function eveningPulse(s: BriefInput, now = new Date()) {
  const d = dayTotals(s, 0, now);
  const avg = avgProfit(s, 7, now);
  const top = bestSellers(s, 1, now)[0];
  const pct = avg ? Math.round(((d.profitCents - avg) / Math.abs(avg)) * 100) : 0;
  const parts = [
    `Leo umeuza ${formatKES(d.salesCents + d.debtSalesCents)}, matumizi ${formatKES(d.expensesCents)}, faida ${formatKES(d.profitCents)}.`,
    avg ? (pct >= 0 ? `Uko juu ya wastani wa wiki kwa ${pct}% 💪` : `Uko chini ya wastani wa wiki kwa ${-pct}%.`) : "",
    top ? `${top.item.name} imeongoza (${top.qty}).` : "",
    d.newDebtsCents > 0 ? `Madeni mapya ${formatKES(d.newDebtsCents)}.` : "",
  ];
  return { text: parts.filter(Boolean).join(" "), totals: d, avgCents: avg, top: top ? { name: top.item.name, qty: top.qty } : null };
}

export function morningBrief(s: BriefInput, now = new Date()) {
  const shopping = s.inventory
    .filter((i) => i.currentQty <= i.lowThreshold)
    .map((i) => {
      const buyQty = Math.max(0, Math.round((i.maxQty - i.currentQty) * 10) / 10);
      return { id: i.id, name: i.name, unit: i.unit, buyQty, estCents: Math.round(buyQty * i.lastPriceCents) };
    });
  const plan = planTomorrow(planHistory(s, now), now).slice(0, 4).map((p) => ({ name: s.menu.find((m) => m.id === p.itemId)?.name ?? p.itemId, qty: p.suggestedQty }));
  const y = dayTotals(s, 1, now);
  const total = shopping.reduce((a, x) => a + x.estCents, 0);
  const text = [
    `Habari ${s.hotel.ownerName}! Jana faida ilikuwa ${formatKES(y.profitCents)}.`,
    shopping.length ? `Leo soko: vitu ${shopping.length} (~${formatKES(total)}).` : "Stock iko sawa leo.",
    plan.length ? `Pika zaidi: ${plan.slice(0, 3).map((p) => p.name).join(", ")}.` : "",
  ].filter(Boolean).join(" ");
  const waText = [text, ...shopping.map((x) => `• ${x.name}: ${x.buyQty} ${x.unit}`), ...plan.map((p) => `🍲 ${p.name}: ${p.qty}`)].join("\n");
  return { text, waText, shopping, shoppingCents: total, plan, yesterday: y };
}

export function debtNudges(s: BriefInput, now = new Date()) {
  return debtors(s, now)
    .filter((d) => d.oldestDays > 7 && d.customer.phone)
    .map((d) => ({
      customerId: d.customer.id, name: d.customer.name, phone: d.customer.phone!, balanceCents: d.balanceCents, days: d.oldestDays,
      body: reminderSms({ name: d.customer.name.split(" ")[0]!, balanceCents: d.balanceCents, hotelName: `${s.hotel.ownerName}'s`, till: s.hotel.tillNumber }),
      sentToday: s.sms.some((m) => m.kind === "reminder" && m.to === d.customer.phone && inBusinessDay(m.createdAt, now, 0)),
    }));
}