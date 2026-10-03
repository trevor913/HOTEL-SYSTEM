"use client";
import { useCallback } from "react";
import { create } from "zustand";
import { useT } from "../i18n";
import { useApp } from "../store/app-store";
import { liveStatus, runLiveAgent } from "./agent";
import { runOfflineAgent, type AgentReply } from "./offline-agent";

export const TOOL_CHIP: Record<string, string> = {
  log_sale: "🧾 Naandika mauzo…", log_debt: "📒 Naandika deni…", record_debt_payment: "💸 Narekodi malipo…", log_expense: "🛒 Naandika matumizi…",
  get_daily_summary: "📊 Nahesabu leo…", get_week_report: "📊 Nahesabu wiki…", get_debts_report: "📒 Naangalia madeni…", set_item_soldout: "🍽️ Nasasisha menyu…",
  check_stock: "📦 Naangalia stock…", update_stock: "📦 Nasasisha stock…", get_best_sellers: "🔥 Naangalia top…", plan_tomorrow: "🗓️ Napanga kesho…",
  send_debt_reminder: "📨 Natuma SMS…", get_customer_profile: "👤 Naangalia mteja…", create_order: "🛵 Naweka oda…", add_menu_item: "🍽️ Naongeza kwa menyu…",
  log_supplier_purchase: "🚚 Naandika msambazaji…", search_anything: "🔎 Natafuta…",
};

const useAgentUi = create<{ busy: string | null; setBusy: (b: string | null) => void }>((set) => ({ busy: null, setBusy: (busy) => set({ busy }) }));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Shared chat brain for the Msaidizi page and the floating launcher. */
export function useMsaidizi() {
  const t = useT();
  const busy = useAgentUi((s) => s.busy);
  const send = useCallback(async (text: string) => {
    const q = text.trim();
    const ui = useAgentUi.getState();
    if (!q || ui.busy) return;
    const { pushChat, chat } = useApp.getState();
    const history = chat.slice(-12).map((m) => ({ role: m.role, content: m.content }));
    pushChat({ role: "user", content: q });
    ui.setBusy(t.msaidizi.thinking);
    let reply: AgentReply | null = null;
    try {
      if (navigator.onLine && (await liveStatus()).chat) {
        reply = await runLiveAgent([...history, { role: "user", content: q }], (tool) => ui.setBusy(TOOL_CHIP[tool] ?? t.msaidizi.thinking));
      }
      if (!reply) {
        await sleep(300);
        reply = runOfflineAgent(q, useApp.getState());
        if (reply.tool) { ui.setBusy(TOOL_CHIP[reply.tool] ?? t.msaidizi.thinking); await sleep(500); }
      }
    } catch {
      reply = { text: "Samahani, kuna hitilafu. Jaribu tena." };
    }
    ui.setBusy(null);
    pushChat({ role: "assistant", content: reply.text, card: reply.card });
  }, [t]);
  return { send, busy };
}