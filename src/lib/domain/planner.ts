/** plan_tomorrow: production suggestions from sales history (§6.2, §8.5). */
export interface DayItemRecord { date: string; itemId: string; soldQty: number; cookedQty: number; soldoutAt: string | null; wasteQty: number }
export interface PlanSuggestion { itemId: string; suggestedQty: number; basis: string; lostSalesQty: number }

/** Weight same-weekday history 2×, recent days more. */
export function planTomorrow(history: readonly DayItemRecord[], tomorrow: Date, closeHour = 21): PlanSuggestion[] {
  const dow = tomorrow.getDay();
  const byItem = new Map<string, DayItemRecord[]>();
  for (const r of history) byItem.set(r.itemId, [...(byItem.get(r.itemId) ?? []), r]);

  const out: PlanSuggestion[] = [];
  for (const [itemId, recs] of byItem) {
    const sorted = [...recs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 28);
    let wSum = 0, qSum = 0, lostSum = 0;
    sorted.forEach((r, idx) => {
      const sameDow = new Date(r.date).getDay() === dow;
      const w = (sameDow ? 2 : 1) * (1 / (1 + idx * 0.08));
      const demand = estimatedDemand(r, closeHour);
      wSum += w; qSum += demand * w; lostSum += (demand - r.soldQty) * w;
    });
    if (wSum === 0) continue;
    const avg = qSum / wSum;
    const lost = lostSum / wSum;
    out.push({
      itemId,
      suggestedQty: Math.max(1, Math.ceil(avg * 1.05)),
      lostSalesQty: Math.round(lost),
      basis: lost >= 1 ? "Iliisha mapema, ongeza" : "Kwa wastani wa mauzo",
    });
  }
  return out.sort((a, b) => b.suggestedQty - a.suggestedQty);
}

/** If an item sold out early, extrapolate demand for the remaining open hours. */
export function estimatedDemand(r: DayItemRecord, closeHour = 21, openHour = 6): number {
  if (!r.soldoutAt) return r.soldQty;
  const d = new Date(r.soldoutAt);
  const hour = d.getHours() + d.getMinutes() / 60;
  const openSpan = closeHour - openHour;
  const soldSpan = Math.max(1, hour - openHour);
  if (soldSpan >= openSpan) return r.soldQty;
  return Math.round(r.soldQty * (openSpan / soldSpan) * 0.85); // evening demand is softer
}

/** "Money left on the table" for an item that sold out early (cents). */
export function moneyLeftOnTable(r: DayItemRecord, priceCents: number, closeHour = 21): number {
  return Math.max(0, estimatedDemand(r, closeHour) - r.soldQty) * priceCents;
}
