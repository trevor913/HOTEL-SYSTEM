/**
 * Live Msaidizi (§6.1): Anthropic tool-use loop. The server route is a stateless proxy;
 * tools execute here against the on-device store, so the same agent works in mock mode
 * (local data) and later against Supabase via the repository layer.
 * Returns null when no live LLM is available → caller falls back to the offline agent.
 */
import { useApp } from "../store/app-store";
import { executeTool } from "./tools";
import type { AgentReply } from "./offline-agent";
import type { ChatCard } from "../types";

type ToolUse = { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };
type Block = { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> };
type Msg = { role: "user" | "assistant"; content: string | unknown[] };

let cached: { chat: boolean; voice: boolean } | null = null;
export async function liveStatus(): Promise<{ chat: boolean; voice: boolean }> {
  if (cached) return cached;
  try {
    const r = await fetch("/api/ai/status", { cache: "no-store" });
    if (r.ok) { cached = (await r.json()) as { chat: boolean; voice: boolean }; return cached; }
  } catch { /* offline: try again next time */ }
  return { chat: false, voice: false };
}

/** Anthropic needs user-first, alternating roles. */
export function sanitizeHistory(history: { role: "user" | "assistant"; content: string }[]): Msg[] {
  const out: Msg[] = [];
  for (const m of history) {
    if (!m.content.trim()) continue;
    if (!out.length && m.role !== "user") continue;
    const last = out[out.length - 1];
    if (last && last.role === m.role && typeof last.content === "string") last.content += `\n${m.content}`;
    else out.push({ role: m.role, content: m.content });
  }
  return out;
}

export async function runLiveAgent(history: { role: "user" | "assistant"; content: string }[], onTool: (name: string) => void): Promise<AgentReply | null> {
  const s = useApp.getState();
  const context = { hotelName: s.hotel.name, ownerName: s.hotel.ownerName, tillNumber: s.hotel.tillNumber, nowIso: new Date().toISOString(), lang: s.lang };
  const messages = sanitizeHistory(history);
  if (!messages.length) return null;
  let card: ChatCard | undefined;
  let tool: string | undefined;
  for (let step = 0; step < 6; step++) {
    let res: { content: Block[]; stop_reason: string };
    try {
      const r = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages, context }) });
      if (!r.ok) throw new Error(String(r.status));
      res = (await r.json()) as typeof res;
    } catch {
      return step === 0 ? null : { text: "Samahani, mtandao umekatika katikati. Nilichofanya kimehifadhiwa.", card, tool };
    }
    const text = res.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").trim();
    const uses = res.content.filter((b): b is ToolUse => b.type === "tool_use" && !!b.id && !!b.name);
    if (res.stop_reason !== "tool_use" || !uses.length) return { text: text || "Sawa 👍", card, tool };
    messages.push({ role: "assistant", content: res.content });
    const results = uses.map((u) => {
      onTool(u.name);
      tool = u.name;
      const out = executeTool(u.name, u.input ?? {});
      if (out.card) card = out.card;
      return { type: "tool_result", tool_use_id: u.id, content: JSON.stringify({ ok: out.ok, message: out.text, data: out.data ?? null }), is_error: !out.ok };
    });
    messages.push({ role: "user", content: results });
  }
  return { text: "Hiyo ilikuwa na hatua nyingi. Niambie tena kwa ufupi?", card, tool };
}