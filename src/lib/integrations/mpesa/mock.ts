/** Mock M-Pesa: STK always "sent"; buildMockC2B fabricates a Daraja-shaped C2B body (Reconcile simulator). */
import { darajaTimestamp } from "./daraja";
import type { MpesaAdapter } from "./types";
import type { Customer, Debt, Hotel, Order } from "../../types";

export const mockMpesa: MpesaAdapter = {
  mode: "mock",
  async stkPush({ amountCents }) {
    return { ok: true, checkoutRequestId: `ws_CO_MOCK_${Date.now()}`, customerMessage: `Mock STK for KSh ${Math.ceil(amountCents / 100)} sent` };
  },
};

const FIRST = ["JANE", "BRIAN", "KEVIN", "MERCY", "DENNIS", "FAITH", "COLLINS", "LILIAN"];
const LAST = ["MUTUKU", "OTIENO", "KARANJA", "CHERONO", "WANYAMA", "NJOROGE"];

export function buildMockC2B(s: { customers: Customer[]; debts: Debt[]; orders: Order[]; hotel: Hotel }, rnd: () => number = Math.random) {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)]!;
  let phone = `2547${String(Math.floor(rnd() * 1e8)).padStart(8, "0")}`;
  let amountKes = pick([150, 250, 360, 500, 1200]);
  let [first, last] = [pick(FIRST), pick(LAST)];
  const r = rnd();
  const debtors = s.customers.filter((c) => c.phone && s.debts.some((d) => d.customerId === c.id && d.balanceCents > 0));
  const orders = s.orders.filter((o) => o.paymentStatus !== "paid" && o.status !== "cancelled" && o.customerPhone);
  const nameOf = (n: string) => { const [a, b] = n.toUpperCase().split(" "); return [a ?? "MTEJA", b ?? ""] as const; };
  if (r < 0.45 && debtors.length) {
    const c = pick(debtors);
    const bal = s.debts.filter((d) => d.customerId === c.id).reduce((a, d) => a + d.balanceCents, 0) / 100;
    phone = c.phone!; amountKes = Math.min(bal, 100 * (1 + Math.floor(rnd() * 3)));
    [first, last] = nameOf(c.name);
  } else if (r < 0.65 && orders.length) {
    const o = pick(orders);
    phone = o.customerPhone; amountKes = o.totalCents / 100;
    [first, last] = nameOf(o.customerName);
  }
  const id = `S${Array.from({ length: 9 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"[Math.floor(rnd() * 34)]).join("")}`;
  return {
    TransactionType: "Buy Goods", TransID: id, TransTime: darajaTimestamp(), TransAmount: amountKes.toFixed(2), BusinessShortCode: s.hotel.tillNumber,
    BillRefNumber: "", InvoiceNumber: "", OrgAccountBalance: "", ThirdPartyTransID: "", MSISDN: phone, FirstName: first, MiddleName: "", LastName: last,
  };
}