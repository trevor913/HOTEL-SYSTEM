"use client";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { ArrowUp, Mic, RotateCcw } from "lucide-react";
import { ChatCard } from "@/components/chat/ChatCard";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { runOfflineAgent } from "@/lib/ai/offline-agent";
import { nextMockTranscript } from "@/lib/ai/transcripts";
import { greetingKey } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

const TOOL_CHIP: Record<string, string> = {
  log_sale: "🧾 Naandika mauzo…", log_debt: "📒 Naandika deni…", record_debt_payment: "💸 Narekodi malipo…", log_expense: "🛒 Naandika matumizi…",
  get_daily_summary: "📊 Nahesabu leo…", get_week_report: "📊 Nahesabu wiki…", get_debts_report: "📒 Naangalia madeni…", set_item_soldout: "🍽️ Nasasisha menyu…",
  check_stock: "📦 Naangalia stock…", get_best_sellers: "🔥 Naangalia top…", plan_tomorrow: "🗓️ Napanga kesho…", send_debt_reminder: "📨 Natuma SMS…",
};

export default function MsaidiziPage() {
  return <Suspense><Chat /></Suspense>;
}

function Chat() {
  const t = useT();
  const chat = useApp((s) => s.chat);
  const pushChat = useApp((s) => s.pushChat);
  const clearChat = useApp((s) => s.clearChat);
  const owner = useApp((s) => s.hotel.ownerName);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const voiceHint = useSearchParams().get("voice") === "1";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [chat.length, busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    pushChat({ role: "user", content: q });
    setBusy(t.msaidizi.thinking);
    await new Promise((r) => setTimeout(r, 350));
    const reply = runOfflineAgent(q, useApp.getState());
    if (reply.tool) { setBusy(TOOL_CHIP[reply.tool] ?? t.msaidizi.thinking); await new Promise((r) => setTimeout(r, 550)); }
    setBusy(null);
    pushChat({ role: "assistant", content: reply.text, card: reply.card });
  };

  const stopRecording = () => {
    if (!recording) return;
    setRecording(false);
    void send(nextMockTranscript()); // live mode: POST blob → /api/ai/transcribe (Whisper, language "sw")
  };

  return (
    <div className="flex min-h-[calc(100dvh-var(--tab-h)-var(--safe-b))] flex-col">
      <header className="flex items-center justify-between px-5 pt-safe pb-2">
        <div className="pt-4">
          <p className="text-xs uppercase tracking-[0.16em] text-dim">{t.greet[greetingKey()]}, {owner}</p>
          <h1 className="font-display text-[28px] font-semibold">{t.msaidizi.title}</h1>
        </div>
        {chat.length > 0 && <button onClick={clearChat} aria-label="Clear" className="mt-4 grid size-11 place-items-center rounded-full bg-overlay"><RotateCcw className="size-4 text-dim" /></button>}
      </header>

      <div className="flex-1 space-y-3 px-5 pb-40">
        {voiceHint && chat.length === 0 && <p className="text-sm text-chai">🎙️ {t.msaidizi.hold}</p>}
        {chat.length === 0 && <p className="max-w-[85%] rounded-3xl rounded-bl-md bg-raised px-4 py-3 text-[15px] leading-relaxed">{t.msaidizi.intro}</p>}
        <AnimatePresence initial={false}>
          {chat.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={cn("flex flex-col", m.role === "user" ? "items-end" : "items-start")}>
              <p className={cn("max-w-[85%] whitespace-pre-line px-4 py-3 text-[15px] leading-relaxed", m.role === "user" ? "rounded-3xl rounded-br-md bg-flame text-[var(--flame-ink)]" : "rounded-3xl rounded-bl-md bg-raised")}>{m.content}</p>
              {m.card && <ChatCard card={m.card} />}
            </motion.div>
          ))}
        </AnimatePresence>
        {busy && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs text-dim"><span className="size-1.5 animate-pulse rounded-full bg-flame" />{busy}</motion.span>}
        <div ref={endRef} />
      </div>

      {/* Composer pinned in the thumb zone */}
      <div className="fixed inset-x-0 z-30 mx-auto max-w-lg bg-gradient-to-t from-bg via-bg to-transparent px-3 pt-6 lg:left-[248px] lg:max-w-3xl" style={{ bottom: "calc(var(--tab-h) + var(--safe-b))" }}>
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
          {t.msaidizi.suggestions.map((s) => <button key={s} onClick={() => send(s)} className="h-9 shrink-0 rounded-full border border-line bg-raised px-3.5 text-sm">{s}</button>)}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="mb-2 flex items-end gap-2">
          <label className="flex min-h-14 flex-1 items-center rounded-[28px] border border-line bg-raised px-4">
            {recording ? <Waveform label={t.msaidizi.recording} /> : (
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.msaidizi.placeholder} className="h-14 w-full bg-transparent text-base outline-none placeholder:text-dim" enterKeyHint="send" />
            )}
          </label>
          {input.trim() ? (
            <motion.button whileTap={{ scale: 0.9 }} type="submit" aria-label="Send" className="grid size-14 place-items-center rounded-full bg-flame text-[var(--flame-ink)]"><ArrowUp className="size-6" strokeWidth={2.5} /></motion.button>
          ) : (
            <motion.button type="button" aria-label={t.msaidizi.hold} animate={{ scale: recording ? 1.15 : 1 }}
              onPointerDown={(e) => { e.preventDefault(); if ("vibrate" in navigator) navigator.vibrate(12); setRecording(true); }} onPointerUp={stopRecording} onPointerLeave={stopRecording}
              className={cn("grid size-14 touch-none place-items-center rounded-full", recording ? "bg-nyanya text-white" : "bg-flame text-[var(--flame-ink)]")}>
              <Mic className="size-6" />
            </motion.button>
          )}
        </form>
      </div>
    </div>
  );
}

function Waveform({ label }: { label: string }) {
  return (
    <span className="flex h-14 w-full items-center gap-3">
      <span className="flex h-6 items-center gap-[3px]" aria-hidden>
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.span key={i} className="w-[3px] rounded-full bg-nyanya" animate={{ height: [4, 8 + ((i * 7) % 16), 4] }} transition={{ duration: 0.6 + (i % 4) * 0.12, repeat: Infinity, ease: "easeInOut" }} />
        ))}
      </span>
      <span className="truncate text-sm text-dim">{label}</span>
    </span>
  );
}
