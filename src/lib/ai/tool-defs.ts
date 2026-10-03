/**
 * Msaidizi tool schemas (§6.2). Shared by the server route (sent to Anthropic) and the
 * client executor (src/lib/ai/tools.ts). No runtime deps so it is safe on both sides.
 */
import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

const confirmed = { type: "boolean", description: "Set true ONLY after the owner explicitly confirmed an amount above KSh 5,000." } as const;
const lineItems = {
  type: "array",
  items: { type: "object", properties: { item: { type: "string", description: "Menu item name as said, e.g. 'chapo', 'ugali samaki'" }, qty: { type: "number" } }, required: ["item", "qty"] },
} as const;

export const TOOL_DEFS: Tool[] = [
  { name: "log_sale", description: "Record a sale of menu items.", input_schema: { type: "object", properties: { items: lineItems, method: { type: "string", enum: ["cash", "mpesa", "debt"] }, customer: { type: "string", description: "Required when method is debt" }, confirmed }, required: ["items", "method"] } },
  { name: "log_debt", description: "Record that a customer ate on credit (new deni) for an amount.", input_schema: { type: "object", properties: { customer: { type: "string" }, amount_kes: { type: "number" }, note: { type: "string" }, confirmed }, required: ["customer", "amount_kes"] } },
  { name: "record_debt_payment", description: "Record a customer paying their debt. Omit amount_kes or set settle_all to clear the full balance.", input_schema: { type: "object", properties: { customer: { type: "string" }, amount_kes: { type: "number" }, settle_all: { type: "boolean" }, method: { type: "string", enum: ["cash", "mpesa"] }, confirmed }, required: ["customer"] } },
  { name: "log_expense", description: "Record money spent (soko, gas, makaa, rent, wages, transport...).", input_schema: { type: "object", properties: { items: { type: "array", items: { type: "object", properties: { label: { type: "string" }, category: { type: "string", enum: ["soko", "gas", "charcoal", "rent", "wages", "transport", "license", "equipment", "other"] }, amount_kes: { type: "number" } }, required: ["label", "amount_kes"] } }, confirmed }, required: ["items"] } },
  { name: "get_daily_summary", description: "P&L for a business day: sales, expenses, new debts, profit. days_ago 0 = today, 1 = yesterday.", input_schema: { type: "object", properties: { days_ago: { type: "number" } } } },
  { name: "get_debts_report", description: "Everyone who owes money, with balances and aging buckets (0-7, 8-30, 30+ days).", input_schema: { type: "object", properties: {} } },
  { name: "get_customer_profile", description: "A customer's visits, spend, loyalty points and open debts.", input_schema: { type: "object", properties: { customer: { type: "string" } }, required: ["customer"] } },
  { name: "check_stock", description: "Stock level for an ingredient. Omit item to list everything running low.", input_schema: { type: "object", properties: { item: { type: "string" } } } },
  { name: "update_stock", description: "Change stock of an ingredient: set an exact quantity, or add / subtract.", input_schema: { type: "object", properties: { item: { type: "string" }, qty: { type: "number" }, mode: { type: "string", enum: ["set", "add", "subtract"] } }, required: ["item", "qty", "mode"] } },
  { name: "get_best_sellers", description: "Top-selling menu items over the last N days (default 7).", input_schema: { type: "object", properties: { days: { type: "number" } } } },
  { name: "plan_tomorrow", description: "How many plates of each item to cook tomorrow, from 3 weeks of sales history.", input_schema: { type: "object", properties: {} } },
  { name: "send_debt_reminder", description: "Send a polite SMS reminder. customer='all' reminds everyone with debts older than 7 days.", input_schema: { type: "object", properties: { customer: { type: "string" } }, required: ["customer"] } },
  { name: "create_order", description: "Create a pickup or delivery order.", input_schema: { type: "object", properties: { customer_name: { type: "string" }, phone: { type: "string" }, items: lineItems, type: { type: "string", enum: ["pickup", "delivery"] }, address: { type: "string" } }, required: ["customer_name", "items", "type"] } },
  { name: "get_week_report", description: "P&L for the last 7 business days.", input_schema: { type: "object", properties: {} } },
  { name: "add_menu_item", description: "Add a new dish to the menu.", input_schema: { type: "object", properties: { name: { type: "string" }, price_kes: { type: "number" }, category: { type: "string", enum: ["breakfast", "main", "side", "drink", "snack"] }, emoji: { type: "string" } }, required: ["name", "price_kes"] } },
  { name: "set_item_soldout", description: "Mark a dish sold out for today (sold_out=false brings it back).", input_schema: { type: "object", properties: { item: { type: "string" }, sold_out: { type: "boolean" } }, required: ["item"] } },
  { name: "log_supplier_purchase", description: "Record buying stock from a supplier (wasambazaji). paid=false adds to what the hotel owes them.", input_schema: { type: "object", properties: { supplier: { type: "string" }, description: { type: "string" }, amount_kes: { type: "number" }, paid: { type: "boolean" }, confirmed }, required: ["supplier", "description", "amount_kes"] } },
  { name: "search_anything", description: "Search customers, menu, suppliers, stock, orders and debts by keyword.", input_schema: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } },
];