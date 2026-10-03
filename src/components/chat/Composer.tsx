"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowUp, Mic } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useMsaidizi } from "@/lib/ai/use-msaidizi";
import { useVoice } from "@/lib/ai/use-voice";
import { cn } from "@/lib/utils/cn";

/** Thumb-zone composer: suggestion pills, text input, hold-to-record mic (§6.6). */
export function Composer({ showSuggestions = true, autoFocus = false }: { showSuggestions?: boolean; autoFocus?: boolean }) {
  const t = useT();
  const { send } = useMsaidizi();
  const [input, setInput] = useState("");
  const voice = useVoice((text) => void send(text));
  const submit = (text: string) => { setInput(""); void send(text); };

  return (
    <div>
      {showSuggestions && (
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto">
          {t.msaidizi.suggestions.map((s) => <button key={s} type="button" onClick={() => submit(s)} className="h-9 shrink-0 rounded-full border border-line bg-raised px-3.5 text-sm">{s}</button>)}
        </div>
      )}
      <form onSubmit={(e) => { e.preventDefault(); submit(input); }} className="flex items-end gap-2">
        <label className="flex min-h-14 flex-1 items-center rounded-[28px] border border-line bg-raised px-4">
          {voice.recording ? <Waveform label={t.msaidizi.recording} /> : (
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.msaidizi.placeholder} autoFocus={autoFocus}
              className="h-14 w-full bg-transparent text-base outline-none placeholder:text-dim" enterKeyHint="send" aria-label={t.msaidizi.placeholder} />
          )}
        </label>
        {input.trim() ? (
          <motion.button whileTap={{ scale: 0.9 }} type="submit" aria-label="Send" className="grid size-14 place-items-center rounded-full bg-flame text-[var(--flame-ink)]"><ArrowUp className="size-6" strokeWidth={2.5} /></motion.button>
        ) : (
          <motion.button type="button" aria-label={t.msaidizi.hold} animate={{ scale: voice.recording ? 1.15 : 1 }}
            onPointerDown={(e) => { e.preventDefault(); void voice.start(); }} onPointerUp={() => void voice.stop()} onPointerLeave={() => void voice.stop()} onContextMenu={(e) => e.preventDefault()}
            className={cn("grid size-14 touch-none select-none place-items-center rounded-full", voice.recording ? "bg-nyanya text-white" : "bg-flame text-[var(--flame-ink)]")}>
            <Mic className="size-6" />
          </motion.button>
        )}
      </form>
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