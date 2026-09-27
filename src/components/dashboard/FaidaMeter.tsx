"use client";
import { motion, useReducedMotion } from "motion/react";
import { formatKES } from "@/lib/utils/money";
import { steam } from "@/lib/motion";

/** Radial gauge: today's profit vs 7-day average (§8.1). The chai tick marks 100% of average. */
export function FaidaMeter({ profitCents, avgCents, label, caption }: { profitCents: number; avgCents: number; label: string; caption: string }) {
  const reduce = useReducedMotion();
  const ratio = avgCents > 0 ? Math.max(0, Math.min(1.5, profitCents / avgCents)) : profitCents > 0 ? 1 : 0;
  const pct = Math.round((avgCents > 0 ? profitCents / avgCents : 0) * 100);
  const R = 70, C = Math.PI * R;
  const fill = (ratio / 1.5) * C;
  const tone = profitCents < 0 ? "var(--nyanya)" : ratio >= 1 ? "var(--sukuma)" : "var(--flame)";
  const avgAngle = Math.PI * (1 - 1 / 1.5);
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 170 100" className="w-40 shrink-0" role="img" aria-label={`${label}: ${pct}%`}>
        <path d="M15 90 A70 70 0 0 1 155 90" fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
        <motion.path d="M15 90 A70 70 0 0 1 155 90" fill="none" stroke={tone} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C - fill }} transition={{ duration: reduce ? 0 : 1.2, ease: steam }} />
        <line x1={85 + Math.cos(avgAngle) * 58} y1={90 - Math.sin(avgAngle) * 58} x2={85 + Math.cos(avgAngle) * 82} y2={90 - Math.sin(avgAngle) * 82} stroke="var(--chai)" strokeWidth="2" />
        <text x="85" y="82" textAnchor="middle" className="money font-display" fontSize="26" fontWeight="600" fill="var(--text)">{pct}%</text>
      </svg>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.14em] text-dim">{label}</p>
        <p className="money mt-1 text-sm text-dim">{caption}</p>
        <p className="money mt-0.5 font-display text-lg" style={{ color: "var(--chai)" }}>{formatKES(avgCents)}</p>
      </div>
    </div>
  );
}
