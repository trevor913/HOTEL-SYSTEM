import { cn } from "@/lib/utils/cn";

/** Initials avatar with a warm colour hash (§8.2). */
const WARM = ["#FF6B2C", "#C99A5B", "#E9A23B", "#D9674A", "#B8744A", "#8F9B3E", "#3E9B4F", "#C75B7A"];
export function hashHue(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return WARM[h % WARM.length]!; }

export function Avatar({ name, size = 44, className }: { name: string; size?: number; className?: string }) {
  const initials = name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const c = hashHue(name);
  return (
    <span
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-display font-semibold", className)}
      style={{ width: size, height: size, fontSize: size * 0.38, background: `color-mix(in oklab, ${c} 22%, transparent)`, color: c, boxShadow: `inset 0 0 0 1.5px color-mix(in oklab, ${c} 45%, transparent)` }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
