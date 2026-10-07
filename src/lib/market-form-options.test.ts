import { describe, expect, it } from "vitest";
import { BUDGET_UNITS, CUSTOMER_OPTIONS, formatBudget } from "./market-form-options";

describe("market form options", () => {
  it("accepts budgets in thousands, lakhs, and crores", () => {
    expect(BUDGET_UNITS).toEqual(["Thousand", "Lakh", "Crore"]);
    expect(formatBudget("500", "Thousand")).toBe("₹500 thousand");
    expect(formatBudget("15", "Lakh")).toBe("₹15 lakh");
    expect(formatBudget("2", "Crore")).toBe("₹2 crore");
  });

  it("offers common target customers and a custom option", () => {
    expect(CUSTOMER_OPTIONS).toContain("Students");
    expect(CUSTOMER_OPTIONS).toContain("Parents");
    expect(CUSTOMER_OPTIONS).toContain("Other");
  });
});