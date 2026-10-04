import type { Dict } from "./index";

export const en: Dict = {
  brand: { tagline: "Your business. On your phone." },
  nav: { home: "Today", mauzo: "Sales", madeni: "Debts", oda: "Orders", msaidizi: "Assistant", matumizi: "Expenses", more: "More", settings: "Settings", outbox: "SMS Outbox" },
  greet: { morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", night: "Good night" },
  home: {
    sales: "Today's Sales", expenses: "Expenses", profit: "Profit", newDebts: "New Debts", meter: "Profit Meter",
    vsAvg: "vs 7-day average", feed: "Live feed", lowStock: "Low stock", pendingOrders: "Orders waiting",
    soldOut: "Sold out", empty: "Nothing yet today. Log your first sale.", viewAll: "See all", yesterdayNote: "It's still night, showing yesterday's numbers.",
    cash: "Cash", mpesa: "M-Pesa",
  },
  fab: { sale: "Log Sale", debt: "Log Debt", expense: "Log Expense", voice: "Voice Note" },
  madeni: {
    title: "Debts", outstanding: "Total outstanding", debtors: "Debtors", oldest: "Oldest debt", recovered: "Recovered this week",
    all: "All", days: "days", pay: "Pay", remind: "Remind", newDebt: "New Debt", lastPaid: "Last paid", never: "Never paid",
    recordPayment: "Record Payment", settle: "Pay All", confirm: "Confirm", settled: "Debt Cleared!", reminderSent: "Reminder sent",
    history: "Debt history", pickCustomer: "Pick customer", newCustomer: "New customer", name: "Name", phone: "Phone (optional)",
    amount: "Amount", note: "Note (optional)", save: "Save Debt", search: "Search customer…", emptyTitle: "No debts here", emptyBody: "Everyone has paid. That's clean business.",
    balance: "Balance", swipeHint: "Swipe right to pay, left to remind", overpay: "Amount exceeds balance",
  },
  mauzo: { title: "Sales", total: "Total", method: "Payment method", onDebt: "Put on credit", logSale: "Log Sale", logged: "Sale logged", clear: "Clear", today: "Today", sales: "sales", filterAll: "All", pos: "Sell", list: "History" },
  matumizi: { title: "Expenses", soko: "Today's Market", add: "Add", logged: "Logged", byCategory: "By category", thisWeek: "this week", recent: "Recent", other: "Other", description: "Description" },
  oda: { title: "Orders", new: "New", preparing: "Preparing", ready: "Ready", out: "On the way", delivered: "Delivered", advance: "Advance", pickup: "Pickup", delivery: "Delivery", paid: "Paid", pod: "Pay on delivery", emptyCol: "No orders" },
  msaidizi: { title: "Assistant", placeholder: "Type or hold the mic…", hold: "Hold the mic to record", recording: "Recording… release to send", thinking: "Thinking…", suggestions: ["How did I do today?", "All debts", "Sold chapo 2 and chai, mpesa", "Plan for tomorrow", "How much oil is left?"], intro: "Tell me anything about the business: sales, debts, expenses, stock. I understand Swahili, Sheng and English." },
  settings: { title: "Settings", language: "Language", theme: "Theme", dark: "Dark", light: "Light", reset: "Reset demo data", outbox: "SMS Outbox", outboxBody: "Every SMS that would go to customers (mock mode).", simulate: "Simulate M-Pesa payment", simulated: "Payment simulated and matched", noSms: "No SMS yet. Settle a debt or send a reminder to see one here.", whatsappSim: "WhatsApp Simulator", reconcile: "Reconcile M-Pesa", integrations: "Integrations" },
  pay: { cash: "Cash", mpesa: "M-Pesa", debt: "Credit" },
  briefs: { evening: "Evening Pulse", morning: "Morning Brief", toWhatsapp: "Send to my WhatsApp", sentWa: "Sent to your WhatsApp", nudgesTitle: "debt reminders waiting", nudgesBody: "Debts older than 7 days. Tap ✓ to send.", approveAll: "Send all", sentMany: "reminders sent" },
  reconcile: { title: "Reconcile M-Pesa", unmatched: "unmatched", allClear: "Every payment is matched 👌", allClearBody: "New M-Pesa payments we can't place will show up here.", simulate: "Simulate M-Pesa payment (C2B)", asSale: "It's a sale", toDebt: "Debt of…", ignore: "Ignore", recent: "Recent", pickDebtor: "Whose debt is it?", suggested: "Suggestion", matchedToast: "Matched", auto: "auto-matched", ignored: "Ignored", entity: { sale: "Sale", debt: "Debt", order: "Order" } },
  whatsapp: { title: "WhatsApp Simulator", customer: "Customer", owner: "Me (owner)", placeholder: "Message", online: "online", intro: "Try how customers order on WhatsApp. Orders land straight in Orders.", ownerIntro: "Talk to the Assistant over WhatsApp as the owner.", orderIn: "New WhatsApp order", quick: ["Menu", "Nataka 2 chapati na madondo", "Niletee ugali beef na chai", "What are your hours?", "Where are you?"], quickOwner: ["How did I do today?", "All debts", "What should I cook tomorrow?"] },
  common: { done: "Done", cancel: "Cancel", back: "Back", close: "Close", offline: "Waiting for network", pending: "pending", more: "Show more" },
};
