/**
 * Money utilities. ALL money in Hotel System is integer cents (KES × 100).
 * Never store or compute money as floats.
 */
export type Cents = number;

export function toCents(kes: number): Cents {
  if (!Number.isFinite(kes)) throw new Error("Invalid amount");
  return Math.round(kes * 100);
}

export function fromCents(cents: Cents): number {
  return cents / 100;
}

export function assertCents(value: number): asserts value is Cents {
  if (!Number.isInteger(value)) throw new Error(`Money must be integer cents, got ${value}`);
}

/** "KSh 1,250" — drops .00, keeps real cents ("KSh 12.50"). */
export function formatKES(cents: Cents, opts: { sign?: boolean; compact?: boolean } = {}): string {
  assertCents(cents);
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  let body: string;
  if (opts.compact && whole >= 1000) {
    body = whole >= 1_000_000 ? `${trim(whole / 1_000_000)}M` : `${trim(whole / 1000)}K`;
  } else {
    body = whole.toLocaleString("en-KE") + (frac ? `.${String(frac).padStart(2, "0")}` : "");
  }
  const sign = negative ? "−" : opts.sign && cents > 0 ? "+" : "";
  return `${sign}KSh ${body}`;
}

function trim(n: number): string {
  return (Math.round(n * 10) / 10).toString();
}

export function sumCents(values: readonly Cents[]): Cents {
  return values.reduce((a, b) => a + b, 0);
}

export function lineTotal(unitPriceCents: Cents, qty: number): Cents {
  assertCents(unitPriceCents);
  if (!Number.isInteger(qty) || qty < 0) throw new Error("Quantity must be a whole number");
  return unitPriceCents * qty;
}

/**
 * Split an amount into n parts that always add back to the total
 * (remainder cents go to the first parts). Used for split payments.
 */
export function splitCents(total: Cents, parts: number): Cents[] {
  assertCents(total);
  if (!Number.isInteger(parts) || parts <= 0) throw new Error("parts must be > 0");
  const base = Math.trunc(total / parts);
  const remainder = total - base * parts;
  return Array.from({ length: parts }, (_, i) => base + (i < Math.abs(remainder) ? Math.sign(remainder) : 0));
}

/** Percentage change, rounded to 1dp. Returns null if previous is zero. */
export function pctChange(current: Cents, previous: Cents): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}
