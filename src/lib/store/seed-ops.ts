/**
 * Operational demo data that sits beside generateSeed(): staff shifts, sold-out times and
 * waste logs for the last 3 weeks, so the planner and staff screens have history (§8.5, §8.6).
 * Deterministic (own PRNG) so tests and screenshots are stable.
 */
import { businessDayStart } from "../utils/dates";
import type { SoldOutEvent, WasteEvent } from "../types";

export const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const shiftKey = (date: string, staffId: string) => `${date}|${staffId}`;

function prng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export interface OpsSeed { shifts: Record<string, boolean>; soldOutLog: SoldOutEvent[]; wasteLog: WasteEvent[] }

export function seedOps(now = new Date()): OpsSeed {
  const rnd = prng(4021);
  const shifts: Record<string, boolean> = {};
  const soldOutLog: SoldOutEvent[] = [];
  const wasteLog: WasteEvent[] = [];
  for (let d = 0; d <= 21; d++) {
    const day = businessDayStart(now, d);
    const key = dateKey(day);
    const dow = day.getDay();
    shifts[shiftKey(key, "s-mary")] = true;
    shifts[shiftKey(key, "s-grace")] = dow !== 0 || d % 14 === 0;
    shifts[shiftKey(key, "s-peter")] = rnd() > 0.12;
    if (d === 0) continue; // today: live
    const at = (h: number, m: number) => { const x = new Date(day); x.setHours(h, m, 0, 0); return x.toISOString(); };
    if (dow === 5 || dow === 6) soldOutLog.push({ id: `so-${d}-p`, itemId: "m-pilau", at: at(13, Math.floor(rnd() * 50)) });
    if (rnd() < 0.35) soldOutLog.push({ id: `so-${d}-m`, itemId: "m-matumbo", at: at(14, Math.floor(rnd() * 59)) });
    if (dow === 0) soldOutLog.push({ id: `so-${d}-c`, itemId: "m-chapati", at: at(11, 20 + Math.floor(rnd() * 30)) });
    if (rnd() < 0.3) wasteLog.push({ id: `w-${d}-g`, itemId: "m-githeri", qty: 1 + Math.floor(rnd() * 4), at: at(21, 0) });
    if (rnd() < 0.2) wasteLog.push({ id: `w-${d}-s`, itemId: "m-ugali-sukuma", qty: 1 + Math.floor(rnd() * 3), at: at(21, 5) });
  }
  return { shifts, soldOutLog, wasteLog };
}