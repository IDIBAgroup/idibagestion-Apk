# Implementation plan by module

IDIBAGES currently has **14 modules** (about 50 routes, 54 view files). Only the foundation is server-backed; most feature pages still read and write demo data in the browser (`lib/db.ts`, localStorage).

## Where things stand

| Layer | State |
|---|---|
| Server (tRPC routers) | `auth`, `plan`, `company`, `subscription`, `transaction`, `payment`, `admin`, `partner`, `customer`, `product` |
| Database (Drizzle/MySQL) | users, sessions, companies, memberships, invitations, plans, subscriptions, transactions, SaaS invoices, clients, products, partner tables |
| Browser-only (localStorage) | projects, tasks, customer invoices, quotes, accounting, assets, expenses, HR, payroll, library, chat, tickets, portals, Vibe prospecting, roles, departments, settings |

## Modules (suggested order)

| # | Module | Status | Routes |
|---|---|---|---|
| 01 | [Core & IAM (auth, users, roles, departments)](01-core-iam.md) | Partially done (server) | `/login`, `/register`, `/admin/users`, `/admin/roles`… |
| 02 | [SaaS, plans & subscriptions](02-saas-subscriptions.md) | Mostly done (payments disabled) | `/`, `/register`, `/subscription`, `/admin/saas` |
| 03 | [CRM: clients, products, opportunities](03-crm-clients.md) | Partially done (server) | `/clients` |
| 04 | [Business partners & commissions](04-partners.md) | Mostly done (server + UI) | `/admin/partners`, `/portal/partner` |
| 05 | [Projects, tasks & planning](05-projects.md) | Not started (local only) | `/projects`, `/projects/[id]`, `/marketing`, `/innovation` |
| 06 | [Sales documents: invoices, quotes, letterhead](06-sales-documents.md) | Not started (partial server data for quotes) | `/finance/invoices`, `/finance/quotes`, `/finance/invoice-header` |
| 07 | [Finance & accounting (OHADA)](07-finance-accounting.md) | Not started (local only) | `/finance/accounting`, `/finance/closing`, `/finance/dsf`, `/finance/assets`… |
| 08 | [Human resources](08-hr.md) | Not started (local only) | `/hr/employees`, `/hr/recruitment`, `/hr/leaves`, `/hr/performance`… |
| 09 | [Payroll & CNPS](09-payroll.md) | Not started (local only, largest page) | `/hr/payroll` |
| 10 | [Workplace: library, chat, support](10-workplace.md) | Not started (local only) | `/library`, `/chat`, `/support` |
| 11 | [External portals (client, vendor) & portal accounts](11-portals.md) | Not started (disabled in production) | `/portal/client`, `/portal/vendor`, `/portal/simple`, `/portal/test`… |
| 12 | [Vibe prospecting (AI sales intelligence)](12-vibe-prospecting.md) | Not started (local only, AI-dependent) | `/vibe/dashboard`, `/vibe/prospecting`, `/vibe/trends`, `/vibe/signals`… |
| 13 | [Dashboard & business reports](13-dashboard-reports.md) | Not started (reads local data) | `/dashboard`, `/finance/reports` |
| 14 | [Platform shell, settings & cross-cutting](14-platform-shell.md) | Ongoing | `/settings`, `(layout, sidebar, header, search, toasts)` |

The order follows the roadmap in [architecture-cible-saas.md](../architecture/architecture-cible-saas.md) (Core, commercial, projects, finance, HR then payroll, workplace, scale). Module 14 runs alongside all of them.

## The recipe used for every module

1. **Schema:** add Drizzle tables in `db/schema.ts` (always with `companyId`), then `npm run db:generate` and review the SQL.
2. **Router:** add `api/<module>-router.ts`, register it in `api/router.ts`. Check membership and permission on every procedure; default deny.
3. **Tests:** Vitest for the router (`api/*.test.ts`).
4. **UI:** replace `getAll/add/update/remove` from `@/lib/db` with `trpc.<module>.*` hooks, one page at a time.
5. **Clean up:** remove that module's seed from `data/seed.ts` and its collection from `lib/db.ts`.
6. **Verify:** `npm run check && npm run lint && npm test && npm run build`.

## Rules

- Do not enable payments, official accounting/DSF or official payroll before the validations listed in the architecture doc.
- Keep one migration per module slice; do not use `db:push` against shared databases.
- Each module doc has a checklist; tick it as you go.
