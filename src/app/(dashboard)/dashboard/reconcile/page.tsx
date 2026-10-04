"use client";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { BookOpen, CheckCircle2, ChevronLeft, EyeOff, Receipt, Smartphone, Sparkles, Zap } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { debtors } from "@/lib/store/selectors";
import { autoMatch } from "@/lib/domain/automatch";
import { simulateC2B } from "@/lib/integrations/mpesa/simulate";
import { formatKES } from "@/lib/utils/money";
import { formatPhone } from "@/lib/utils/phone";
import { timeAgo } from "@/lib/utils/dates";
import type { MpesaTxn } from "@/lib/types";

export default function ReconcilePage() {
  const t = useT();
  const s = useApp();
  const toast = useToast((x) => x.show);
  const [pickFor, setPickFor] = useState<MpesaTxn | null>(null);
  const [busy, setBusy] = useState(false);
  const unmatched = s.mpesa.filter((m) => m.status === "unmatched");
  const recent = s.mpesa.filter((m) => m.status !== "unmatched").slice(0, 8);
  const list = useMemo(() => debtors(s), [s]);

  const suggestionsFor = (tx: MpesaTxn) => {
    const r = autoMatch(tx, {
      customers: s.customers, debts: s.debts.filter((d) => d.balanceCents > 0),
      orders: s.orders.filter((o) => o.status !== "cancelled").map((o) => ({ id: o.id, code: o.code, customerPhone: o.customerPhone, totalCents: o.totalCents, paymentStatus: o.paymentStatus, createdAt: o.createdAt })),
    });
    return r.status === "matched" ? [r] : r.suggestions;
  };

  const simulate = async () => {
    setBusy(true);
    try {
      const tx = await simulateC2B();
      toast(`${tx.payerName} · ${formatKES(tx.amountCents)}${tx.status === "matched" ? ` · ${t.reconcile.auto} ✓` : ""}`);
    } finally { setBusy(false); }
  };
  const match = (tx: MpesaTxn, entity: "debt" | "order" | "sale", id: string) => { s.matchMpesa(tx.id, entity, id); toast(`${t.reconcile.matchedToast} ✓`); };

  return (
    <div className="px-5">
      <header className="flex items-center gap-2 pt-safe pb-2">
        <Link href="/dashboard/settings" aria-label={t.common.back} className="mt-4 grid size-11 place-items-center rounded-full bg-overlay"><ChevronLeft className="size-5" /></Link>
        <div className="mt-4">
          <h1 className="font-display text-2xl font-semibold">{t.reconcile.title}</h1>
          <p className="text-xs text-dim">{unmatched.length} {t.reconcile.unmatched}</p>
        </div>
      </header>

      {unmatched.length === 0 ? (
        <div className="mt-8 rounded-3xl border border-line bg-raised p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-sukuma" />
          <p className="mt-3 font-display text-lg font-semibold">{t.reconcile.allClear}</p>
          <p className="mt-1 text-sm text-dim">{t.reconcile.allClearBody}</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          <AnimatePresence initial={false}>
            {unmatched.map((tx) => {
              const sug = suggestionsFor(tx)[0];
              const label = sug ? (sug.entity === "order" ? s.orders.find((o) => o.id === sug.entityId)?.code : s.customers.find((c) => c.id === s.debts.find((d) => d.id === sug.entityId)?.customerId)?.name) : null;
              return (
                <motion.li key={tx.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 80, height: 0, marginTop: 0 }} className="overflow-hidden rounded-3xl border border-line bg-raised">
                  <div className="flex items-center gap-3 p-4">
                    <span className="grid size-11 place-items-center rounded-2xl bg-[color-mix(in_oklab,var(--sukuma)_16%,transparent)]"><Smartphone className="size-5 text-sukuma" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{tx.payerName}</span>
                      <span className="money text-xs text-dim">{formatPhone(tx.phone)} · {tx.providerTxId} · {timeAgo(tx.createdAt, s.lang)}</span>
                    </span>
                    <span className="money font-display text-xl font-semibold">{formatKES(tx.amountCents)}</span>
                  </div>
                  {sug && label && (
                    <button onClick={() => match(tx, sug.entity, sug.entityId)} className="mx-4 mb-3 flex min-h-12 w-[calc(100%-2rem)] items-center gap-3 rounded-2xl bg-[color-mix(in_oklab,var(--flame)_12%,transparent)] px-3 text-left">
                      <Sparkles className="size-4 shrink-0 text-flame" />
                      <span className="flex-1 text-sm"><span className="text-xs text-dim">{t.reconcile.suggested} · {Math.round(sug.confidence * 100)}%</span><span className="block font-medium">{t.reconcile.entity[sug.entity]}: {label}</span></span>
                      <Zap className="size-4 text-flame" />
                    </button>
                  )}
                  <div className="grid grid-cols-3 border-t border-line text-sm">
                    <button onClick={() => match(tx, "sale", "")} className="flex h-12 items-center justify-center gap-1.5"><Receipt className="size-4 text-chai" />{t.reconcile.asSale}</button>
                    <button onClick={() => setPickFor(tx)} className="flex h-12 items-center justify-center gap-1.5 border-x border-line"><BookOpen className="size-4 text-nyanya" />{t.reconcile.toDebt}</button>
                    <button onClick={() => { s.ignoreMpesa(tx.id); toast(t.reconcile.ignored); }} className="flex h-12 items-center justify-center gap-1.5 text-dim"><EyeOff className="size-4" />{t.reconcile.ignore}</button>
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}

      {recent.length > 0 && (
        <section className="mt-7">
          <h2 className="text-xs uppercase tracking-[0.16em] text-dim">{t.reconcile.recent}</h2>
          <ul className="mt-2 divide-y divide-line">
            {recent.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                <span><span className="block">{m.payerName}</span><span className="text-xs text-dim">{m.status === "ignored" ? t.reconcile.ignored : t.reconcile.entity[m.matchedEntity ?? "sale"]} · {timeAgo(m.createdAt, s.lang)}</span></span>
                <span className={`money ${m.status === "ignored" ? "text-dim line-through" : "text-sukuma"}`}>{formatKES(m.amountCents)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="h-24" />
      <div className="fixed inset-x-0 z-30 mx-auto max-w-lg px-5 lg:left-[248px] lg:max-w-3xl" style={{ bottom: "calc(var(--tab-h) + var(--safe-b) + 12px)" }}>
        <motion.button whileTap={{ scale: 0.97 }} disabled={busy} onClick={simulate} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sukuma font-medium text-white shadow-[0_12px_30px_-12px_var(--sukuma)] disabled:opacity-60">
          <Smartphone className="size-5" /> {t.reconcile.simulate}
        </motion.button>
      </div>

      <BottomSheet open={!!pickFor} onClose={() => setPickFor(null)} title={t.reconcile.pickDebtor}>
        <ul className="divide-y divide-line">
          {list.map((d) => {
            const debt = s.debts.find((x) => x.customerId === d.customer.id && x.balanceCents > 0);
            return (
              <li key={d.customer.id}>
                <button onClick={() => { if (pickFor && debt) match(pickFor, "debt", debt.id); setPickFor(null); }} className="flex min-h-16 w-full items-center gap-3 py-2 text-left">
                  <Avatar name={d.customer.name} size={40} />
                  <span className="flex-1"><span className="block font-medium">{d.customer.name}</span><span className="text-xs text-dim">siku {d.oldestDays}</span></span>
                  <span className="money text-nyanya">{formatKES(d.balanceCents)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </BottomSheet>
    </div>
  );
}