import { describe, expect, it } from "vitest";
import { OHADA_POSTING_ACCOUNTS } from "@/data/ohada-chart";
import { areJournalLinesBalanced, convertToBaseAmount, summarizeAccountingEntries } from "@/lib/accounting/journal";
import { getCompanyFiscalPeriodBounds } from "@/lib/accounting/period";
import { canCloseFiscalPeriod, canReopenFiscalPeriod, isDateInFiscalPeriod } from "@/lib/accounting/period-policy";
import { getClosingAccountBalance, signedAccountBalance, splitAccountBalance } from "@/lib/accounting/trial-balance";
import type { AccountingEntry } from "@/types";

describe("SYSCOHADA journal rules", () => {
  it("converts transaction currency to the company base currency with cent precision", () => {
    expect(convertToBaseAmount(125.55, 600.25)).toBe(75_361.39);
    expect(() => convertToBaseAmount(100, 0)).toThrow(RangeError);
    expect(() => convertToBaseAmount(1_000_000_000_000, 1_000_000_000)).toThrow(RangeError);
    expect(() => convertToBaseAmount(0.01, 0.01)).toThrow(RangeError);
  });

  it("accepts only balanced, one-sided journal lines", () => {
    expect(areJournalLinesBalanced([{ debit: 150_000, credit: 0 }, { debit: 0, credit: 150_000 }])).toBe(true);
    expect(areJournalLinesBalanced([{ debit: 150_000, credit: 0 }, { debit: 0, credit: 149_999.99 }])).toBe(false);
    expect(areJournalLinesBalanced([{ debit: 150_000, credit: 10 }, { debit: 0, credit: 150_000 }])).toBe(false);
  });

  it("exposes only detail accounts for posting and contains the common customer and sales accounts", () => {
    const codes = new Set(OHADA_POSTING_ACCOUNTS.map(({ code }) => code));
    expect(codes.has("4111")).toBe(true);
    expect(codes.has("706")).toBe(true);
    expect(codes.has("411")).toBe(false);
    expect([...codes].some((code) => [...codes].some((other) => other.length > code.length && other.startsWith(code)))).toBe(false);
  });

  it("calculates summaries from posted lines", () => {
    const entries: AccountingEntry[] = [
      { id: "1", date: "2026-01-01", journal: "VEN", pieceNumber: "PC-1", accountCode: "4111", accountLabel: "Clients", label: "Vente", debit: 120, credit: 0, companyId: "1" },
      { id: "2", date: "2026-01-01", journal: "VEN", pieceNumber: "PC-1", accountCode: "706", accountLabel: "Ventes", label: "Vente", debit: 0, credit: 120, companyId: "1" },
    ];
    expect(summarizeAccountingEntries(entries)).toMatchObject({ revenue: 120, netIncome: 120, cashIn: 0, cashOut: 0 });
    const bankReceipt = { ...entries[0], id: "3", accountCode: "521", accountLabel: "Banques locales", debit: 120, credit: 0 };
    const bankWithdrawal = { ...entries[0], id: "4", accountCode: "521", accountLabel: "Banques locales", debit: 0, credit: 45 };
    expect(summarizeAccountingEntries([bankReceipt, bankWithdrawal])).toMatchObject({ cashIn: 120, cashOut: 45, netCash: 75 });
  });
});

describe("company-specific fiscal periods", () => {
  it("uses the company configured fiscal start date rather than assuming a calendar year", () => {
    expect(getCompanyFiscalPeriodBounds(2026, 10, 1)).toEqual({ startDate: "2026-10-01", endDate: "2027-09-30", label: "2026-2027" });
  });

  it("clamps a fiscal start day that does not exist in February", () => {
    expect(getCompanyFiscalPeriodBounds(2024, 2, 30)).toEqual({ startDate: "2024-02-29", endDate: "2025-02-27", label: "2024-2025" });
  });

  it("locks dates inside the configured inclusive period and restricts reopening to administrators", () => {
    const period = getCompanyFiscalPeriodBounds(2026, 10, 1);
    expect(isDateInFiscalPeriod("2026-10-01", period)).toBe(true);
    expect(isDateInFiscalPeriod("2027-09-30", period)).toBe(true);
    expect(isDateInFiscalPeriod("2027-10-01", period)).toBe(false);
    expect(canCloseFiscalPeriod("manager")).toBe(true);
    expect(canCloseFiscalPeriod("member")).toBe(false);
    expect(canReopenFiscalPeriod("admin")).toBe(true);
    expect(canReopenFiscalPeriod("manager")).toBe(false);
  });
});

describe("SYSCOHADA trial balance arithmetic", () => {
  it("carries forward the exact opening net and classifies closing balances on one side", () => {
    const openingNet = signedAccountBalance(12_345n, 22_200n);
    const closingNet = getClosingAccountBalance(openingNet, 1_200n, 440n);
    expect(splitAccountBalance(openingNet)).toEqual({ debitCents: 0n, creditCents: 9_855n });
    expect(splitAccountBalance(closingNet)).toEqual({ debitCents: 0n, creditCents: 9_095n });
    expect(splitAccountBalance(getClosingAccountBalance(35_000n, 12_000n, 47_000n))).toEqual({ debitCents: 0n, creditCents: 0n });
  });
});
