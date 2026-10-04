"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Download, FileText } from "lucide-react";
import { SubHeader } from "@/components/dashboard/SubHeader";
import { Segmented } from "@/components/ui/Segmented";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { buildReport, delta, periodRange, previousRange, salesCsv, ymd, type Bucket, type PeriodKind } from "@/lib/domain/reports";
import { formatKES } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

const C = { flame: "var(--flame)", sukuma: "var(--sukuma)", nyanya: "var(--nyanya)", chai: "var(--chai)", ugali: "var(--ugali)", dim: "var(--text-dim)", line: "var(--border)" };
const PAY_COLOR = { cash: C.chai, mpesa: C.sukuma, debt: C.nyanya, split: C.ugali } as const;
const compact = (v: number) => formatKES(v, { compact: true });
const axis = { fill: C.dim, fontSize: 11 };

type TipProps = { active?: boolean; label?: string | number; payload?: { name?: string; value?: number; color?: string }[]; labelFmt?: (l: string | number) => string };
function Tip({ active, payload, label, labelFmt }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-overlay px-3 py-2 text-xs shadow-xl">
      <p className="mb-1 text-dim">{labelFmt && label !== undefined ? labelFmt(label) : label}</p>
      {payload.map((p) => <p key={p.name} className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: p.color }} />{p.name}<span className="money ml-auto pl-3 font-semibold">{formatKES(p.value ?? 0)}</span></p>)}
    </div>
  );
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return <section className={cn("rounded-3xl border border-line bg-raised p-4", className)}><h2 className="mb-3 font-display text-base font-semibold">{title}</h2>{children}</section>;
}

export default function RipotiPage() {
  const t = useT();
  const s = useApp();
  const toast = useToast((x) => x.show);
  const [period, setPeriod] = useState<PeriodKind>("wiki");
  const [custom, setCustom] = useState(() => { const d = new Date(); const a = new Date(d); a.setDate(a.getDate() - 13); return { from: ymd(a), to: ymd(d) }; });

  const { rep, prev } = useMemo(() => {
    const r = periodRange(period, new Date(), custom);
    return { rep: buildReport(s, r), prev: buildReport(s, previousRange(r)).totals };
  }, [s, period, custom]);

  const label = (b: Bucket) => b.hour !== null ? `${String(b.hour).padStart(2, "0")}` : rep.range.days <= 7 ? t.ops.weekdays[b.dow]! : `${Number(b.date.slice(8))}/${Number(b.date.slice(5, 7))}`;
  const data = rep.series.map((b) => ({ ...b, label: label(b) }));
  const kpis = [
    { k: t.rep.revenue, v: rep.totals.revenueCents, p: prev.revenueCents, good: true },
    { k: t.rep.expenses, v: rep.totals.expensesCents, p: prev.expensesCents, good: false },
    { k: t.rep.profit, v: rep.totals.profitCents, p: prev.profitCents, good: true },
    { k: t.rep.newDebts, v: rep.totals.newDebtCents, p: prev.newDebtCents, good: false },
  ];
  const maxHour = Math.max(1, ...rep.hours);
  const maxBest = Math.max(1, ...rep.best.map((b) => b.cents));
  const payTotal = rep.payMix.reduce((a, x) => a + x.cents, 0);
  const qs = `p=${period}&from=${custom.from}&to=${custom.to}`;

  const exportCsv = () => {
    const csv = "\uFEFF" + salesCsv(s, rep.range);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const last = new Date(rep.range.end); last.setDate(last.getDate() - 1);
    a.download = `mauzo-${ymd(rep.range.start)}_${ymd(last)}.csv`;
    a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast(`${t.rep.csvDone} ✓`);
  };

  return (
    <div className="pb-tabs">
      <SubHeader title={t.rep.title} sub={`${rep.totals.count} ${t.rep.salesCount}`} right={
        <button onClick={exportCsv} className="flex h-11 items-center gap-1.5 rounded-full bg-overlay px-4 text-sm"><Download className="size-4 text-chai" />CSV</button>
      } />
      <div className="px-5">
        <Segmented layoutId="rep-period" value={period} onChange={setPeriod} options={[{ value: "leo", label: t.rep.today }, { value: "wiki", label: t.rep.week }, { value: "mwezi", label: t.rep.month }, { value: "custom", label: t.rep.custom }]} />
        {period === "custom" && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <label className="text-xs text-dim">{t.rep.from}<input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="input mt-1 money" /></label>
            <label className="text-xs text-dim">{t.rep.to}<input type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="input mt-1 money" /></label>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 px-5 lg:grid-cols-4">
        {kpis.map((x) => {
          const d = delta(x.v, x.p);
          const up = (d ?? 0) >= 0;
          const ok = x.good ? up : !up;
          return (
            <div key={x.k} className="rounded-3xl border border-line bg-raised p-4">
              <p className="text-xs text-dim">{x.k}</p>
              <p className={cn("money mt-1 font-display text-2xl font-semibold", x.k === t.rep.profit && (x.v >= 0 ? "text-sukuma" : "text-nyanya"))}>{compact(x.v)}</p>
              {d !== null && <p className={cn("mt-1 flex items-center gap-0.5 text-xs", ok ? "text-sukuma" : "text-nyanya")}>{up ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}{Math.abs(d)}% <span className="text-dim">{t.rep.vsPrev}</span></p>}
            </div>
          );
        })}
      </div>

      <div className="mt-3 grid gap-3 px-5 lg:grid-cols-2">
        <Card title={t.rep.revVsExp} className="lg:col-span-2">
          <div className="h-52">
            <ResponsiveContainer>
              <AreaChart data={data} margin={{ left: -8, right: 4, top: 4 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.flame} stopOpacity={0.45} /><stop offset="100%" stopColor={C.flame} stopOpacity={0} /></linearGradient>
                  <linearGradient id="gExp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.chai} stopOpacity={0.3} /><stop offset="100%" stopColor={C.chai} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
                <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={compact} width={56} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="revenueCents" name={t.rep.revenue} stroke={C.flame} strokeWidth={2.5} fill="url(#gRev)" />
                <Area type="monotone" dataKey="expensesCents" name={t.rep.expenses} stroke={C.chai} strokeWidth={2} fill="url(#gExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t.rep.profitBars}>
          <div className="h-44">
            <ResponsiveContainer>
              <BarChart data={data} margin={{ left: -8, right: 4, top: 4 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
                <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={compact} width={56} />
                <Tooltip content={<Tip />} cursor={{ fill: "var(--bg-overlay)" }} />
                <Bar dataKey="profitCents" name={t.rep.profit} radius={[6, 6, 0, 0]}>
                  {data.map((d) => <Cell key={d.key} fill={d.profitCents >= 0 ? C.sukuma : C.nyanya} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title={t.rep.payMix}>
          {payTotal === 0 ? <p className="py-10 text-center text-sm text-dim">{t.rep.empty}</p> : (
            <div className="flex items-center gap-4">
              <div className="relative size-40 shrink-0">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={rep.payMix} dataKey="cents" nameKey="method" innerRadius={50} outerRadius={74} paddingAngle={2} stroke="none">
                      {rep.payMix.map((p) => <Cell key={p.method} fill={PAY_COLOR[p.method]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <span className="pointer-events-none absolute inset-0 grid place-items-center text-center"><span><span className="money block font-display text-lg font-semibold">{compact(payTotal)}</span><span className="text-[10px] text-dim">{t.rep.total}</span></span></span>
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                {rep.payMix.map((p) => (
                  <li key={p.method} className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: PAY_COLOR[p.method] }} /><span className="flex-1">{t.rep.methods[p.method]}</span><span className="money text-dim">{Math.round((p.cents / payTotal) * 100)}%</span></li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card title={t.rep.hours}>
          <div className="grid grid-cols-[repeat(17,minmax(0,1fr))] gap-1">
            {rep.hours.slice(5, 22).map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="h-12 w-full rounded-md" title={`${i + 5}:00 · ${formatKES(c)}`} style={{ background: `color-mix(in oklab, var(--flame) ${Math.round(8 + (c / maxHour) * 92)}%, var(--bg-overlay))` }} />
                {(i + 5) % 3 === 0 && <span className="text-[10px] text-dim">{i + 5}</span>}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-dim">{t.rep.hoursBody}</p>
        </Card>

        <Card title={t.rep.best}>
          {rep.best.length === 0 ? <p className="py-6 text-center text-sm text-dim">{t.rep.empty}</p> : (
            <ul className="space-y-2.5">
              {rep.best.map((b, i) => (
                <li key={b.itemId}>
                  <div className="flex justify-between text-sm"><span className="truncate">{i + 1}. {b.emoji} {b.name} <span className="text-xs text-dim">× {b.qty}</span></span><span className="money shrink-0">{compact(b.cents)}</span></div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-overlay"><div className="h-full rounded-full bg-flame" style={{ width: `${(b.cents / maxBest) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title={t.rep.topCustomers}>
          {rep.topCustomers.length === 0 ? <p className="py-6 text-center text-sm text-dim">{t.rep.empty}</p> : (
            <ul className="divide-y divide-line">
              {rep.topCustomers.map((c) => <li key={c.customerId} className="flex justify-between py-2 text-sm"><span>{c.name} <span className="text-xs text-dim">· {c.visits} {t.rep.visits}</span></span><span className="money">{formatKES(c.cents)}</span></li>)}
            </ul>
          )}
        </Card>

        <Card title={t.rep.recovery} className="lg:col-span-2">
          <p className="-mt-2 mb-2 text-xs text-dim">{t.rep.recoveryBody}: <span className="money text-sukuma">{formatKES(rep.totals.recoveredCents)}</span> / <span className="money text-nyanya">{formatKES(rep.totals.newDebtCents)}</span></p>
          <div className="h-44">
            <ResponsiveContainer>
              <ComposedChart data={data} margin={{ left: -8, right: 4, top: 4 }}>
                <CartesianGrid stroke={C.line} vertical={false} />
                <XAxis dataKey="label" tick={axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={12} />
                <YAxis tick={axis} tickLine={false} axisLine={false} tickFormatter={compact} width={56} />
                <Tooltip content={<Tip />} cursor={{ fill: "var(--bg-overlay)" }} />
                <Bar dataKey="newDebtCents" name={t.rep.newDebts} fill={C.nyanya} radius={[5, 5, 0, 0]} opacity={0.75} />
                <Line type="monotone" dataKey="recoveredCents" name={t.rep.recovered} stroke={C.sukuma} strokeWidth={2.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mx-5 mt-4 mb-6">
        <Link href={`/ripoti/statement?${qs}`} className="flex min-h-16 items-center gap-3 rounded-3xl border border-line bg-raised px-4">
          <FileText className="size-6 text-chai" />
          <span className="flex-1"><span className="block font-medium">{t.rep.statement}</span><span className="text-xs text-dim">{t.rep.statementBody}</span></span>
        </Link>
      </div>
    </div>
  );
}