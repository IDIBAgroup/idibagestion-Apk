# Module 07 — Finance & accounting (OHADA)

**Status:** Not started (local only)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/finance/accounting`
- `/finance/closing`
- `/finance/dsf`
- `/finance/assets`
- `/finance/expenses`

Main files:

- `views/AccountingPage.tsx`
- `views/YearEndClosingPage.tsx`
- `views/DSFPage.tsx`
- `views/AssetsPage.tsx`
- `views/ExpensesPage.tsx`
- `types.ts (AccountingEntry, ChartAccount, ClosingEntry, DSFForm, Asset, Expense)`

## 2. Current state

- Local collections: `accountingEntries`, `chartAccounts`, `financialReports`, `closingEntries`, `dsfs`, `assets`, `expenses`.
- `DSFPage` also reads `employees`, `payroll`, `invoices` (cross-module reads that will need server queries).
- Seed contains a demo chart of accounts, not a validated OHADA plan.

## 3. Target data model

- To add: `chart_accounts`, `journals`, `journal_entries` + `journal_lines` (debit/credit, must balance), `fiscal_periods` (open/closed), `expenses` + `expense_attachments`, `fixed_assets` + `depreciation_schedule`, `dsf_forms`.

## 4. API (tRPC)

- `account.list/create`
- `journal.postEntry` (rejects unbalanced), `journal.list`
- `period.close/reopen`
- `expense.*`, `asset.*`, `depreciation.run`
- `report.trialBalance/ledger/balanceSheet/incomeStatement`
- `dsf.generate/get/save`

## 5. Implementation steps

1. [ ] Start with `expenses` and `assets` (self-contained), then chart of accounts and journal.
2. [ ] Enforce balanced entries and period locks in the API, inside a DB transaction.
3. [ ] Generate entries automatically from issued invoices (06) and payroll (09) through events.
4. [ ] Closing and DSF last: they only read finished data.
5. [ ] File attachments for expenses need object storage (see module 10).
6. [ ] Export to CSV/PDF for accountants.

## 6. Depends on

- 01 Core
- 06 Sales documents
- 09 Payroll (for DSF)

## 7. Acceptance criteria

- [ ] Trial balance always balances.
- [ ] Closed periods reject new entries.
- [ ] Every manual change is audited.

## 8. Risks & notes

- Do not present reports or DSF as official before validation by local accounting experts (architecture doc, phase 4).

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
