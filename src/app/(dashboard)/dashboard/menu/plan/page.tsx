"use client";
import { useMemo, useState } from "react";
import { Minus, Plus, TrendingUp } from "lucide-react";
import { SubHeader } from "@/components/dashboard/SubHeader";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { planHistory } from "@/lib/store/selectors";
import { moneyLeftOnTable, planTomorrow } from "@/lib/domain/planner";
import { formatKES } from "@/lib/utils/money";
import { clockTime } from "@/lib/utils/dates";
import { DishThumb } from "@/components/menu/DishThumb";

export default function PlanPage() {
  const t = useT();
  const s = useApp();
  const toast = useToast((x) => x.show);
  const [waste, setWaste] = useState<Record<string, number>>({});
  const { plan, left, leftTotal, max } = useMemo(() => {
    const hist = planHistory(s);
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const plan = planTomorrow(hist, tomorrow).filter((p) => s.menu.some((m) => m.id === p.itemId && m.isAvailable));
    const byItem = new Map<string, { cents: number; times: string[] }>();
    for (const r of hist) {
      if (r.daysAgo > 7 || !r.soldoutAt) continue;
      const m = s.menu.find((x) => x.id === r.itemId);
      if (!m) continue;
      const cur = byItem.get(r.itemId) ?? { cents: 0, times: [] };
      cur.cents += moneyLeftOnTable(r, m.priceCents); cur.times.push(r.soldoutAt);
      byItem.set(r.itemId, cur);
    }
    const left = [...byItem.entries()].map(([id, v]) => ({ m: s.menu.find((x) => x.id === id)!, ...v })).filter((x) => x.cents > 0).sort((a, b) => b.cents - a.cents);
    return { plan, left, leftTotal: left.reduce((a, x) => a + x.cents, 0), max: Math.max(1, ...plan.map((p) => p.suggestedQty)) };
  }, [s]);

  const logAll = () => {
    const entries = Object.entries(waste).filter(([, q]) => q > 0);
    entries.forEach(([id, q]) => s.logWaste(id, q));
    setWaste({});
    if (entries.length) toast(`${t.ops.wasteLogged} ✓`);
  };

  return (
    <div className="pb-tabs">
      <SubHeader title={t.ops.plan} sub={t.ops.planIntro} back="/dashboard/menu" />

      {leftTotal > 0 && (
        <section className="mx-5 mt-3 rounded-3xl border border-chai/40 bg-[color-mix(in_oklab,var(--chai)_10%,transparent)] p-4">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-chai"><TrendingUp className="size-3.5" />{t.ops.leftOnTable}</p>
          <p className="money mt-1 font-display text-3xl font-semibold">{formatKES(leftTotal)}</p>
          <p className="text-xs text-dim">{t.ops.leftBody}</p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {left.slice(0, 4).map((x) => (
              <li key={x.m.id} className="flex justify-between gap-2"><span className="truncate">{x.m.emoji} {x.m.nameSw} <span className="text-xs text-dim">· {t.ops.soldOutAt} {x.times.slice(0, 3).map(clockTime).join(", ")}</span></span><span className="money shrink-0 text-chai">{formatKES(x.cents)}</span></li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-5 px-5">
        <h2 className="font-display text-lg font-semibold">{t.ops.cook} · {t.ops.plates}</h2>
        {plan.length === 0 ? <p className="py-8 text-center text-sm text-dim">{t.ops.noHistory}</p> : (
          <ul className="mt-2 space-y-2">
            {plan.map((p) => {
              const m = s.menu.find((x) => x.id === p.itemId)!;
              return (
                <li key={p.itemId} className="flex items-center gap-3 rounded-2xl border border-line bg-raised p-3">
                  <DishThumb m={m} size={44} />
                  <span className="min-w-0 flex-1">
                    <span className="flex justify-between"><span className="truncate font-medium">{m.nameSw}</span><span className="money font-display text-xl font-semibold">{p.suggestedQty}</span></span>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-overlay"><span className="block h-full rounded-full bg-flame" style={{ width: `${(p.suggestedQty / max) * 100}%` }} /></span>
                    <span className="mt-1 block text-xs text-dim">{p.basis}{p.lostSalesQty > 0 ? ` · ~${p.lostSalesQty} ${t.ops.lostSales}` : ""}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-7 px-5 pb-6">
        <h2 className="font-display text-lg font-semibold">{t.ops.wasteTitle}</h2>
        <p className="text-xs text-dim">{t.ops.wasteBody}</p>
        <ul className="mt-2 divide-y divide-line rounded-3xl border border-line bg-raised">
          {s.menu.filter((m) => m.isAvailable && m.category !== "drink").map((m) => {
            const q = waste[m.id] ?? 0;
            return (
              <li key={m.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1 truncate text-sm">{m.emoji} {m.nameSw}</span>
                <button onClick={() => setWaste({ ...waste, [m.id]: Math.max(0, q - 1) })} aria-label="−" className="grid size-11 place-items-center rounded-full bg-overlay"><Minus className="size-4" /></button>
                <span className="money w-6 text-center font-semibold">{q}</span>
                <button onClick={() => setWaste({ ...waste, [m.id]: q + 1 })} aria-label="+" className="grid size-11 place-items-center rounded-full bg-overlay"><Plus className="size-4" /></button>
              </li>
            );
          })}
        </ul>
        <button onClick={logAll} disabled={!Object.values(waste).some((q) => q > 0)} className="mt-3 h-14 w-full rounded-2xl bg-flame font-display text-lg font-semibold text-[var(--flame-ink)] disabled:opacity-40">{t.ops.logWaste}</button>
      </section>
    </div>
  );
}