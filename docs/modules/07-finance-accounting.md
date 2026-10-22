# Module 07 — Finance & accounting (OHADA)

**Status:** In progress — tenant-scoped persistence is implemented for expenses, fixed assets, manual journal postings and saved report snapshots; production migrations remain unapplied.  
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

- Server-backed: `expenses`, `fixed_assets`, `journal_entries`, `journal_entry_lines`, `financial_reports`, `fiscal_periods`.
- Still local or incomplete: `chartAccounts` is a static client-side SYSCOHADA catalogue; `closingEntries` and `dsfs` still use local collections.
- `DSFPage` also reads `employees`, `payroll`, `invoices` (cross-module reads that will need server queries).
- The accounting page posts balanced two-line entries atomically, validates detail account codes, stores transaction/base currencies, reads sales invoices through the server API, and exposes a server-calculated general trial balance and paginated account ledger.
- Saved report snapshots use the company's configured fiscal-year start date. Current calculations remain preliminary and are not validated statutory statements.
- The submitted SYSCOHADA chart remains static and read-only; it is not yet tenant-customizable or stored in the database.

## 3. Target data model

- Added: `journal_entries` + `journal_entry_lines` (debit/credit), `financial_reports`, `expense_claims`, `fixed_assets`.
- Still to add: tenant-specific `chart_accounts`, configurable `journals`, expense attachment lifecycle, `depreciation_schedule`, and `dsf_forms`.

## 4. API (tRPC)

- `account.list/create`
- `journal.postEntry` (rejects unbalanced), `journal.list`
- `period.close/reopen`
- `expense.*`, `asset.*`, `depreciation.run`
- `report.trialBalance/ledger/balanceSheet/incomeStatement`
- `dsf.generate/get/save`

## 5. Implementation steps

1. [x] Tenant-scoped persistent flows for expenses and fixed assets; journal and report tables are generated.
2. [x] Manual journal postings are balanced and atomic; closed fiscal periods block new postings and overlapping periods cannot be closed.
3. [x] Add tenant-scoped account-level ledger and trial-balance queries.
4. [ ] Generate entries automatically from issued invoices (06) and payroll (09) through events.
5. [ ] Closing and DSF last: they only read finished data.
6. [ ] File attachments for expenses need object storage (see module 10).
7. [ ] Export to CSV/PDF for accountants.

## 6. Depends on

- 01 Core
- 06 Sales documents
- 09 Payroll (for DSF)

## 7. Acceptance criteria

- [x] Every new manual two-line posting is balanced atomically by construction; a historical-integrity check for legacy imports remains outstanding.
- [x] Closed periods reject new entries; close and reopen actions are tenant-scoped, permission-checked, and serialized with journal posting.
- [ ] Every manual change is audited.

## 8. Risks & notes

- Do not present reports or DSF as official before validation by local accounting experts (architecture doc, phase 4).

## 9. Definition of done

- [x] Additive tables and migration generated; `db:check` passes. Apply migrations 0026 and 0027 to the deployed database before enabling journal posting and period controls there; neither migration has been applied to production from this workspace.
- [x] Journal, expense, and asset APIs check company scope, subscription feature, and management role.
- [x] Accounting page reads and writes through `trpc.*`; no `@/lib/db` access remains for its journal or reports.
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Router-level database tests, `npm run lint`, production migration application, and broader OHADA statement validation remain.
- [x] Pure journal/fiscal-period tests (17 targeted tests), `npm run check`, and `npm run db:check` pass. `npm run build` passed before the fiscal-period lock changes and must be rerun before deployment.
