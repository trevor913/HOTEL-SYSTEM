"use client";
import { animate, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { formatKES } from "@/lib/utils/money";

/** Spring-rolled KES figure. Always tabular-nums (§9.3). */
export function AnimatedMoney({ cents, className, sign }: { cents: number; className?: string; sign?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) { el.textContent = formatKES(cents, { sign }); return; }
    const controls = animate(mv, cents, {
      type: "spring", stiffness: 60, damping: 18,
      onUpdate: (v) => { el.textContent = formatKES(Math.round(v / 100) * 100, { sign }); },
    });
    return () => controls.stop();
  }, [cents, mv, reduce, sign]);
  return <span ref={ref} className={`money ${className ?? ""}`}>{formatKES(0)}</span>;
}
