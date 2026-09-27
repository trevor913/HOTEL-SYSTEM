"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const EVENTS = [
  "Mama Mary amerecord mauzo ya KSh 12,400 leo ✅",
  "Otieno amelipa deni la KSh 250 kwa M-Pesa 💸",
  "Pilau imeisha saa 7:40 mchana, Ijumaa inauza 🔥",
  "Kumbusho 6 za madeni zimetumwa kwa SMS 📨",
  "Oda KB-1042 imefika Mountain View 🛵",
];

export function Ticker() {
  const [i, setI] = useState(0);
  useEffect(() => { const id = setInterval(() => setI((x) => (x + 1) % EVENTS.length), 2800); return () => clearInterval(id); }, []);
  return (
    <div className="mx-auto max-w-5xl px-5 pb-10" aria-live="polite">
      <div className="flex h-12 items-center gap-3 overflow-hidden rounded-full border border-line bg-raised px-4 text-sm">
        <span className="pulse-ring size-2 shrink-0 rounded-full bg-sukuma" />
        <AnimatePresence mode="wait">
          <motion.span key={i} initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }} className="truncate">{EVENTS[i]}</motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
