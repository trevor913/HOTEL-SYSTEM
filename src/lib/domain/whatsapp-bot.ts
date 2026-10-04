/**
 * Customer-facing WhatsApp brain (§7.3): menu, hours, location and ordering by plain text
 * ("nataka 2 chapati na madondo"). Pure, so the webhook and the on-device simulator agree.
 * Order replies contain "{CODE}" which the caller replaces with the real order code.
 */
import { parseSale, type Catalog } from "../ai/intents";
import { DEMO_CATALOG } from "../demo/catalog";
import { formatKES } from "../utils/money";
import type { Hotel, MenuItem } from "../types";

export interface WaContext { hotel: Hotel; menu: MenuItem[]; appUrl: string }
export type WaReply =
  | { kind: "menu" | "hours" | "location" | "help" | "sold_out"; text: string }
  | { kind: "order"; text: string; items: { itemId: string; name: string; qty: number }[]; totalCents: number; type: "pickup" | "delivery" };

const aliasesOf = (id: string) => DEMO_CATALOG.menu.find((m) => m.id === id)?.aliases ?? [];
const catalogOf = (items: MenuItem[]): Catalog => ({ menu: items.map((m) => ({ id: m.id, name: m.name, aliases: [m.nameSw, ...aliasesOf(m.id)] })), inventory: [], customers: [] });

export function whatsappReply(input: string, ctx: WaContext): WaReply {
  const t = input.toLowerCase();
  const { hotel } = ctx;
  const link = `${ctx.appUrl}/m/${hotel.slug}`;
  const live = ctx.menu.filter((m) => m.isAvailable && !m.soldOutToday).sort((a, b) => a.sortOrder - b.sortOrder);

  if (/(saa ngapi|mko wazi|mmefungua|mnafungua|mnafunga|open|hours|close)/.test(t))
    return { kind: "hours", text: `⏰ ${hotel.name} iko wazi kila siku ${hotel.openHours.open} hadi ${hotel.openHours.close}. Karibu! 🍲` };
  if (/(mko wapi|location|where are you|mahali|address yenu)/.test(t))
    return { kind: "location", text: `📍 ${hotel.name}: ${hotel.locationText}.\nAgiza mapema hapa: ${link}` };
  if (/(menyu|menu|bei|price|mna nini|kuna nini|chakula gani|leo kuna)/.test(t)) {
    const lines = live.slice(0, 12).map((m) => `${m.emoji} ${m.nameSw} — ${formatKES(m.priceCents)}`);
    return { kind: "menu", text: `🍲 *Menyu ya leo, ${hotel.name}*\n${lines.join("\n")}\n\nAgiza kwa kutuma ujumbe, mfano: _nataka 2 chapati na madondo_\nAu hapa: ${link}` };
  }

  const sale = parseSale(input, catalogOf(live));
  if (sale?.kind === "log_sale" && sale.items.length) {
    const delivery = /(niletee|nileteeni|deliver|delivery|leta|kuletewa|tuma kwa)/.test(t);
    const rows = sale.items.map((i) => { const m = live.find((x) => x.id === i.itemId)!; return { ...i, cents: m.priceCents * i.qty }; });
    const total = rows.reduce((a, r) => a + r.cents, 0);
    const text = [
      "✅ *Oda {CODE} imepokelewa!*",
      ...rows.map((r) => `${r.qty}× ${r.name} — ${formatKES(r.cents)}`),
      `*Jumla: ${formatKES(total)}*`,
      delivery ? "🛵 Tutakuletea. Tuma location yako 📍 tafadhali." : "🏃 Itakuwa tayari baada ya dakika 15–20.",
      `Lipa kwa M-Pesa Till *${hotel.tillNumber}* au ukifika. Asante! 🙏`,
    ].join("\n");
    return { kind: "order", text, items: sale.items, totalCents: total, type: delivery ? "delivery" : "pickup" };
  }

  const soldOut = parseSale(input, catalogOf(ctx.menu.filter((m) => m.soldOutToday)));
  if (soldOut?.kind === "log_sale" && soldOut.items.length)
    return { kind: "sold_out", text: `😔 Samahani, ${soldOut.items.map((i) => i.name).join(", ")} imeisha leo. Tuma *menyu* uone kilichopo.` };

  return { kind: "help", text: `Habari! 👋 Karibu ${hotel.name}.\nTuma *menyu* kuona chakula cha leo, au agiza moja kwa moja: _nataka ugali beef na chai_.\n${link}` };
}