/** Opening-hours helpers for the public menu. Handles windows that cross midnight. */
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return (h ?? 0) * 60 + (m ?? 0); };

export function isOpenNow(h: { open: string; close: string }, now: Date = new Date()): boolean {
  const m = now.getHours() * 60 + now.getMinutes();
  const o = toMin(h.open), c = toMin(h.close);
  return c > o ? m >= o && m < c : m >= o || m < c;
}