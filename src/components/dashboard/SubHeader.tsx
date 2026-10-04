"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useT } from "@/lib/i18n";

/** Back-button header for secondary screens. */
export function SubHeader({ title, sub, back = "/dashboard/zaidi", right }: { title: string; sub?: string; back?: string; right?: ReactNode }) {
  const t = useT();
  return (
    <header className="flex items-center gap-2 px-5 pt-safe pb-2">
      <Link href={back} aria-label={t.common.back} className="mt-4 grid size-11 shrink-0 place-items-center rounded-full bg-overlay"><ChevronLeft className="size-5" /></Link>
      <div className="mt-4 min-w-0 flex-1">
        <h1 className="truncate font-display text-2xl font-semibold">{title}</h1>
        {sub && <p className="truncate text-xs text-dim">{sub}</p>}
      </div>
      {right && <div className="mt-4">{right}</div>}
    </header>
  );
}