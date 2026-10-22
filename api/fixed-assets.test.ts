import { describe, expect, it } from "vitest";
import { calculateEstimatedDepreciation } from "@/lib/finance/fixed-assets";

describe("fixed asset depreciation estimates", () => {
  it("calculates a straight-line estimate from elapsed months", () => {
    expect(calculateEstimatedDepreciation(1_200_000, "2025-01-01", 4, "linear", new Date("2026-01-01T00:00:00Z"))).toBe(300_000);
  });

  it("does not depreciate an asset before acquisition", () => {
    expect(calculateEstimatedDepreciation(1_200_000, "2026-04-01", 4, "linear", new Date("2026-03-31T00:00:00Z"))).toBe(0);
  });

  it("caps the estimate at acquisition value", () => {
    expect(calculateEstimatedDepreciation(1_200_000, "2020-01-01", 2, "linear", new Date("2026-01-01T00:00:00Z"))).toBe(1_200_000);
  });

  it("keeps declining-balance estimates within the acquisition value", () => {
    const estimate = calculateEstimatedDepreciation(1_200_000, "2025-01-01", 5, "degressive", new Date("2026-01-01T00:00:00Z"));
    expect(estimate).toBeGreaterThan(0);
    expect(estimate).toBeLessThan(1_200_000);
  });
});
