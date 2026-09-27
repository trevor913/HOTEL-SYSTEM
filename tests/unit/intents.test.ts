import { describe, expect, it } from "vitest";
import { parseIntent } from "@/lib/ai/intents";
import { DEMO_CATALOG as C } from "@/lib/demo/catalog";

describe("§6.3 mandatory utterances", () => {
  it("sale with quantities and cash", () => {
    expect(parseIntent("Nimeuza ugali samaki mbili na chai moja, cash", C)).toEqual({
      kind: "log_sale", method: "cash",
      items: [{ itemId: "m-ugali-samaki", name: "Ugali Samaki", qty: 2 }, { itemId: "m-chai", name: "Chai", qty: 1 }],
    });
  });
  it("new debt", () => expect(parseIntent("Andika deni ya Otieno mia mbili hamsini", C)).toEqual({ kind: "log_debt", customer: "Otieno", amountKes: 250 }));
  it("full settlement", () => expect(parseIntent("Otieno amelipa deni yote", C)).toMatchObject({ kind: "record_debt_payment", customer: "Otieno", amountKes: "all" }));
  it("multi-item expenses", () => expect(parseIntent("Nimenunua nyama elfu mbili na sukuma mia tatu", C)).toEqual({
    kind: "log_expense",
    items: [{ label: "Nyama", category: "soko", amountKes: 2000 }, { label: "Sukuma", category: "soko", amountKes: 300 }],
  }));
  it("daily summary", () => expect(parseIntent("Leo nimepataje?", C)).toEqual({ kind: "get_daily_summary" }));
  it("debts report", () => expect(parseIntent("Nani ananidai... eeh, nani nina madeni yao?", C)).toEqual({ kind: "get_debts_report" }));
  it("sold out", () => expect(parseIntent("Wali imeisha", C)).toMatchObject({ kind: "set_item_soldout", itemId: "m-wali" }));
  it("stock check", () => expect(parseIntent("Mafuta imebaki lita ngapi?", C)).toMatchObject({ kind: "check_stock", itemId: "i-mafuta" }));
});

describe("extra utterances", () => {
  it.each([
    ["Wanjiku amelipa mia mbili mpesa", { kind: "record_debt_payment", customer: "Wanjiku", amountKes: 200, method: "mpesa" }],
    ["Nimeuza chapo tatu na madondo mbili mpesa", { kind: "log_sale", method: "mpesa" }],
    ["Nimelipa gas elfu tatu mia mbili", { kind: "log_expense", items: [{ label: "Gas", category: "gas", amountKes: 3200 }] }],
    ["Chapati zimeisha", { kind: "set_item_soldout", itemId: "m-chapati" }],
    ["Kesho nipike nini?", { kind: "plan_tomorrow" }],
    ["Kumbusha Kamau deni lake", { kind: "send_debt_reminder", customer: "Kamau" }],
    ["Habari", { kind: "greeting" }],
    ["Nimeuza pilau nne", { kind: "log_sale", items: [{ itemId: "m-pilau", name: "Pilau", qty: 4 }] }],
    ["Weka deni ya Mwangi elfu moja mia tano", { kind: "log_debt", customer: "Mwangi", amountKes: 1500 }],
    ["Ripoti ya wiki hii", { kind: "get_week_report" }],
  ])("%s", (u, expected) => expect(parseIntent(u, C)).toMatchObject(expected));
});
