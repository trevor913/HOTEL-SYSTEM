"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Check, RotateCcw, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { formatKES } from "@/lib/utils/money";
import { formatPhone } from "@/lib/utils/phone";

type Phase = "sending" | "pin" | "done" | "error";

/**
 * Lipa na M-Pesa modal (§8.9) with an animated phone. Calls the real /api/mpesa/stk/push.
 * Mock mode: simulates the customer entering their PIN and returns a fake receipt.
 * Live mode: the Daraja callback records the payment server-side, so we return null.
 */
export function StkModal({ open, phone, amountCents, merchant, onDone, onClose }: {
  open: boolean; phone: string; amountCents: number; merchant: string; onDone: (receipt: string | null) => void; onClose: () => void;
}) {
  const t = useT();
  const [phase, setPhase] = useState<Phase>("sending");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    setPhase("sending");
    (async () => {
      let mode = "mock";
      try {
        const r = await fetch("/api/mpesa/stk/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, amountKes: Math.ceil(amountCents / 100), reference: "ODA", description: "Hotel order" }) });
        const j = (await r.json()) as { ok?: boolean; mode?: string };
        if (!r.ok || !j.ok) throw new Error("stk");
        mode = j.mode ?? "mock";
      } catch { if (alive) setPhase("error"); return; }
      await wait(900); if (!alive) return;
      setPhase("pin");
      await wait(mode === "mock" ? 2600 : 6000); if (!alive) return;
      setPhase("done");
      await wait(1300); if (!alive) return;
      const receipt = mode === "mock" ? `T${Array.from({ length: 9 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 34)]).join("")}` : null;
      onDone(receipt);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attempt]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] grid place-items-center bg-[var(--scrim)] p-6 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal aria-label={t.pub.stkTitle}>
          <motion.div initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, opacity: 0 }} className="relative w-full max-w-sm rounded-[32px] border border-line bg-raised p-6 text-center">
            {phase !== "done" && <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 grid size-10 place-items-center rounded-full bg-overlay"><X className="size-4" /></button>}

            {/* Phone illustration */}
            <div className="relative mx-auto h-60 w-32 overflow-hidden rounded-[26px] border-[5px] border-[#2a2522] bg-[#141110] shadow-2xl">
              <span className="absolute top-1.5 left-1/2 h-1.5 w-10 -translate-x-1/2 rounded-full bg-[#2a2522]" />
              <AnimatePresence mode="wait">
                {phase === "sending" && (
                  <motion.div key="s" className="absolute inset-0 grid place-items-center" exit={{ opacity: 0 }}>
                    {[0, 1, 2].map((i) => <motion.span key={i} className="absolute size-12 rounded-full border-2 border-sukuma" animate={{ scale: [0.4, 1.8], opacity: [0.9, 0] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.45 }} />)}
                    <span className="size-3 rounded-full bg-sukuma" />
                  </motion.div>
                )}
                {phase === "pin" && (
                  <motion.div key="p" initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 22 }} className="absolute inset-x-1.5 top-6 rounded-xl bg-white p-2 text-left text-[9px] leading-tight text-[#1c1917]">
                    <p className="font-bold text-[#2e7d32]">M-PESA</p>
                    <p className="mt-0.5">Lipa {formatKES(amountCents)} kwa {merchant}?</p>
                    <p className="mt-1 text-[#57534e]">Weka PIN:</p>
                    <span className="mt-1 flex gap-1">{[0, 1, 2, 3].map((i) => <motion.span key={i} className="size-2 rounded-full bg-[#1c1917]" initial={{ opacity: 0.15 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 + i * 0.4 }} />)}</span>
                  </motion.div>
                )}
                {phase === "done" && (
                  <motion.div key="d" className="absolute inset-0 grid place-items-center" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 16 }}>
                    <span className="grid size-16 place-items-center rounded-full bg-sukuma"><Check className="size-9 text-white" strokeWidth={3} /></span>
                  </motion.div>
                )}
                {phase === "error" && <motion.div key="e" className="absolute inset-0 grid place-items-center text-3xl" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>⚠️</motion.div>}
              </AnimatePresence>
            </div>

            <p className="mt-5 font-display text-xl font-semibold">{phase === "done" ? t.pub.stkDone : phase === "error" ? t.pub.stkError : t.pub.stkTitle}</p>
            <p className="mt-1 text-sm text-dim">
              {phase === "sending" && <>{t.pub.stkBody} <span className="money text-ink">{formatPhone(phone)}</span></>}
              {phase === "pin" && t.pub.stkPin}
              {phase === "done" && formatKES(amountCents)}
            </p>
            {phase === "error" && (
              <button onClick={() => setAttempt((a) => a + 1)} className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-flame px-5 font-medium text-[var(--flame-ink)]"><RotateCcw className="size-4" />{t.pub.retry}</button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}