"use client";
/**
 * On-device data store (MOCK_MODE). Seeded once, persisted to localStorage so the app
 * works fully offline and on Netlify with zero backend. In live mode the same actions
 * are mirrored to Supabase through src/lib/db (Phase 4+).
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { allocatePayment, receiptSms, reminderSms, settleAll, type DebtLike } from "../domain/debts";
import { autoMatch } from "../domain/automatch";
import type { ChatMessage, Debt, Expense, ExpenseCategory, FeedEvent, InventoryItem, MenuCategory, MenuItem, MpesaTxn, Order, OrderStatus, Sale, SaleItem, SmsMessage, SoldOutEvent, StockMove, SupplierPayment, WagePayment, WasteEvent } from "../types";
import { seedOps, shiftKey } from "./seed-ops";
import { businessDayStart } from "../utils/dates";
import { slugify } from "../demo/dishes";
import { generateSeed, type SeedData } from "./seed";

export const ORDER_FLOW: OrderStatus[] = ["new", "preparing", "ready", "out_for_delivery", "delivered"];

interface AppState extends SeedData {
  lang: "sw" | "en";
  theme: "dark" | "light";
  sms: SmsMessage[];
  chat: ChatMessage[];
  pendingSync: number;
  supplierPayments: SupplierPayment[];
  stockMoves: StockMove[];
  wagePayments: WagePayment[];
  shifts: Record<string, boolean>;
  soldOutLog: SoldOutEvent[];
  wasteLog: WasteEvent[];
  pinLock: boolean;
  onboarded: boolean;
  tourPending: boolean;
  completeOnboarding: (p: { hotelName: string; ownerName: string; locationText: string; openHours: { open: string; close: string }; tillNumber: string; phone: string; dishes: Omit<MenuItem, "id" | "isAvailable" | "soldOutToday" | "sortOrder">[] }) => void;
  finishTour: () => void;
  locked: boolean;
  activeStaffId: string;
  paySupplier: (p: { supplierId: string; amountCents: number; method: "cash" | "mpesa" }) => void;
  setStockLevels: (itemId: string, p: { lowThreshold: number; maxQty: number }) => void;
  toggleShift: (date: string, staffId: string) => void;
  payWages: (staffId: string, amountCents: number) => void;
  logWaste: (itemId: string, qty: number) => void;
  setPinLock: (on: boolean) => void;
  unlock: (staffId: string, pin: string) => boolean;
  lock: () => void;
  setLang: (l: "sw" | "en") => void;
  setTheme: (t: "dark" | "light") => void;
  logSale: (p: { items: { menuItemId: string; qty: number }[]; method: Sale["paymentMethod"]; customerId?: string | null; channel?: Sale["channel"] }) => Sale;
  logDebt: (p: { customerId: string; amountCents: number; description?: string }) => Debt;
  addCustomer: (p: { name: string; phone: string | null }) => string;
  recordPayment: (p: { customerId: string; amountCents: number | "all"; method: "cash" | "mpesa" }) => { paidCents: number; balanceCents: number; settled: boolean };
  logExpense: (p: { category: ExpenseCategory; description: string; amountCents: number }) => Expense;
  setSoldOut: (menuItemId: string, soldOut: boolean) => void;
  toggleAvailable: (menuItemId: string) => void;
  advanceOrder: (orderId: string) => Order | undefined;
  sendReminder: (customerId: string) => SmsMessage | undefined;
  simulateMpesa: () => MpesaTxn;
  matchMpesa: (txId: string, entity: "debt" | "order" | "sale", entityId: string) => void;
  ingestMpesa: (p: Pick<MpesaTxn, "providerTxId" | "type" | "phone" | "amountCents" | "payerName" | "createdAt">) => MpesaTxn;
  ignoreMpesa: (txId: string) => void;
  updateStock: (p: { itemId: string; qty: number; mode: "set" | "add" | "subtract"; reason?: StockMove["reason"] }) => InventoryItem | undefined;
  createOrder: (p: { customerName: string; customerPhone: string; items: { menuItemId: string; qty: number }[]; type: Order["type"]; addressText?: string; placedVia?: Order["placedVia"]; paymentStatus?: Order["paymentStatus"] }) => Order;
  addMenuItem: (p: { name: string; nameSw?: string; category: MenuCategory; priceCents: number; emoji?: string }) => MenuItem;
  updateMenuItem: (id: string, patch: Partial<Omit<MenuItem, "id">>) => void;
  deleteMenuItem: (id: string) => void;
  logSupplierPurchase: (p: { supplierId: string; description: string; amountCents: number; paid: boolean; category?: ExpenseCategory }) => Expense;
  pushOutbox: (m: Omit<SmsMessage, "id" | "createdAt">) => void;
  pushChat: (m: Omit<ChatMessage, "id" | "createdAt">) => void;
  clearChat: () => void;
  resetDemo: () => void;
}

const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

function feed(kind: FeedEvent["kind"], title: string, amountCents: number): FeedEvent {
  return { id: uid("f"), kind, title, amountCents, createdAt: nowIso() };
}

let firstHydration = true;

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...generateSeed(),
      lang: "sw",
      theme: "dark",
      sms: [],
      chat: [],
      pendingSync: 0,
      ...seedOps(),
      supplierPayments: [],
      stockMoves: [],
      wagePayments: [],
      pinLock: false,
      onboarded: false,
      tourPending: false,
      locked: false,
      activeStaffId: "s-mary",
      setLang: (lang) => set({ lang }),
      setTheme: (theme) => set({ theme }),

      logSale: ({ items, method, customerId = null, channel = "walk_in" }) => {
        const { menu } = get();
        const saleItems: SaleItem[] = items.map((i) => {
          const m = menu.find((x) => x.id === i.menuItemId);
          if (!m) throw new Error(`Unknown menu item ${i.menuItemId}`);
          return { menuItemId: m.id, qty: i.qty, unitPriceCents: m.priceCents, lineTotalCents: m.priceCents * i.qty };
        });
        const total = saleItems.reduce((a, i) => a + i.lineTotalCents, 0);
        const sale: Sale = { id: uid("sale"), customerId, staffId: get().activeStaffId, totalCents: total, paymentMethod: method, channel, items: saleItems, createdAt: nowIso() };
        const title = saleItems.map((i) => `${i.qty}× ${menu.find((m) => m.id === i.menuItemId)!.name}`).join(", ");
        set((s) => ({
          sales: [...s.sales, sale],
          feed: [feed(method === "mpesa" ? "mpesa" : "sale", title, total), ...s.feed].slice(0, 40),
          pendingSync: typeof navigator !== "undefined" && !navigator.onLine ? s.pendingSync + 1 : s.pendingSync,
        }));
        if (method === "debt" && customerId) get().logDebt({ customerId, amountCents: total, description: title });
        return sale;
      },

      logDebt: ({ customerId, amountCents, description = "Chakula" }) => {
        const debt: Debt = { id: uid("d"), customerId, amountCents, balanceCents: amountCents, status: "open", description, createdAt: nowIso(), settledAt: null };
        const name = get().customers.find((c) => c.id === customerId)?.name ?? "Mteja";
        set((s) => ({ debts: [...s.debts, debt], feed: [feed("debt_new", `Deni: ${name}`, amountCents), ...s.feed].slice(0, 40) }));
        return debt;
      },

      addCustomer: ({ name, phone }) => {
        const id = uid("c");
        set((s) => ({ customers: [...s.customers, { id, name, phone, totalSpentCents: 0, visitCount: 0, loyaltyPoints: 0, lastSeenAt: nowIso(), createdAt: nowIso() }] }));
        return id;
      },

      recordPayment: ({ customerId, amountCents, method }) => {
        const s = get();
        const mine: DebtLike[] = s.debts.filter((d) => d.customerId === customerId);
        const result = amountCents === "all" ? settleAll(mine) : allocatePayment(mine, amountCents);
        const paid = result.allocations.reduce((a, x) => a + x.appliedCents, 0);
        const byId = new Map(result.allocations.map((a) => [a.debtId, a]));
        const debts = s.debts.map((d) => {
          const a = byId.get(d.id);
          return a ? { ...d, balanceCents: a.newBalanceCents, status: a.newStatus, settledAt: a.newStatus === "paid" ? nowIso() : d.settledAt } : d;
        });
        const balance = debts.filter((d) => d.customerId === customerId).reduce((acc, d) => acc + d.balanceCents, 0);
        const cust = s.customers.find((c) => c.id === customerId);
        const payments = result.allocations.map((a) => ({ id: uid("dp"), debtId: a.debtId, amountCents: a.appliedCents, method, createdAt: nowIso() }));
        const sms: SmsMessage[] = cust?.phone
          ? [{ id: uid("sms"), to: cust.phone, toName: cust.name, kind: "receipt", status: "sent", createdAt: nowIso(), body: receiptSms({ name: cust.name.split(" ")[0]!, paidCents: paid, balanceCents: balance, hotelName: s.hotel.name }) }]
          : [];
        set({ debts, debtPayments: [...s.debtPayments, ...payments], sms: [...sms, ...s.sms], feed: [feed("debt_paid", `${cust?.name ?? "Mteja"} amelipa deni`, paid), ...s.feed].slice(0, 40) });
        return { paidCents: paid, balanceCents: balance, settled: balance === 0 };
      },

      logExpense: ({ category, description, amountCents }) => {
        const e: Expense = { id: uid("ex"), category, description, amountCents, supplierId: null, incurredOn: nowIso(), createdAt: nowIso() };
        set((s) => ({ expenses: [...s.expenses, e], feed: [feed("expense", description, amountCents), ...s.feed].slice(0, 40) }));
        return e;
      },

      setSoldOut: (id, soldOut) => set((s) => {
        const today = businessDayStart(new Date(), 0).getTime();
        const log = s.soldOutLog.filter((e) => !(e.itemId === id && new Date(e.at).getTime() >= today));
        return { menu: s.menu.map((m) => (m.id === id ? { ...m, soldOutToday: soldOut } : m)), soldOutLog: soldOut ? [...log, { id: uid("so"), itemId: id, at: nowIso() }] : log };
      }),
      toggleAvailable: (id) => set((s) => ({ menu: s.menu.map((m) => (m.id === id ? { ...m, isAvailable: !m.isAvailable } : m)) })),

      advanceOrder: (orderId) => {
        const o = get().orders.find((x) => x.id === orderId);
        if (!o) return undefined;
        const flow = o.type === "pickup" ? ORDER_FLOW.filter((x) => x !== "out_for_delivery") : ORDER_FLOW;
        const idx = flow.indexOf(o.status === "confirmed" ? "new" : o.status);
        const next = flow[Math.min(idx + 1, flow.length - 1)]!;
        const updated: Order = { ...o, status: next, updatedAt: nowIso(), riderName: next === "out_for_delivery" ? o.riderName ?? "Brian (Boda)" : o.riderName };
        const copy: Record<string, string> = {
          preparing: `Habari ${o.customerName.split(" ")[0]}! Oda ${o.code} inapikwa sasa. 🍲`,
          ready: `Oda ${o.code} iko tayari! ${o.type === "pickup" ? "Karibu uchukue." : "Rider anaondoka sasa hivi."}`,
          out_for_delivery: `Oda ${o.code} iko njiani na ${updated.riderName}. 🛵`,
          delivered: `Asante kwa kununua ${get().hotel.name}! Karibu tena. 🙏`,
        };
        const body = copy[next];
        const msg: SmsMessage | null = body ? { id: uid("sms"), to: o.customerPhone, toName: o.customerName, kind: "order", status: "sent", body, createdAt: nowIso() } : null;
        set((s) => ({ orders: s.orders.map((x) => (x.id === orderId ? updated : x)), sms: msg ? [msg, ...s.sms] : s.sms }));
        return updated;
      },

      sendReminder: (customerId) => {
        const s = get();
        const c = s.customers.find((x) => x.id === customerId);
        const bal = s.debts.filter((d) => d.customerId === customerId).reduce((a, d) => a + d.balanceCents, 0);
        if (!c?.phone || bal <= 0) return undefined;
        const msg: SmsMessage = { id: uid("sms"), to: c.phone, toName: c.name, kind: "reminder", status: "sent", createdAt: nowIso(), body: reminderSms({ name: c.name.split(" ")[0]!, balanceCents: bal, hotelName: `${s.hotel.ownerName}'s`, till: s.hotel.tillNumber }) };
        set({ sms: [msg, ...s.sms] });
        return msg;
      },

      simulateMpesa: () => {
        const s = get();
        const debtors = s.customers.filter((c) => c.phone && s.debts.some((d) => d.customerId === c.id && d.balanceCents > 0));
        const c = debtors[Math.floor(Math.random() * debtors.length)];
        const openDebt = c ? s.debts.find((d) => d.customerId === c.id && d.balanceCents > 0) : undefined;
        const amount = openDebt ? Math.min(openDebt.balanceCents, 10000 * (1 + Math.floor(Math.random() * 3))) : 25000;
        const tx: MpesaTxn = {
          id: uid("mp"), providerTxId: `SK${Math.random().toString(36).slice(2, 10).toUpperCase()}`, type: "c2b",
          phone: c?.phone ?? "254799000111", amountCents: amount, payerName: (c?.name ?? "WALK IN").toUpperCase(),
          matchedEntity: null, matchedId: null, status: "unmatched", createdAt: nowIso(),
        };
        return get().ingestMpesa(tx);
      },

      matchMpesa: (txId, entity, entityId) => {
        const s = get();
        const tx = s.mpesa.find((m) => m.id === txId);
        if (!tx || tx.status === "matched") return;
        let matchedId = entityId;
        if (entity === "debt") {
          const d = s.debts.find((x) => x.id === entityId);
          if (d) {
            const owed = s.debts.filter((x) => x.customerId === d.customerId).reduce((a, x) => a + x.balanceCents, 0);
            if (owed > 0) get().recordPayment({ customerId: d.customerId, amountCents: Math.min(tx.amountCents, owed), method: "mpesa" });
          }
        } else if (entity === "order") {
          set((st) => ({ orders: st.orders.map((o) => (o.id === entityId ? { ...o, paymentStatus: "paid" as const } : o)) }));
        } else {
          const sale: Sale = { id: uid("sale"), customerId: s.customers.find((c) => c.phone === tx.phone)?.id ?? null, staffId: get().activeStaffId, totalCents: tx.amountCents, paymentMethod: "mpesa", channel: "walk_in", items: [], mpesaTxId: tx.providerTxId, createdAt: tx.createdAt };
          matchedId = sale.id;
          set((st) => ({ sales: [...st.sales, sale] }));
        }
        set((st) => ({ mpesa: st.mpesa.map((m) => (m.id === txId ? { ...m, status: "matched" as const, matchedEntity: entity, matchedId } : m)) }));
      },

      ingestMpesa: ({ providerTxId, type, phone, amountCents, payerName, createdAt }) => {
        const s = get();
        const existing = s.mpesa.find((m) => m.providerTxId === providerTxId);
        if (existing) return existing;
        const tx: MpesaTxn = { id: uid("mp"), providerTxId, type, phone, amountCents, payerName, createdAt, matchedEntity: null, matchedId: null, status: "unmatched" };
        const match = autoMatch(tx, {
          customers: s.customers, debts: s.debts.filter((d) => d.balanceCents > 0),
          orders: s.orders.map((o) => ({ id: o.id, code: o.code, customerPhone: o.customerPhone, totalCents: o.totalCents, paymentStatus: o.paymentStatus, createdAt: o.createdAt })),
        });
        set((st) => ({ mpesa: [tx, ...st.mpesa], feed: [feed("mpesa", `M-Pesa: ${tx.payerName}`, amountCents), ...st.feed].slice(0, 40) }));
        if (match.status === "matched") get().matchMpesa(tx.id, match.entity, match.entityId);
        return get().mpesa.find((m) => m.id === tx.id) ?? tx;
      },
      ignoreMpesa: (txId) => set((s) => ({ mpesa: s.mpesa.map((m) => (m.id === txId ? { ...m, status: "ignored" as const } : m)) })),

      updateStock: ({ itemId, qty, mode, reason }) => {
        let out: InventoryItem | undefined;
        let delta = 0;
        set((s) => ({
          inventory: s.inventory.map((i) => {
            if (i.id !== itemId) return i;
            const next = Math.max(0, Math.round((mode === "set" ? qty : mode === "add" ? i.currentQty + qty : i.currentQty - qty) * 100) / 100);
            delta = Math.round((next - i.currentQty) * 100) / 100;
            out = { ...i, currentQty: next };
            return out;
          }),
        }));
        if (out && delta !== 0) {
          const r = reason ?? (mode === "add" ? "purchase" : mode === "subtract" ? "usage" : "adjust");
          set((s) => ({ stockMoves: [{ id: uid("sm"), itemId, delta, reason: r, createdAt: nowIso() }, ...s.stockMoves].slice(0, 200) }));
        }
        return out;
      },

      createOrder: ({ customerName, customerPhone, items, type, addressText, placedVia = "manual", paymentStatus = "pay_on_delivery" }) => {
        const { menu, orders } = get();
        const lines = items.map((i) => {
          const m = menu.find((x) => x.id === i.menuItemId);
          if (!m) throw new Error(`Unknown menu item ${i.menuItemId}`);
          return { menuItemId: m.id, qty: i.qty, unitPriceCents: m.priceCents };
        });
        const total = lines.reduce((a, l) => a + l.qty * l.unitPriceCents, 0);
        const last = Math.max(1030, ...orders.map((o) => Number(o.code.split("-")[1]) || 0));
        const order: Order = { id: uid("o"), code: `KB-${last + 1}`, customerName, customerPhone, status: "new", type, addressText, totalCents: total, paymentStatus, placedVia, items: lines, createdAt: nowIso(), updatedAt: nowIso() };
        set((s) => ({ orders: [order, ...s.orders], feed: [feed("order", `Oda ${order.code}: ${customerName}`, total), ...s.feed].slice(0, 40) }));
        return order;
      },

      addMenuItem: ({ name, nameSw, category, priceCents, emoji = "🍽️" }) => {
        const hue = [...name].reduce((a, c) => a + c.charCodeAt(0) * 7, 0) % 360;
        const item: MenuItem = { id: uid("m"), name, nameSw: nameSw ?? name, category, priceCents, emoji, hue, isAvailable: true, soldOutToday: false, sortOrder: get().menu.length };
        set((s) => ({ menu: [...s.menu, item] }));
        return item;
      },
      updateMenuItem: (id, patch) => set((s) => ({ menu: s.menu.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      deleteMenuItem: (id) => set((s) => ({ menu: s.menu.filter((m) => m.id !== id) })),

      logSupplierPurchase: ({ supplierId, description, amountCents, paid, category = "soko" }) => {
        const e: Expense = { id: uid("ex"), category, description, amountCents, supplierId, incurredOn: nowIso(), createdAt: nowIso() };
        set((s) => ({
          expenses: [...s.expenses, e],
          suppliers: paid ? s.suppliers : s.suppliers.map((x) => (x.id === supplierId ? { ...x, balanceOwedCents: x.balanceOwedCents + amountCents } : x)),
          feed: [feed("expense", `${s.suppliers.find((x) => x.id === supplierId)?.name ?? "Msambazaji"}: ${description}`, amountCents), ...s.feed].slice(0, 40),
        }));
        return e;
      },
      paySupplier: ({ supplierId, amountCents, method }) => set((s) => ({
        supplierPayments: [{ id: uid("spay"), supplierId, amountCents, method, createdAt: nowIso() }, ...s.supplierPayments],
        suppliers: s.suppliers.map((x) => (x.id === supplierId ? { ...x, balanceOwedCents: Math.max(0, x.balanceOwedCents - amountCents) } : x)),
      })),
      setStockLevels: (itemId, { lowThreshold, maxQty }) => set((s) => ({ inventory: s.inventory.map((i) => (i.id === itemId ? { ...i, lowThreshold, maxQty: Math.max(maxQty, lowThreshold) } : i)) })),
      toggleShift: (date, staffId) => set((s) => { const k = shiftKey(date, staffId); return { shifts: { ...s.shifts, [k]: !s.shifts[k] } }; }),
      payWages: (staffId, amountCents) => {
        const st = get().staff.find((x) => x.id === staffId);
        if (!st || amountCents <= 0) return;
        set((s) => ({
          wagePayments: [{ id: uid("wp"), staffId, amountCents, createdAt: nowIso() }, ...s.wagePayments],
          expenses: [...s.expenses, { id: uid("ex"), category: "wages" as const, description: `Karo: ${st.name}`, amountCents, supplierId: null, incurredOn: nowIso(), createdAt: nowIso() }],
          feed: [feed("expense", `Karo: ${st.name}`, amountCents), ...s.feed].slice(0, 40),
        }));
      },
      logWaste: (itemId, qty) => set((s) => ({ wasteLog: [...s.wasteLog, { id: uid("w"), itemId, qty, at: nowIso() }] })),
      setPinLock: (pinLock) => set({ pinLock, locked: false }),
      unlock: (staffId, pin) => {
        const st = get().staff.find((x) => x.id === staffId);
        if (!st || st.pin !== pin) return false;
        set({ locked: false, activeStaffId: staffId });
        return true;
      },
      lock: () => { if (get().pinLock) set({ locked: true }); },

      completeOnboarding: ({ hotelName, ownerName, locationText, openHours, tillNumber, phone, dishes }) => {
        const prev = get();
        const menu: MenuItem[] = dishes.map((d, i) => ({ ...d, id: `m-${slugify(d.name)}-${i}`, isAvailable: true, soldOutToday: false, sortOrder: i }));
        set({
          hotel: { ...prev.hotel, id: uid("h"), name: hotelName, slug: slugify(hotelName), ownerName, locationText, openHours, tillNumber: tillNumber || "", phone: phone || prev.hotel.phone, tagline: "Chakula kitamu, bei poa." },
          menu, customers: [], debts: [], debtPayments: [], sales: [], expenses: [], orders: [], mpesa: [], feed: [], sms: [], chat: [],
          suppliers: [], supplierPayments: [], stockMoves: [], wagePayments: [], soldOutLog: [], wasteLog: [], shifts: {},
          inventory: prev.inventory.map((i) => ({ ...i })),
          staff: [{ id: "s-owner", name: ownerName, role: "owner", dailyWageCents: 0, pin: "1234" }], activeStaffId: "s-owner",
          onboarded: true, tourPending: true, locked: false, pendingSync: 0, seededAt: nowIso(),
        });
      },
      finishTour: () => set({ tourPending: false }),

      pushOutbox: (m) => set((s) => ({ sms: [{ ...m, id: uid("sms"), createdAt: nowIso() }, ...s.sms] })),

      pushChat: (m) => set((s) => ({ chat: [...s.chat, { ...m, id: uid("msg"), createdAt: nowIso() }].slice(-80) })),
      clearChat: () => set({ chat: [] }),
      resetDemo: () => set({ ...generateSeed(), ...seedOps(), onboarded: false, tourPending: false, sms: [], chat: [], pendingSync: 0, supplierPayments: [], stockMoves: [], wagePayments: [], locked: false, activeStaffId: "s-mary" }),
    }),
    {
      name: "hotel-system:v1",
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: () => (state) => {
        // Demo mode: re-seed a snapshot older than 2 days so "today" always has life.
        if (state && !state.onboarded && Date.now() - new Date(state.seededAt).getTime() > 2 * 86_400_000) state.resetDemo();
        // PIN lock: always start locked when enabled.
        if (state?.pinLock && firstHydration) setTimeout(() => useApp.setState({ locked: true }), 0);
        firstHydration = false;
      },
    },
  ),
);
