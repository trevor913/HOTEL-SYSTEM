"use client";
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { useMemo, useState } from "react";
import { BellRing, HandCoins, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PaymentSheet } from "@/components/dashboard/PaymentSheet";
import { NewDebtSheet } from "@/components/dashboard/NewDebtSheet";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { AnimatedMoney } from "@/components/ui/AnimatedMoney";
import { useToast } from "@/components/ui/Toast";
import { useLang, useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { debtors, recoveredThisWeek, type Debtor } from "@/lib/store/selectors";
import { bucketOf } from "@/lib/domain/debts";
import { formatKES } from "@/lib/utils/money";
import { timeAgo, clockTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { item, list } from "@/lib/motion";

type Tab = "all" | "0-7" | "8-30" | "30+";

export default function MadeniPage() {
  const t = useT();
  const s = useApp();
  const [tab, setTab] = useState<Tab>("all");
  const [paying, setPaying] = useState<Debtor | null>(null);
  const [viewing, setViewing] = useState<Debtor | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const all = useMemo(() => debtors(s), [s]);
  const shown = tab === "all" ? all : all.filter((d) => bucketOf(d.oldestDays) === tab);
  const total = all.reduce((a, d) => a + d.balanceCents, 0);
  const oldest = all.reduce((a, d) => Math.max(a, d.oldestDays), 0);
  const recovered = useMemo(() => recoveredThisWeek(s), [s]);
  const count = (b: Tab) => (b === "all" ? all.length : all.filter((d) => bucketOf(d.oldestDays) === b).length);

  return (
    <div className="pb-20">
      <PageHeader eyebrow={s.hotel.name} title={t.madeni.title} />

      <section className="mx-5 mt-2 rounded-3xl border border-line bg-raised p-5">
        <p className="text-xs uppercase tracking-[0.16em] text-dim">{t.madeni.outstanding}</p>
        <AnimatedMoney cents={total} className="mt-1 block font-display text-5xl font-semibold text-nyanya" />
        <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4 text-sm">
          <div><dt className="text-dim">{t.madeni.debtors}</dt><dd className="money mt-0.5 font-display text-xl">{all.length}</dd></div>
          <div><dt className="text-dim">{t.madeni.oldest}</dt><dd className="money mt-0.5 font-display text-xl">{oldest} <span className="text-sm text-dim">{t.madeni.days}</span></dd></div>
          <div><dt className="text-dim">{t.madeni.recovered}</dt><dd className="money mt-0.5 font-display text-xl text-sukuma">{formatKES(recovered, { compact: true }).replace("KSh ", "")}</dd></div>
        </dl>
      </section>

      {/* Aging tabs */}
      <div className="no-scrollbar sticky top-0 z-20 -mt-px flex gap-2 overflow-x-auto bg-bg/95 px-5 py-3 backdrop-blur">
        {(["all", "0-7", "8-30", "30+"] as Tab[]).map((b) => (
          <button key={b} onClick={() => setTab(b)}
            className={cn("relative h-10 shrink-0 rounded-full px-4 text-sm font-medium",
              tab === b ? (b === "30+" ? "bg-nyanya text-white" : "bg-ink text-bg") : b === "30+" ? "border border-nyanya/50 text-nyanya" : "border border-line text-dim")}>
            {b === "all" ? t.madeni.all : `${b} ${t.madeni.days}`} <span className="money ml-1 opacity-70">{count(b)}</span>
          </button>
        ))}
      </div>
      <p className="px-5 pb-2 text-xs text-dim">{t.madeni.swipeHint}</p>

      {shown.length === 0 ? (
        <EmptyDebts title={t.madeni.emptyTitle} body={t.madeni.emptyBody} />
      ) : (
        <motion.ul variants={list} initial="initial" animate="animate" className="space-y-2 px-5">
          <AnimatePresence initial={false}>
            {shown.map((d) => (
              <motion.li key={d.customer.id} variants={item} layout exit={{ opacity: 0, height: 0, marginTop: 0 }}>
                <DebtorCard d={d} onPay={() => setPaying(d)} onOpen={() => setViewing(d)} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}

      {/* Primary action in the thumb zone */}
      <motion.button whileTap={{ scale: 0.96 }} onClick={() => setNewOpen(true)}
        className="above-tabs fixed left-1/2 z-30 flex h-14 -translate-x-1/2 items-center gap-2 rounded-full bg-flame px-6 font-display text-base font-semibold text-[var(--flame-ink)] shadow-[0_12px_30px_-10px_var(--flame)] lg:bottom-8">
        <Plus className="size-5" strokeWidth={2.6} /> {t.madeni.newDebt}
      </motion.button>

      <PaymentSheet debtor={paying} onClose={() => setPaying(null)} />
      <NewDebtSheet open={newOpen} onClose={() => setNewOpen(false)} />
      <HistorySheet d={viewing} onClose={() => setViewing(null)} onPay={() => { const v = viewing; setViewing(null); setTimeout(() => setPaying(v), 250); }} />
    </div>
  );
}

function DebtorCard({ d, onPay, onOpen }: { d: Debtor; onPay: () => void; onOpen: () => void }) {
  const t = useT();
  const lang = useLang();
  const sendReminder = useApp((s) => s.sendReminder);
  const toast = useToast((s) => s.show);
  const x = useMotionValue(0);
  const payOpacity = useTransform(x, [20, 90], [0, 1]);
  const remindOpacity = useTransform(x, [-90, -20], [1, 0]);
  const urgent = d.oldestDays > 30;

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > 90) onPay();
    else if (info.offset.x < -90) {
      const m = sendReminder(d.customer.id);
      const first = d.customer.name.split(" ")[0];
      toast(m ? `${t.madeni.reminderSent} · ${first}` : `${first}: hakuna namba ya simu`, m ? "ok" : "warn");
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <motion.div style={{ opacity: payOpacity }} className="absolute inset-0 flex items-center bg-sukuma pl-6 text-white"><HandCoins className="size-6" /><span className="ml-2 font-medium">{t.madeni.pay}</span></motion.div>
      <motion.div style={{ opacity: remindOpacity }} className="absolute inset-0 flex items-center justify-end bg-chai pr-6 text-[var(--flame-ink)]"><span className="mr-2 font-medium">{t.madeni.remind}</span><BellRing className="size-6" /></motion.div>
      <motion.button
        drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.5} dragSnapToOrigin style={{ x }} onDragEnd={onDragEnd} onTap={onOpen}
        className={cn("relative flex w-full items-center gap-3 rounded-3xl border bg-raised p-4 text-left", urgent ? "border-nyanya/40" : "border-line")}
      >
        {urgent && <span className="absolute inset-y-4 left-0 w-1 rounded-r-full bg-nyanya" />}
        <Avatar name={d.customer.name} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{d.customer.name}</span>
          <span className="mt-0.5 flex items-center gap-2 text-xs text-dim">
            <span className={cn("money rounded-full px-2 py-0.5", urgent ? "bg-nyanya/15 text-nyanya" : d.oldestDays > 7 ? "bg-chai/15 text-chai" : "bg-overlay")}>{d.oldestDays} {t.madeni.days}</span>
            <span className="truncate">{d.lastPaymentAt ? `${t.madeni.lastPaid} ${timeAgo(d.lastPaymentAt, lang)}` : t.madeni.never}</span>
          </span>
        </span>
        <span className="money font-display text-xl font-semibold text-nyanya">{formatKES(d.balanceCents).replace("KSh ", "")}</span>
      </motion.button>
    </div>
  );
}

function HistorySheet({ d, onClose, onPay }: { d: Debtor | null; onClose: () => void; onPay: () => void }) {
  const t = useT();
  const lang = useLang();
  const s = useApp();
  const events = useMemo(() => {
    if (!d) return [];
    const debts = s.debts.filter((x) => x.customerId === d.customer.id);
    const ids = new Set(debts.map((x) => x.id));
    return [
      ...debts.map((x) => ({ id: x.id, at: x.createdAt, label: x.description, cents: x.amountCents, kind: "debt" as const })),
      ...s.debtPayments.filter((p) => ids.has(p.debtId)).map((p) => ({ id: p.id, at: p.createdAt, label: p.method === "mpesa" ? "M-Pesa" : "Cash", cents: p.amountCents, kind: "pay" as const })),
    ].sort((a, b) => b.at.localeCompare(a.at));
  }, [d, s]);
  return (
    <BottomSheet open={!!d} onClose={onClose} title={t.madeni.history}
      footer={<motion.button whileTap={{ scale: 0.97 }} onClick={onPay} className="h-14 w-full rounded-2xl bg-sukuma font-display text-lg font-semibold text-white">{t.madeni.recordPayment}</motion.button>}>
      {d && (
        <>
          <div className="mt-2 flex items-center gap-3">
            <Avatar name={d.customer.name} size={52} />
            <div><p className="font-display text-xl font-semibold">{d.customer.name}</p><p className="money text-sm text-dim">{d.customer.phone ? `0${d.customer.phone.slice(3)}` : "—"}</p></div>
            <p className="money ml-auto font-display text-2xl font-semibold text-nyanya">{formatKES(d.balanceCents)}</p>
          </div>
          <ol className="relative mt-6 border-l border-line pl-5">
            {events.map((e) => (
              <li key={e.id} className="relative pb-5">
                <span className={cn("absolute -left-[27px] top-1 grid size-3.5 place-items-center rounded-full ring-4 ring-raised", e.kind === "pay" ? "bg-sukuma" : "bg-nyanya")} />
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-[15px]">{e.kind === "pay" ? `✓ ${e.label}` : e.label}</p>
                  <p className={cn("money font-medium", e.kind === "pay" ? "text-sukuma" : "text-nyanya")}>{e.kind === "pay" ? "−" : "+"}{formatKES(e.cents)}</p>
                </div>
                <p className="text-xs text-dim">{timeAgo(e.at, lang)} · {clockTime(e.at)}</p>
              </li>
            ))}
          </ol>
        </>
      )}
    </BottomSheet>
  );
}

function EmptyDebts({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex flex-col items-center px-10 py-14 text-center">
      <svg viewBox="0 0 120 90" className="w-32" aria-hidden>
        <rect x="18" y="14" width="84" height="64" rx="6" fill="var(--bg-overlay)" stroke="var(--border)" />
        <path d="M60 14v64" stroke="var(--border)" />
        <path d="M28 32h22M28 42h18M70 32h22M70 42h14" stroke="var(--text-dim)" strokeWidth="2" strokeLinecap="round" opacity=".5" />
        <circle cx="86" cy="62" r="14" fill="var(--sukuma)" /><path d="M79 62l5 5 9-10" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-dim">{body}</p>
    </div>
  );
}
