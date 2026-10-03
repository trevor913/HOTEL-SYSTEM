import { businessDayStart, daysBetween, inBusinessDay } from "../utils/dates";
import type { Customer, Debt, Expense, MenuItem, Sale } from "../types";
import type { DayItemRecord } from "../domain/planner";

export function dayTotals(s: { sales: Sale[]; expenses: Expense[]; debts: Debt[] }, daysAgo = 0, now = new Date()) {
  const sales = s.sales.filter((x) => inBusinessDay(x.createdAt, now, daysAgo));
  const salesCents = sales.filter((x) => x.paymentMethod !== "debt").reduce((a, x) => a + x.totalCents, 0);
  const debtSalesCents = sales.filter((x) => x.paymentMethod === "debt").reduce((a, x) => a + x.totalCents, 0);
  const expensesCents = s.expenses.filter((x) => inBusinessDay(x.createdAt, now, daysAgo)).reduce((a, x) => a + x.amountCents, 0);
  const newDebtsCents = s.debts.filter((x) => inBusinessDay(x.createdAt, now, daysAgo)).reduce((a, x) => a + x.amountCents, 0);
  const mpesaCents = sales.filter((x) => x.paymentMethod === "mpesa").reduce((a, x) => a + x.totalCents, 0);
  return {
    salesCents, expensesCents, newDebtsCents, mpesaCents, cashCents: salesCents - mpesaCents, debtSalesCents,
    // Profit = food sold today (incl. on credit) minus spend
    profitCents: salesCents + debtSalesCents - expensesCents, count: sales.length,
  };
}

export function avgProfit(s: Parameters<typeof dayTotals>[0], days = 7, now = new Date()) {
  let sum = 0;
  for (let i = 1; i <= days; i++) sum += dayTotals(s, i, now).profitCents;
  return Math.round(sum / days);
}

export interface Debtor { customer: Customer; balanceCents: number; oldestDays: number; debtCount: number; lastPaymentAt: string | null }
export function debtors(s: { debts: Debt[]; customers: Customer[]; debtPayments: { debtId: string; createdAt: string }[] }, now = new Date()): Debtor[] {
  const map = new Map<string, Debtor>();
  for (const d of s.debts) {
    if (d.balanceCents <= 0 || d.status === "written_off") continue;
    const c = s.customers.find((x) => x.id === d.customerId);
    if (!c) continue;
    const e = map.get(c.id) ?? { customer: c, balanceCents: 0, oldestDays: 0, debtCount: 0, lastPaymentAt: null };
    e.balanceCents += d.balanceCents;
    e.debtCount += 1;
    e.oldestDays = Math.max(e.oldestDays, daysBetween(d.createdAt, now));
    map.set(c.id, e);
  }
  for (const p of s.debtPayments) {
    const d = s.debts.find((x) => x.id === p.debtId);
    const e = d && map.get(d.customerId);
    if (e && (!e.lastPaymentAt || p.createdAt > e.lastPaymentAt)) e.lastPaymentAt = p.createdAt;
  }
  return [...map.values()].sort((a, b) => b.balanceCents - a.balanceCents);
}

export function recoveredThisWeek(s: { debtPayments: { amountCents: number; createdAt: string }[] }, now = new Date()) {
  const start = businessDayStart(now, 6).getTime();
  return s.debtPayments.filter((p) => new Date(p.createdAt).getTime() >= start).reduce((a, p) => a + p.amountCents, 0);
}

export function bestSellers(s: { sales: Sale[]; menu: MenuItem[] }, days = 7, now = new Date()) {
  const start = businessDayStart(now, days - 1).getTime();
  const qty = new Map<string, { qty: number; cents: number }>();
  for (const sale of s.sales) {
    if (new Date(sale.createdAt).getTime() < start) continue;
    for (const i of sale.items) {
      const e = qty.get(i.menuItemId) ?? { qty: 0, cents: 0 };
      e.qty += i.qty; e.cents += i.lineTotalCents;
      qty.set(i.menuItemId, e);
    }
  }
  return [...qty.entries()]
    .map(([id, v]) => ({ item: s.menu.find((m) => m.id === id), ...v }))
    .filter((x): x is { item: MenuItem; qty: number; cents: number } => !!x.item)
    .sort((a, b) => b.cents - a.cents);
}

/** Daily spend series for an expense keyword (Soko sparkline). */
export function priceSeries(expenses: Expense[], match: string, days = 14, now = new Date()) {
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    out.push(expenses.filter((e) => inBusinessDay(e.createdAt, now, i) && e.description.toLowerCase().includes(match.toLowerCase())).reduce((a, e) => a + e.amountCents, 0));
  }
  return out;
}

/** Per-item daily sold quantities for the last N business days (planner input). */
export function planHistory(s: { sales: Sale[]; menu: MenuItem[] }, now = new Date(), days = 21): DayItemRecord[] {
  const base = businessDayStart(now, 0).getTime();
  const counts = new Map<string, number>();
  for (const sale of s.sales) {
    const t = new Date(sale.createdAt).getTime();
    if (t >= base) continue;
    const idx = Math.floor((base - t) / 86_400_000) + 1;
    if (idx > days) continue;
    for (const it of sale.items) counts.set(`${idx}|${it.menuItemId}`, (counts.get(`${idx}|${it.menuItemId}`) ?? 0) + it.qty);
  }
  const out: DayItemRecord[] = [];
  for (let i = 1; i <= days; i++) {
    const d = businessDayStart(now, i);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    for (const m of s.menu) {
      const sold = counts.get(`${i}|${m.id}`) ?? 0;
      out.push({ date, itemId: m.id, soldQty: sold, cookedQty: sold, soldoutAt: null, wasteQty: 0 });
    }
  }
  return out;
}
