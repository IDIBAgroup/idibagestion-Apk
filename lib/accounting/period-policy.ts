export function canCloseFiscalPeriod(role: string) {
  return ["platform_admin", "owner", "admin", "manager"].includes(role);
}

export function canReopenFiscalPeriod(role: string) {
  return ["platform_admin", "owner", "admin"].includes(role);
}

export function isDateInFiscalPeriod(date: string, period: { startDate: string; endDate: string }) {
  return period.startDate <= date && period.endDate >= date;
}
