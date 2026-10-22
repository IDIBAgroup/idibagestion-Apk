import { and, asc, desc, eq, gt, gte, inArray, lt, lte, ne, or, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { companies, companyProfiles, financialReports, fiscalPeriods, journalEntries, journalEntryLines } from "@db/schema";
import { OHADA_POSTING_ACCOUNTS } from "@/data/ohada-chart";
import { convertToBaseAmount, MAX_EXACT_CURRENCY_AMOUNT, summarizeAccountingEntries } from "@/lib/accounting/journal";
import { getCompanyFiscalPeriodBounds } from "@/lib/accounting/period";
import { canCloseFiscalPeriod, canReopenFiscalPeriod, isDateInFiscalPeriod } from "@/lib/accounting/period-policy";
import { getClosingAccountBalance, signedAccountBalance, splitAccountBalance } from "@/lib/accounting/trial-balance";
import type { AccountingEntry, FinancialReport } from "@/types";
import { assertCompanyAccess, getCompanyAccessRole, createRouter, authedQuery } from "./middleware";
import { isDesignMode } from "./design-mode";
import { getDb } from "./queries/connection";
import { assertSubscriptionFeature } from "./subscription-quota";
import { resolveCompanyCurrencyCode } from "./company-currency";

const journalCodes = ["VEN", "ACH", "BNQ", "CAI", "OD"] as const;
const reportTypes = ["income_statement", "balance_sheet", "cash_flow"] as const;
const chartByCode = new Map(OHADA_POSTING_ACCOUNTS.map(({ code, label }) => [code, label]));
const demoEntries = new Map<number, AccountingEntry[]>();
const demoReports = new Map<number, FinancialReport[]>();
const demoFiscalPeriods = new Map<number, Array<typeof fiscalPeriods.$inferSelect>>();

function isValidIsoDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

async function configuredFiscalPeriod(companyId: number, fiscalYear: number) {
  let fiscalStartMonth = 1;
  let fiscalStartDay = 1;
  if (!isDesignMode) {
    const [profile] = await getDb().select({
      fiscalYearStartMonth: companyProfiles.fiscalYearStartMonth,
      fiscalYearStartDay: companyProfiles.fiscalYearStartDay,
    }).from(companyProfiles).where(eq(companyProfiles.companyId, companyId)).limit(1);
    fiscalStartMonth = profile?.fiscalYearStartMonth ?? 1;
    fiscalStartDay = profile?.fiscalYearStartDay ?? 1;
  }
  return getCompanyFiscalPeriodBounds(fiscalYear, fiscalStartMonth, fiscalStartDay);
}

function decimalToCents(value: unknown) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(value));
  if (!match) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Une ligne comptable contient un montant invalide." });
  return BigInt(match[1]) * 100n + BigInt((match[2] ?? "").padEnd(2, "0"));
}

function centsToAmount(cents: bigint) {
  if (cents > BigInt(Number.MAX_SAFE_INTEGER) || cents < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le solde dépasse la précision numérique prise en charge pour l’affichage." });
  }
  return Number(cents) / 100;
}

function accountNetCents(debit: unknown, credit: unknown) {
  return signedAccountBalance(decimalToCents(debit), decimalToCents(credit));
}

function mapJournalLine(
  header: typeof journalEntries.$inferSelect,
  line: typeof journalEntryLines.$inferSelect,
): AccountingEntry {
  return {
    id: `${header.id}-${line.id}`,
    date: header.entryDate,
    pieceNumber: header.pieceNumber,
    journal: header.journalCode,
    accountCode: line.accountCode,
    accountLabel: line.accountLabel,
    label: header.label,
    debit: Number(line.debit),
    credit: Number(line.credit),
    companyId: String(header.companyId),
    analyticCode: header.analyticCode || undefined,
    transactionAmount: Number(header.transactionAmount),
    transactionCurrency: header.transactionCurrency,
    exchangeRate: Number(header.exchangeRate),
    baseCurrency: header.baseCurrency,
  };
}

async function loadJournalEntries(companyId: number, startDate?: string, endDate?: string) {
  const filters = [eq(journalEntries.companyId, companyId)];
  if (startDate) filters.push(gte(journalEntries.entryDate, startDate));
  if (endDate) filters.push(lte(journalEntries.entryDate, endDate));
  const db = getDb();
  const headers = await db.select().from(journalEntries).where(and(...filters)).orderBy(desc(journalEntries.entryDate), desc(journalEntries.id));
  const headerIds = headers.map(({ id }) => id);
  if (!headerIds.length) return [] as AccountingEntry[];
  const lines = await db.select().from(journalEntryLines).where(and(
    eq(journalEntryLines.companyId, companyId),
    inArray(journalEntryLines.journalEntryId, headerIds),
  )).orderBy(journalEntryLines.journalEntryId, journalEntryLines.lineNumber);
  const headersById = new Map(headers.map((header) => [header.id, header]));
  return lines.flatMap((line) => {
    const header = headersById.get(line.journalEntryId);
    return header ? [mapJournalLine(header, line)] : [];
  });
}

async function assertAccountingManager(user: Parameters<typeof getCompanyAccessRole>[0], companyId: number) {
  const role = await getCompanyAccessRole(user, companyId);
  if (!canCloseFiscalPeriod(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Droits insuffisants pour gérer les écritures comptables." });
  }
}

function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY";
}

export const accountingRouter = createRouter({
  journal: createRouter({
    list: authedQuery.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "accounting");
      if (isDesignMode) return demoEntries.get(input.companyId) ?? [];
      return loadJournalEntries(input.companyId);
    }),

    postEntry: authedQuery.input(z.object({
      companyId: z.number().int().positive(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidIsoDate, "Date invalide."),
      pieceNumber: z.string().trim().min(1).max(100),
      journal: z.enum(journalCodes),
      label: z.string().trim().min(2).max(500),
      analyticCode: z.string().trim().max(120).optional(),
      debitAccountCode: z.string().trim().min(3).max(20),
      creditAccountCode: z.string().trim().min(3).max(20),
      amount: z.number().finite().positive().max(1_000_000_000_000),
      transactionCurrency: z.string().trim().regex(/^[A-Za-z]{3}$/).transform((value) => value.toUpperCase()),
      exchangeRate: z.number().finite().positive().max(1_000_000_000),
    }).refine((input) => Number.isFinite(input.amount * input.exchangeRate) && input.amount * input.exchangeRate >= 0.005 && input.amount * input.exchangeRate <= MAX_EXACT_CURRENCY_AMOUNT, {
      path: ["amount"], message: "Le montant converti dépasse la précision monétaire prise en charge.",
    }).refine((input) => input.debitAccountCode !== input.creditAccountCode, {
      path: ["creditAccountCode"], message: "Le débit et le crédit doivent viser des comptes différents.",
    })).mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "accounting");
      await assertAccountingManager(ctx.user, input.companyId);
      const debitAccountLabel = chartByCode.get(input.debitAccountCode);
      const creditAccountLabel = chartByCode.get(input.creditAccountCode);
      if (!debitAccountLabel || !creditAccountLabel) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Sélectionnez deux comptes de détail du plan SYSCOHADA." });
      }
      const baseCurrency = await resolveCompanyCurrencyCode(input.companyId);
      if (input.transactionCurrency === baseCurrency && Math.abs(input.exchangeRate - 1) > 1e-10) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le taux de conversion doit être égal à 1 lorsque la devise est celle de l'entreprise." });
      }
      const baseAmount = convertToBaseAmount(input.amount, input.exchangeRate);

      if (isDesignMode) {
        const locked = (demoFiscalPeriods.get(input.companyId) ?? []).some((period) => period.status === "closed" && isDateInFiscalPeriod(input.date, period));
        if (locked) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’exercice comptable est clôturé. Réouvrez-le avant d’ajouter une écriture." });
        const id = Date.now();
        const common = {
          date: input.date, pieceNumber: input.pieceNumber, journal: input.journal,
          label: input.label, companyId: String(input.companyId), analyticCode: input.analyticCode || undefined,
          transactionAmount: input.amount, transactionCurrency: input.transactionCurrency,
          exchangeRate: input.exchangeRate, baseCurrency,
        };
        const posted: AccountingEntry[] = [
          { ...common, id: `${id}-1`, accountCode: input.debitAccountCode, accountLabel: debitAccountLabel.split("(")[0].trim(), debit: baseAmount, credit: 0 },
          { ...common, id: `${id}-2`, accountCode: input.creditAccountCode, accountLabel: creditAccountLabel.split("(")[0].trim(), debit: 0, credit: baseAmount },
        ];
        demoEntries.set(input.companyId, [...posted, ...(demoEntries.get(input.companyId) ?? [])]);
        return posted;
      }

      try {
        const db = getDb();
        const [created] = await db.transaction(async (tx) => {
          const [tenant] = await tx.select({ id: companies.id }).from(companies)
            .where(eq(companies.id, input.companyId)).limit(1).for("update");
          if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable." });
          const [closedPeriod] = await tx.select({ id: fiscalPeriods.id }).from(fiscalPeriods).where(and(
            eq(fiscalPeriods.companyId, input.companyId),
            eq(fiscalPeriods.status, "closed"),
            lte(fiscalPeriods.startDate, input.date),
            gte(fiscalPeriods.endDate, input.date),
          )).limit(1).for("update");
          if (closedPeriod) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’exercice comptable est clôturé. Réouvrez-le avant d’ajouter une écriture." });
          const [header] = await tx.insert(journalEntries).values({
            companyId: input.companyId,
            entryDate: input.date,
            journalCode: input.journal,
            pieceNumber: input.pieceNumber,
            label: input.label,
            analyticCode: input.analyticCode || null,
            baseCurrency,
            transactionCurrency: input.transactionCurrency,
            exchangeRate: input.exchangeRate.toFixed(10),
            transactionAmount: input.amount.toFixed(2),
            createdByUserId: ctx.user.id,
          }).$returningId();
          const lines = await tx.insert(journalEntryLines).values([
            { companyId: input.companyId, journalEntryId: header.id, lineNumber: 1, accountCode: input.debitAccountCode, accountLabel: debitAccountLabel.split("(")[0].trim(), debit: baseAmount.toFixed(2), credit: "0.00" },
            { companyId: input.companyId, journalEntryId: header.id, lineNumber: 2, accountCode: input.creditAccountCode, accountLabel: creditAccountLabel.split("(")[0].trim(), debit: "0.00", credit: baseAmount.toFixed(2) },
          ]).$returningId();
          return [{ header, lineIds: lines.map(({ id }) => id) }];
        });
        const now = new Date();
        const commonHeader = {
          id: created.header.id, companyId: input.companyId, entryDate: input.date, journalCode: input.journal,
          pieceNumber: input.pieceNumber, label: input.label, analyticCode: input.analyticCode || null,
          baseCurrency, transactionCurrency: input.transactionCurrency, exchangeRate: input.exchangeRate.toFixed(10),
          transactionAmount: input.amount.toFixed(2), createdByUserId: ctx.user.id, createdAt: now,
        } as typeof journalEntries.$inferSelect;
        return [
          mapJournalLine(commonHeader, { id: created.lineIds[0], companyId: input.companyId, journalEntryId: created.header.id, lineNumber: 1, accountCode: input.debitAccountCode, accountLabel: debitAccountLabel.split("(")[0].trim(), debit: baseAmount.toFixed(2), credit: "0.00", createdAt: now }),
          mapJournalLine(commonHeader, { id: created.lineIds[1], companyId: input.companyId, journalEntryId: created.header.id, lineNumber: 2, accountCode: input.creditAccountCode, accountLabel: creditAccountLabel.split("(")[0].trim(), debit: "0.00", credit: baseAmount.toFixed(2), createdAt: now }),
        ];
      } catch (error) {
        if (isDuplicateKey(error)) throw new TRPCError({ code: "CONFLICT", message: "Ce numéro de pièce existe déjà dans ce journal pour cette entreprise." });
        throw error;
      }
    }),
  }),

  report: createRouter({
    list: authedQuery.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "accounting");
      if (isDesignMode) return demoReports.get(input.companyId) ?? [];
      const rows = await getDb().select().from(financialReports)
        .where(eq(financialReports.companyId, input.companyId)).orderBy(desc(financialReports.generatedAt));
      return rows.flatMap((row): FinancialReport[] => {
        try {
          const data = JSON.parse(row.reportData) as Record<string, number>;
          return [{ id: String(row.id), type: row.type, period: row.period, startDate: row.startDate, endDate: row.endDate, data, generatedAt: row.generatedAt.toISOString(), generatedBy: String(row.generatedByUserId), companyId: String(row.companyId) }];
        } catch { return []; }
      });
    }),

    generate: authedQuery.input(z.object({
      companyId: z.number().int().positive(),
      type: z.enum(reportTypes),
      fiscalYear: z.number().int().min(1990).max(new Date().getFullYear() + 1),
    })).mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "accounting");
      await assertAccountingManager(ctx.user, input.companyId);
      const { startDate, endDate, label: period } = await configuredFiscalPeriod(input.companyId, input.fiscalYear);
      const entries = isDesignMode
        ? (demoEntries.get(input.companyId) ?? []).filter((entry) => entry.date >= startDate && entry.date <= endDate)
        : await loadJournalEntries(input.companyId, startDate, endDate);
      const data = summarizeAccountingEntries(entries);
      const generatedAt = new Date();
      if (isDesignMode) {
        const report: FinancialReport = {
          id: `report-${Date.now()}`, type: input.type, period, startDate, endDate,
          data, generatedAt: generatedAt.toISOString(), generatedBy: String(ctx.user.id), companyId: String(input.companyId),
        };
        demoReports.set(input.companyId, [report, ...(demoReports.get(input.companyId) ?? [])]);
        return report;
      }
      const [created] = await getDb().insert(financialReports).values({
        companyId: input.companyId, type: input.type, period, startDate, endDate,
        reportData: JSON.stringify(data), generatedByUserId: ctx.user.id,
      }).$returningId();
      return {
        id: String(created.id), type: input.type, period, startDate, endDate,
        data, generatedAt: generatedAt.toISOString(), generatedBy: String(ctx.user.id), companyId: String(input.companyId),
      } satisfies FinancialReport;
    }),
  }),

  trialBalance: createRouter({
    list: authedQuery.input(z.object({
      companyId: z.number().int().positive(),
      fiscalYear: z.number().int().min(1990).max(new Date().getFullYear() + 1),
    })).query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "accounting");
      const { startDate, endDate, label } = await configuredFiscalPeriod(input.companyId, input.fiscalYear);
      let aggregates: Array<{ accountCode: string; accountLabel: string; openingDebit: unknown; openingCredit: unknown; debit: unknown; credit: unknown }>;
      if (isDesignMode) {
        const byAccount = new Map<string, { accountLabel: string; openingDebit: bigint; openingCredit: bigint; debit: bigint; credit: bigint }>();
        for (const entry of demoEntries.get(input.companyId) ?? []) {
          if (entry.date > endDate) continue;
          const row = byAccount.get(entry.accountCode) ?? { accountLabel: entry.accountLabel, openingDebit: 0n, openingCredit: 0n, debit: 0n, credit: 0n };
          const debit = decimalToCents(entry.debit.toFixed(2));
          const credit = decimalToCents(entry.credit.toFixed(2));
          if (entry.date < startDate) { row.openingDebit += debit; row.openingCredit += credit; }
          else { row.debit += debit; row.credit += credit; }
          byAccount.set(entry.accountCode, row);
        }
        aggregates = [...byAccount].map(([accountCode, row]) => ({ accountCode, ...row })).sort((a, b) => a.accountCode.localeCompare(b.accountCode));
      } else {
        aggregates = await getDb().select({
          accountCode: journalEntryLines.accountCode,
          accountLabel: sql<string>`MAX(${journalEntryLines.accountLabel})`,
          openingDebit: sql<string>`COALESCE(SUM(CASE WHEN ${journalEntries.entryDate} < ${startDate} THEN ${journalEntryLines.debit} ELSE 0 END), 0)`,
          openingCredit: sql<string>`COALESCE(SUM(CASE WHEN ${journalEntries.entryDate} < ${startDate} THEN ${journalEntryLines.credit} ELSE 0 END), 0)`,
          debit: sql<string>`COALESCE(SUM(CASE WHEN ${journalEntries.entryDate} >= ${startDate} THEN ${journalEntryLines.debit} ELSE 0 END), 0)`,
          credit: sql<string>`COALESCE(SUM(CASE WHEN ${journalEntries.entryDate} >= ${startDate} THEN ${journalEntryLines.credit} ELSE 0 END), 0)`,
        }).from(journalEntryLines).innerJoin(journalEntries, and(
          eq(journalEntries.companyId, journalEntryLines.companyId),
          eq(journalEntries.id, journalEntryLines.journalEntryId),
        )).where(and(
          eq(journalEntryLines.companyId, input.companyId),
          lte(journalEntries.entryDate, endDate),
        )).groupBy(journalEntryLines.accountCode, journalEntryLines.accountLabel).orderBy(asc(journalEntryLines.accountCode));
      }

      const rows = aggregates.map((row) => {
        const openingNet = accountNetCents(row.openingDebit, row.openingCredit);
        const debit = decimalToCents(row.debit);
        const credit = decimalToCents(row.credit);
        const opening = splitAccountBalance(openingNet);
        const closing = splitAccountBalance(getClosingAccountBalance(openingNet, debit, credit));
        return {
          accountCode: row.accountCode,
          accountLabel: row.accountLabel,
          openingDebit: centsToAmount(opening.debitCents),
          openingCredit: centsToAmount(opening.creditCents),
          debit: centsToAmount(debit),
          credit: centsToAmount(credit),
          closingDebit: centsToAmount(closing.debitCents),
          closingCredit: centsToAmount(closing.creditCents),
        };
      }).filter((row) => row.openingDebit || row.openingCredit || row.debit || row.credit);
      const totals = rows.reduce((result, row) => ({
        openingDebit: result.openingDebit + row.openingDebit,
        openingCredit: result.openingCredit + row.openingCredit,
        debit: result.debit + row.debit,
        credit: result.credit + row.credit,
        closingDebit: result.closingDebit + row.closingDebit,
        closingCredit: result.closingCredit + row.closingCredit,
      }), { openingDebit: 0, openingCredit: 0, debit: 0, credit: 0, closingDebit: 0, closingCredit: 0 });
      return { fiscalYear: input.fiscalYear, period: label, startDate, endDate, rows, totals };
    }),
  }),

  ledger: createRouter({
    list: authedQuery.input(z.object({
      companyId: z.number().int().positive(),
      accountCode: z.string().trim().min(3).max(20),
      fiscalYear: z.number().int().min(1990).max(new Date().getFullYear() + 1),
      cursor: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isValidIsoDate), entryId: z.string().regex(/^\d+$/), lineNumber: z.number().int().positive() }).optional(),
    })).query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "accounting");
      const accountLabel = chartByCode.get(input.accountCode);
      if (!accountLabel) throw new TRPCError({ code: "BAD_REQUEST", message: "Sélectionnez un compte de détail du plan SYSCOHADA." });
      const { startDate, endDate, label } = await configuredFiscalPeriod(input.companyId, input.fiscalYear);
      const pageSize = 200;
      if (isDesignMode) {
        const all = (demoEntries.get(input.companyId) ?? []).filter((entry) => entry.accountCode === input.accountCode && entry.date <= endDate)
          .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
        const openingNet = all.filter((entry) => entry.date < startDate).reduce((net, entry) => net + decimalToCents(entry.debit.toFixed(2)) - decimalToCents(entry.credit.toFixed(2)), 0n);
        const movements = all.filter((entry) => entry.date >= startDate);
        const cursorIndex = input.cursor ? movements.findIndex((entry) => entry.date === input.cursor!.date && entry.id === input.cursor!.entryId) + 1 : 0;
        const startBalance = openingNet + movements.slice(0, cursorIndex).reduce((net, entry) => net + decimalToCents(entry.debit.toFixed(2)) - decimalToCents(entry.credit.toFixed(2)), 0n);
        const page = movements.slice(cursorIndex, cursorIndex + pageSize + 1);
        let balance = startBalance;
        const entries = page.slice(0, pageSize).map((entry) => {
          balance += decimalToCents(entry.debit.toFixed(2)) - decimalToCents(entry.credit.toFixed(2));
          return { ...entry, entryId: entry.id, lineNumber: 1, balance: centsToAmount(balance) };
        });
        const last = entries[entries.length - 1];
        return { accountCode: input.accountCode, accountLabel, period: label, startDate, endDate, openingBalance: centsToAmount(openingNet), entries, nextCursor: page.length > pageSize && last ? { date: last.date, entryId: last.entryId, lineNumber: last.lineNumber } : null };
      }

      const db = getDb();
      const baseFilters = [
        eq(journalEntryLines.companyId, input.companyId),
        eq(journalEntryLines.accountCode, input.accountCode),
        eq(journalEntries.companyId, input.companyId),
        eq(journalEntries.id, journalEntryLines.journalEntryId),
      ];
      const [opening] = await db.select({
        debit: sql<string>`COALESCE(SUM(${journalEntryLines.debit}), 0)`,
        credit: sql<string>`COALESCE(SUM(${journalEntryLines.credit}), 0)`,
      }).from(journalEntryLines).innerJoin(journalEntries, and(
        eq(journalEntries.companyId, journalEntryLines.companyId), eq(journalEntries.id, journalEntryLines.journalEntryId),
      )).where(and(...baseFilters.filter((_, index) => index < 2), lt(journalEntries.entryDate, startDate)));
      const openingNet = accountNetCents(opening?.debit ?? "0", opening?.credit ?? "0");

      let cursorBalance = openingNet;
      if (input.cursor) {
        const cursorDate = input.cursor.date;
        const cursorId = Number(input.cursor.entryId);
        const [priorPage] = await db.select({
          debit: sql<string>`COALESCE(SUM(${journalEntryLines.debit}), 0)`,
          credit: sql<string>`COALESCE(SUM(${journalEntryLines.credit}), 0)`,
        }).from(journalEntryLines).innerJoin(journalEntries, and(
          eq(journalEntries.companyId, journalEntryLines.companyId), eq(journalEntries.id, journalEntryLines.journalEntryId),
        )).where(and(
          ...baseFilters.filter((_, index) => index < 2),
          gte(journalEntries.entryDate, startDate), lte(journalEntries.entryDate, endDate),
          or(
            lt(journalEntries.entryDate, cursorDate),
            and(eq(journalEntries.entryDate, cursorDate), or(
              lt(journalEntries.id, cursorId),
              and(eq(journalEntries.id, cursorId), lte(journalEntryLines.lineNumber, input.cursor.lineNumber)),
            )),
          ),
        ));
        cursorBalance += accountNetCents(priorPage?.debit ?? "0", priorPage?.credit ?? "0");
      }
      const afterCursor = input.cursor ? or(
        gt(journalEntries.entryDate, input.cursor.date),
        and(eq(journalEntries.entryDate, input.cursor.date), or(
          gt(journalEntries.id, Number(input.cursor.entryId)),
          and(eq(journalEntries.id, Number(input.cursor.entryId)), gt(journalEntryLines.lineNumber, input.cursor.lineNumber)),
        )),
      ) : undefined;
      const queryFilters = [
        ...baseFilters,
        gte(journalEntries.entryDate, startDate), lte(journalEntries.entryDate, endDate),
      ];
      if (afterCursor) queryFilters.push(afterCursor);
      const result = await db.select({
        date: journalEntries.entryDate,
        journal: journalEntries.journalCode,
        pieceNumber: journalEntries.pieceNumber,
        label: journalEntries.label,
        analyticCode: journalEntries.analyticCode,
        entryId: journalEntries.id,
        lineNumber: journalEntryLines.lineNumber,
        debit: journalEntryLines.debit,
        credit: journalEntryLines.credit,
      }).from(journalEntryLines).innerJoin(journalEntries, and(
        eq(journalEntries.companyId, journalEntryLines.companyId), eq(journalEntries.id, journalEntryLines.journalEntryId),
      )).where(and(...queryFilters)).orderBy(asc(journalEntries.entryDate), asc(journalEntries.id), asc(journalEntryLines.lineNumber)).limit(pageSize + 1);
      let balance = cursorBalance;
      const entries = result.slice(0, pageSize).map((entry) => {
        balance += accountNetCents(entry.debit, entry.credit);
        return { ...entry, entryId: String(entry.entryId), debit: Number(entry.debit), credit: Number(entry.credit), balance: centsToAmount(balance) };
      });
      const last = result[pageSize - 1];
      return {
        accountCode: input.accountCode, accountLabel, period: label, startDate, endDate,
        openingBalance: centsToAmount(openingNet), entries,
        nextCursor: result.length > pageSize && last ? { date: last.date, entryId: String(last.entryId), lineNumber: last.lineNumber } : null,
      };
    }),
  }),

  period: createRouter({
    list: authedQuery.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "accounting");
      const role = await getCompanyAccessRole(ctx.user, input.companyId);
      const canClose = canCloseFiscalPeriod(role);
      const canReopen = canReopenFiscalPeriod(role);
      const periods = isDesignMode
        ? demoFiscalPeriods.get(input.companyId) ?? []
        : await getDb().select().from(fiscalPeriods).where(eq(fiscalPeriods.companyId, input.companyId)).orderBy(desc(fiscalPeriods.fiscalYear));
      return { periods, canClose, canReopen };
    }),

    close: authedQuery.input(z.object({
      companyId: z.number().int().positive(),
      fiscalYear: z.number().int().min(1990).max(new Date().getFullYear() + 1),
    })).mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "accounting");
      await assertAccountingManager(ctx.user, input.companyId);
      if (isDesignMode) {
        const { startDate, endDate, label } = await configuredFiscalPeriod(input.companyId, input.fiscalYear);
        const closedAt = new Date();
        const existing = demoFiscalPeriods.get(input.companyId) ?? [];
        const prior = existing.find((period) => period.fiscalYear === input.fiscalYear);
        if (prior?.status === "closed") throw new TRPCError({ code: "CONFLICT", message: "Cet exercice est déjà clôturé." });
        if (prior && (prior.startDate !== startDate || prior.endDate !== endDate)) throw new TRPCError({ code: "CONFLICT", message: "Les dates de l’exercice ont changé. Vérifiez le paramétrage avant de le clôturer." });
        const period: typeof fiscalPeriods.$inferSelect = {
          id: prior?.id ?? Date.now(), companyId: input.companyId, fiscalYear: input.fiscalYear, label, startDate, endDate,
          status: "closed", closedByUserId: ctx.user.id, closedAt, reopenedByUserId: prior?.reopenedByUserId ?? null,
          reopenedAt: prior?.reopenedAt ?? null, createdAt: prior?.createdAt ?? closedAt, updatedAt: closedAt,
        };
        demoFiscalPeriods.set(input.companyId, [period, ...existing.filter(({ fiscalYear }) => fiscalYear !== input.fiscalYear)]);
        return period;
      }

      const closedAt = new Date();
      return getDb().transaction(async (tx) => {
        const [tenant] = await tx.select({ id: companies.id }).from(companies).where(eq(companies.id, input.companyId)).limit(1).for("update");
        if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable." });
        const [profile] = await tx.select({ fiscalYearStartMonth: companyProfiles.fiscalYearStartMonth, fiscalYearStartDay: companyProfiles.fiscalYearStartDay })
          .from(companyProfiles).where(eq(companyProfiles.companyId, input.companyId)).limit(1);
        const { startDate, endDate, label } = getCompanyFiscalPeriodBounds(input.fiscalYear, profile?.fiscalYearStartMonth ?? 1, profile?.fiscalYearStartDay ?? 1);
        const [prior] = await tx.select().from(fiscalPeriods).where(and(
          eq(fiscalPeriods.companyId, input.companyId), eq(fiscalPeriods.fiscalYear, input.fiscalYear),
        )).limit(1).for("update");
        if (prior?.status === "closed") throw new TRPCError({ code: "CONFLICT", message: "Cet exercice est déjà clôturé." });
        if (prior && (prior.startDate !== startDate || prior.endDate !== endDate)) throw new TRPCError({ code: "CONFLICT", message: "Les dates de l’exercice ont changé. Vérifiez le paramétrage avant de le clôturer." });
        const overlaps = await tx.select({ id: fiscalPeriods.id }).from(fiscalPeriods).where(and(
          eq(fiscalPeriods.companyId, input.companyId),
          ne(fiscalPeriods.fiscalYear, input.fiscalYear),
          lte(fiscalPeriods.startDate, endDate),
          gte(fiscalPeriods.endDate, startDate),
        )).limit(1).for("update");
        if (overlaps.length) throw new TRPCError({ code: "CONFLICT", message: "Cette période recouvre un autre exercice déjà enregistré." });

        const entryBalances = await tx.select({
          journalEntryId: journalEntries.id,
          debit: sql<string>`COALESCE(SUM(${journalEntryLines.debit}), 0)`,
          credit: sql<string>`COALESCE(SUM(${journalEntryLines.credit}), 0)`,
          lineCount: sql<number>`COUNT(${journalEntryLines.id})`,
        }).from(journalEntries).leftJoin(journalEntryLines, and(
          eq(journalEntryLines.companyId, journalEntries.companyId),
          eq(journalEntryLines.journalEntryId, journalEntries.id),
        )).where(and(
          eq(journalEntries.companyId, input.companyId),
          gte(journalEntries.entryDate, startDate),
          lte(journalEntries.entryDate, endDate),
        )).groupBy(journalEntries.id);
        const unbalanced = entryBalances.some((entry) => entry.lineCount < 2 || decimalToCents(entry.debit) !== decimalToCents(entry.credit));
        if (unbalanced) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Clôture refusée : au moins une écriture de l’exercice est incomplète ou déséquilibrée." });

        if (prior) {
          await tx.update(fiscalPeriods).set({ status: "closed", label, closedByUserId: ctx.user.id, closedAt }).where(eq(fiscalPeriods.id, prior.id));
          return { ...prior, status: "closed" as const, label, closedByUserId: ctx.user.id, closedAt, updatedAt: closedAt };
        }
        const [created] = await tx.insert(fiscalPeriods).values({
          companyId: input.companyId, fiscalYear: input.fiscalYear, label, startDate, endDate,
          status: "closed", closedByUserId: ctx.user.id, closedAt,
        }).$returningId();
        return { id: created.id, companyId: input.companyId, fiscalYear: input.fiscalYear, label, startDate, endDate, status: "closed" as const, closedByUserId: ctx.user.id, closedAt, reopenedByUserId: null, reopenedAt: null, createdAt: closedAt, updatedAt: closedAt };
      });
    }),

    reopen: authedQuery.input(z.object({
      companyId: z.number().int().positive(),
      fiscalYear: z.number().int().min(1990).max(new Date().getFullYear() + 1),
    })).mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      await assertSubscriptionFeature(input.companyId, "accounting");
      const role = await getCompanyAccessRole(ctx.user, input.companyId);
      if (!canReopenFiscalPeriod(role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Seuls les administrateurs de l’entreprise peuvent réouvrir un exercice." });
      }
      const reopenedAt = new Date();
      if (isDesignMode) {
        const existing = demoFiscalPeriods.get(input.companyId) ?? [];
        const prior = existing.find((period) => period.fiscalYear === input.fiscalYear);
        if (!prior || prior.status !== "closed") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cet exercice n’est pas clôturé." });
        const reopened = { ...prior, status: "open" as const, reopenedByUserId: ctx.user.id, reopenedAt, updatedAt: reopenedAt };
        demoFiscalPeriods.set(input.companyId, existing.map((period) => period.fiscalYear === input.fiscalYear ? reopened : period));
        return reopened;
      }
      return getDb().transaction(async (tx) => {
        const [tenant] = await tx.select({ id: companies.id }).from(companies).where(eq(companies.id, input.companyId)).limit(1).for("update");
        if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Entreprise introuvable." });
        const [prior] = await tx.select().from(fiscalPeriods).where(and(
          eq(fiscalPeriods.companyId, input.companyId), eq(fiscalPeriods.fiscalYear, input.fiscalYear),
        )).limit(1).for("update");
        if (!prior || prior.status !== "closed") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Cet exercice n’est pas clôturé." });
        await tx.update(fiscalPeriods).set({ status: "open", reopenedByUserId: ctx.user.id, reopenedAt }).where(eq(fiscalPeriods.id, prior.id));
        return { ...prior, status: "open" as const, reopenedByUserId: ctx.user.id, reopenedAt, updatedAt: reopenedAt };
      });
    }),
  }),
});
