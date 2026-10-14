# Module 09 — Payroll & CNPS

**Status:** Not started (local only, largest page)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/hr/payroll`

Main files:

- `views/PayrollPage.tsx (1,174 lines)`
- `types.ts (PayrollItem, EmployeeLoan)`

## 2. Current state

- Local collections: `payroll`, `contracts`, `employees`, `leaves`, `loans`, `accountingEntries`.
- Calculations (CNPS, taxes, deductions) live inside the page component in the browser.

## 3. Target data model

- To add: `payroll_rules` (versioned: rates, ceilings, effective dates), `payroll_runs` (period, status draft/validated/published), `payslips`, `payslip_lines`, `employee_loans` + `loan_repayments`, `payroll_exports`.

## 4. API (tRPC)

- `payroll.preview/runCalculate`
- `payroll.validate` (different user than preparer)
- `payroll.publish`
- `payslip.mine` (employee sees only published)
- `payrollRules.list/create` (versioned)

## 5. Implementation steps

1. [ ] Extract calculation logic from `PayrollPage` into a pure, tested function (`lib/payroll/*.ts`) with unit tests for known cases.
2. [ ] Make rules data (versioned table), not constants.
3. [ ] Create run/payslip tables and the calculation endpoint on the server.
4. [ ] Separate permissions: prepare, validate, publish; employee read-only on own published payslips.
5. [ ] Generate accounting entries on publish (module 07).
6. [ ] PDF payslip generation and CNPS declaration export.

## 6. Depends on

- 08 HR (employees, contracts, leaves)
- 07 Finance (entries)

## 7. Acceptance criteria

- [ ] Same inputs always produce the same payslip (reproducible, rule version stored).
- [ ] Preparer cannot validate their own run.

## 8. Risks & notes

- Do not run official payroll before validation by local specialists (architecture doc, phase 5). Payroll access must be isolated from regular HR access.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
