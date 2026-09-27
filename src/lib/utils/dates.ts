/** Date helpers. Business day starts 05:00 local (hotels run past midnight). */
export const BUSINESS_DAY_START_HOUR = 5;

export function businessDayStart(now: Date = new Date(), daysAgo = 0): Date {
  const d = new Date(now);
  if (d.getHours() < BUSINESS_DAY_START_HOUR) d.setDate(d.getDate() - 1);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(BUSINESS_DAY_START_HOUR, 0, 0, 0);
  return d;
}
export function inBusinessDay(iso: string, now: Date = new Date(), daysAgo = 0): boolean {
  const start = businessDayStart(now, daysAgo).getTime();
  const t = new Date(iso).getTime();
  return t >= start && t < start + 86_400_000;
}
export function daysBetween(a: string | Date, b: Date = new Date()): number {
  return Math.max(0, Math.floor((b.getTime() - new Date(a).getTime()) / 86_400_000));
}
export function greetingKey(now: Date = new Date()): "morning" | "afternoon" | "evening" | "night" {
  const h = now.getHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 16) return "afternoon";
  if (h >= 16 && h < 22) return "evening";
  return "night";
}
export function timeAgo(iso: string, lang: "sw" | "en", now: Date = new Date()): string {
  const s = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 1000));
  const m = Math.floor(s / 60), h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (lang === "sw") {
    if (s < 60) return "sasa hivi";
    if (m < 60) return `dak ${m} zilizopita`;
    if (h < 24) return `saa ${h} zilizopita`;
    return d === 1 ? "jana" : `siku ${d} zilizopita`;
  }
  if (s < 60) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return d === 1 ? "yesterday" : `${d}d ago`;
}
export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });
}
export function dayLabel(iso: string, lang: "sw" | "en", now: Date = new Date()): string {
  if (inBusinessDay(iso, now, 0)) return lang === "sw" ? "Leo" : "Today";
  if (inBusinessDay(iso, now, 1)) return lang === "sw" ? "Jana" : "Yesterday";
  return new Date(iso).toLocaleDateString(lang === "sw" ? "sw-KE" : "en-KE", { weekday: "long", day: "numeric", month: "short" });
}
