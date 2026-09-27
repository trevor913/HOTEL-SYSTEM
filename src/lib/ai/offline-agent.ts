/**
 * Offline Msaidizi: executes rule-based intents against the on-device store and
 * answers with rich cards. Used in MOCK_MODE and whenever the network is down.
 * The live Anthropic agent (agent.ts, Phase 3b) will call the SAME tool functions.
 */
import { parseIntent, type Catalog, type Intent } from "./intents";
import { formatKES } from "../utils/money";
import { agingReport } from "../domain/debts";
import { planTomorrow } from "../domain/planner";
import { bestSellers, dayTotals, debtors } from "../store/selectors";
import { inBusinessDay } from "../utils/dates";
import type { ChatCard } from "../types";
import type { useApp } from "../store/app-store";

type Store = ReturnType<typeof useApp.getState>;
export interface AgentReply { text: string; card?: ChatCard; tool?: string }

const CONFIRM_THRESHOLD_CENTS = 500_000; // KES 5,000 (§6.1)
let pending: Intent | null = null;

export function buildCatalog(s: Store): Catalog {
  const ALIASES: Record<string, string[]> = {
    "m-ugali-beef": ["ugali nyama"], "m-ugali-samaki": ["ugali fish"], "m-ugali-sukuma": ["ugali mboga"],
    "m-chapati": ["chapo", "chapos"], "m-madondo": ["maharagwe", "beans"], "m-chapati-madondo": ["chapo madondo"],
    "m-wali": ["wali", "rice"], "m-samaki": ["samaki", "fish", "wet fry"], "m-mandazi": ["maandazi"], "m-chai": ["tea"],
    "m-matumbo": ["tripe"], "m-ndengu": ["green grams"],
  };
  const INV: Record<string, string[]> = {
    "i-mafuta": ["mafuta", "oil"], "i-unga": ["unga", "flour"], "i-ngano": ["ngano"], "i-mchele": ["mchele"], "i-gas": ["gas", "gesi", "mtungi"],
    "i-makaa": ["makaa", "charcoal"], "i-maharagwe": ["maharagwe"], "i-sukari": ["sukari", "sugar"], "i-majani": ["majani"], "i-maziwa": ["maziwa", "milk"],
  };
  return {
    menu: s.menu.map((m) => ({ id: m.id, name: m.name, aliases: ALIASES[m.id] ?? [] })),
    inventory: s.inventory.map((i) => ({ id: i.id, name: i.name, aliases: INV[i.id] ?? [] })),
    customers: s.customers.map((c) => ({ id: c.id, name: c.name, aliases: [c.name.split(" ")[0]!, ...(c.nickname ? [c.nickname] : [])] })),
  };
}

function customerByName(s: Store, name: string) {
  const n = name.toLowerCase();
  return s.customers.find((c) => c.name.toLowerCase() === n || c.name.split(" ")[0]!.toLowerCase() === n || c.nickname?.toLowerCase() === n);
}

function needsConfirm(i: Intent): number {
  if (i.kind === "log_debt") return i.amountKes * 100;
  if (i.kind === "log_expense") return i.items.reduce((a, x) => a + x.amountKes * 100, 0);
  if (i.kind === "record_debt_payment" && i.amountKes !== "all") return i.amountKes * 100;
  return 0;
}

export function runOfflineAgent(text: string, s: Store): AgentReply {
  const t = text.trim().toLowerCase();
  if (pending && /^(ndio|ndiyo|yes|sawa|confirm|thibitisha|poa)\b/.test(t)) {
    const p = pending; pending = null;
    return execute(p, s);
  }
  if (pending && /^(hapana|no|cancel|ghairi|acha)\b/.test(t)) { pending = null; return { text: "Sawa, nimeghairi. Hakuna kilichoandikwa." }; }

  const intent = parseIntent(text, buildCatalog(s));
  const cents = needsConfirm(intent);
  if (cents > CONFIRM_THRESHOLD_CENTS) {
    pending = intent;
    return { text: `Hiyo ni ${formatKES(cents)}. Nithibitishe kabla sijaandika? Jibu "ndio" au "hapana".` };
  }
  return execute(intent, s);
}

function execute(intent: Intent, s: Store): AgentReply {
  switch (intent.kind) {
    case "log_sale": {
      let customerId: string | null = null;
      if (intent.method === "debt" && intent.customer) customerId = customerByName(s, intent.customer)?.id ?? s.addCustomer({ name: intent.customer, phone: null });
      const sale = s.logSale({ items: intent.items.map((i) => ({ menuItemId: i.itemId, qty: i.qty })), method: intent.method, customerId });
      return {
        tool: "log_sale", text: `Nimeandika mauzo ✅ (${intent.method === "mpesa" ? "M-Pesa" : intent.method === "debt" ? "deni" : "cash"}).`,
        card: { type: "receipt", title: "Mauzo", lines: sale.items.map((i) => ({ label: `${i.qty}× ${s.menu.find((m) => m.id === i.menuItemId)?.name}`, cents: i.lineTotalCents })), totalCents: sale.totalCents },
      };
    }
    case "log_debt": {
      const c = customerByName(s, intent.customer);
      const id = c?.id ?? s.addCustomer({ name: intent.customer, phone: null });
      const d = s.logDebt({ customerId: id, amountCents: intent.amountKes * 100, description: "Kupitia Msaidizi" });
      const bal = s.debts.concat(d).filter((x) => x.customerId === id).reduce((a, x) => a + x.balanceCents, 0);
      const who = c?.name ?? intent.customer;
      return {
        tool: "log_debt", text: `📒 Deni la ${who} limeandikwa.`,
        card: { type: "receipt", title: `Deni: ${who}`, lines: [{ label: "Deni jipya", cents: d.amountCents }, { label: "Jumla anadaiwa", cents: bal }], totalCents: bal, stamp: "IMEANDIKWA" },
      };
    }
    case "record_debt_payment": {
      const c = customerByName(s, intent.customer);
      if (!c) return { text: `Sijampata ${intent.customer} kwenye daftari. Umeandika jina sawa?` };
      const owed = s.debts.filter((d) => d.customerId === c.id).reduce((a, d) => a + d.balanceCents, 0);
      if (owed === 0) return { text: `${c.name} hana deni lolote sasa hivi. 👌` };
      const amt = intent.amountKes === "all" ? "all" : Math.min(intent.amountKes * 100, owed);
      const r = s.recordPayment({ customerId: c.id, amountCents: amt, method: intent.method === "mpesa" ? "mpesa" : "cash" });
      return {
        tool: "record_debt_payment",
        text: r.settled ? `🎉 Deni Limelipwa! ${c.name} amemaliza. Nimemtumia SMS ya risiti.` : `Sawa, ${c.name} amelipa ${formatKES(r.paidCents)}. Salio: ${formatKES(r.balanceCents)}.`,
        card: { type: "receipt", title: `Malipo: ${c.name}`, lines: [{ label: "Amelipa", cents: r.paidCents }, { label: "Salio", cents: r.balanceCents }], totalCents: r.paidCents, stamp: r.settled ? "IMELIPWA" : undefined },
      };
    }
    case "log_expense": {
      const lines = intent.items.map((i) => { s.logExpense({ category: i.category, description: i.label, amountCents: i.amountKes * 100 }); return { label: i.label, cents: i.amountKes * 100 }; });
      const total = lines.reduce((a, l) => a + l.cents, 0);
      return { tool: "log_expense", text: "🧾 Matumizi yameandikwa.", card: { type: "receipt", title: "Matumizi", lines, totalCents: total } };
    }
    case "get_daily_summary": {
      const d = dayTotals(s);
      const verdict = d.profitCents >= 0 ? `Leo uko juu kwa ${formatKES(d.profitCents)} 💪` : `Leo matumizi yamezidi mauzo kwa ${formatKES(-d.profitCents)}. Tuangalie soko kesho.`;
      return { tool: "get_daily_summary", text: verdict, card: { type: "pnl", label: "Leo", salesCents: d.salesCents + d.debtSalesCents, expensesCents: d.expensesCents, newDebtsCents: d.newDebtsCents, profitCents: d.profitCents } };
    }
    case "get_week_report": {
      let sales = 0, exp = 0, debt = 0;
      for (let i = 0; i < 7; i++) { const d = dayTotals(s, i); sales += d.salesCents + d.debtSalesCents; exp += d.expensesCents; debt += d.newDebtsCents; }
      return { tool: "get_week_report", text: "Hii ndiyo wiki yako (siku 7):", card: { type: "pnl", label: "Wiki hii", salesCents: sales, expensesCents: exp, newDebtsCents: debt, profitCents: sales - exp } };
    }
    case "get_debts_report": {
      const list = debtors(s);
      const aging = agingReport(s.debts);
      const total = list.reduce((a, d) => a + d.balanceCents, 0);
      const old = aging["30+"].count ? ` ${aging["30+"].count} wamepita siku 30, hao tuwafuatilie kwanza.` : "";
      return {
        tool: "get_debts_report", text: `Watu ${list.length} wanakudai ${formatKES(total)}.${old}`,
        card: { type: "debts", totalCents: total, rows: list.slice(0, 6).map((d) => ({ name: d.customer.name, cents: d.balanceCents, days: d.oldestDays })) },
      };
    }
    case "set_item_soldout":
      s.setSoldOut(intent.itemId, true);
      return { tool: "set_item_soldout", text: `Sawa, ${intent.name} imewekwa "Imeisha" leo. Menyu ya wateja imesasishwa.` };
    case "check_stock": {
      const i = s.inventory.find((x) => x.id === intent.itemId);
      if (!i) return { text: "Ni kitu gani cha stock? Mfano: \"Unga imebaki ngapi?\"" };
      const low = i.currentQty <= i.lowThreshold;
      return { tool: "check_stock", text: `${i.name}: imebaki ${i.currentQty} ${i.unit}. ${low ? "⚠️ Iko chini, ongeza kwa soko kesho." : "Iko sawa kwa sasa."}` };
    }
    case "get_best_sellers": {
      const b = bestSellers(s, 7).slice(0, 5);
      return { tool: "get_best_sellers", text: "Vinavyouzwa sana wiki hii:", card: { type: "list", title: "Top 5 (siku 7)", rows: b.map((x) => ({ label: `${x.item.name} · ${x.qty}`, value: formatKES(x.cents) })) } };
    }
    case "plan_tomorrow": {
      const history = s.menu.flatMap((m) =>
        Array.from({ length: 21 }, (_, i) => {
          const sold = s.sales.filter((x) => inBusinessDay(x.createdAt, new Date(), i + 1)).reduce((a, x) => a + (x.items.find((it) => it.menuItemId === m.id)?.qty ?? 0), 0);
          const d = new Date(); d.setDate(d.getDate() - i - 1);
          return { date: d.toISOString().slice(0, 10), itemId: m.id, soldQty: sold, cookedQty: sold, soldoutAt: null, wasteQty: 0 };
        }));
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
      const plan = planTomorrow(history, tomorrow).slice(0, 7);
      return { tool: "plan_tomorrow", text: "Mpango wa kesho kwa historia ya wiki 3:", card: { type: "list", title: "Pika kesho", rows: plan.map((p) => ({ label: s.menu.find((m) => m.id === p.itemId)?.name ?? p.itemId, value: `${p.suggestedQty} sahani` })) } };
    }
    case "send_debt_reminder": {
      if (intent.customer === "all") {
        const list = debtors(s).filter((d) => d.oldestDays > 7);
        const sent = list.map((d) => s.sendReminder(d.customer.id)).filter(Boolean).length;
        return { tool: "send_debt_reminder", text: `📨 Nimetuma kumbusho ${sent} kwa wenye madeni ya zaidi ya siku 7.` };
      }
      const c = customerByName(s, intent.customer);
      const m = c && s.sendReminder(c.id);
      return m ? { tool: "send_debt_reminder", text: `📨 Kumbusho limetumwa kwa ${c.name}:\n"${m.body}"` } : { text: `${intent.customer} hana deni au namba ya simu.` };
    }
    case "greeting":
      return { text: `Habari ${s.hotel.ownerName}! Niko tayari. Niambie mauzo, madeni, au uliza "Leo nimepataje?"` };
    default:
      return { text: "Sijaelewa vizuri 🤔 Jaribu: \"Nimeuza chapo mbili na chai, mpesa\", \"Andika deni ya Otieno mia tatu\", au \"Leo nimepataje?\"" };
  }
}
