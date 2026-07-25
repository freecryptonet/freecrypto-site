import { describe, it, expect } from "vitest";
import { isStoreIndexable } from "./seo";

describe("isStoreIndexable", () => {
  it("is false for thin content", () => {
    expect(isStoreIndexable({ description_md: "short", how_it_works_md: "", worth_it_md: "" })).toBe(false);
  });
  it("is true once combined content clears 800 chars", () => {
    const big = "x".repeat(500);
    expect(isStoreIndexable({ description_md: big, how_it_works_md: big, worth_it_md: "" })).toBe(true);
  });
  it("sums all three fields", () => {
    const chunk = "y".repeat(300);
    expect(isStoreIndexable({ description_md: chunk, how_it_works_md: chunk, worth_it_md: chunk })).toBe(true);
  });
});
