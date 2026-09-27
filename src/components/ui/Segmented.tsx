"use client";
import { motion } from "motion/react";
import { cn } from "@/lib/utils/cn";

export function Segmented<T extends string>({ value, onChange, options, className, layoutId }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; tone?: "nyanya" }[]; className?: string; layoutId: string }) {
  return (
    <div className={cn("flex gap-1 rounded-2xl bg-overlay p-1", className)} role="tablist">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button key={o.value} role="tab" aria-selected={active} onClick={() => onChange(o.value)}
            className={cn("relative h-11 flex-1 rounded-xl px-3 text-sm font-medium transition-colors", active ? (o.tone === "nyanya" ? "text-nyanya" : "text-ink") : "text-dim")}>
            {active && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-xl bg-raised shadow-[0_1px_0_var(--border)]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
