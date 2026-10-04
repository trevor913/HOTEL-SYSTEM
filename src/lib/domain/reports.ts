/**
 * Ripoti engine (§8.8). Pure aggregation over a business-day range (days start 05:00).
 * Used by the Ripoti screen, CSV export and the printable Bank Statement.
 */
import { BUSINESS_DAY_START_HOUR, businessDayStart } from "../utils/dates";
import type { Customer, Debt, DebtPayment, Expense, ExpenseCategory, MenuItem, Sale, Staff } from "../types";

export type PeriodKind = "leo" | "wiki" | "mwezi" | "custom";
export interface Range { start: Date; end: Date; days: number }
export interface ReportInput { sales: Sale[]; expenses: Expense[]; debts: Debt[]; debtPayments: DebtPayment[]; menu: MenuItem[]; customers: Customer[]; staff?: Staff[] }

const DAY = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseDay = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1, BUSINESS_DAY_START_HOUR); };
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

export function periodRange(kind: PeriodKind, now = new Date(), custom?: { from: string; to: string }): Range {
  if (kind === "custom" && custom?.from && custom?.to) {
    let a = parseDay(custom.from), b = parseDay(custom.to);
    if (a > b) [a, b] = [b, a];
    const end = addDays(b, 1);
    return { start: a, end, days: Math.max(1, Math.round((end.getTime() - a.getTime()) / DAY)) };
  }
  const n = kind === "leo" ? 1 : kind === "wiki" ? 7 : 30;
  return { start: businessDayStart(now, n - 1), end: addDays(businessDayStart(now, 0), 1), days: n };
}

export function previousRange(r: Range): Range {
  return { start: addDays(r.start, -r.days), end: new Date(r.start), days: r.days };
}

export interface Bucket {
  key: number; date: string; dow: number; hour: number | null;
  revenueCents: number; cashCents: number; mpesaCents: number; debtSalesCents: number; expensesCents: number; profitCents: number;
  newDebtCents: number; recoveredCents: number; count: number;
}

export function buildReport(s: ReportInput, r: Range, opts: { granularity?: "auto" | "day" } = {}) {
  const t0 = r.start.getTime(), t1 = r.end.getTime();
  const inR = (iso: string) => { const t = Date.parse(iso); return t >= t0 && t < t1; };
  const sales = s.sales.filter((x) => inR(x.createdAt));
  const expenses = s.expenses.filter((x) => inR(x.createdAt));
  const newDebts = s.debts.filter((x) => inR(x.createdAt));
  const payments = s.debtPayments.filter((x) => inR(x.createdAt));

  const hourly = opts.granularity !== "day" && r.days <= 1;
  const n = hourly ? 24 : r.days;
  const series: Bucket[] = Array.from({ length: n }, (_, i) => {
    const d = hourly ? r.start : addDays(r.start, i);
    return { key: i, date: ymd(d), dow: d.getDay(), hour: hourly ? i : null, revenueCents: 0, cashCents: 0, mpesaCents: 0, debtSalesCents: 0, expensesCents: 0, profitCents: 0, newDebtCents: 0, recoveredCents: 0, count: 0 };
  });
  const at = (iso: string) => {
    const i = hourly ? new Date(iso).getHours() : Math.floor((Date.parse(iso) - t0) / DAY);
    return series[Math.min(n - 1, Math.max(0, i))]!;
  };

  const hours = Array.from({ length: 24 }, () => 0);
  const mix = { cash: 0, mpesa: 0, debt: 0, split: 0 };
  const items = new Map<string, { qty: number; cents: number }>();
  const custs = new Map<string, { cents: number; visits: number }>();
  for (const x of sales) {
    const b = at(x.createdAt);
    b.revenueCents += x.totalCents; b.count++;
    if (x.paymentMethod === "mpesa") b.mpesaCents += x.totalCents;
    else if (x.paymentMethod === "debt") b.debtSalesCents += x.totalCents;
    else b.cashCents += x.totalCents;
    mix[x.paymentMethod] += x.totalCents;
    hours[new Date(x.createdAt).getHours()]! += x.totalCents;
    for (const it of x.items) {
      const cur = items.get(it.menuItemId) ?? { qty: 0, cents: 0 };
      cur.qty += it.qty; cur.cents += it.lineTotalCents; items.set(it.menuItemId, cur);
    }
    if (x.customerId) { const c = custs.get(x.customerId) ?? { cents: 0, visits: 0 }; c.cents += x.totalCents; c.visits++; custs.set(x.customerId, c); }
  }
  const byCat = new Map<ExpenseCategory, number>();
  for (const e of expenses) { at(e.createdAt).expensesCents += e.amountCents; byCat.set(e.category, (byCat.get(e.category) ?? 0) + e.amountCents); }
  for (const d of newDebts) at(d.createdAt).newDebtCents += d.amountCents;
  for (const p of payments) at(p.createdAt).recoveredCents += p.amountCents;
  for (const b of series) b.profitCents = b.revenueCents - b.expensesCents;

  const sum = (k: keyof Bucket) => series.reduce((a, b) => a + (b[k] as number), 0);
  const totals = {
    revenueCents: sum("revenueCents"), cashCents: sum("cashCents"), mpesaCents: sum("mpesaCents"), debtSalesCents: sum("debtSalesCents"),
    expensesCents: sum("expensesCents"), profitCents: sum("profitCents"), newDebtCents: sum("newDebtCents"), recoveredCents: sum("recoveredCents"), count: sales.length,
  };
  const best = [...items.entries()].map(([id, v]) => { const m = s.menu.find((x) => x.id === id); return { itemId: id, name: m?.nameSw ?? id, emoji: m?.emoji ?? "🍽️", ...v }; })
    .sort((a, b) => b.cents - a.cents).slice(0, 8);
  const topCustomers = [...custs.entries()].map(([id, v]) => ({ customerId: id, name: s.customers.find((c) => c.id === id)?.name ?? "Mteja", ...v }))
    .sort((a, b) => b.cents - a.cents).slice(0, 5);
  const payMix = (Object.entries(mix) as [keyof typeof mix, number][]).filter(([, c]) => c > 0).map(([method, cents]) => ({ method, cents }));
  const expenseByCat = [...byCat.entries()].map(([category, cents]) => ({ category, cents })).sort((a, b) => b.cents - a.cents);

  return { range: r, hourly, series: hourly ? series.slice(BUSINESS_DAY_START_HOUR, 23) : series, totals, hours, payMix, best, topCustomers, expenseByCat };
}
export type Report = ReturnType<typeof buildReport>;

/** % change vs previous period; null when there is no baseline. */
export function delta(cur: number, prev: number): number | null {
  if (!prev) return null;
  return Math.round(((cur - prev) / Math.abs(prev)) * 100);
}

const csvCell = (v: string | number) => { const x = String(v); return /[",\n]/.test(x) ? `"${x.replace(/"/g, '""')}"` : x; };
export const toCsv = (rows: (string | number)[][]) => rows.map((r) => r.map(csvCell).join(",")).join("\n");

/** Transaction-level CSV for the period (Excel-friendly). */
export function salesCsv(s: ReportInput, r: Range): string {
  const t0 = r.start.getTime(), t1 = r.end.getTime();
  const rows: (string | number)[][] = [["Date", "Time", "Receipt", "Items", "Method", "Total (KES)", "Staff", "Customer"]];
  for (const x of [...s.sales].filter((x) => { const t = Date.parse(x.createdAt); return t >= t0 && t < t1; }).sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const d = new Date(x.createdAt);
    const items = x.items.map((i) => `${i.qty}x ${s.menu.find((m) => m.id === i.menuItemId)?.name ?? i.menuItemId}`).join("; ") || "M-Pesa";
    rows.push([ymd(d), `${pad(d.getHours())}:${pad(d.getMinutes())}`, x.id, items, x.paymentMethod, (x.totalCents / 100).toFixed(2),
      s.staff?.find((st) => st.id === x.staffId)?.name ?? x.staffId, x.customerId ? s.customers.find((c) => c.id === x.customerId)?.name ?? "" : ""]);
  }
  return toCsv(rows);
}