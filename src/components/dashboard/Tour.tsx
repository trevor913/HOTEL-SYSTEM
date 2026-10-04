"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Bot, Home, Plus } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { steam } from "@/lib/motion";

/** First-run 3-card tour shown after onboarding (§8.10). */
export function Tour() {
  const t = useT();
  const pending = useApp((s) => s.tourPending);
  const finish = useApp((s) => s.finishTour);
  const locked = useApp((s) => s.locked);
  const [i, setI] = useState(0);
  const cards = [
    { icon: Home, title: t.onb.tour[0]!.title, body: t.onb.tour[0]!.body },
    { icon: Plus, title: t.onb.tour[1]!.title, body: t.onb.tour[1]!.body },
    { icon: Bot, title: t.onb.tour[2]!.title, body: t.onb.tour[2]!.body },
  ];
  const c = cards[i]!;
  return (
    <AnimatePresence>
      {pending && !locked && (
        <motion.div className="fixed inset-0 z-[80] flex items-end bg-[var(--scrim)] p-4 pb-[max(env(safe-area-inset-bottom),16px)] lg:items-center lg:justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal aria-label={c.title}>
          <motion.div initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }} transition={{ ease: steam, duration: 0.4 }} className="w-full max-w-md rounded-[28px] border border-line bg-raised p-6">
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }}>
                <span className="grid size-12 place-items-center rounded-2xl bg-flame text-[var(--flame-ink)]"><c.icon className="size-6" /></span>
                <h2 className="mt-4 font-display text-2xl font-semibold">{c.title}</h2>
                <p className="mt-1.5 text-dim">{c.body}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex items-center gap-3">
              <div className="flex flex-1 gap-1.5">{cards.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-flame" : "w-1.5 bg-line"}`} />)}</div>
              <button onClick={finish} className="h-12 px-3 text-sm text-dim">{t.onb.skip}</button>
              <button onClick={() => (i < cards.length - 1 ? setI(i + 1) : finish())} className="h-12 rounded-2xl bg-flame px-5 font-semibold text-[var(--flame-ink)]">{i < cards.length - 1 ? t.onb.next : t.onb.gotIt}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}