import { cn } from "@/lib/utils/cn";

/** Wordmark: "Hotel" off-white + "System" flame tag, rising steam glyph (§9.2). */
export function Logo({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <span className={cn("inline-flex items-end gap-1.5 font-display font-semibold tracking-tight", className)} aria-label="Hotel System">
      <span className="relative">
        <svg className={cn("absolute -top-3 left-[0.55em] h-3.5 w-4 text-flame", animated && "steam")} viewBox="0 0 24 20" fill="none" aria-hidden>
          <path d="M5 18c-2-3 2-5 0-9s1-6 1-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12 18c-2-3 2-5 0-9s1-6 1-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M19 18c-2-3 2-5 0-9s1-6 1-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <span className="text-ink">Hotel</span>
      </span>
      <span className="rounded-md bg-flame px-1.5 py-0.5 text-[0.8em] leading-none text-[var(--flame-ink)]">System</span>
    </span>
  );
}
