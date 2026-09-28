"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Bike, ChevronRight, MapPin, Phone, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useToast } from "@/components/ui/Toast";
import { useLang, useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { formatKES } from "@/lib/utils/money";
import { timeAgo } from "@/lib/utils/dates";
import { formatPhone } from "@/lib/utils/phone";
import { cn } from "@/lib/utils/cn";
import type { Order, OrderStatus } from "@/lib/types";

type Col = "new" | "preparing" | "ready" | "out_for_delivery" | "delivered";
const COLS: Col[] = ["new", "preparing", "ready", "out_for_delivery", "delivered"];
const norm = (s: OrderStatus): Col | null => (s === "confirmed" ? "new" : s === "cancelled" ? null : s);

export default function OdaPage() {
  const t = useT();
  const orders = useApp((s) => s.orders);
  const [col, setCol] = useState<Col>("new");
  const label: Record<Col, string> = { new: t.oda.new, preparing: t.oda.preparing, ready: t.oda.ready, out_for_delivery: t.oda.out, delivered: t.oda.delivered };
  const byCol = (c: Col) => orders.filter((o) => norm(o.status) === c).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  useNewOrderDing(orders.filter((o) => o.status === "new").length);

  return (
    <div>
      <PageHeader title={t.oda.title} />
      {/* Mobile: status rail + one-tap advance. Desktop: full kanban. */}
      <div className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto bg-bg/95 px-5 py-3 backdrop-blur lg:hidden">
        {COLS.map((c) => (
          <button key={c} onClick={() => setCol(c)} className={cn("flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium", col === c ? "bg-ink text-bg" : "border border-line text-dim")}>
            {label[c]} <span className={cn("money rounded-full px-1.5 text-xs", c === "new" && byCol(c).length ? "bg-flame text-[var(--flame-ink)]" : "opacity-70")}>{byCol(c).length}</span>
          </button>
        ))}
      </div>
      <div className="px-5 lg:hidden">
        <AnimatePresence mode="popLayout" initial={false}>
          {byCol(col).length === 0 ? (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center text-sm text-dim">{t.oda.emptyCol}</motion.p>
          ) : byCol(col).map((o) => <OrderCard key={o.id} o={o} />)}
        </AnimatePresence>
      </div>
      <div className="hidden gap-3 overflow-x-auto px-5 lg:grid lg:grid-cols-5">
        {COLS.map((c) => (
          <section key={c} className="min-w-0">
            <h3 className="mb-2 text-sm font-medium text-dim">{label[c]} · {byCol(c).length}</h3>
            <AnimatePresence mode="popLayout">{byCol(c).map((o) => <OrderCard key={o.id} o={o} compact />)}</AnimatePresence>
          </section>
        ))}
      </div>
    </div>
  );
}

function OrderCard({ o, compact }: { o: Order; compact?: boolean }) {
  const t = useT();
  const lang = useLang();
  const menu = useApp((s) => s.menu);
  const advance = useApp((s) => s.advanceOrder);
  const toast = useToast((s) => s.show);
  const next: Partial<Record<OrderStatus, string>> = { new: t.oda.preparing, confirmed: t.oda.preparing, preparing: t.oda.ready, ready: o.type === "pickup" ? t.oda.delivered : t.oda.out, out_for_delivery: t.oda.delivered };
  const nextLabel = next[o.status];
  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 60 }}
      className={cn("mb-3 rounded-3xl border bg-raised p-4", o.status === "new" ? "border-flame/50" : "border-line")}>
      <header className="flex items-center gap-2">
        <span className="money font-display text-lg font-semibold">{o.code}</span>
        <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]", o.type === "delivery" ? "bg-chai/15 text-chai" : "bg-overlay text-dim")}>
          {o.type === "delivery" ? <Bike className="size-3" /> : <ShoppingBag className="size-3" />}{o.type === "delivery" ? t.oda.delivery : t.oda.pickup}
        </span>
        <span className="ml-auto text-xs text-dim">{timeAgo(o.createdAt, lang)}</span>
      </header>
      <p className="mt-2 font-medium">{o.customerName}</p>
      {!compact && <p className="flex items-center gap-1.5 text-sm text-dim"><Phone className="size-3.5" />{formatPhone(o.customerPhone)}</p>}
      {o.addressText && !compact && <p className="flex items-center gap-1.5 text-sm text-dim"><MapPin className="size-3.5" />{o.addressText}</p>}
      <ul className="mt-3 space-y-0.5 text-sm">
        {o.items.map((i) => <li key={i.menuItemId} className="flex justify-between"><span>{i.qty}× {menu.find((m) => m.id === i.menuItemId)?.name}</span><span className="money text-dim">{(i.qty * i.unitPriceCents) / 100}</span></li>)}
      </ul>
      <footer className="mt-3 flex items-center justify-between border-t border-line pt-3">
        <span className="money font-display text-lg font-semibold">{formatKES(o.totalCents)}</span>
        <span className={cn("text-xs", o.paymentStatus === "paid" ? "text-sukuma" : "text-chai")}>{o.paymentStatus === "paid" ? t.oda.paid : t.oda.pod}</span>
      </footer>
      {o.riderName && <p className="mt-1 text-xs text-dim">🛵 {o.riderName}</p>}
      {nextLabel && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => { if (advance(o.id)) toast(`${o.code} → ${nextLabel}`); }}
          className="mt-3 flex h-12 w-full items-center justify-center gap-1 rounded-2xl bg-flame font-medium text-[var(--flame-ink)]">
          {nextLabel} <ChevronRight className="size-4" />
        </motion.button>
      )}
    </motion.article>
  );
}

/** Soft ding (WebAudio, no asset needed) when the count of new orders grows. */
function useNewOrderDing(count: number) {
  const prev = useRef(count);
  useEffect(() => {
    if (count > prev.current) {
      try {
        const ctx = new AudioContext();
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = "sine"; o.frequency.setValueAtTime(880, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
        g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.6);
      } catch { /* audio blocked until a user gesture */ }
      if ("Notification" in window && Notification.permission === "granted") new Notification("Oda mpya! 🍲");
    }
    prev.current = count;
  }, [count]);
}
