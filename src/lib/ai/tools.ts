/**
 * Client-side tool executor for the live agent. Runs every Msaidizi tool against the
 * on-device store; offline-agent reuses the same `execute` paths so both brains agree.
 */
import { useApp } from "../store/app-store";
import { bestSellers, dayTotals } from "../store/selectors";
import { formatKES } from "../utils/money";
import { maskPhone, normalizePhone } from "../utils/phone";
import { daysBetween } from "../utils/dates";
import { buildCatalog, execute, type AgentReply } from "./offline-agent";
import type { ExpenseCategory, MenuCategory } from "../types";

type Input = Record<string, unknown>;
export interface ToolOutcome extends AgentReply { ok: boolean; data?: unknown }

const CONFIRM_CENTS = 500_000;
const EXPENSE_CATS: ExpenseCategory[] = ["soko", "gas", "charcoal", "rent", "wages", "transport", "license", "equipment", "other"];
const MENU_CATS: MenuCategory[] = ["breakfast", "main", "side", "drink", "snack"];

const S = () => useApp.getState();
const norm = (x: string) => x.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
const str = (v: unknown) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : NaN);
const kesToCents = (kes: number) => Math.round(kes * 100);

/** Best fuzzy match: exact > prefix > substring. */
export function bestMatch<T>(query: string, rows: readonly T[], keys: (r: T) => string[]): T | undefined {
  const q = norm(query);
  if (!q) return undefined;
  let hit: { r: T; score: number } | undefined;
  for (const r of rows) {
    for (const raw of keys(r)) {
      const k = norm(raw);
      if (!k) continue;
      const score = k === q ? 3 : k.startsWith(q) || q.startsWith(`${k} `) ? 2 : k.includes(q) || q.includes(k) ? 1 : 0;
      if (score && (!hit || score > hit.score)) hit = { r, score };
    }
  }
  return hit?.r;
}

const menuOf = (q: string) => {
  const s = S();
  const cat = buildCatalog(s).menu;
  const c = bestMatch(q, cat, (x) => [x.name, ...x.aliases, s.menu.find((m) => m.id === x.id)?.nameSw ?? ""]);
  return c ? s.menu.find((m) => m.id === c.id) : undefined;
};
const customerOf = (q: string) => bestMatch(q, S().customers, (c) => [c.name, c.name.split(" ")[0]!, c.nickname ?? ""]);
const inventoryOf = (q: string) => {
  const s = S();
  const cat = buildCatalog(s).inventory;
  const c = bestMatch(q, cat, (x) => [x.name, ...x.aliases]);
  return c ? s.inventory.find((i) => i.id === c.id) : undefined;
};

const fail = (text: string): ToolOutcome => ({ ok: false, text });
const ok = (r: AgentReply, data?: unknown): ToolOutcome => ({ ok: true, ...r, data: data ?? r.card ?? null });
function needsConfirm(cents: number, input: Input): ToolOutcome | null {
  if (cents <= CONFIRM_CENTS || input.confirmed === true) return null;
  return fail(`NEEDS_CONFIRMATION: ${formatKES(cents)} is above KSh 5,000. Ask the owner to confirm, then call again with confirmed=true.`);
}

function resolveLines(raw: unknown): { items: { itemId: string; name: string; qty: number }[]; missing?: string } {
  const items: { itemId: string; name: string; qty: number }[] = [];
  for (const it of Array.isArray(raw) ? (raw as Input[]) : []) {
    const m = menuOf(str(it.item));
    if (!m) return { items, missing: str(it.item) };
    const qty = Math.max(1, Math.round(num(it.qty) || 1));
    const ex = items.find((x) => x.itemId === m.id);
    if (ex) ex.qty += qty; else items.push({ itemId: m.id, name: m.name, qty });
  }
  return { items };
}

export function executeTool(name: string, input: Input = {}): ToolOutcome {
  try {
    switch (name) {
      case "log_sale": {
        const { items, missing } = resolveLines(input.items);
        if (missing !== undefined) return fail(`"${missing}" is not on the menu. Menu: ${S().menu.map((m) => m.name).join(", ")}`);
        if (!items.length) return fail("No items given.");
        const total = items.reduce((a, i) => a + (S().menu.find((m) => m.id === i.itemId)?.priceCents ?? 0) * i.qty, 0);
        const c = needsConfirm(total, input); if (c) return c;
        const method = (["cash", "mpesa", "debt"] as const).find((x) => x === str(input.method)) ?? "cash";
        const rawCustomer = str(input.customer);
        const customer = rawCustomer ? customerOf(rawCustomer)?.name ?? rawCustomer : undefined;
        if (method === "debt" && !customer) return fail("A sale on credit needs the customer's name.");
        return ok(execute({ kind: "log_sale", items, method, ...(customer ? { customer } : {}) }, S()));
      }
      case "log_debt": {
        const who = str(input.customer); const kes = num(input.amount_kes);
        if (!who || !(kes > 0)) return fail("Need customer and a positive amount_kes.");
        const c = needsConfirm(kesToCents(kes), input); if (c) return c;
        return ok(execute({ kind: "log_debt", customer: customerOf(who)?.name ?? who, amountKes: kesToCents(kes) / 100 }, S()));
      }
      case "record_debt_payment": {
        const cust = customerOf(str(input.customer));
        if (!cust) return fail(`No customer called "${str(input.customer)}" in the daftari.`);
        const kes = num(input.amount_kes);
        const all = input.settle_all === true || !(kes > 0);
        if (!all) { const c = needsConfirm(kesToCents(kes), input); if (c) return c; }
        return ok(execute({ kind: "record_debt_payment", customer: cust.name, amountKes: all ? "all" : kesToCents(kes) / 100, method: str(input.method) === "mpesa" ? "mpesa" : "cash" }, S()));
      }
      case "log_expense": {
        const items = (Array.isArray(input.items) ? (input.items as Input[]) : [])
          .map((i) => ({ label: str(i.label) || "Matumizi", category: EXPENSE_CATS.find((x) => x === str(i.category)) ?? "other", amountKes: kesToCents(num(i.amount_kes)) / 100 }))
          .filter((i) => i.amountKes > 0);
        if (!items.length) return fail("No valid expense lines.");
        const c = needsConfirm(items.reduce((a, i) => a + kesToCents(i.amountKes), 0), input); if (c) return c;
        return ok(execute({ kind: "log_expense", items }, S()));
      }
      case "get_daily_summary": {
        const daysAgo = Math.max(0, Math.round(num(input.days_ago) || 0));
        const d = dayTotals(S(), daysAgo);
        const label = daysAgo === 0 ? "Leo" : daysAgo === 1 ? "Jana" : `Siku ${daysAgo} zilizopita`;
        return ok({ tool: name, text: `${label}: faida ${formatKES(d.profitCents)}.`, card: { type: "pnl", label, salesCents: d.salesCents + d.debtSalesCents, expensesCents: d.expensesCents, newDebtsCents: d.newDebtsCents, profitCents: d.profitCents } }, d);
      }
      case "get_customer_profile": {
        const s = S(); const c = customerOf(str(input.customer));
        if (!c) return fail(`No customer called "${str(input.customer)}".`);
        const open = s.debts.filter((d) => d.customerId === c.id && d.balanceCents > 0);
        const bal = open.reduce((a, d) => a + d.balanceCents, 0);
        const data = { name: c.name, nickname: c.nickname ?? null, phone: c.phone ? maskPhone(c.phone) : null, visits: c.visitCount, totalSpent: formatKES(c.totalSpentCents), loyaltyPoints: c.loyaltyPoints, balance: formatKES(bal), openDebts: open.map((d) => ({ description: d.description, balance: formatKES(d.balanceCents), days: daysBetween(d.createdAt) })) };
        return ok({ tool: name, text: `${c.name}: ziara ${c.visitCount}, deni ${formatKES(bal)}.`, card: { type: "list", title: c.name, rows: [{ label: "Ziara", value: String(c.visitCount) }, { label: "Ametumia", value: formatKES(c.totalSpentCents) }, { label: "Pointi", value: String(c.loyaltyPoints) }, { label: "Deni", value: formatKES(bal) }] } }, data);
      }
      case "check_stock": {
        if (!str(input.item)) {
          const low = S().inventory.filter((i) => i.currentQty <= i.lowThreshold);
          return ok({ tool: name, text: low.length ? `Vitu ${low.length} viko chini.` : "Stock yote iko sawa.", card: { type: "list", title: "Stock iko chini", rows: low.map((i) => ({ label: i.name, value: `${i.currentQty} ${i.unit}` })) } });
        }
        const inv = inventoryOf(str(input.item));
        if (!inv) return fail(`No stock item "${str(input.item)}". Items: ${S().inventory.map((i) => i.name).join(", ")}`);
        return ok(execute({ kind: "check_stock", itemId: inv.id, name: inv.name }, S()), { name: inv.name, qty: inv.currentQty, unit: inv.unit, low: inv.currentQty <= inv.lowThreshold });
      }
      case "update_stock": {
        const inv = inventoryOf(str(input.item)); const qty = num(input.qty);
        if (!inv || !Number.isFinite(qty)) return fail("Need a known stock item and a qty.");
        const mode = (["set", "add", "subtract"] as const).find((x) => x === str(input.mode)) ?? "set";
        const u = S().updateStock({ itemId: inv.id, qty, mode });
        return ok({ tool: name, text: `📦 ${inv.name}: sasa ${u?.currentQty} ${inv.unit}.` }, u);
      }
      case "get_best_sellers": {
        const days = Math.max(1, Math.round(num(input.days) || 7));
        const b = bestSellers(S(), days).slice(0, 5);
        return ok({ tool: name, text: `Vinavyouzwa sana (siku ${days}):`, card: { type: "list", title: `Top 5 (siku ${days})`, rows: b.map((x) => ({ label: `${x.item.name} · ${x.qty}`, value: formatKES(x.cents) })) } });
      }
      case "send_debt_reminder": {
        const who = str(input.customer);
        if (/^(all|wote|everyone)$/i.test(who)) return ok(execute({ kind: "send_debt_reminder", customer: "all" }, S()));
        const c = customerOf(who);
        if (!c) return fail(`No customer called "${who}".`);
        return ok(execute({ kind: "send_debt_reminder", customer: c.name }, S()));
      }
      case "create_order": {
        const { items, missing } = resolveLines(input.items);
        if (missing !== undefined) return fail(`"${missing}" is not on the menu.`);
        const customerName = str(input.customer_name);
        if (!items.length || !customerName) return fail("Need customer_name and items.");
        const known = customerOf(customerName);
        const phone = normalizePhone(str(input.phone)) ?? known?.phone ?? "";
        const type = str(input.type) === "delivery" ? "delivery" : "pickup";
        const o = S().createOrder({ customerName: known?.name ?? customerName, customerPhone: phone, items: items.map((i) => ({ menuItemId: i.itemId, qty: i.qty })), type, addressText: str(input.address) || undefined, placedVia: "manual" });
        return ok({ tool: name, text: `🛵 Oda ${o.code} imeingia (${type === "delivery" ? "kuletewa" : "kuchukua"}).`, card: { type: "receipt", title: `Oda ${o.code}`, lines: items.map((i) => ({ label: `${i.qty}× ${i.name}`, cents: (S().menu.find((m) => m.id === i.itemId)?.priceCents ?? 0) * i.qty })), totalCents: o.totalCents, stamp: "MPYA" } }, { code: o.code, total: formatKES(o.totalCents) });
      }
      case "add_menu_item": {
        const n = str(input.name); const kes = num(input.price_kes);
        if (!n || !(kes > 0)) return fail("Need name and a positive price_kes.");
        if (menuOf(n)?.name.toLowerCase() === n.toLowerCase()) return fail(`${n} is already on the menu.`);
        const m = S().addMenuItem({ name: n, category: MENU_CATS.find((x) => x === str(input.category)) ?? "main", priceCents: kesToCents(kes), emoji: str(input.emoji) || undefined });
        return ok({ tool: name, text: `${m.emoji} ${m.name} imeongezwa kwa menyu: ${formatKES(m.priceCents)}.` }, { id: m.id, name: m.name, price: formatKES(m.priceCents) });
      }
      case "set_item_soldout": {
        const m = menuOf(str(input.item));
        if (!m) return fail(`"${str(input.item)}" is not on the menu.`);
        const soldOut = input.sold_out !== false;
        S().setSoldOut(m.id, soldOut);
        return ok({ tool: name, text: soldOut ? `${m.name} imewekwa "Imeisha" leo.` : `${m.name} imerudi kwenye menyu.` });
      }
      case "log_supplier_purchase": {
        const sup = bestMatch(str(input.supplier), S().suppliers, (x) => [x.name, x.name.split(" ")[0]!, ...x.whatTheySupply.split(",")]);
        if (!sup) return fail(`Unknown supplier. Suppliers: ${S().suppliers.map((x) => x.name).join(", ")}`);
        const kes = num(input.amount_kes);
        if (!(kes > 0)) return fail("Need a positive amount_kes.");
        const c = needsConfirm(kesToCents(kes), input); if (c) return c;
        const paid = input.paid !== false;
        S().logSupplierPurchase({ supplierId: sup.id, description: str(input.description) || sup.whatTheySupply, amountCents: kesToCents(kes), paid });
        const owed = S().suppliers.find((x) => x.id === sup.id)?.balanceOwedCents ?? 0;
        return ok({ tool: name, text: `🧾 ${sup.name}: ${formatKES(kesToCents(kes))} ${paid ? "imelipwa" : "kwa mkopo"}. Unadaiwa ${formatKES(owed)}.` }, { supplier: sup.name, owed: formatKES(owed) });
      }
      case "search_anything": {
        const q = norm(str(input.query));
        if (!q) return fail("Empty query.");
        const s = S();
        const has = (x: string) => norm(x).includes(q);
        const rows: { label: string; value: string }[] = [
          ...s.customers.filter((c) => has(c.name) || has(c.nickname ?? "")).map((c) => ({ label: `👤 ${c.name}`, value: formatKES(s.debts.filter((d) => d.customerId === c.id).reduce((a, d) => a + d.balanceCents, 0)) })),
          ...s.menu.filter((m) => has(m.name) || has(m.nameSw)).map((m) => ({ label: `${m.emoji} ${m.name}`, value: formatKES(m.priceCents) })),
          ...s.inventory.filter((i) => has(i.name)).map((i) => ({ label: `📦 ${i.name}`, value: `${i.currentQty} ${i.unit}` })),
          ...s.suppliers.filter((x) => has(x.name) || has(x.whatTheySupply)).map((x) => ({ label: `🚚 ${x.name}`, value: formatKES(x.balanceOwedCents) })),
          ...s.orders.filter((o) => has(o.code) || has(o.customerName)).map((o) => ({ label: `🛵 ${o.code} ${o.customerName}`, value: o.status })),
        ].slice(0, 8);
        return ok({ tool: name, text: rows.length ? `Nimepata ${rows.length}:` : "Sijapata chochote.", card: { type: "list", title: `Tafuta: ${str(input.query)}`, rows } });
      }
      case "get_debts_report": return ok(execute({ kind: "get_debts_report" }, S()));
      case "plan_tomorrow": return ok(execute({ kind: "plan_tomorrow" }, S()));
      case "get_week_report": return ok(execute({ kind: "get_week_report" }, S()));
      default: return fail(`Unknown tool ${name}`);
    }
  } catch (e) {
    return fail(`Error: ${e instanceof Error ? e.message : String(e)}`);
  }
}