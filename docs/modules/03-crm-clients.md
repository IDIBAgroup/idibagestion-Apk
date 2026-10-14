# Module 03 — CRM: clients, products, opportunities

**Status:** Partially done (server)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/clients`

Main files:

- `views/ClientsPage.tsx`
- `api/commercial-router.ts (customer, product)`
- `db/schema.ts (clients, products)`
- `types.ts (Client, Opportunity)`

## 2. Current state

- **Server has** `customer.*` and `product.*` (list by company, get, create, update, delete) and tables `clients`, `products`.
- **`ClientsPage` still uses local data:** collections `clients`, `invoices`, `opportunities`. `DevisPage` already reads `customer.listByCompany` and `product.listByCompany`, so the server and local data are out of sync today.

## 3. Target data model

- Existing: `clients`, `products`.
- To add: `contacts` (clientId, name, role, email, phone), `opportunities` (companyId, clientId, ownerId, stage, amountXAF, expectedCloseDate), `opportunity_stage_history`.

## 4. API (tRPC)

- `opportunity.list/create/update/moveStage/delete`
- `contact.list/create/update/delete`
- `customer.timeline` (invoices, quotes, opportunities for one client)

## 5. Implementation steps

1. [ ] Switch `ClientsPage` from `getAll('clients')` to `trpc.customer.*`; delete the local client seed.
2. [ ] Add `contacts` and `opportunities` tables + routers (scoped by companyId and owner).
3. [ ] Replace local `opportunities`/`invoices` reads in `ClientsPage` with server queries (invoices arrive in module 06; stub the tab until then).
4. [ ] Add pipeline view (stage move) and the `OpportunityWon` hook that can create a project (module 05).
5. [ ] Import/export (CSV) using the existing `papaparse` dependency.

## 6. Depends on

- 01 Core & IAM
- 06 Sales documents (invoice tab)
- 05 Projects (won opportunity to project)

## 7. Acceptance criteria

- [ ] Two browsers of the same company see the same clients.
- [ ] Clients of company A are never returned to company B.

## 8. Risks & notes

- `DevisPage` and `ClientsPage` must move to the server data in the same step to avoid two client lists.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
