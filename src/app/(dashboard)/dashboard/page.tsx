"use client";
import Link from "next/link";
import { motion } from "motion/react";
import { useMemo } from "react";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, ChefHat, CircleDollarSign, NotebookPen, Receipt, ShoppingBasket, Smartphone } from "lucide-react";
import { AnimatedMoney } from "@/components/ui/AnimatedMoney";
import { FaidaMeter } from "@/components/dashboard/FaidaMeter";
import { BriefsCard } from "@/components/dashboard/BriefsCard";
import { useT, useLang } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { avgProfit, dayTotals } from "@/lib/store/selectors";
import { greetingKey, timeAgo, BUSINESS_DAY_START_HOUR } from "@/lib/utils/dates";
import { formatKES } from "@/lib/utils/money";
import { item, list } from "@/lib/motion";
import type { FeedEvent } from "@/lib/types";

const FEED_ICON: Record<FeedEvent["kind"], typeof Receipt> = { sale: Receipt, mpesa: Smartphone, debt_new: NotebookPen, debt_paid: CircleDollarSign, expense: ShoppingBasket, order: ChefHat };

export default function LeoPage() {
  const t = useT();
  const lang = useLang();
  const s = useApp();
  const now = new Date();
  const today = useMemo(() => dayTotals(s), [s]);
  const avg = useMemo(() => avgProfit(s), [s]);
  const lowStock = s.inventory.filter((i) => i.currentQty <= i.lowThreshold);
  const soldOut = s.menu.filter((m) => m.soldOutToday);
  const unmatched = s.mpesa.filter((m) => m.status === "unmatched").length;
  const pending = s.orders.filter((o) => ["new", "confirmed", "preparing"].includes(o.status)).length;
  const positive = today.profitCents >= 0;
  const g = greetingKey(now);

  return (
    <div>
      {/* Greeting with ember glow; the focal point is the scoreboard below */}
      <section className="ember relative overflow-hidden px-5 pt-safe pb-6">
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-sm text-dim">{t.greet[g]}, {s.hotel.ownerName} {g === "morning" ? "🌅" : ""}</p>
            <p className="text-xs text-dim/80">{s.hotel.name} · {now.toLocaleDateString(lang === "sw" ? "sw-KE" : "en-KE", { weekday: "long", day: "numeric", month: "long" })}</p>
          </div>
          <Link href="/dashboard/zaidi" aria-label={t.nav.more} className="grid size-11 place-items-center rounded-full bg-overlay font-display font-semibold text-chai">MM</Link>
        </div>

        <div className="mt-7">
          <p className="text-xs uppercase tracking-[0.18em] text-dim">{t.home.profit} · {lang === "sw" ? "Leo" : "Today"}</p>
          <AnimatedMoney cents={today.profitCents} className={`mt-1 block font-display text-display-2xl font-semibold ${positive ? "text-sukuma" : "text-nyanya"}`} />
          {now.getHours() < BUSINESS_DAY_START_HOUR && <p className="mt-1 text-xs text-chai">{t.home.yesterdayNote}</p>}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
          <Stat label={t.home.sales} cents={today.salesCents + today.debtSalesCents} icon={<ArrowUpRight className="size-3.5 text-sukuma" />} />
          <Stat label={t.home.expenses} cents={today.expensesCents} icon={<ArrowDownRight className="size-3.5 text-nyanya" />} />
          <Stat label={t.home.newDebts} cents={today.newDebtsCents} tone="nyanya" />
        </div>
        <div className="mt-3 flex gap-2 text-xs text-dim">
          <span className="money rounded-full bg-overlay px-3 py-1">{t.home.mpesa} {formatKES(today.mpesaCents)}</span>
          <span className="money rounded-full bg-overlay px-3 py-1">{t.home.cash} {formatKES(today.cashCents)}</span>
        </div>
      </section>

      {(pending > 0 || unmatched > 0 || lowStock.length > 0 || soldOut.length > 0) && (
        <section className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-2">
          {pending > 0 && (
            <Link href="/dashboard/oda" className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-[color-mix(in_oklab,var(--flame)_16%,transparent)] px-4 text-sm font-medium text-flame">
              <span className="pulse-ring size-2 rounded-full bg-flame" /> {pending} {t.home.pendingOrders}
            </Link>
          )}
          {unmatched > 0 && (
            <Link href="/dashboard/reconcile" className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-sukuma/40 px-4 text-sm font-medium text-sukuma">
              <Smartphone className="size-3.5" /> {unmatched} M-Pesa {t.reconcile.unmatched}
            </Link>
          )}
          {lowStock.map((i) => (
            <span key={i.id} className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-line px-4 text-sm text-dim">
              <AlertTriangle className="size-3.5 text-chai" /> {i.name.split(" ")[0]} · {i.currentQty} {i.unit}
            </span>
          ))}
          {soldOut.map((m) => <span key={m.id} className="flex h-11 shrink-0 items-center rounded-full border border-nyanya/40 px-4 text-sm text-nyanya">{m.name} · {t.home.soldOut}</span>)}
        </section>
      )}

      <section className="mx-5 mt-4 rounded-3xl border border-line bg-raised p-4">
        <FaidaMeter profitCents={today.profitCents} avgCents={avg} label={t.home.meter} caption={t.home.vsAvg} />
      </section>

      <BriefsCard />

      <section className="mt-7 px-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg font-semibold">{t.home.feed}</h2>
          <Link href="/dashboard/mauzo?tab=list" className="text-sm text-flame">{t.home.viewAll}</Link>
        </div>
        {s.feed.length === 0 ? (
          <p className="mt-6 text-sm text-dim">{t.home.empty}</p>
        ) : (
          <motion.ul variants={list} initial="initial" animate="animate" className="mt-3 divide-y divide-line">
            {s.feed.slice(0, 10).map((f) => {
              const Icon = FEED_ICON[f.kind];
              const neg = f.kind === "expense" || f.kind === "debt_new";
              return (
                <motion.li key={f.id} variants={item} className="flex items-center gap-3 py-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-overlay"><Icon className={`size-[18px] ${f.kind === "mpesa" || f.kind === "debt_paid" ? "text-sukuma" : neg ? "text-nyanya" : "text-chai"}`} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px]">{f.title}</span>
                    <span className="text-xs text-dim">{timeAgo(f.createdAt, lang, now)}</span>
                  </span>
                  <span className={`money text-[15px] font-medium ${neg ? "text-nyanya" : "text-ink"}`}>{neg ? "−" : "+"}{formatKES(f.amountCents).replace("KSh ", "")}</span>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, cents, icon, tone }: { label: string; cents: number; icon?: React.ReactNode; tone?: "nyanya" }) {
  return (
    <div className="bg-raised p-3">
      <p className="flex items-center gap-1 text-[11px] text-dim">{icon}{label}</p>
      <AnimatedMoney cents={cents} className={`mt-1 block text-[15px] font-semibold ${tone === "nyanya" ? "text-nyanya" : "text-ink"}`} />
    </div>
  );
}
