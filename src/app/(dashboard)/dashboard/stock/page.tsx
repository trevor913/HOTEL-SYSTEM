"use client";
import { motion } from "motion/react";
import { useState } from "react";
import { Minus, Plus, SlidersHorizontal } from "lucide-react";
import { SubHeader } from "@/components/dashboard/SubHeader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { formatKES } from "@/lib/utils/money";
import { timeAgo } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { Field } from "@/components/ui/Field";
import type { InventoryItem } from "@/lib/types";

const STEP: Record<InventoryItem["unit"], number> = { kg: 1, ltr: 0.5, pcs: 1, sack: 1, cylinder: 1 };

export default function StockPage() {
  const t = useT();
  const s = useApp();
  const toast = useToast((x) => x.show);
  const [edit, setEdit] = useState<{ id: string; low: string; max: string } | null>(null);
  const low = s.inventory.filter((i) => i.currentQty <= i.lowThreshold);
  const sorted = [...s.inventory].sort((a, b) => a.currentQty / a.maxQty - b.currentQty / b.maxQty);
  const restockCost = low.reduce((a, i) => a + Math.max(0, i.maxQty - i.currentQty) * i.lastPriceCents, 0);
  const editing = edit ? s.inventory.find((i) => i.id === edit.id) : undefined;

  return (
    <div className="pb-tabs">
      <SubHeader title={t.ops.stock} sub={low.length ? `${low.length} ${t.ops.lowCount} · ~${formatKES(Math.round(restockCost), { compact: true })}` : t.ops.stockBody} />
      <ul className="mt-3 grid gap-3 px-5 sm:grid-cols-2">
        {sorted.map((i) => {
          const pct = Math.min(100, (i.currentQty / i.maxQty) * 100);
          const isLow = i.currentQty <= i.lowThreshold;
          return (
            <li key={i.id} className={cn("rounded-3xl border bg-raised p-4", isLow ? "border-nyanya/50" : "border-line")}>
              <div className="flex items-start justify-between gap-2">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{i.name}</span>
                  <span className="text-xs text-dim">{formatKES(i.lastPriceCents)}/{i.unit}{isLow && <span className="ml-1.5 text-nyanya">· {t.ops.low}</span>}</span>
                </span>
                <button onClick={() => setEdit({ id: i.id, low: String(i.lowThreshold), max: String(i.maxQty) })} aria-label={t.ops.levels} className="grid size-9 place-items-center rounded-full bg-overlay"><SlidersHorizontal className="size-4 text-dim" /></button>
              </div>
              <div className="relative mt-3 h-3 overflow-hidden rounded-full bg-overlay">
                <motion.div className={cn("h-full rounded-full", isLow ? "bg-nyanya" : pct < 50 ? "bg-chai" : "bg-sukuma")} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                <span className="absolute top-0 h-full w-0.5 bg-ink/40" style={{ left: `${(i.lowThreshold / i.maxQty) * 100}%` }} />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => s.updateStock({ itemId: i.id, qty: STEP[i.unit], mode: "subtract" })} aria-label="−" className="grid size-12 place-items-center rounded-2xl bg-overlay"><Minus className="size-5" /></button>
                <span className="money flex-1 text-center font-display text-2xl font-semibold">{i.currentQty}<span className="ml-1 text-sm font-normal text-dim">{i.unit}</span></span>
                <button onClick={() => s.updateStock({ itemId: i.id, qty: STEP[i.unit], mode: "add" })} aria-label="+" className="grid size-12 place-items-center rounded-2xl bg-overlay"><Plus className="size-5" /></button>
              </div>
            </li>
          );
        })}
      </ul>

      {s.stockMoves.length > 0 && (
        <section className="mt-6 px-5 pb-6">
          <h2 className="text-xs uppercase tracking-[0.16em] text-dim">{t.ops.moves}</h2>
          <ul className="mt-2 divide-y divide-line">
            {s.stockMoves.slice(0, 10).map((m) => {
              const i = s.inventory.find((x) => x.id === m.itemId);
              return <li key={m.id} className="flex justify-between py-2 text-sm"><span>{i?.name} <span className="text-xs text-dim">· {timeAgo(m.createdAt, s.lang)}</span></span><span className={cn("money", m.delta > 0 ? "text-sukuma" : "text-nyanya")}>{m.delta > 0 ? "+" : ""}{m.delta} {i?.unit}</span></li>;
            })}
          </ul>
        </section>
      )}

      <BottomSheet open={!!edit} onClose={() => setEdit(null)} title={editing?.name ?? t.ops.levels} footer={
        <div className="flex gap-2">
          <button onClick={() => { if (editing) { s.updateStock({ itemId: editing.id, qty: editing.maxQty, mode: "set", reason: "purchase" }); toast(t.ops.saved); setEdit(null); } }} className="h-14 flex-1 rounded-2xl bg-overlay font-medium">{t.ops.restock}</button>
          <button onClick={() => { if (edit) { s.setStockLevels(edit.id, { lowThreshold: Number(edit.low) || 0, maxQty: Number(edit.max) || 1 }); toast(t.ops.saved); setEdit(null); } }} className="h-14 flex-1 rounded-2xl bg-flame font-display font-semibold text-[var(--flame-ink)]">{t.ops.save}</button>
        </div>
      }>
        {edit && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t.ops.threshold} (${editing?.unit})`}><input value={edit.low} inputMode="decimal" onChange={(e) => setEdit({ ...edit, low: e.target.value.replace(/[^\d.]/g, "") })} className="input money" /></Field>
            <Field label={`${t.ops.maxQty} (${editing?.unit})`}><input value={edit.max} inputMode="decimal" onChange={(e) => setEdit({ ...edit, max: e.target.value.replace(/[^\d.]/g, "") })} className="input money" /></Field>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}