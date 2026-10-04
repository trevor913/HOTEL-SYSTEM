"use client";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { SubHeader } from "@/components/dashboard/SubHeader";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { staffSales, wageSummary } from "@/lib/store/selectors";
import { formatKES } from "@/lib/utils/money";
import { cn } from "@/lib/utils/cn";

export default function StaffPage() {
  const t = useT();
  const s = useApp();
  const toast = useToast((x) => x.show);
  const rows = useMemo(() => s.staff.map((st) => ({ st, w: wageSummary(s, st.id), sales: staffSales(s, st.id) })), [s]);
  const due = rows.reduce((a, r) => a + r.w.dueCents, 0);

  return (
    <div className="pb-tabs">
      <SubHeader title={t.ops.staff} sub={due ? `${t.ops.wageDue}: ${formatKES(due)}` : t.ops.staffBody} />
      <ul className="mt-3 space-y-3 px-5 pb-6">
        {rows.map(({ st, w, sales }) => (
          <li key={st.id} className="rounded-3xl border border-line bg-raised p-4">
            <div className="flex items-center gap-3">
              <Avatar name={st.name} size={48} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{st.name}{s.activeStaffId === st.id && <span className="ml-2 rounded-full bg-overlay px-2 py-0.5 text-[10px] text-flame">●</span>}</span>
                <span className="text-xs text-dim">{st.role === "owner" ? t.ops.owner : `${t.ops.worker} · ${formatKES(st.dailyWageCents)} ${t.ops.perDay}`}</span>
              </span>
              <span className="text-right"><span className="money block font-display text-lg font-semibold">{formatKES(sales.cents, { compact: true })}</span><span className="text-[11px] text-dim">{t.ops.salesWeek} · {sales.count}</span></span>
            </div>

            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-dim">{t.ops.shifts}</p>
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {w.dates.map((d) => {
                const dow = new Date(`${d.date}T12:00:00`).getDay();
                return (
                  <button key={d.date} onClick={() => s.toggleShift(d.date, st.id)} aria-pressed={d.present} aria-label={`${d.date} ${d.present ? t.ops.present : t.ops.absent}`}
                    className={cn("flex h-14 flex-col items-center justify-center gap-0.5 rounded-xl text-[11px]", d.present ? "bg-[color-mix(in_oklab,var(--sukuma)_20%,transparent)] text-sukuma" : "bg-overlay text-dim")}>
                    <span>{t.ops.weekdays[dow]}</span>
                    {d.present ? <Check className="size-4" /> : <span className="size-4" />}
                  </button>
                );
              })}
            </div>

            {st.role !== "owner" && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-overlay p-3">
                <span className="text-sm"><span className="block text-xs text-dim">{t.ops.wageDue} · {w.days} {t.ops.days}</span><span className={cn("money font-display text-xl font-semibold", w.dueCents ? "text-chai" : "text-dim")}>{formatKES(w.dueCents)}</span></span>
                <button disabled={!w.dueCents} onClick={() => { s.payWages(st.id, w.dueCents); toast(`${t.ops.wagePaid}: ${st.name} ✓`); }}
                  className="h-12 rounded-2xl bg-flame px-5 font-medium text-[var(--flame-ink)] disabled:opacity-40">{t.ops.payWage}</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}