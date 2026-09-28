"use client";
import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { AmountDisplay, Keypad } from "@/components/ui/Keypad";
import { useToast } from "@/components/ui/Toast";
import { useLang, useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { priceSeries } from "@/lib/store/selectors";
import { formatKES, pctChange } from "@/lib/utils/money";
import { businessDayStart, clockTime, dayLabel } from "@/lib/utils/dates";
import type { ExpenseCategory } from "@/lib/types";

const CHIPS: { label: string; match: string; category: ExpenseCategory; quick: number[] }[] = [
  { label: "Nyama", match: "nyama", category: "soko", quick: [1500, 2000, 2500] },
  { label: "Sukuma", match: "sukuma", category: "soko", quick: [200, 300, 500] },
  { label: "Nyanya", match: "nyanya", category: "soko", quick: [150, 250, 400] },
  { label: "Unga", match: "unga", category: "soko", quick: [700, 1400, 2100] },
  { label: "Mafuta", match: "mafuta", category: "soko", quick: [580, 1160, 2900] },
  { label: "Gas", match: "gas", category: "gas", quick: [3200] },
  { label: "Makaa", match: "makaa", category: "charcoal", quick: [250, 300, 1400] },
  { label: "Maziwa", match: "maziwa", category: "soko", quick: [480, 600, 720] },
  { label: "Samaki", match: "samaki", category: "soko", quick: [2800, 3200, 3600] },
  { label: "Boda", match: "boda", category: "transport", quick: [100, 150, 200] },
];

const CAT_COLORS: Record<ExpenseCategory, string> = { soko: "var(--flame)", gas: "var(--chai)", charcoal: "#8a7a6b", rent: "var(--nyanya)", wages: "var(--sukuma)", transport: "var(--ugali)", license: "#6b8fa3", equipment: "#a36b8f", other: "var(--text-dim)" };

export default function MatumiziPage() {
  const t = useT();
  const lang = useLang();
  const expenses = useApp((s) => s.expenses);
  const logExpense = useApp((s) => s.logExpense);
  const toast = useToast((s) => s.show);
  const [chip, setChip] = useState<(typeof CHIPS)[number] | null>(null);
  const [amount, setAmount] = useState("");

  const weekStart = businessDayStart(new Date(), 6).getTime();
  const week = useMemo(() => expenses.filter((e) => new Date(e.createdAt).getTime() >= weekStart), [expenses, weekStart]);
  const weekTotal = week.reduce((a, e) => a + e.amountCents, 0);
  const todayTotal = expenses.filter((e) => new Date(e.createdAt).getTime() >= businessDayStart().getTime()).reduce((a, e) => a + e.amountCents, 0);
  const byCat = useMemo(() => {
    const m = new Map<ExpenseCategory, number>();
    for (const e of week) m.set(e.category, (m.get(e.category) ?? 0) + e.amountCents);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [week]);
  const recent = [...expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 25);

  const save = () => {
    if (!chip || !Number(amount)) return;
    logExpense({ category: chip.category, description: chip.label, amountCents: Number(amount) * 100 });
    toast(`${chip.label} · KSh ${Number(amount).toLocaleString("en-KE")} ${t.matumizi.logged}`);
    setChip(null); setAmount("");
  };

  return (
    <div>
      <PageHeader title={t.matumizi.title} eyebrow={`${lang === "sw" ? "Leo" : "Today"} · ${formatKES(todayTotal)}`} />

      <section className="px-5 pt-3">
        <h2 className="font-display text-lg font-semibold">{t.matumizi.soko}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {CHIPS.map((c) => {
            const series = priceSeries(expenses, c.match, 14);
            const recentWeek = series.slice(7).reduce((a, b) => a + b, 0);
            const prevWeek = series.slice(0, 7).reduce((a, b) => a + b, 0);
            const pct = pctChange(recentWeek, prevWeek);
            return (
              <motion.button key={c.label} whileTap={{ scale: 0.96 }} onClick={() => setChip(c)} className="flex h-[76px] flex-col justify-between rounded-2xl border border-line bg-raised p-3 text-left">
                <span className="flex w-full items-center justify-between">
                  <span className="font-medium">{c.label}</span>
                  {pct !== null && Math.abs(pct) >= 1 && (
                    <span className={`money flex items-center gap-0.5 text-[11px] ${pct > 0 ? "text-nyanya" : "text-sukuma"}`}>
                      {pct > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}{Math.abs(pct)}%
                    </span>
                  )}
                </span>
                <Sparkline values={series} />
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="mx-5 mt-6 flex items-center gap-5 rounded-3xl border border-line bg-raised p-4">
        <Donut data={byCat.map(([k, v]) => ({ key: k, value: v, color: CAT_COLORS[k] }))} />
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.14em] text-dim">{t.matumizi.byCategory} · {t.matumizi.thisWeek}</p>
          <p className="money mt-1 font-display text-2xl font-semibold">{formatKES(weekTotal)}</p>
          <ul className="mt-2 space-y-1 text-sm">
            {byCat.slice(0, 4).map(([k, v]) => (
              <li key={k} className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: CAT_COLORS[k] }} /><span className="flex-1 capitalize text-dim">{k}</span><span className="money">{formatKES(v, { compact: true })}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-6 px-5">
        <h2 className="font-display text-lg font-semibold">{t.matumizi.recent}</h2>
        <ul className="mt-2 divide-y divide-line">
          {recent.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-3">
              <span className="size-2 rounded-full" style={{ background: CAT_COLORS[e.category] }} />
              <span className="flex-1"><span className="block text-[15px]">{e.description}</span><span className="text-xs text-dim">{dayLabel(e.createdAt, lang)} · {clockTime(e.createdAt)}</span></span>
              <span className="money font-medium text-nyanya">−{formatKES(e.amountCents).replace("KSh ", "")}</span>
            </li>
          ))}
        </ul>
      </section>

      <BottomSheet open={!!chip} onClose={() => { setChip(null); setAmount(""); }} title={chip?.label}
        footer={<motion.button whileTap={{ scale: 0.97 }} disabled={!Number(amount)} onClick={save} className="h-14 w-full rounded-2xl bg-flame font-display text-lg font-semibold text-[var(--flame-ink)] disabled:opacity-40">{t.matumizi.add}</motion.button>}>
        <AmountDisplay value={amount} tone="nyanya" />
        <div className="mb-3 flex gap-2">
          {chip?.quick.map((v) => <button key={v} onClick={() => setAmount(String(v))} className="money h-10 flex-1 rounded-full border border-line text-sm">{v.toLocaleString("en-KE")}</button>)}
        </div>
        <Keypad value={amount} onChange={setAmount} />
      </BottomSheet>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${22 - (v / max) * 20}`).join(" ");
  return (
    <svg viewBox="0 0 100 24" preserveAspectRatio="none" className="h-5 w-full" aria-hidden>
      <polyline points={pts} fill="none" stroke="var(--chai)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

function Donut({ data }: { data: { key: string; value: number; color: string }[] }) {
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const R = 36, C = 2 * Math.PI * R;
  const offsets = data.reduce<number[]>((acc, d, i) => [...acc, (acc[i - 1] ?? 0) + (i === 0 ? 0 : ((data[i - 1]?.value ?? 0) / total) * C)], []);
  return (
    <svg viewBox="0 0 100 100" className="size-28 shrink-0 -rotate-90" aria-hidden>
      <circle cx="50" cy="50" r={R} fill="none" stroke="var(--border)" strokeWidth="14" />
      {data.map((d, i) => {
        const len = (d.value / total) * C;
        return <motion.circle key={d.key} cx="50" cy="50" r={R} fill="none" stroke={d.color} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: -(offsets[i] ?? 0) }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} />;
      })}
    </svg>
  );
}
