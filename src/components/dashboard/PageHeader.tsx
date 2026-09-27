import type { ReactNode } from "react";

/** Headers carry information, not primary actions (thumb rule: actions live low). */
export function PageHeader({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-3 px-5 pt-safe pb-2">
      <div className="pt-4">
        {eyebrow && <p className="text-xs uppercase tracking-[0.16em] text-dim">{eyebrow}</p>}
        <h1 className="font-display text-[28px] font-semibold leading-tight">{title}</h1>
      </div>
      {right}
    </header>
  );
}
