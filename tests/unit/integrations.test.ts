import { describe, expect, it } from "vitest";
import { darajaTimestamp, parseC2B, parseDarajaTime, parseStkCallback, stkPassword } from "@/lib/integrations/mpesa/daraja";
import { buildMockC2B } from "@/lib/integrations/mpesa/mock";
import { extractMessages, verifySignature } from "@/lib/integrations/whatsapp";
import { whatsappReply } from "@/lib/domain/whatsapp-bot";
import { HOTEL, MENU, generateSeed } from "@/lib/store/seed";
import { createHmac } from "node:crypto";

describe("Daraja", () => {
  it("timestamp is EAT YYYYMMDDHHmmss and round-trips", () => {
    const d = new Date("2026-10-04T10:15:30Z");
    expect(darajaTimestamp(d)).toBe("20261004131530");
    expect(parseDarajaTime("20261004131530")).toBe(d.toISOString());
  });
  it("stk password", () => expect(stkPassword("174379", "pk", "20261004131530")).toBe(btoa("174379pk20261004131530")));
  it("parses C2B", () => {
    const t = parseC2B({ TransID: "SJK123", TransAmount: "250.00", MSISDN: "0712345678", FirstName: "Otieno", LastName: "Ochieng", TransTime: "20261004131530", BusinessShortCode: "832100" });
    expect(t).toMatchObject({ providerTxId: "SJK123", amountCents: 25000, phone: "254712345678", payerName: "OTIENO OCHIENG", type: "c2b", shortcode: "832100" });
  });
  it("rejects zero amount", () => expect(parseC2B({ TransID: "X", TransAmount: "0" })).toBeNull());
  it("parses STK success + failure", () => {
    const ok = parseStkCallback({ Body: { stkCallback: { MerchantRequestID: "m", CheckoutRequestID: "c", ResultCode: 0, ResultDesc: "ok", CallbackMetadata: { Item: [{ Name: "Amount", Value: 130 }, { Name: "MpesaReceiptNumber", Value: "QK1" }, { Name: "PhoneNumber", Value: 254712345678 }, { Name: "TransactionDate", Value: 20261004131530 }] } } } });
    expect(ok?.txn).toMatchObject({ providerTxId: "QK1", amountCents: 13000, type: "stk" });
    const bad = parseStkCallback({ Body: { stkCallback: { ResultCode: 1032, ResultDesc: "Cancelled by user" } } });
    expect(bad).toMatchObject({ ok: false, resultCode: 1032, txn: null });
  });
  it("mock C2B goes through the real parser", () => {
    const seed = generateSeed(new Date(2026, 9, 2, 13));
    for (let i = 0; i < 20; i++) expect(parseC2B(buildMockC2B(seed))).not.toBeNull();
  });
});

describe("WhatsApp", () => {
  it("verifies signature", () => {
    const body = '{"a":1}';
    const sig = `sha256=${createHmac("sha256", "s3cret").update(body).digest("hex")}`;
    expect(verifySignature(body, sig, "s3cret")).toBe(true);
    expect(verifySignature(body, sig, "nope")).toBe(false);
  });
  it("extracts text messages", () => {
    const m = extractMessages({ entry: [{ changes: [{ value: { contacts: [{ wa_id: "2547", profile: { name: "Jane" } }], messages: [{ from: "2547", id: "w1", type: "text", text: { body: "Menyu" } }] } }] }] });
    expect(m).toEqual([{ from: "2547", id: "w1", text: "Menyu", name: "Jane" }]);
  });
  const ctx = { hotel: HOTEL, menu: MENU, appUrl: "https://x.app" };
  it("menu reply", () => expect(whatsappReply("Menyu tafadhali", ctx).kind).toBe("menu"));
  it("orders by text", () => {
    // "chapati na madondo" is the combo dish (longest alias wins)
    expect(whatsappReply("nataka 2 chapati na madondo", ctx)).toMatchObject({ kind: "order", type: "pickup", totalCents: 2 * 11000, items: [{ itemId: "m-chapati-madondo", qty: 2 }] });
    expect(whatsappReply("nataka chapati 3 na chai", ctx)).toMatchObject({ kind: "order", totalCents: 3 * 2000 + 3000 });
  });
  it("delivery orders", () => expect(whatsappReply("Niletee ugali beef na chai", ctx)).toMatchObject({ kind: "order", type: "delivery" }));
  it("sold-out item is refused", () => {
    const menu = MENU.map((m) => (m.id === "m-pilau" ? { ...m, soldOutToday: true } : m));
    expect(whatsappReply("nataka pilau", { ...ctx, menu }).kind).toBe("sold_out");
  });
  it("hours", () => expect(whatsappReply("Mko wazi saa ngapi?", ctx).kind).toBe("hours"));
});
