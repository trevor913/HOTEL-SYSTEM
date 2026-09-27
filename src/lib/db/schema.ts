/**
 * Drizzle schema — Supabase Postgres (§5). Money = integer cents. Phones = 2547XXXXXXXX.
 * RLS policies live in drizzle/0001_rls.sql.
 */
import { boolean, date, integer, jsonb, numeric, pgEnum, pgTable, text, timestamp, uuid, doublePrecision } from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const hotelId = () => uuid("hotel_id").notNull().references(() => hotels.id, { onDelete: "cascade" });

export const roleEnum = pgEnum("role", ["owner", "staff", "admin"]);
export const debtStatusEnum = pgEnum("debt_status", ["open", "partial", "paid", "written_off"]);
export const payMethodEnum = pgEnum("pay_method", ["cash", "mpesa", "other"]);
export const saleMethodEnum = pgEnum("sale_method", ["cash", "mpesa", "debt", "split"]);
export const channelEnum = pgEnum("channel", ["walk_in", "whatsapp", "phone", "app"]);
export const menuCategoryEnum = pgEnum("menu_category", ["breakfast", "main", "side", "drink", "snack"]);
export const expenseCategoryEnum = pgEnum("expense_category", ["soko", "gas", "charcoal", "rent", "wages", "transport", "license", "equipment", "other"]);
export const supplierTxnEnum = pgEnum("supplier_txn_type", ["purchase", "payment"]);
export const unitEnum = pgEnum("unit", ["kg", "ltr", "pcs", "sack", "cylinder"]);
export const stockReasonEnum = pgEnum("stock_reason", ["purchase", "usage", "waste", "adjust"]);
export const orderStatusEnum = pgEnum("order_status", ["new", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"]);
export const orderTypeEnum = pgEnum("order_type", ["pickup", "delivery"]);
export const orderPayEnum = pgEnum("order_payment_status", ["unpaid", "paid", "pay_on_delivery"]);
export const placedViaEnum = pgEnum("placed_via", ["public_menu", "whatsapp", "manual"]);
export const mpesaTypeEnum = pgEnum("mpesa_type", ["c2b", "stk"]);
export const matchEntityEnum = pgEnum("match_entity", ["sale", "debt", "order"]);
export const mpesaStatusEnum = pgEnum("mpesa_status", ["unmatched", "matched", "ignored"]);
export const aiRoleEnum = pgEnum("ai_role", ["user", "assistant", "tool"]);

export const hotels = pgTable("hotels", {
  id: id(), slug: text("slug").notNull().unique(), name: text("name").notNull(), tagline: text("tagline"),
  ownerId: uuid("owner_id").notNull(), phone: text("phone"), tillNumber: text("till_number"), locationText: text("location_text"),
  lat: doublePrecision("lat"), lng: doublePrecision("lng"), logoUrl: text("logo_url"), currency: text("currency").notNull().default("KES"),
  openHours: jsonb("open_hours"), settings: jsonb("settings"), createdAt: createdAt(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), hotelId: uuid("hotel_id").references(() => hotels.id), fullName: text("full_name").notNull(),
  phone: text("phone"), role: roleEnum("role").notNull().default("owner"), avatarUrl: text("avatar_url"), pinHash: text("pin_hash"), createdAt: createdAt(),
});

export const customers = pgTable("customers", {
  id: id(), hotelId: hotelId(), name: text("name").notNull(), nickname: text("nickname"), phone: text("phone"), photoUrl: text("photo_url"),
  notes: text("notes"), totalSpentCents: integer("total_spent_cents").notNull().default(0), visitCount: integer("visit_count").notNull().default(0),
  loyaltyPoints: integer("loyalty_points").notNull().default(0), lastSeenAt: timestamp("last_seen_at", { withTimezone: true }), createdAt: createdAt(),
});

export const debts = pgTable("debts", {
  id: id(), hotelId: hotelId(), customerId: uuid("customer_id").notNull().references(() => customers.id),
  amountCents: integer("amount_cents").notNull(), balanceCents: integer("balance_cents").notNull(),
  status: debtStatusEnum("status").notNull().default("open"), description: text("description"), items: jsonb("items"),
  dueDate: date("due_date"), createdBy: uuid("created_by"), createdAt: createdAt(), settledAt: timestamp("settled_at", { withTimezone: true }),
});

export const debtPayments = pgTable("debt_payments", {
  id: id(), debtId: uuid("debt_id").notNull().references(() => debts.id, { onDelete: "cascade" }), amountCents: integer("amount_cents").notNull(),
  method: payMethodEnum("method").notNull(), mpesaTxId: text("mpesa_tx_id"), note: text("note"), createdAt: createdAt(),
});

export const menuItems = pgTable("menu_items", {
  id: id(), hotelId: hotelId(), name: text("name").notNull(), nameSw: text("name_sw"), category: menuCategoryEnum("category").notNull(),
  priceCents: integer("price_cents").notNull(), imageUrl: text("image_url"), isAvailable: boolean("is_available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0), createdAt: createdAt(),
});

export const dailyMenus = pgTable("daily_menus", {
  id: id(), hotelId: hotelId(), date: date("date").notNull(), itemId: uuid("item_id").notNull().references(() => menuItems.id),
  plannedQty: integer("planned_qty"), cookedQty: integer("cooked_qty"), soldQty: integer("sold_qty").default(0),
  soldoutAt: timestamp("soldout_at", { withTimezone: true }), wasteQty: integer("waste_qty").default(0), notes: text("notes"),
});

export const sales = pgTable("sales", {
  id: id(), hotelId: hotelId(), customerId: uuid("customer_id").references(() => customers.id), staffId: uuid("staff_id"),
  totalCents: integer("total_cents").notNull(), paymentMethod: saleMethodEnum("payment_method").notNull(), mpesaTxId: text("mpesa_tx_id"),
  channel: channelEnum("channel").notNull().default("walk_in"), note: text("note"), createdAt: createdAt(),
});

export const saleItems = pgTable("sale_items", {
  id: id(), saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }), menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id),
  qty: integer("qty").notNull(), unitPriceCents: integer("unit_price_cents").notNull(), lineTotalCents: integer("line_total_cents").notNull(),
});

export const suppliers = pgTable("suppliers", {
  id: id(), hotelId: hotelId(), name: text("name").notNull(), phone: text("phone"), whatTheySupply: text("what_they_supply"),
  balanceOwedCents: integer("balance_owed_cents").notNull().default(0), createdAt: createdAt(),
});

export const supplierTxns = pgTable("supplier_txns", {
  id: id(), supplierId: uuid("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }), type: supplierTxnEnum("type").notNull(),
  amountCents: integer("amount_cents").notNull(), note: text("note"), createdAt: createdAt(),
});

export const expenses = pgTable("expenses", {
  id: id(), hotelId: hotelId(), category: expenseCategoryEnum("category").notNull(), description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(), supplierId: uuid("supplier_id").references(() => suppliers.id), receiptPhotoUrl: text("receipt_photo_url"),
  incurredOn: date("incurred_on").notNull(), createdBy: uuid("created_by"), createdAt: createdAt(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: id(), hotelId: hotelId(), name: text("name").notNull(), unit: unitEnum("unit").notNull(), currentQty: numeric("current_qty").notNull().default("0"),
  lowThreshold: numeric("low_threshold").notNull().default("0"), lastPriceCents: integer("last_price_cents"), createdAt: createdAt(),
});

export const stockMoves = pgTable("stock_moves", {
  id: id(), inventoryItemId: uuid("inventory_item_id").notNull().references(() => inventoryItems.id, { onDelete: "cascade" }),
  delta: numeric("delta").notNull(), reason: stockReasonEnum("reason").notNull(), note: text("note"), createdAt: createdAt(),
});

export const orders = pgTable("orders", {
  id: id(), hotelId: hotelId(), customerId: uuid("customer_id").references(() => customers.id), code: text("code").notNull(),
  status: orderStatusEnum("status").notNull().default("new"), type: orderTypeEnum("type").notNull(), addressText: text("address_text"),
  totalCents: integer("total_cents").notNull(), paymentStatus: orderPayEnum("payment_status").notNull().default("unpaid"), mpesaTxId: text("mpesa_tx_id"),
  riderName: text("rider_name"), riderPhone: text("rider_phone"), placedVia: placedViaEnum("placed_via").notNull(), createdAt: createdAt(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: id(), orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }), menuItemId: uuid("menu_item_id").notNull().references(() => menuItems.id),
  qty: integer("qty").notNull(), unitPriceCents: integer("unit_price_cents").notNull(),
});

export const mpesaTxns = pgTable("mpesa_txns", {
  id: id(), hotelId: hotelId(), providerTxId: text("provider_tx_id").notNull().unique(), type: mpesaTypeEnum("type").notNull(), phone: text("phone"),
  amountCents: integer("amount_cents").notNull(), payerName: text("payer_name"), raw: jsonb("raw"), matchedEntity: matchEntityEnum("matched_entity"),
  matchedId: uuid("matched_id"), status: mpesaStatusEnum("status").notNull().default("unmatched"), createdAt: createdAt(),
});

export const staffShifts = pgTable("staff_shifts", {
  id: id(), hotelId: hotelId(), staffId: uuid("staff_id").notNull(), date: date("date").notNull(), present: boolean("present").notNull().default(true),
  wageCents: integer("wage_cents").notNull().default(0), paid: boolean("paid").notNull().default(false), note: text("note"),
});

export const aiMessages = pgTable("ai_messages", {
  id: id(), hotelId: hotelId(), userId: uuid("user_id"), role: aiRoleEnum("role").notNull(), content: text("content").notNull(),
  audioUrl: text("audio_url"), intent: text("intent"), toolCalls: jsonb("tool_calls"), createdAt: createdAt(),
});

export const notifications = pgTable("notifications", {
  id: id(), hotelId: hotelId(), kind: text("kind").notNull(), title: text("title").notNull(), body: text("body"), read: boolean("read").notNull().default(false), createdAt: createdAt(),
});

export const auditLog = pgTable("audit_log", {
  id: id(), hotelId: hotelId(), actorId: uuid("actor_id"), action: text("action").notNull(), entity: text("entity").notNull(),
  entityId: uuid("entity_id"), diff: jsonb("diff"), createdAt: createdAt(),
});
