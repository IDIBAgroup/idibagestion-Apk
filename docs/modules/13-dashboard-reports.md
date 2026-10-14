# Module 13 — Dashboard & business reports

**Status:** Not started (reads local data)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/dashboard`
- `/finance/reports`

Main files:

- `views/DashboardPage.tsx`
- `views/RapportsPage.tsx`
- `components/shared/SearchModal.tsx`

## 2. Current state

- Both pages aggregate local collections in the browser: `invoices`, `projects`, `tasks`, `users` (dashboard) and `clients`, `expenses`, `invoices`, `quotes` (reports).
- They break or show empty data as soon as the source modules move to the server.

## 3. Target data model

- No new source tables; add read models/aggregations (views or cached queries) per KPI.

## 4. API (tRPC)

- `dashboard.kpis` (revenue, receivables, open projects, cash)
- `report.sales/expenses/clients` with date filters
- Export endpoints (CSV/PDF)

## 5. Implementation steps

1. [ ] Do this last, after modules 03, 05, 06, 07 are on the server.
2. [ ] Move aggregation to SQL (`SUM`/`GROUP BY` through Drizzle) instead of loading all rows into the browser.
3. [ ] Respect permissions: a KPI is only computed from data the user may read.
4. [ ] Cache expensive queries (short TTL) and add period selectors.
5. [ ] Replace the placeholder/demo charts; keep Recharts/D3 components.

## 6. Depends on

- 03, 05, 06, 07 (and 08/09 for HR KPIs)

## 7. Acceptance criteria

- [ ] KPIs match the underlying module lists for the same period.
- [ ] Dashboard loads in under 2 s on realistic data.

## 8. Risks & notes

- Avoid building a second source of truth; always aggregate from the owning module's tables.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
