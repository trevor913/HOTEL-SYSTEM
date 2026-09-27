/**
 * parseSwahiliAmount — turns spoken/typed Swahili (and Sheng/English/digit) amounts into KES.
 *   "mia mbili hamsini"        → 250
 *   "elfu mbili"               → 2000
 *   "elfu moja mia tano"       → 1500
 *   "elfu kumi na tano"        → 15000
 *   "laki moja"                → 100000
 *   "2k" / "2,500" / "ngiri 2" → 2000 / 2500 / 2000
 * Returns null when no amount is found.
 */
const UNITS: Record<string, number> = {
  sifuri: 0, moja: 1, mbili: 2, tatu: 3, nne: 4, tano: 5, sita: 6, saba: 7, nane: 8, tisa: 9,
  kumi: 10, ishirini: 20, thelathini: 30, arobaini: 40, hamsini: 50, sitini: 60, sabini: 70,
  themanini: 80, tisini: 90,
  // English fallbacks
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};
const MULTIPLIERS: Record<string, number> = {
  mia: 100, hundred: 100,
  elfu: 1000, ngiri: 1000, thousand: 1000, k: 1000,
  laki: 100_000,
  milioni: 1_000_000, million: 1_000_000,
};
/** Sheng money slang */
const SLANG: Record<string, number> = {
  thao: 1000, punch: 1000, soo: 100, ashuu: 500, jirongo: 1000, finje: 500, kindee: 100,
};
const JOINERS = new Set(["na", "and", "u"]);

export const SWAHILI_NUMBER_WORDS = new Set([
  ...Object.keys(UNITS), ...Object.keys(MULTIPLIERS), ...Object.keys(SLANG),
]);

export function isNumberToken(tok: string): boolean {
  const t = tok.toLowerCase();
  return SWAHILI_NUMBER_WORDS.has(t) || /^\d[\d,]*(\.\d+)?k?$/.test(t);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/(\d),(\d{3})/g, "$1$2")
    .replace(/(\d)\s*k\b/g, "$1 k")
    .replace(/[^a-z0-9.\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

/** Parse a token sequence that is entirely number words. */
export function parseNumberTokens(tokens: readonly string[]): number | null {
  let total = 0;
  let current = 0;
  let seen = false;
  // Swahili puts the multiplier BEFORE the count: "mia mbili" = 200, "elfu tatu" = 3000.
  let pendingMultiplier: number | null = null;

  const flushPending = () => {
    if (pendingMultiplier !== null) {
      total += pendingMultiplier * (current || 1);
      current = 0;
      pendingMultiplier = null;
    }
  };

  for (const raw of tokens) {
    const t = raw.toLowerCase();
    if (JOINERS.has(t)) continue;
    if (/^\d+(\.\d+)?$/.test(t)) {
      current += Number(t);
      seen = true;
      continue;
    }
    if (t in SLANG) { flushPending(); total += current; current = 0; pendingMultiplier = SLANG[t]!; seen = true; continue; }
    if (t in MULTIPLIERS) {
      const m = MULTIPLIERS[t]!;
      if (t === "k" || t === "thousand" || t === "hundred" || t === "million") {
        // English/digit style: count comes BEFORE multiplier ("2 k", "two thousand")
        if (pendingMultiplier !== null && m < pendingMultiplier) {
          current = (current || 1) * m;
        } else {
          flushPending();
          total += (current || 1) * m;
          current = 0;
        }
      } else {
        // Swahili style: multiplier first. "elfu moja mia tano": flush elfu(1) then start mia.
        if (pendingMultiplier !== null && m >= pendingMultiplier) {
          pendingMultiplier = pendingMultiplier * m;
        } else {
          flushPending();
          total += current;
          current = 0;
          pendingMultiplier = m;
        }
      }
      seen = true;
      continue;
    }
    if (t in UNITS) {
      current += UNITS[t]!;
      seen = true;
      continue;
    }
    return null;
  }
  if (pendingMultiplier !== null) {
    total += resolveTrailing(pendingMultiplier, tokens);
    return seen ? total : null;
  }
  total += current;
  return seen ? total : null;
}

/**
 * For the last multiplier group, only the FIRST number word after it is its count;
 * anything after is added. "mia mbili hamsini" → 100*2 + 50.
 */
function resolveTrailing(mult: number, tokens: readonly string[]): number {
  let idx = -1;
  for (let i = tokens.length - 1; i >= 0; i--) {
    const t = tokens[i]!.toLowerCase();
    if (t in MULTIPLIERS || t in SLANG) { idx = i; break; }
  }
  const after = tokens.slice(idx + 1).map((t) => t.toLowerCase());
  const val = (t: string | undefined): number | null =>
    t === undefined ? null : t in UNITS ? UNITS[t]! : /^\d+$/.test(t) ? Number(t) : null;
  const words = after.filter((t) => !JOINERS.has(t));
  if (words.length === 0) return mult;
  let count = val(after[0]) ?? 1;
  let i = 1;
  // "elfu kumi na tano" = 15,000: a tens word joined by "na" to a unit forms the count.
  if (count >= 10 && count < 100 && after[i] && JOINERS.has(after[i]!)) {
    const u = val(after[i + 1]);
    if (u !== null && u < 10) { count += u; i += 2; }
  }
  let rest = 0;
  for (const t of after.slice(i)) rest += val(t) ?? 0;
  // Speakers don't say "mia hamsini" meaning 5,000; treat tens-after-mia as 100 + tens.
  if (count >= 10 && mult === 100) return mult + count + rest;
  return mult * count + rest;
}

export function parseSwahiliAmount(text: string): number | null {
  const tokens = tokenize(text);
  let best: number | null = null;
  let run: string[] = [];
  const flush = () => {
    const trimmed = trimJoiners(run);
    if (trimmed.length) {
      const v = parseNumberTokens(trimmed);
      if (v !== null && (best === null || v > best)) best = v;
    }
    run = [];
  };
  for (const t of tokens) {
    if (isNumberToken(t) || (JOINERS.has(t) && run.length)) run.push(t);
    else flush();
  }
  flush();
  return best;
}

function trimJoiners(run: string[]): string[] {
  let s = 0, e = run.length;
  while (s < e && JOINERS.has(run[s]!)) s++;
  while (e > s && JOINERS.has(run[e - 1]!)) e--;
  return run.slice(s, e);
}

/** Extract all amount segments in order, e.g. "nyama elfu mbili na sukuma mia tatu" */
export function extractAmountSegments(text: string): { label: string; amount: number }[] {
  const tokens = tokenize(text);
  const out: { label: string; amount: number }[] = [];
  let label: string[] = [];
  let nums: string[] = [];
  const push = () => {
    const n = trimJoiners(nums);
    if (n.length && label.length) {
      const v = parseNumberTokens(n);
      if (v !== null) out.push({ label: label.join(" "), amount: v });
      label = [];
    }
    nums = [];
  };
  for (const t of tokens) {
    if (isNumberToken(t)) nums.push(t);
    else if (JOINERS.has(t)) { if (nums.length) nums.push(t); }
    else { if (nums.length) push(); label.push(t); }
  }
  push();
  return out;
}
