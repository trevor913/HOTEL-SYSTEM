/** Normalize Kenyan phone numbers to 2547XXXXXXXX / 2541XXXXXXXX. Returns null if invalid. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "").replace(/^\+/, "");
  let local: string | null = null;
  if (/^254[17]\d{8}$/.test(digits)) local = digits.slice(3);
  else if (/^0[17]\d{8}$/.test(digits)) local = digits.slice(1);
  else if (/^[17]\d{8}$/.test(digits)) local = digits;
  return local ? `254${local}` : null;
}

/** 254712345678 → "0712 345 678" */
export function formatPhone(normalized: string): string {
  const n = normalizePhone(normalized);
  if (!n) return normalized;
  const l = `0${n.slice(3)}`;
  return `${l.slice(0, 4)} ${l.slice(4, 7)} ${l.slice(7)}`;
}

/** Masked for public/SMS contexts: "0712 *** 678" */
export function maskPhone(normalized: string): string {
  const f = formatPhone(normalized);
  return f.replace(/^(\d{4}) \d{3}/, "$1 ***");
}
