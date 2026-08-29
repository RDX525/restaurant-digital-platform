import { describe, expect, it } from "vitest";
import {
  buildSafeMetricSummary,
  claimIsSupported,
  collectNumericValues,
  extractNumericClaims,
  requiresVerifiedMetrics,
  validateMetricClaims,
} from "./safeguards";

describe("intelligence safeguards", () => {
  it("detects when a question requires verified metrics", () => {
    expect(requiresVerifiedMetrics("How much revenue did I make last week?")).toBe(true);
    expect(requiresVerifiedMetrics("Write a friendly greeting")).toBe(false);
  });

  it("collects numeric values from source metrics", () => {
    const allowed = collectNumericValues({
      revenue: 5240,
      orders: 42,
      nested: { deltaPercent: 8.2 },
    });

    expect(claimIsSupported(5240, allowed)).toBe(true);
    expect(claimIsSupported(9999, allowed)).toBe(false);
  });

  it("rejects unsupported numeric claims in generated text", () => {
    const sourceMetrics = {
      get_sales_summary: { revenue: 120, orders: 3, averageOrderValue: 40 },
    };

    const valid = validateMetricClaims({
      text: "Verified sales were NZ$120 from 3 paid orders.",
      sourceMetrics,
    });
    const invalid = validateMetricClaims({
      text: "Yesterday revenue was NZ$9,999.",
      sourceMetrics,
    });

    expect(valid.valid).toBe(true);
    expect(invalid.valid).toBe(false);
    expect(invalid.unsupportedClaims).toContain(9999);
  });

  it("extracts currency and percentage claims from AI text", () => {
    const claims = extractNumericClaims(
      "Yesterday revenue was NZ$5,240, 8.2% above average from 42 orders.",
    );

    expect(claims).toContain(5240);
    expect(claims).toContain(8.2);
    expect(claims).toContain(42);
  });

  it("builds a safe fallback summary from verified metrics only", () => {
    const summary = buildSafeMetricSummary({
      get_sales_summary: { revenue: 120, orders: 3, averageOrderValue: 40 },
      get_customer_summary: { inactiveCustomers: 7, returningCustomers: 2, newCustomers: 1 },
    });

    expect(summary).toContain("NZ$120");
    expect(summary).toContain("3 paid orders");
    expect(summary).toContain("7 inactive");
  });
});
