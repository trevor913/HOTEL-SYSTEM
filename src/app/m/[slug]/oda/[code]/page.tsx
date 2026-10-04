"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { Bike, Check, ChefHat, ChevronLeft, PackageCheck, Phone, ReceiptText, Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { useMounted } from "@/lib/utils/use-mounted";
import { formatKES } from "@/lib/utils/money";
import { clockTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { OrderStatus } from "@/lib/types";

const ICON = { new: ReceiptText, preparing: ChefHat, ready: PackageCheck, out_for_delivery: Bike, delivered: Sparkles } as const;

export default function TrackerPage() {
  const mounted = useMounted();
  return mounted ? <Tracker /> : <div className="min-h-dvh bg-bg" />;
}

function Tracker() {
  const { slug, code } = useParams<{ slug: string; code: string }>();
  const t = useT();
  const s = useApp();
  const o = s.orders.find((x) => x.code === decodeURIComponent(code));
  const back = `/m/${slug}`;

  if (!o) {
    return (
      <div className="grid min-h-dvh place-items-center p-8 text-center">
        <div><p className="font-display text-2xl">{t.pub.notFound}</p><Link href={back} className="mt-4 inline-block text-flame underline">{t.pub.backToMenu}</Link></div>
      </div>
    );
  }

  const flow: OrderStatus[] = o.type === "pickup" ? ["new", "preparing", "ready", "delivered"] : ["new", "preparing", "ready", "out_for_delivery", "delivered"];
  const status = o.status === "confirmed" ? "new" : o.status;
  const idx = flow.indexOf(status);
  const cancelled = o.status === "cancelled";
  const done = status === "delivered";
  const headline = cancelled ? t.pub.cancelled : status === "ready" && o.type === "pickup" ? t.pub.readyPickup : t.pub.steps[status as keyof typeof t.pub.steps];

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-bg px-5 pb-10">
      <header className="flex items-center gap-2 pt-[max(env(safe-area-inset-top),16px)]">
        <Link href={back} aria-label={t.pub.backToMenu} className="grid size-11 place-items-center rounded-full bg-overlay"><ChevronLeft className="size-5" /></Link>
        <span className="text-sm text-dim">{s.hotel.name}</span>
      </header>

      <section className="mt-6 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-dim">{t.pub.code}</p>
        <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="money mt-1 font-display text-5xl font-semibold text-flame">{o.code}</motion.p>
        <motion.p key={status} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 font-display text-2xl font-semibold">{headline}</motion.p>
        {!done && !cancelled && <p className="mt-1 text-sm text-dim">{t.pub.eta}</p>}
      </section>

      {!cancelled && (
        <ol className="mt-8 space-y-0">
          {flow.map((st, i) => {
            const Icon = ICON[st as keyof typeof ICON];
            const reached = i <= idx, current = i === idx;
            return (
              <li key={st} className="relative flex gap-4 pb-6 last:pb-0">
                {i < flow.length - 1 && <span className="absolute top-12 left-[23px] h-[calc(100%-48px)] w-0.5 overflow-hidden bg-line"><motion.span className="block w-full bg-sukuma" initial={{ height: 0 }} animate={{ height: i < idx ? "100%" : 0 }} transition={{ duration: 0.6 }} /></span>}
                <span className={cn("relative grid size-12 shrink-0 place-items-center rounded-full", reached ? "bg-sukuma text-white" : "bg-overlay text-dim")}>
                  {current && !done && <motion.span className="absolute inset-0 rounded-full border-2 border-sukuma" animate={{ scale: [1, 1.5], opacity: [0.8, 0] }} transition={{ duration: 1.4, repeat: Infinity }} />}
                  {reached && !current ? <Check className="size-5" strokeWidth={3} /> : <Icon className="size-5" />}
                </span>
                <span className="pt-3">
                  <span className={cn("block font-medium", !reached && "text-dim")}>{t.pub.steps[st as keyof typeof t.pub.steps]}</span>
                  {current && <span className="text-xs text-dim">{clockTime(o.updatedAt)}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <section className="mt-8 rounded-3xl border border-line bg-raised p-4">
        <ul className="space-y-1.5 text-sm">
          {o.items.map((it) => {
            const m = s.menu.find((x) => x.id === it.menuItemId);
            return <li key={it.menuItemId} className="flex justify-between"><span>{it.qty}× {m ? (s.lang === "sw" ? m.nameSw : m.name) : it.menuItemId}</span><span className="money">{formatKES(it.qty * it.unitPriceCents)}</span></li>;
          })}
        </ul>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", o.paymentStatus === "paid" ? "bg-sukuma/15 text-sukuma" : "bg-chai/15 text-chai")}>{o.paymentStatus === "paid" ? `M-Pesa · ${t.pub.paid}` : t.pub.unpaid}</span>
          <span className="money font-display text-xl font-semibold">{formatKES(o.totalCents)}</span>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <a href={`tel:+${s.hotel.phone}`} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-overlay font-medium"><Phone className="size-4" />{t.pub.call}</a>
        <Link href={back} className="flex h-14 items-center justify-center rounded-2xl bg-overlay font-medium">{t.pub.backToMenu}</Link>
      </div>
      {!done && !cancelled && (
        <button onClick={() => s.advanceOrder(o.id)} className="mt-6 w-full text-center text-xs text-dim underline underline-offset-4">{t.pub.demoAdvance}</button>
      )}
    </div>
  );
}