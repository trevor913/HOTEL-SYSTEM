"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { ChatCard } from "./ChatCard";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { useMsaidizi } from "@/lib/ai/use-msaidizi";
import { cn } from "@/lib/utils/cn";

export function MessageList({ limit, className }: { limit?: number; className?: string }) {
  const t = useT();
  const all = useApp((s) => s.chat);
  const chat = limit ? all.slice(-limit) : all;
  const { busy } = useMsaidizi();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [all.length, busy]);

  return (
    <div className={cn("space-y-3", className)} aria-live="polite">
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
  );
}