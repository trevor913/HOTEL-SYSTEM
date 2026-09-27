import { describe, expect, it } from "vitest";
import { formatKES, lineTotal, pctChange, splitCents, toCents } from "@/lib/utils/money";
import { normalizePhone, formatPhone } from "@/lib/utils/phone";

describe("money", () => {
  it("converts without float drift", () => { expect(toCents(0.1 + 0.2)).toBe(30); expect(toCents(1250)).toBe(125000); });
  it("formats KSh", () => {
    expect(formatKES(125000)).toBe("KSh 1,250");
    expect(formatKES(1250)).toBe("KSh 12.50");
    expect(formatKES(-5000)).toBe("−KSh 50");
    expect(formatKES(1240000, { compact: true })).toBe("KSh 12.4K");
  });
  it("rejects float cents", () => expect(() => formatKES(10.5)).toThrow());
  it("splits and sums back", () => {
    const parts = splitCents(1000, 3);
    expect(parts).toEqual([334, 333, 333]);
    expect(parts.reduce((a, b) => a + b)).toBe(1000);
  });
  it("line totals", () => expect(lineTotal(18000, 3)).toBe(54000));
  it("pct change", () => { expect(pctChange(112, 100)).toBe(12); expect(pctChange(5, 0)).toBeNull(); });
});

describe("phone", () => {
  it.each([["0712345678", "254712345678"], ["+254 712 345 678", "254712345678"], ["712345678", "254712345678"], ["0110123456", "254110123456"]])(
    "%s", (i, o) => expect(normalizePhone(i)).toBe(o));
  it("rejects junk", () => expect(normalizePhone("12345")).toBeNull());
  it("formats", () => expect(formatPhone("254712345678")).toBe("0712 345 678"));
});
