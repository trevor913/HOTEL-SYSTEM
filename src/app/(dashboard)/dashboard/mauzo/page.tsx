"use client";
import { AnimatePresence, motion } from "motion/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { Minus, NotebookPen, Smartphone, Banknote } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Segmented } from "@/components/ui/Segmented";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { useLang, useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { formatKES } from "@/lib/utils/money";
import { clockTime, dayLabel } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import type { MenuItem, Sale } from "@/lib/types";

export default function MauzoPage() {
  return <Suspense><Mauzo /></Suspense>;
}

function Mauzo() {
  const t = useT();
  const params = useSearchParams();
  const [tab, setTab] = useState<"pos" | "list">(params.get("tab") === "list" ? "list" : "pos");
  return (
    <div>
      <PageHeader title={t.mauzo.title} />
      <div className="px-5 pt-2 pb-3">
        <Segmented layoutId="mauzo-tab" value={tab} onChange={setTab} options={[{ value: "pos", label: t.mauzo.pos }, { value: "list", label: t.mauzo.list }]} />
      </div>
      {tab === "pos" ? <Pos /> : <SalesList />}
    </div>
  );
}

function Pos() {
  const t = useT();
  const lang = useLang();
  const menu = useApp((s) => s.menu);
  const customers = useApp((s) => s.customers);
  const logSale = useApp((s) => s.logSale);
  const toast = useToast((s) => s.show);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [method, setMethod] = useState<"cash" | "mpesa">("mpesa");
  const [pickDebt, setPickDebt] = useState(false);

  const items = menu.filter((m) => m.isAvailable);
  const lines = Object.entries(cart).filter(([, q]) => q > 0);
  const total = lines.reduce((a, [id, q]) => a + (menu.find((m) => m.id === id)?.priceCents ?? 0) * q, 0);
  const count = lines.reduce((a, [, q]) => a + q, 0);
  const add = (m: MenuItem) => { if ("vibrate" in navigator) navigator.vibrate(6); setCart((c) => ({ ...c, [m.id]: (c[m.id] ?? 0) + 1 })); };
  const dec = (id: string) => setCart((c) => ({ ...c, [id]: Math.max(0, (c[id] ?? 0) - 1) }));

  const commit = (m: "cash" | "mpesa" | "debt", customerId?: string) => {
    logSale({ items: lines.map(([menuItemId, qty]) => ({ menuItemId, qty })), method: m, customerId: customerId ?? null });
    toast(`${t.mauzo.logged} · ${formatKES(total)}`);
    setCart({}); setPickDebt(false);
  };

  return (
    <>
      <div className="grid grid-cols-3 gap-2 px-5 pb-44">
        {items.map((m) => {
          const q = cart[m.id] ?? 0;
          return (
            <motion.button key={m.id} whileTap={{ scale: 0.94 }} onClick={() => add(m)} disabled={m.soldOutToday}
              className={cn("relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-2xl border p-2.5 text-left", q ? "border-flame" : "border-line", m.soldOutToday && "opacity-40")}
              style={{ background: `linear-gradient(160deg, hsl(${m.hue} 45% 20% / .55), var(--bg-raised) 70%)` }}>
              <span className="text-3xl leading-none" aria-hidden>{m.emoji}</span>
              <span>
                <span className="block text-[13px] font-medium leading-tight">{m.name}</span>
                {lang === "sw" && m.nameSw !== m.name && <span className="block truncate text-[10px] text-dim">{m.nameSw}</span>}
                <span className="money text-xs text-dim">{m.priceCents / 100}/=</span>
              </span>
              <AnimatePresence>
                {q > 0 && (
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} key={q}
                    className="money absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-flame text-sm font-bold text-[var(--flame-ink)]">{q}</motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Running total bar, anchored above the tab bar (thumb zone) */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div initial={{ y: 120 }} animate={{ y: 0 }} exit={{ y: 120 }} transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="fixed inset-x-0 z-30 mx-auto max-w-lg px-3" style={{ bottom: "calc(var(--tab-h) + var(--safe-b) + 8px)" }}>
            <div className="rounded-3xl border border-line bg-overlay p-3 shadow-2xl">
              <div className="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
                {lines.map(([id, q]) => (
                  <button key={id} onClick={() => dec(id)} className="flex h-8 shrink-0 items-center gap-1 rounded-full bg-raised pr-3 pl-2 text-xs">
                    <Minus className="size-3 text-dim" /> {q}× {menu.find((m) => m.id === id)?.name}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setMethod((m) => (m === "cash" ? "mpesa" : "cash"))} aria-label={t.mauzo.method}
                  className="flex h-14 shrink-0 items-center gap-2 rounded-2xl bg-raised px-3 text-sm font-medium">
                  {method === "mpesa" ? <Smartphone className="size-4 text-sukuma" /> : <Banknote className="size-4 text-chai" />} {method === "mpesa" ? t.pay.mpesa : t.pay.cash}
                </button>
                <button onClick={() => setPickDebt(true)} aria-label={t.mauzo.onDebt} className="grid size-14 shrink-0 place-items-center rounded-2xl bg-raised"><NotebookPen className="size-5 text-nyanya" /></button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => commit(method)} className="flex h-14 flex-1 items-center justify-between rounded-2xl bg-flame px-4 font-display font-semibold text-[var(--flame-ink)]">
                  <span>{t.mauzo.logSale}</span><span className="money text-lg">{formatKES(total)}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomSheet open={pickDebt} onClose={() => setPickDebt(false)} title={`${t.mauzo.onDebt} · ${formatKES(total)}`}>
        <ul className="divide-y divide-line">
          {[...customers].sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt)).map((c) => (
            <li key={c.id}><button onClick={() => commit("debt", c.id)} className="flex h-16 w-full items-center gap-3 text-left"><Avatar name={c.name} size={40} /><span className="font-medium">{c.name}</span></button></li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}

function SalesList() {
  const t = useT();
  const lang = useLang();
  const sales = useApp((s) => s.sales);
  const menu = useApp((s) => s.menu);
  const [filter, setFilter] = useState<"all" | Sale["paymentMethod"]>("all");
  const [limit, setLimit] = useState(60);
  const groups = useMemo(() => {
    const sorted = [...sales].filter((s) => filter === "all" || s.paymentMethod === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
    const map = new Map<string, Sale[]>();
    for (const s of sorted) { const k = dayLabel(s.createdAt, lang); map.set(k, [...(map.get(k) ?? []), s]); }
    return [...map.entries()];
  }, [sales, filter, lang, limit]);
  const name = (id: string) => menu.find((m) => m.id === id)?.name ?? "";
  return (
    <div className="px-5">
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-3">
        {(["all", "mpesa", "cash", "debt"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("h-10 shrink-0 rounded-full px-4 text-sm", filter === f ? "bg-ink text-bg" : "border border-line text-dim")}>
            {f === "all" ? t.mauzo.filterAll : t.pay[f]}
          </button>
        ))}
      </div>
      {groups.map(([day, rows]) => (
        <section key={day} className="mb-5">
          <div className="sticky top-0 z-10 flex items-baseline justify-between bg-bg/95 py-2 backdrop-blur">
            <h3 className="font-display font-semibold">{day}</h3>
            <span className="money text-sm text-dim">{formatKES(rows.reduce((a, s) => a + s.totalCents, 0))} · {rows.length} {t.mauzo.sales}</span>
          </div>
          <ul className="divide-y divide-line">
            {rows.map((s) => (
              <li key={s.id} className="flex items-center gap-3 py-3">
                <span className="money w-11 text-xs text-dim">{clockTime(s.createdAt)}</span>
                <span className="min-w-0 flex-1 truncate text-[15px]">{s.items.map((i) => `${i.qty}× ${name(i.menuItemId)}`).join(", ")}</span>
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", s.paymentMethod === "mpesa" ? "bg-sukuma/15 text-sukuma" : s.paymentMethod === "debt" ? "bg-nyanya/15 text-nyanya" : "bg-chai/15 text-chai")}>{s.paymentMethod}</span>
                <span className="money w-16 text-right font-medium">{s.totalCents / 100}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <button onClick={() => setLimit((l) => l + 80)} className="mb-6 h-12 w-full rounded-2xl border border-line text-sm text-dim">+ {t.common.more}</button>
    </div>
  );
}
