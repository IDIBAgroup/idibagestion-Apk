export type TaxRulePeriod = {
  effectiveFrom: string;
  effectiveTo?: string | null;
};

/** Date-only ISO values sort lexicographically, so these comparisons are timezone safe. */
export function hasOverlappingTaxRulePeriod(
  existingPeriods: readonly TaxRulePeriod[],
  incomingPeriod: TaxRulePeriod,
) {
  const incomingEnd = incomingPeriod.effectiveTo ?? "9999-12-31";

  return existingPeriods.some((period) =>
    period.effectiveFrom <= incomingEnd &&
    (period.effectiveTo ?? "9999-12-31") >= incomingPeriod.effectiveFrom,
  );
}
