export type DepreciationMethod = "linear" | "degressive";

/** Approximation for the asset list only; official accounting entries must be validated separately. */
export function calculateEstimatedDepreciation(
  acquisitionValue: number,
  acquisitionDate: string,
  usefulLifeYears: number,
  method: DepreciationMethod,
  asOf = new Date(),
) {
  if (!Number.isFinite(acquisitionValue) || acquisitionValue <= 0 || !acquisitionDate || !Number.isFinite(usefulLifeYears) || usefulLifeYears <= 0) return 0;
  const start = new Date(`${acquisitionDate}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime())) return 0;
  const elapsedMonths = Math.max(0, (asOf.getUTCFullYear() - start.getUTCFullYear()) * 12 + asOf.getUTCMonth() - start.getUTCMonth());
  const lifeMonths = usefulLifeYears * 12;
  if (method === "linear") return Math.min(acquisitionValue, acquisitionValue * elapsedMonths / lifeMonths);
  const annualRate = Math.min(1, 2 / usefulLifeYears);
  return Math.min(acquisitionValue, acquisitionValue * (1 - Math.pow(1 - annualRate, elapsedMonths / 12)));
}
