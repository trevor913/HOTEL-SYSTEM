import { businessDayStart, daysBetween, inBusinessDay } from "../utils/dates";
import type { Customer, Debt, Expense, MenuItem, Sale, SoldOutEvent, Staff, WagePayment, WasteEvent } from "../types";
import { dateKey } from "./seed-ops";
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

/** Per-item daily records for the last N business days (planner input), incl. sold-out times and waste. */
export function planHistory(
  s: { sales: Sale[]; menu: MenuItem[]; soldOutLog?: SoldOutEvent[]; wasteLog?: WasteEvent[] }, now = new Date(), days = 21,
): (DayItemRecord & { daysAgo: number })[] {
  const base = businessDayStart(now, 0).getTime();
  const idxOf = (iso: string) => { const t = new Date(iso).getTime(); return t >= base ? 0 : Math.floor((base - t) / 86_400_000) + 1; };
  const counts = new Map<string, number>();
  for (const sale of s.sales) {
    const idx = idxOf(sale.createdAt);
    if (idx === 0 || idx > days) continue;
    for (const it of sale.items) counts.set(`${idx}|${it.menuItemId}`, (counts.get(`${idx}|${it.menuItemId}`) ?? 0) + it.qty);
  }
  const soldOut = new Map<string, string>();
  for (const e of s.soldOutLog ?? []) { const i = idxOf(e.at); if (i > 0 && i <= days) soldOut.set(`${i}|${e.itemId}`, e.at); }
  const waste = new Map<string, number>();
  for (const e of s.wasteLog ?? []) { const i = idxOf(e.at); if (i > 0 && i <= days) waste.set(`${i}|${e.itemId}`, (waste.get(`${i}|${e.itemId}`) ?? 0) + e.qty); }
  const out: (DayItemRecord & { daysAgo: number })[] = [];
  for (let i = 1; i <= days; i++) {
    const date = dateKey(businessDayStart(now, i));
    for (const m of s.menu) {
      const k = `${i}|${m.id}`;
      const sold = counts.get(k) ?? 0;
      const w = waste.get(k) ?? 0;
      out.push({ date, daysAgo: i, itemId: m.id, soldQty: sold, cookedQty: sold + w, soldoutAt: soldOut.get(k) ?? null, wasteQty: w });
    }
  }
  return out;
}

/** Last 7 business days: present-days × daily wage minus wages paid in that window. */
export function wageSummary(
  s: { staff: Staff[]; shifts: Record<string, boolean>; wagePayments: WagePayment[] }, staffId: string, now = new Date(),
) {
  const st = s.staff.find((x) => x.id === staffId);
  if (!st) return { days: 0, earnedCents: 0, paidCents: 0, dueCents: 0, dates: [] as { date: string; present: boolean }[] };
  const dates = Array.from({ length: 7 }, (_, i) => { const date = dateKey(businessDayStart(now, 6 - i)); return { date, present: !!s.shifts[`${date}|${staffId}`] }; });
  const days = dates.filter((d) => d.present).length;
  const since = businessDayStart(now, 6).getTime();
  const paidCents = s.wagePayments.filter((p) => p.staffId === staffId && new Date(p.createdAt).getTime() >= since).reduce((a, p) => a + p.amountCents, 0);
  const earnedCents = st.role === "owner" ? 0 : days * st.dailyWageCents;
  return { days, earnedCents, paidCents, dueCents: Math.max(0, earnedCents - paidCents), dates };
}

/** Sales attributed to a staff member over N days. */
export function staffSales(s: { sales: Sale[] }, staffId: string, days = 7, now = new Date()) {
  const since = businessDayStart(now, days - 1).getTime();
  const rows = s.sales.filter((x) => x.staffId === staffId && new Date(x.createdAt).getTime() >= since);
  return { count: rows.length, cents: rows.reduce((a, x) => a + x.totalCents, 0) };
}
