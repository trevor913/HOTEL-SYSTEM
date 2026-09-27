/**
 * Deterministic demo seed for Nourish Hotel (§5). Same output every run (seeded PRNG),
 * relative to "now" so the demo always feels alive today.
 */
import type { Customer, Debt, DebtPayment, Expense, FeedEvent, Hotel, InventoryItem, MenuItem, MpesaTxn, Order, Sale, Staff, Supplier } from "../types";

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const HOTEL: Hotel = {
  id: "h-nourish", slug: "nourish-hotel", name: "Nourish Hotel", tagline: "Chakula cha nyumbani, bei ya mtaa.",
  ownerName: "Mama Mary", phone: "254712832100", tillNumber: "832100", locationText: "Kangemi Stage, Waiyaki Way, Nairobi",
  openHours: { open: "06:00", close: "21:30" },
};

const K = (kes: number) => kes * 100;
type MenuRow = [string, string, string, MenuItem["category"], number, string, number];
const MENU_ROWS: MenuRow[] = [
  ["m-chai", "Chai", "Chai ya Maziwa", "breakfast", 30, "☕", 32],
  ["m-mandazi", "Mandazi", "Mandazi", "breakfast", 10, "🥯", 38],
  ["m-chapati", "Chapati", "Chapati", "side", 20, "🫓", 40],
  ["m-madondo", "Madondo", "Maharagwe (Madondo)", "main", 80, "🫘", 20],
  ["m-chapati-madondo", "Chapati Madondo", "Chapati na Madondo", "main", 110, "🫘", 24],
  ["m-ugali-sukuma", "Ugali Sukuma", "Ugali na Sukuma Wiki", "main", 70, "🥬", 120],
  ["m-ugali-beef", "Ugali Beef", "Ugali na Nyama", "main", 180, "🍖", 12],
  ["m-ugali-samaki", "Ugali Samaki", "Ugali na Samaki", "main", 250, "🐟", 200],
  ["m-samaki", "Samaki Wet Fry", "Samaki wa Kukaanga", "main", 250, "🐟", 195],
  ["m-pilau", "Pilau", "Pilau ya Nyama", "main", 150, "🍛", 28],
  ["m-wali", "Wali Maharagwe", "Wali na Maharagwe", "main", 100, "🍚", 45],
  ["m-githeri", "Githeri", "Githeri Special", "main", 80, "🌽", 50],
  ["m-matumbo", "Matumbo", "Matumbo Fry", "main", 150, "🍲", 8],
  ["m-ndengu", "Ndengu", "Ndengu na Chapati", "main", 100, "🥣", 90],
];
export const MENU: MenuItem[] = MENU_ROWS.map(([id, name, nameSw, category, kes, emoji, hue], i) => ({
  id, name, nameSw, category, priceCents: K(kes), emoji, hue, isAvailable: true, soldOutToday: false, sortOrder: i,
}));

const NAMES: [string, string | undefined][] = [
  ["Otieno Ochieng", "Otieno"], ["Wanjiku Kamau", "Shiku"], ["Kamau Njoroge", "Kamau"], ["Achieng Atieno", "Achi"],
  ["Mwangi Githinji", "Mwas"], ["Njeri Wambui", undefined], ["Kiprono Rotich", "Kip"], ["Chebet Jeptoo", undefined],
  ["Omondi Were", "Omosh"], ["Wairimu Nduta", undefined], ["Mutua Musyoka", undefined], ["Nekesa Wafula", undefined],
  ["Baraka Kiptoo", undefined], ["Akinyi Odhiambo", undefined], ["Juma Hassan", "Juma"], ["Fatuma Ali", undefined],
  ["Kariuki Maina", "Kariu"], ["Moraa Kerubo", undefined], ["Wekesa Simiyu", undefined], ["Nyambura Wangari", undefined],
  ["Ouma Okoth", undefined], ["Jeptoo Kosgei", undefined], ["Musa Abdi", "Fundi Musa"], ["Waweru Kinyua", undefined],
  ["Adhiambo Awuor", undefined],
];

export const STAFF: Staff[] = [
  { id: "s-mary", name: "Mama Mary", role: "owner", dailyWageCents: 0, pin: "1234" },
  { id: "s-grace", name: "Grace Wambui", role: "staff", dailyWageCents: K(500), pin: "2580" },
  { id: "s-peter", name: "Peter Onyango", role: "staff", dailyWageCents: K(450), pin: "1470" },
];

export interface SeedData {
  hotel: Hotel; menu: MenuItem[]; customers: Customer[]; debts: Debt[]; debtPayments: DebtPayment[];
  sales: Sale[]; expenses: Expense[]; suppliers: Supplier[]; inventory: InventoryItem[]; orders: Order[];
  mpesa: MpesaTxn[]; staff: Staff[]; feed: FeedEvent[]; seededAt: string;
}

export function generateSeed(now: Date = new Date()): SeedData {
  const rnd = mulberry32(20260928);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)]!;
  const between = (a: number, b: number) => Math.floor(a + rnd() * (b - a + 1));
  const iso = (d: Date) => d.toISOString();
  const dayAt = (daysAgo: number, h: number, m: number) => {
    const d = new Date(now); d.setDate(d.getDate() - daysAgo); d.setHours(h, m, between(0, 59), 0); return d;
  };
  let seq = 0; const id = (p: string) => `${p}-${(++seq).toString(36)}`;
  const phoneFor = (i: number) => `2547${String(10 + (i * 7) % 89).padStart(2, "0")}${String(100000 + i * 3719).slice(-6)}`;

  const customers: Customer[] = NAMES.map(([name, nickname], i) => ({
    id: `c-${i + 1}`, name, nickname, phone: i % 6 === 5 ? null : phoneFor(i + 1),
    totalSpentCents: 0, visitCount: 0, loyaltyPoints: 0, lastSeenAt: iso(dayAt(between(0, 6), 13, 0)), createdAt: iso(dayAt(between(40, 90), 9, 0)),
  }));

  const price = new Map(MENU.map((m) => [m.id, m.priceCents]));
  const sales: Sale[] = [];
  const mpesa: MpesaTxn[] = [];
  const hours = [6, 7, 7, 8, 8, 9, 10, 11, 12, 12, 13, 13, 13, 14, 16, 17, 18, 19, 19, 20];
  const breakfast = ["m-chai", "m-mandazi", "m-chapati", "m-chapati-madondo"];
  const lunch = ["m-ugali-beef", "m-ugali-sukuma", "m-ugali-samaki", "m-madondo", "m-chapati", "m-wali", "m-githeri", "m-matumbo", "m-ndengu", "m-samaki", "m-pilau"];

  for (let d = 59; d >= 0; d--) {
    const date = dayAt(d, 12, 0);
    const dow = date.getDay();
    const isToday = d === 0;
    const nowHour = now.getHours();
    let count = dow === 0 ? between(28, 38) : dow === 5 ? between(55, 70) : dow === 6 ? between(45, 55) : between(40, 52);
    if (isToday && nowHour < 5) count = 0; // before the business day starts, "today" is still yesterday
    else if (isToday) count = Math.max(6, Math.round(count * Math.min(1, Math.max(0.15, (nowHour - 6) / 15))));
    for (let s = 0; s < count; s++) {
      let h = pick(hours);
      if (isToday && h > nowHour) h = Math.max(6, nowHour - between(0, 2));
      const createdAt = dayAt(d, h, between(0, 59));
      const pool = h < 10 ? breakfast : lunch;
      const n = between(1, 3);
      const items: Sale["items"] = [];
      for (let k = 0; k < n; k++) {
        let mid = pick(pool);
        if (dow === 5 && h >= 11 && rnd() < 0.35) mid = "m-pilau"; // Friday pilau
        const qty = mid === "m-chapati" || mid === "m-mandazi" ? between(1, 3) : 1;
        const unit = price.get(mid)!;
        const ex = items.find((x) => x.menuItemId === mid);
        if (ex) { ex.qty += qty; ex.lineTotalCents = ex.qty * unit; }
        else items.push({ menuItemId: mid, qty, unitPriceCents: unit, lineTotalCents: unit * qty });
      }
      if (h < 10 && !items.some((i) => i.menuItemId === "m-chai") && rnd() < 0.6)
        items.push({ menuItemId: "m-chai", qty: 1, unitPriceCents: K(30), lineTotalCents: K(30) });
      const total = items.reduce((a, i) => a + i.lineTotalCents, 0);
      const r = rnd();
      const method = r < 0.52 ? "mpesa" : r < 0.94 ? "cash" : "debt";
      const cust = rnd() < 0.4 || method === "debt" ? pick(customers) : null;
      const sale: Sale = {
        id: id("sale"), customerId: cust?.id ?? null, staffId: pick(STAFF).id, totalCents: total,
        paymentMethod: method, channel: rnd() < 0.9 ? "walk_in" : "whatsapp", items, createdAt: iso(createdAt),
      };
      if (method === "mpesa") {
        const tx = `S${String.fromCharCode(65 + between(0, 25))}${between(10, 99)}${Math.floor(rnd() * 36 ** 6).toString(36).toUpperCase().padStart(6, "X")}`;
        sale.mpesaTxId = tx;
        if (d < 14) mpesa.push({
          id: id("mp"), providerTxId: tx, type: "c2b", phone: cust?.phone ?? phoneFor(100 + s + d * 3), amountCents: total,
          payerName: (cust?.name ?? pick(NAMES)[0]).toUpperCase(), matchedEntity: "sale", matchedId: sale.id, status: "matched", createdAt: sale.createdAt,
        });
      }
      if (cust) { cust.totalSpentCents += total; cust.visitCount += 1; cust.loyaltyPoints += Math.floor(total / 10000); }
      sales.push(sale);
    }
  }
  // Unmatched M-Pesa payments for the Reconcile inbox
  for (let i = 0; i < 5; i++) {
    const c = customers[i * 4 + 1]!;
    mpesa.push({
      id: id("mp"), providerTxId: `SJ${80 + i}UNM${i}X${between(100, 999)}`, type: "c2b", phone: phoneFor(300 + i), amountCents: K(pick([150, 250, 360, 500, 1200])),
      payerName: `${pick(["JANE", "BRIAN", "KEVIN", "MERCY", "DENNIS"])} ${c.name.split(" ")[1]!.toUpperCase()}`, matchedEntity: null, matchedId: null, status: "unmatched",
      createdAt: iso(dayAt(i === 0 ? 0 : between(0, 2), between(8, 19), between(0, 59))),
    });
  }

  // Debts: 18 mixed states
  const debts: Debt[] = [];
  const debtPayments: DebtPayment[] = [];
  const debtDescs = ["Lunch ya wiki", "Ugali beef x2", "Chai na mandazi", "Pilau Ijumaa", "Chakula cha mafundi", "Samaki wet fry", "Chapo madondo x3", "Lunch ya site"];
  const ages = [0, 1, 2, 3, 5, 6, 9, 11, 14, 17, 21, 26, 33, 38, 45, 52, 4, 8];
  const states: Debt["status"][] = ["open", "open", "partial", "open", "paid", "open", "partial", "open", "paid", "open", "partial", "open", "open", "partial", "open", "paid", "open", "open"];
  const owners = [0, 1, 2, 3, 4, 6, 8, 0, 10, 12, 14, 16, 22, 18, 2, 20, 24, 13];
  ages.forEach((age, i) => {
    const cust = customers[owners[i]!]!;
    const amount = K(pick([120, 180, 250, 250, 300, 360, 450, 520, 700, 1200, 1500, 2400]));
    const created = dayAt(age, between(11, 19), between(0, 59));
    const status = states[i]!;
    let balance = amount;
    if (status === "partial") {
      const paid = Math.round((amount * pick([0.3, 0.4, 0.5])) / 1000) * 1000;
      balance = amount - paid;
      debtPayments.push({ id: id("dp"), debtId: `d-${i + 1}`, amountCents: paid, method: rnd() < 0.6 ? "mpesa" : "cash", createdAt: iso(dayAt(Math.max(0, age - between(1, 4)), 18, 10)) });
    }
    if (status === "paid") {
      balance = 0;
      debtPayments.push({ id: id("dp"), debtId: `d-${i + 1}`, amountCents: amount, method: "mpesa", createdAt: iso(dayAt(Math.max(0, age - 2), 17, 40)) });
    }
    debts.push({ id: `d-${i + 1}`, customerId: cust.id, amountCents: amount, balanceCents: balance, status, description: pick(debtDescs), createdAt: iso(created), settledAt: status === "paid" ? iso(dayAt(Math.max(0, age - 2), 17, 40)) : null });
  });

  const suppliers: Supplier[] = [
    { id: "sup-1", name: "Kamau Butchery", phone: "254722410981", whatTheySupply: "Nyama, matumbo", balanceOwedCents: K(4200) },
    { id: "sup-2", name: "Mama Njeri (Mboga)", phone: "254733201776", whatTheySupply: "Sukuma, nyanya, vitunguu", balanceOwedCents: K(850) },
    { id: "sup-3", name: "Gikomba Fish (Onyango)", phone: "254711908233", whatTheySupply: "Samaki (tilapia)", balanceOwedCents: K(3000) },
    { id: "sup-4", name: "Kangemi Wholesalers", phone: "254720554120", whatTheySupply: "Unga, mchele, mafuta, sukari", balanceOwedCents: 0 },
    { id: "sup-5", name: "Total Gas Kangemi", phone: "254701223300", whatTheySupply: "Gas 13kg refill", balanceOwedCents: 0 },
    { id: "sup-6", name: "Brookside (Juma)", phone: "254745118902", whatTheySupply: "Maziwa", balanceOwedCents: K(1260) },
  ];

  const expenses: Expense[] = [];
  const daily: [Expense["category"], string, number, number, string | null][] = [
    ["soko", "Nyama", 1800, 2600, "sup-1"], ["soko", "Sukuma & nyanya", 350, 600, "sup-2"], ["soko", "Maziwa", 480, 720, "sup-6"],
    ["charcoal", "Makaa (debe)", 250, 350, null], ["transport", "Boda ya soko", 100, 200, null],
  ];
  for (let d = 59; d >= 0; d--) {
    if (d === 0 && now.getHours() < 5) continue;
    for (const [cat, desc, lo, hi, sup] of daily) {
      expenses.push({ id: id("ex"), category: cat, description: desc, amountCents: K(Math.round(between(lo, hi) / 10) * 10), supplierId: sup, incurredOn: iso(dayAt(d, 6, between(0, 40))), createdAt: iso(dayAt(d, 6, 45)) });
    }
    const dow = dayAt(d, 12, 0).getDay();
    if (dow === 2 || dow === 5) expenses.push({ id: id("ex"), category: "soko", description: "Samaki", amountCents: K(between(28, 36) * 100), supplierId: "sup-3", incurredOn: iso(dayAt(d, 6, 10)), createdAt: iso(dayAt(d, 6, 50)) });
    if (d % 6 === 0) expenses.push({ id: id("ex"), category: "gas", description: "Gas 13kg refill", amountCents: K(3200), supplierId: "sup-5", incurredOn: iso(dayAt(d, 8, 0)), createdAt: iso(dayAt(d, 8, 5)) });
    if (d % 7 === 1) expenses.push({ id: id("ex"), category: "soko", description: "Unga, mchele, mafuta", amountCents: K(between(38, 46) * 100), supplierId: "sup-4", incurredOn: iso(dayAt(d, 7, 0)), createdAt: iso(dayAt(d, 7, 10)) });
    if (d % 7 === 6) expenses.push({ id: id("ex"), category: "wages", description: "Karo ya wiki: Grace & Peter", amountCents: K(6650), supplierId: null, incurredOn: iso(dayAt(d, 20, 0)), createdAt: iso(dayAt(d, 20, 5)) });
    if (d === 27) expenses.push({ id: id("ex"), category: "rent", description: "Kodi ya mwezi", amountCents: K(8000), supplierId: null, incurredOn: iso(dayAt(d, 10, 0)), createdAt: iso(dayAt(d, 10, 0)) });
  }

  const inventory: InventoryItem[] = [
    { id: "i-unga", name: "Unga wa Ugali", unit: "kg", currentQty: 14, lowThreshold: 10, maxQty: 48, lastPriceCents: K(68) },
    { id: "i-ngano", name: "Unga wa Ngano", unit: "kg", currentQty: 22, lowThreshold: 8, maxQty: 48, lastPriceCents: K(75) },
    { id: "i-mchele", name: "Mchele", unit: "kg", currentQty: 6, lowThreshold: 8, maxQty: 25, lastPriceCents: K(160) },
    { id: "i-mafuta", name: "Mafuta ya Kupika", unit: "ltr", currentQty: 3.5, lowThreshold: 5, maxQty: 20, lastPriceCents: K(290) },
    { id: "i-gas", name: "Gas (13kg)", unit: "cylinder", currentQty: 1, lowThreshold: 1, maxQty: 2, lastPriceCents: K(3200) },
    { id: "i-makaa", name: "Makaa", unit: "sack", currentQty: 2, lowThreshold: 1, maxQty: 4, lastPriceCents: K(1400) },
    { id: "i-maharagwe", name: "Maharagwe", unit: "kg", currentQty: 11, lowThreshold: 5, maxQty: 20, lastPriceCents: K(180) },
    { id: "i-sukari", name: "Sukari", unit: "kg", currentQty: 4, lowThreshold: 3, maxQty: 10, lastPriceCents: K(170) },
    { id: "i-majani", name: "Majani ya Chai", unit: "kg", currentQty: 1.5, lowThreshold: 0.5, maxQty: 3, lastPriceCents: K(420) },
    { id: "i-maziwa", name: "Maziwa", unit: "ltr", currentQty: 8, lowThreshold: 6, maxQty: 20, lastPriceCents: K(60) },
  ];

  const orderStates: Order["status"][] = ["new", "new", "confirmed", "preparing", "preparing", "ready", "out_for_delivery", "delivered", "delivered", "delivered", "cancelled", "delivered"];
  const orders: Order[] = orderStates.map((status, i) => {
    const cust = customers[(i * 3 + 2) % customers.length]!;
    const items = [{ menuItemId: pick(lunch), qty: between(1, 3), unitPriceCents: 0 }, { menuItemId: pick(["m-chai", "m-chapati"]), qty: between(1, 2), unitPriceCents: 0 }]
      .map((x) => ({ ...x, unitPriceCents: price.get(x.menuItemId)! }));
    const total = items.reduce((a, x) => a + x.qty * x.unitPriceCents, 0);
    const minsAgo = status === "delivered" || status === "cancelled" ? 60 * 24 * between(1, 6) : between(3, 55);
    const created = new Date(now.getTime() - minsAgo * 60_000);
    const type = i % 3 === 0 ? "pickup" : "delivery";
    return {
      id: `o-${i + 1}`, code: `KB-${1031 + i}`, customerName: cust.name, customerPhone: cust.phone ?? phoneFor(200 + i), status, type,
      addressText: type === "delivery" ? pick(["Mountain View, Gate B", "Kangemi Market, Stall 14", "Westlands, Sarit site", "Loresho Ridge, Hse 22"]) : undefined,
      totalCents: total, paymentStatus: status === "delivered" || i % 2 === 0 ? "paid" : "pay_on_delivery",
      riderName: status === "out_for_delivery" ? "Brian (Boda)" : undefined, placedVia: i % 2 ? "whatsapp" : "public_menu",
      items, createdAt: iso(created), updatedAt: iso(created),
    };
  });

  // Live feed: the latest sales (last 24h so the feed is never empty at night)
  const since = now.getTime() - 24 * 3_600_000;
  const feed: FeedEvent[] = sales
    .filter((s) => new Date(s.createdAt).getTime() >= since)
    .slice(-8)
    .map((s) => ({
      id: `f-${s.id}`, kind: (s.paymentMethod === "mpesa" ? "mpesa" : "sale") as FeedEvent["kind"],
      title: s.items.map((i) => `${i.qty}× ${MENU.find((m) => m.id === i.menuItemId)!.name}`).join(", "), amountCents: s.totalCents, createdAt: s.createdAt,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return { hotel: HOTEL, menu: MENU.map((m) => ({ ...m })), customers, debts, debtPayments, sales, expenses, suppliers, inventory, orders, mpesa, staff: STAFF, feed, seededAt: iso(now) };
}
