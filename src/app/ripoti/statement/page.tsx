"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { ChevronLeft, Lock, Printer } from "lucide-react";
import { useT } from "@/lib/i18n";
import { useApp } from "@/lib/store/app-store";
import { useMounted } from "@/lib/utils/use-mounted";
import { buildReport, periodRange, ymd, type PeriodKind } from "@/lib/domain/reports";
import { formatPhone } from "@/lib/utils/phone";

const kes = (c: number) => (c / 100).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Printable A4 "Bank Statement" for SACCO / bank loan applications (§8.8). */
export default function StatementPage() {
  const mounted = useMounted();
  return mounted ? <Suspense><Statement /></Suspense> : null;
}

function Statement() {
  const t = useT();
  const q = useSearchParams();
  const s = useApp();
  const kind = (["leo", "wiki", "mwezi", "custom"].includes(q.get("p") ?? "") ? q.get("p") : "mwezi") as PeriodKind;
  const rep = useMemo(() => buildReport(s, periodRange(kind, new Date(), { from: q.get("from") ?? "", to: q.get("to") ?? "" }), { granularity: "day" }), [s, kind, q]);

  if (s.pinLock && s.locked) {
    return <div className="grid min-h-dvh place-items-center bg-bg p-8 text-center text-ink"><div><Lock className="mx-auto size-8 text-flame" /><p className="mt-3">{t.ops.enterPin}</p><Link href="/dashboard" className="mt-4 inline-block text-flame underline">{t.nav.home}</Link></div></div>;
  }

  const last = new Date(rep.range.end); last.setDate(last.getDate() - 1);
  const fmtDate = (d: Date) => d.toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" });
  const tt = rep.totals;
  const summary: [string, number, string?][] = [
    [t.rep.st.cash, tt.cashCents], [t.rep.st.mpesa, tt.mpesaCents], [t.rep.st.credit, tt.debtSalesCents],
    [t.rep.st.gross, tt.revenueCents, "font-semibold"], [t.rep.st.expenses, -tt.expensesCents], [t.rep.st.net, tt.profitCents, "font-semibold text-base"],
  ];
  const activeDays = rep.series.filter((b) => b.count > 0).length;

  return (
    <div className="min-h-dvh bg-[#e7e5e4] py-6 print:bg-white print:py-0">
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4">
        <Link href="/dashboard/ripoti" className="flex h-11 items-center gap-1 rounded-full bg-white px-4 text-sm text-[#1c1917]"><ChevronLeft className="size-4" />{t.rep.title}</Link>
        <button onClick={() => window.print()} className="flex h-11 items-center gap-2 rounded-full bg-[#E8590C] px-5 text-sm font-medium text-white"><Printer className="size-4" />{t.rep.print}</button>
      </div>

      <article className="print-doc mx-auto max-w-[210mm] bg-white px-[14mm] py-[14mm] text-[12px] leading-relaxed text-[#1c1917] shadow-xl print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between border-b-2 border-[#1c1917] pb-4">
          <div>
            <p className="font-display text-2xl font-semibold">{s.hotel.name}</p>
            <p>{s.hotel.locationText}</p>
            <p>{t.rep.st.owner}: {s.hotel.ownerName} · {formatPhone(s.hotel.phone)}</p>
            <p>M-Pesa Till: {s.hotel.tillNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold uppercase tracking-wide">{t.rep.st.title}</p>
            <p>{t.rep.st.period}: {fmtDate(rep.range.start)} – {fmtDate(last)}</p>
            <p>{t.rep.st.generated}: {fmtDate(new Date())}</p>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-2 gap-6">
          <table className="w-full">
            <tbody>
              {summary.map(([k, v, cls]) => <tr key={k} className={`border-b border-[#e7e5e4] ${cls ?? ""}`}><td className="py-1">{k}</td><td className="py-1 text-right tabular-nums">KES {kes(v)}</td></tr>)}
            </tbody>
          </table>
          <table className="w-full">
            <tbody>
              <tr className="border-b border-[#e7e5e4]"><td className="py-1">{t.rep.st.txns}</td><td className="py-1 text-right tabular-nums">{tt.count}</td></tr>
              <tr className="border-b border-[#e7e5e4]"><td className="py-1">{t.rep.st.activeDays}</td><td className="py-1 text-right tabular-nums">{activeDays} / {rep.range.days}</td></tr>
              <tr className="border-b border-[#e7e5e4]"><td className="py-1">{t.rep.st.avgDaily}</td><td className="py-1 text-right tabular-nums">KES {kes(Math.round(tt.revenueCents / Math.max(1, activeDays)))}</td></tr>
              <tr className="border-b border-[#e7e5e4]"><td className="py-1">{t.rep.st.recovered}</td><td className="py-1 text-right tabular-nums">KES {kes(tt.recoveredCents)}</td></tr>
            </tbody>
          </table>
        </section>

        <table className="mt-6 w-full border-collapse tabular-nums">
          <thead>
            <tr className="border-y-2 border-[#1c1917] text-left text-[11px] uppercase tracking-wide">
              <th className="py-1.5">{t.rep.st.date}</th><th className="text-right">{t.rep.st.txns}</th><th className="text-right">{t.rep.st.cash}</th><th className="text-right">M-Pesa</th><th className="text-right">{t.rep.st.credit}</th><th className="text-right">{t.rep.st.expenses}</th><th className="text-right">{t.rep.st.net}</th>
            </tr>
          </thead>
          <tbody>
            {rep.series.map((b) => (
              <tr key={b.date} className="border-b border-[#e7e5e4] break-inside-avoid">
                <td className="py-1">{fmtDate(new Date(`${b.date}T12:00:00`))}</td><td className="text-right">{b.count}</td><td className="text-right">{kes(b.cashCents)}</td><td className="text-right">{kes(b.mpesaCents)}</td><td className="text-right">{kes(b.debtSalesCents)}</td><td className="text-right">{kes(b.expensesCents)}</td>
                <td className={`text-right font-medium ${b.profitCents < 0 ? "text-[#b91c1c]" : ""}`}>{kes(b.profitCents)}</td>
              </tr>
            ))}
            <tr className="border-y-2 border-[#1c1917] font-semibold">
              <td className="py-1.5">{t.rep.total}</td><td className="text-right">{tt.count}</td><td className="text-right">{kes(tt.cashCents)}</td><td className="text-right">{kes(tt.mpesaCents)}</td><td className="text-right">{kes(tt.debtSalesCents)}</td><td className="text-right">{kes(tt.expensesCents)}</td><td className="text-right">{kes(tt.profitCents)}</td>
            </tr>
          </tbody>
        </table>

        <footer className="mt-10 grid grid-cols-2 gap-10 text-[11px] text-[#57534e]">
          <p>{t.rep.st.note} Ref: HS-{s.hotel.tillNumber}-{ymd(rep.range.start).replace(/-/g, "")}</p>
          <div className="text-right"><div className="ml-auto mt-8 w-48 border-t border-[#1c1917] pt-1">{t.rep.st.signature}</div></div>
        </footer>
      </article>
    </div>
  );
}