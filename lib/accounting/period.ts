export function getCompanyFiscalPeriodBounds(startYear: number, startMonth: number, startDay: number) {
  if (!Number.isInteger(startYear) || !Number.isInteger(startMonth) || !Number.isInteger(startDay) || startMonth < 1 || startMonth > 12 || startDay < 1 || startDay > 31) {
    throw new RangeError("Les paramètres de l’exercice comptable sont invalides.");
  }
  const dateAt = (year: number) => {
    const lastDay = new Date(Date.UTC(year, startMonth, 0)).getUTCDate();
    return new Date(Date.UTC(year, startMonth - 1, Math.min(startDay, lastDay)));
  };
  const start = dateAt(startYear);
  const nextStart = dateAt(startYear + 1);
  const end = new Date(nextStart.getTime() - 86_400_000);
  const startDate = start.toISOString().slice(0, 10);
  const endDate = end.toISOString().slice(0, 10);
  const label = startMonth === 1 && startDay === 1
    ? String(startYear)
    : `${startYear}-${end.getUTCFullYear()}`;
  return { startDate, endDate, label };
}
