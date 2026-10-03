/**
 * Rule-based Swahili / Sheng / English intent parser.
 * Runs fully offline (MOCK_MODE) and is the deterministic fallback when no
 * Anthropic key exists. Every §6.3 utterance in MASTERPROMPT.md must pass.
 */
import { extractAmountSegments, isNumberToken, parseNumberTokens, parseSwahiliAmount } from "../utils/swahili-numbers";

export type PaymentMethod = "cash" | "mpesa" | "debt";
export type ExpenseCategory = "soko" | "gas" | "charcoal" | "rent" | "wages" | "transport" | "license" | "equipment" | "other";

export interface CatalogItem { id: string; name: string; aliases: string[] }
export interface Catalog { menu: CatalogItem[]; inventory: CatalogItem[]; customers: CatalogItem[] }

export type Intent =
  | { kind: "log_sale"; items: { itemId: string; name: string; qty: number }[]; method: PaymentMethod; customer?: string }
  | { kind: "log_debt"; customer: string; amountKes: number; note?: string }
  | { kind: "record_debt_payment"; customer: string; amountKes: number | "all"; method: PaymentMethod }
  | { kind: "log_expense"; items: { label: string; category: ExpenseCategory; amountKes: number }[] }
  | { kind: "get_daily_summary" }
  | { kind: "get_debts_report" }
  | { kind: "set_item_soldout"; itemId: string; name: string }
  | { kind: "check_stock"; itemId: string | null; name: string }
  | { kind: "get_best_sellers" }
  | { kind: "plan_tomorrow" }
  | { kind: "get_week_report" }
  | { kind: "send_debt_reminder"; customer: string | "all" }
  | { kind: "greeting" }
  | { kind: "unknown"; text: string };

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9,.\s]/g, " ").replace(/\s+/g, " ").trim();

const has = (t: string, ...words: string[]) => words.some((w) => new RegExp(`\\b${w}`).test(t));

const EXPENSE_WORDS: Record<string, { label: string; category: ExpenseCategory }> = {
  nyama: { label: "Nyama", category: "soko" }, meat: { label: "Nyama", category: "soko" },
  sukuma: { label: "Sukuma", category: "soko" }, nyanya: { label: "Nyanya", category: "soko" },
  vitunguu: { label: "Vitunguu", category: "soko" }, unga: { label: "Unga", category: "soko" },
  mafuta: { label: "Mafuta", category: "soko" }, mchele: { label: "Mchele", category: "soko" },
  maharagwe: { label: "Maharagwe", category: "soko" }, samaki: { label: "Samaki", category: "soko" },
  sukari: { label: "Sukari", category: "soko" }, maziwa: { label: "Maziwa", category: "soko" },
  majani: { label: "Majani ya chai", category: "soko" }, ngano: { label: "Ngano", category: "soko" },
  gas: { label: "Gas", category: "gas" }, gesi: { label: "Gas", category: "gas" },
  makaa: { label: "Makaa", category: "charcoal" }, charcoal: { label: "Makaa", category: "charcoal" },
  kodi: { label: "Kodi", category: "rent" }, rent: { label: "Kodi", category: "rent" },
  mshahara: { label: "Mshahara", category: "wages" }, karo: { label: "Karo", category: "wages" },
  nauli: { label: "Nauli", category: "transport" }, fare: { label: "Nauli", category: "transport" },
  boda: { label: "Boda", category: "transport" }, leseni: { label: "Leseni", category: "license" },
};

const FILLER = new Set(["nimeuza", "nimenunua", "nimelipa", "nime", "andika", "weka", "ya", "wa", "za", "la", "na", "and", "leo", "sold", "bought", "cash", "mpesa", "m", "pesa", "kwa", "deni", "madeni", "pale", "hii", "hizo", "sasa", "tu"]);

function methodOf(t: string): PaymentMethod {
  if (has(t, "mpesa", "m pesa", "m-pesa", "till", "lipa na")) return "mpesa";
  if (has(t, "deni", "credit", "kwa mkopo")) return "debt";
  return "cash";
}

function matchCatalog(tokens: string[], start: number, items: CatalogItem[]): { item: CatalogItem; len: number } | null {
  let best: { item: CatalogItem; len: number } | null = null;
  for (const item of items) {
    for (const alias of [item.name, ...item.aliases]) {
      const a = norm(alias).split(" ");
      if (a.length > tokens.length - start) continue;
      if (a.every((w, i) => tokens[start + i] === w || tokens[start + i] === `${w}s`)) {
        if (!best || a.length > best.len) best = { item, len: a.length };
      }
    }
  }
  return best;
}

function findCustomer(text: string, catalog: Catalog): string | null {
  const t = norm(text);
  for (const c of catalog.customers) {
    for (const a of [c.name, ...c.aliases]) {
      if (new RegExp(`\\b${norm(a)}\\b`).test(t)) return c.name;
    }
  }
  // Unknown customer: capitalised word after "ya/wa/kwa" in raw text, or before "amelipa"
  const m = text.match(/\b(?:ya|wa|kwa|for)\s+([A-Z][a-zA-Z'-]+)/) ?? text.match(/\b([A-Z][a-zA-Z'-]+)\s+(?:amelipa|ame lipa|paid)/);
  return m?.[1] ?? null;
}

export function parseSale(text: string, catalog: Catalog): Intent | null {
  const tokens = norm(text).split(" ");
  const items: { itemId: string; name: string; qty: number }[] = [];
  let i = 0;
  while (i < tokens.length) {
    // Prefix quantity: "2 chapati", "mbili chai"
    let prefixQty: number | null = null;
    if (isNumberToken(tokens[i]!)) {
      const pre: string[] = [];
      let j = i;
      while (j < tokens.length && isNumberToken(tokens[j]!)) pre.push(tokens[j++]!);
      i = j;
      if (!matchCatalog(tokens, i, catalog.menu)) continue;
      prefixQty = parseNumberTokens(pre);
    }
    const m = matchCatalog(tokens, i, catalog.menu);
    if (!m) { i++; continue; }
    i += m.len;
    const numToks: string[] = [];
    if (prefixQty === null) while (i < tokens.length && isNumberToken(tokens[i]!)) numToks.push(tokens[i++]!);
    const qty = prefixQty ?? (numToks.length ? parseNumberTokens(numToks) ?? 1 : 1);
    const existing = items.find((x) => x.itemId === m.item.id);
    if (existing) existing.qty += qty;
    else items.push({ itemId: m.item.id, name: m.item.name, qty: Math.max(1, Math.round(qty)) });
  }
  if (!items.length) return null;
  const method = methodOf(norm(text));
  const customer = method === "debt" ? findCustomer(text, catalog) ?? undefined : undefined;
  return { kind: "log_sale", items, method, ...(customer ? { customer } : {}) };
}

export function parseIntent(input: string, catalog: Catalog): Intent {
  const raw = input.trim();
  const t = norm(raw);
  if (!t) return { kind: "unknown", text: raw };

  // ---- Queries -----------------------------------------------------------
  if (/(nimepataje|nimeunda aje|nimeunda ngapi|faida ya leo|mauzo ya leo|how much.*today|today.*(summary|profit)|how did i do|leo (imekuwaje|ni ngapi))/.test(t))
    return { kind: "get_daily_summary" };
  if (/(ananidai|wananidai|madeni yao|nani (ana|nina) (deni|madeni)|madeni yote|who owes|all debts|debts? report|orodha ya madeni)/.test(t))
    return { kind: "get_debts_report" };
  if (/(wiki hii|this week|ripoti ya wiki|week report)/.test(t)) return { kind: "get_week_report" };
  if (/(inauzwa sana|best ?sellers?|zinazouzwa|top items|inatoka sana)/.test(t)) return { kind: "get_best_sellers" };
  if (/(kesho|tomorrow).*(pik|cook|mpango|plan)|(mpango|plan|pik|cook).*(kesho|tomorrow)/.test(t)) return { kind: "plan_tomorrow" };

  // Stock check: "Mafuta imebaki lita ngapi?", "How much oil is left?"
  if (/(imebaki|imesalia|zimebaki|iko ngapi|ngapi imebaki|stock|is left|how much .* left)/.test(t)) {
    const tokens = t.split(" ");
    for (let i = 0; i < tokens.length; i++) {
      const m = matchCatalog(tokens, i, catalog.inventory);
      if (m) return { kind: "check_stock", itemId: m.item.id, name: m.item.name };
    }
    return { kind: "check_stock", itemId: null, name: "" };
  }

  // Sold out: "Wali imeisha", "chapati zimeisha", "pilau is finished"
  if (/(imeisha|zimeisha|imekwisha|sold ?out|finished|imeishia)/.test(t)) {
    const tokens = t.split(" ");
    for (let i = 0; i < tokens.length; i++) {
      const m = matchCatalog(tokens, i, catalog.menu);
      if (m) return { kind: "set_item_soldout", itemId: m.item.id, name: m.item.name };
    }
  }

  // Reminders
  if (/(kumbusha|tuma reminder|send reminder|remind)/.test(t)) {
    const who = has(t, "wote", "all") ? "all" : findCustomer(raw, catalog);
    if (who) return { kind: "send_debt_reminder", customer: who };
  }

  // ---- Debt payment: "Otieno amelipa deni yote", "Wanjiku amelipa mia mbili mpesa"
  if (/(amelipa|ame lipa|amepay|amelipia|paid|amemaliza)/.test(t)) {
    const customer = findCustomer(raw, catalog);
    if (customer) {
      const full = has(t, "yote", "zote", "all", "full", "kabisa", "amemaliza");
      const amount = parseSwahiliAmount(raw);
      return {
        kind: "record_debt_payment",
        customer,
        amountKes: full || amount === null ? "all" : amount,
        method: has(t, "mpesa", "m pesa", "till") ? "mpesa" : "cash",
      };
    }
  }

  // ---- New debt: "Andika deni ya Otieno mia mbili hamsini"
  if (/\b(deni|madeni|credit)\b/.test(t) && /(andika|weka|ongeza|record|add|amekula|anadaiwa)/.test(t)) {
    const customer = findCustomer(raw, catalog);
    const amount = parseSwahiliAmount(raw);
    if (customer && amount !== null) return { kind: "log_debt", customer, amountKes: amount };
  }

  // ---- Expenses: "Nimenunua nyama elfu mbili na sukuma mia tatu"
  if (/(nimenunua|nunua|bought|nimelipa|matumizi|expense|soko)/.test(t)) {
    const segs = extractAmountSegments(raw);
    const items = segs
      .map((s) => {
        const words = s.label.split(" ").filter((w) => !FILLER.has(w));
        const key = words.find((w) => w in EXPENSE_WORDS);
        const mapped = key ? EXPENSE_WORDS[key]! : null;
        const label = mapped?.label ?? (words.join(" ") || "Matumizi");
        return { label: capitalize(label), category: mapped?.category ?? ("other" as ExpenseCategory), amountKes: s.amount };
      })
      .filter((x) => x.amountKes > 0);
    if (items.length) return { kind: "log_expense", items };
  }

  // ---- Sales: "Nimeuza ugali samaki mbili na chai moja, cash"
  if (/(nimeuza|uza|sold|mauzo|ameagiza|amekula)/.test(t) || matchesAnyMenu(t, catalog)) {
    const sale = parseSale(raw, catalog);
    if (sale) return sale;
  }

  if (/^(habari|hello|hi|sasa|niaje|mambo|hujambo|vipi)\b/.test(t)) return { kind: "greeting" };
  return { kind: "unknown", text: raw };
}

function matchesAnyMenu(t: string, catalog: Catalog): boolean {
  const tokens = t.split(" ");
  return tokens.some((_, i) => matchCatalog(tokens, i, catalog.menu) !== null) && /\d|moja|mbili|tatu|nne|tano/.test(t);
}

function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
