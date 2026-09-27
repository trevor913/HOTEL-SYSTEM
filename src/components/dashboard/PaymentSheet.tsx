"use client";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { AmountDisplay, Keypad } from "@/components/ui/Keypad";
import { Avatar } from "@/components/ui/Avatar";
import { Segmented } from "@/components/ui/Segmented";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { formatKES } from "@/lib/utils/money";
import type { Debtor } from "@/lib/store/selectors";

async function burst() {
  const confetti = (await import("canvas-confetti")).default;
  const colors = ["#FF6B2C", "#3E9B4F", "#C99A5B", "#E9DCC3"];
  confetti({ particleCount: 90, spread: 75, startVelocity: 42, origin: { y: 0.75 }, colors, disableForReducedMotion: true, zIndex: 70 });
  setTimeout(() => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors, disableForReducedMotion: true, zIndex: 70 }), 180);
  setTimeout(() => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors, disableForReducedMotion: true, zIndex: 70 }), 260);
}

export function PaymentSheet({ debtor, onClose }: { debtor: Debtor | null; onClose: () => void }) {
  const t = useT();
  const recordPayment = useApp((s) => s.recordPayment);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"cash" | "mpesa">("mpesa");
  const [done, setDone] = useState<null | { settled: boolean; paid: number; balance: number }>(null);
  const balanceKes = debtor ? debtor.balanceCents / 100 : 0;
  const over = Number(amount) > balanceKes;

  const close = () => { onClose(); setTimeout(() => { setAmount(""); setDone(null); }, 300); };
  const submit = (all = false) => {
    if (!debtor) return;
    const r = recordPayment({ customerId: debtor.customer.id, amountCents: all ? "all" : Number(amount) * 100, method });
    setDone({ settled: r.settled, paid: r.paidCents, balance: r.balanceCents });
    if (r.settled) void burst();
    setTimeout(close, r.settled ? 2200 : 1400);
  };

  return (
    <BottomSheet open={!!debtor} onClose={close} title={t.madeni.recordPayment}
      footer={!done && (
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => submit(true)} className="h-14 flex-1 rounded-2xl border border-line font-medium">{t.madeni.settle}</motion.button>
          <motion.button whileTap={{ scale: 0.97 }} disabled={!Number(amount) || over} onClick={() => submit(false)}
            className="h-14 flex-[1.6] rounded-2xl bg-sukuma font-display text-lg font-semibold text-white disabled:opacity-40">{t.madeni.confirm}</motion.button>
        </div>
      )}>
      {debtor && (
        <div className="relative">
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={debtor.customer.name} size={44} />
            <div className="flex-1"><p className="font-medium">{debtor.customer.name}</p><p className="money text-sm text-dim">{t.madeni.balance}: <span className="text-nyanya">{formatKES(debtor.balanceCents)}</span></p></div>
          </div>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="grid place-items-center py-14 text-center">
                {done.settled ? (
                  <motion.div initial={{ scale: 2.2, rotate: -18, opacity: 0 }} animate={{ scale: 1, rotate: -8, opacity: 1 }} transition={{ type: "spring", stiffness: 380, damping: 16 }}
                    className="rounded-xl border-4 border-sukuma px-6 py-3 font-display text-3xl font-bold uppercase tracking-wide text-sukuma">
                    {t.madeni.settled} 🎉
                  </motion.div>
                ) : (
                  <p className="money font-display text-2xl">+{formatKES(done.paid)}<span className="mt-2 block text-base text-dim">{t.madeni.balance}: {formatKES(done.balance)}</span></p>
                )}
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0 }}>
                <AmountDisplay value={amount} tone={over ? "nyanya" : "sukuma"} />
                {over && <p className="-mt-2 mb-2 text-center text-sm text-nyanya">{t.madeni.overpay}</p>}
                <Segmented layoutId="pay-method" value={method} onChange={setMethod} className="mb-3" options={[{ value: "mpesa", label: t.pay.mpesa }, { value: "cash", label: t.pay.cash }]} />
                <Keypad value={amount} onChange={setAmount} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </BottomSheet>
  );
}
