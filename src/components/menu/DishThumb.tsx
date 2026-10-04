import type { MenuItem } from "@/lib/types";

/** Dish photo, or its emoji on a warm tile when no photo exists. */
export function DishThumb({ m, size = 56 }: { m: Pick<MenuItem, "emoji" | "hue" | "imageUrl" | "name">; size?: number }) {
  return m.imageUrl
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={m.imageUrl} alt={m.name} width={size} height={size} className="shrink-0 rounded-2xl object-cover" style={{ width: size, height: size }} />
    : <span className="grid shrink-0 place-items-center rounded-2xl" style={{ width: size, height: size, fontSize: size * 0.5, background: `oklch(0.42 0.09 ${m.hue} / 0.35)` }}>{m.emoji}</span>;
}
