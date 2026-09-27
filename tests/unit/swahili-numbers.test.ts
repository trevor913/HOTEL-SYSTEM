import { describe, expect, it } from "vitest";
import { extractAmountSegments, parseSwahiliAmount } from "@/lib/utils/swahili-numbers";

describe("parseSwahiliAmount", () => {
  it.each([
    ["mia mbili hamsini", 250], ["elfu mbili", 2000], ["elfu moja mia tano", 1500], ["mia tatu", 300],
    ["laki moja", 100000], ["2k", 2000], ["2,500", 2500], ["ngiri 2", 2000], ["hamsini", 50],
    ["elfu mbili mia tano hamsini", 2550], ["mia", 100], ["thao", 1000], ["ishirini na tano", 25],
    ["elfu kumi na tano", 15000], ["mia tano na hamsini", 550], ["elfu ishirini na tano", 25000],
    ["elfu moja mia mbili hamsini", 1250], ["Andika deni ya Otieno mia mbili hamsini", 250],
  ])("%s → %d", (input, expected) => expect(parseSwahiliAmount(input)).toBe(expected));

  it("returns null with no amount", () => expect(parseSwahiliAmount("habari yako")).toBeNull());

  it("extracts labelled segments", () => {
    expect(extractAmountSegments("Nimenunua nyama elfu mbili na sukuma mia tatu")).toEqual([
      { label: "nimenunua nyama", amount: 2000 },
      { label: "sukuma", amount: 300 },
    ]);
  });
});
