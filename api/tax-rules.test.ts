import { describe, expect, it } from "vitest";
import { hasOverlappingTaxRulePeriod } from "@/lib/ohada/tax-rules";

describe("effective-dated tax rules", () => {
  it("allows adjacent non-overlapping periods", () => {
    expect(hasOverlappingTaxRulePeriod(
      [{ effectiveFrom: "2026-01-01", effectiveTo: "2026-06-30" }],
      { effectiveFrom: "2026-07-01" },
    )).toBe(false);
  });

  it("treats both endpoints as inclusive", () => {
    expect(hasOverlappingTaxRulePeriod(
      [{ effectiveFrom: "2026-01-01", effectiveTo: "2026-06-30" }],
      { effectiveFrom: "2026-06-30", effectiveTo: "2026-12-31" },
    )).toBe(true);
  });

  it("treats an omitted end date as open-ended", () => {
    expect(hasOverlappingTaxRulePeriod(
      [{ effectiveFrom: "2025-01-01" }],
      { effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31" },
    )).toBe(true);
  });

  it("allows a new period before the existing period", () => {
    expect(hasOverlappingTaxRulePeriod(
      [{ effectiveFrom: "2026-01-01", effectiveTo: "2026-12-31" }],
      { effectiveFrom: "2025-01-01", effectiveTo: "2025-12-31" },
    )).toBe(false);
  });
});
