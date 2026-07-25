import { describe, it, expect } from "vitest";
import { parseCashback } from "./cashback";

describe("parseCashback", () => {
  it("parses a percent rate", () => {
    expect(parseCashback("up to 2.7%")).toEqual({ text: "up to 2.7%", kind: "percent", value: 2.7 });
  });
  it("parses an integer percent", () => {
    expect(parseCashback("up to 20%")).toEqual({ text: "up to 20%", kind: "percent", value: 20 });
  });
  it("parses sats with a European thousands separator", () => {
    expect(parseCashback("up to 38.280 sats")).toEqual({ text: "up to 38.280 sats", kind: "sats", value: 38280 });
  });
  it("parses small sats", () => {
    expect(parseCashback("up to 7.975 sats")).toEqual({ text: "up to 7.975 sats", kind: "sats", value: 7975 });
  });
  it("classifies a percent discount code as discount", () => {
    expect(parseCashback("5% discount code")).toEqual({ text: "5% discount code", kind: "discount", value: 5 });
  });
  it("parses a euro discount", () => {
    expect(parseCashback("€5 discount code")).toEqual({ text: "€5 discount code", kind: "discount", value: 5 });
  });
  it("parses a free-months perk as discount", () => {
    expect(parseCashback("1 free month")).toEqual({ text: "1 free month", kind: "discount", value: 1 });
  });
  it("returns unknown for empty input", () => {
    expect(parseCashback("")).toEqual({ text: "", kind: "unknown", value: null });
  });
});
