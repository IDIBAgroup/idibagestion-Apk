import type { AccountingEntry } from "@/types";

export type AccountingSummary = {
  revenue: number;
  expenses: number;
  netIncome: number;
  assets: number;
  liabilities: number;
  equity: number;
  cashIn: number;
  cashOut: number;
  netCash: number;
};

export const MAX_EXACT_CURRENCY_AMOUNT = Number.MAX_SAFE_INTEGER / 100;

export function convertToBaseAmount(amount: number, exchangeRate: number) {
  if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(exchangeRate) || exchangeRate <= 0) {
    throw new RangeError("Le montant et le taux de conversion doivent être positifs et finis.");
  }
  const convertedAmount = amount * exchangeRate;
  if (!Number.isFinite(convertedAmount) || convertedAmount > MAX_EXACT_CURRENCY_AMOUNT) {
    throw new RangeError("Le montant converti dépasse la précision monétaire prise en charge.");
  }
  const roundedAmount = Math.round((convertedAmount + Number.EPSILON) * 100) / 100;
  if (roundedAmount <= 0) throw new RangeError("Le montant converti est inférieur à la plus petite unité comptable.");
  return roundedAmount;
}

export function areJournalLinesBalanced(lines: Array<{ debit: number; credit: number }>) {
  if (lines.length < 2 || lines.some(({ debit, credit }) => !Number.isFinite(debit) || !Number.isFinite(credit) || debit < 0 || credit < 0 || debit > MAX_EXACT_CURRENCY_AMOUNT || credit > MAX_EXACT_CURRENCY_AMOUNT || (debit > 0 && credit > 0))) return false;
  const debitCents = lines.reduce((sum, line) => sum + Math.round(line.debit * 100), 0);
  const creditCents = lines.reduce((sum, line) => sum + Math.round(line.credit * 100), 0);
  return debitCents === creditCents && debitCents > 0;
}

export function summarizeAccountingEntries(entries: AccountingEntry[]): AccountingSummary {
  const revenue = entries.filter((entry) => entry.accountCode.startsWith("7"))
    .reduce((sum, entry) => sum + entry.credit - entry.debit, 0);
  const expenses = entries.filter((entry) => entry.accountCode.startsWith("6"))
    .reduce((sum, entry) => sum + entry.debit - entry.credit, 0);
  const assets = entries.filter((entry) => ["2", "3", "4", "5"].some((prefix) => entry.accountCode.startsWith(prefix)))
    .reduce((sum, entry) => sum + entry.debit - entry.credit, 0);
  const liabilities = entries.filter((entry) => entry.accountCode.startsWith("1"))
    .reduce((sum, entry) => sum + entry.credit - entry.debit, 0);
  const cashAccounts = entries.filter((entry) => entry.accountCode.startsWith("5"));
  const cashIn = cashAccounts.reduce((sum, entry) => sum + entry.debit, 0);
  const cashOut = cashAccounts.reduce((sum, entry) => sum + entry.credit, 0);
  return { revenue, expenses, netIncome: revenue - expenses, assets, liabilities, equity: assets - liabilities, cashIn, cashOut, netCash: cashIn - cashOut };
}
