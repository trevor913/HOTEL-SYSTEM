/** Domain types mirror the Drizzle schema (src/lib/db/schema.ts). Money = integer cents. */
export type ID = string;
export type PaymentMethod = "cash" | "mpesa" | "debt" | "split";
export type MenuCategory = "breakfast" | "main" | "side" | "drink" | "snack";
export type ExpenseCategory = "soko" | "gas" | "charcoal" | "rent" | "wages" | "transport" | "license" | "equipment" | "other";
export type DebtStatus = "open" | "partial" | "paid" | "written_off";
export type OrderStatus = "new" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";

export interface Hotel { id: ID; slug: string; name: string; tagline: string; ownerName: string; phone: string; tillNumber: string; locationText: string; openHours: { open: string; close: string } }
export interface Customer { id: ID; name: string; nickname?: string; phone: string | null; notes?: string; totalSpentCents: number; visitCount: number; loyaltyPoints: number; lastSeenAt: string; createdAt: string }
export interface Debt { id: ID; customerId: ID; amountCents: number; balanceCents: number; status: DebtStatus; description: string; createdAt: string; settledAt: string | null }
export interface DebtPayment { id: ID; debtId: ID; amountCents: number; method: "cash" | "mpesa" | "other"; mpesaTxId?: string; createdAt: string }
export interface MenuItem { id: ID; name: string; nameSw: string; category: MenuCategory; priceCents: number; emoji: string; hue: number; isAvailable: boolean; soldOutToday: boolean; sortOrder: number; imageUrl?: string; description?: string }
export interface SaleItem { menuItemId: ID; qty: number; unitPriceCents: number; lineTotalCents: number }
export interface Sale { id: ID; customerId: ID | null; staffId: ID; totalCents: number; paymentMethod: PaymentMethod; channel: "walk_in" | "whatsapp" | "phone" | "app"; items: SaleItem[]; mpesaTxId?: string; createdAt: string }
export interface Expense { id: ID; category: ExpenseCategory; description: string; amountCents: number; supplierId: ID | null; incurredOn: string; createdAt: string }
export interface Supplier { id: ID; name: string; phone: string; whatTheySupply: string; balanceOwedCents: number }
export interface InventoryItem { id: ID; name: string; unit: "kg" | "ltr" | "pcs" | "sack" | "cylinder"; currentQty: number; lowThreshold: number; maxQty: number; lastPriceCents: number }
export interface OrderItem { menuItemId: ID; qty: number; unitPriceCents: number }
export interface Order { id: ID; code: string; customerName: string; customerPhone: string; status: OrderStatus; type: "pickup" | "delivery"; addressText?: string; totalCents: number; paymentStatus: "unpaid" | "paid" | "pay_on_delivery"; riderName?: string; placedVia: "public_menu" | "whatsapp" | "manual"; items: OrderItem[]; createdAt: string; updatedAt: string }
export interface MpesaTxn { id: ID; providerTxId: string; type: "c2b" | "stk"; phone: string; amountCents: number; payerName: string; matchedEntity: "sale" | "debt" | "order" | null; matchedId: ID | null; status: "unmatched" | "matched" | "ignored"; createdAt: string }
export interface Staff { id: ID; name: string; role: "owner" | "staff"; dailyWageCents: number; pin: string }
export interface SmsMessage { id: ID; to: string; toName: string; body: string; kind: "receipt" | "reminder" | "order" | "brief"; status: "queued" | "sent"; channel?: "sms" | "whatsapp"; createdAt: string }
export interface FeedEvent { id: ID; kind: "sale" | "mpesa" | "debt_new" | "debt_paid" | "expense" | "order"; title: string; amountCents: number; createdAt: string }
export interface ChatMessage { id: ID; role: "user" | "assistant"; content: string; card?: ChatCard; createdAt: string }
export type ChatCard =
  | { type: "pnl"; salesCents: number; expensesCents: number; newDebtsCents: number; profitCents: number; label: string }
  | { type: "receipt"; title: string; lines: { label: string; cents: number }[]; totalCents: number; stamp?: string }
  | { type: "debts"; rows: { name: string; cents: number; days: number }[]; totalCents: number }
  | { type: "list"; title: string; rows: { label: string; value: string }[] };

export interface SupplierPayment { id: ID; supplierId: ID; amountCents: number; method: "cash" | "mpesa"; createdAt: string }
export interface StockMove { id: ID; itemId: ID; delta: number; reason: "purchase" | "usage" | "waste" | "adjust"; createdAt: string }
export interface WagePayment { id: ID; staffId: ID; amountCents: number; createdAt: string }
export interface SoldOutEvent { id: ID; itemId: ID; at: string }
export interface WasteEvent { id: ID; itemId: ID; qty: number; at: string }
