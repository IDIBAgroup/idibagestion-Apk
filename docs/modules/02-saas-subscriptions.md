# Module 02 — SaaS, plans & subscriptions

**Status:** Mostly done (payments disabled)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/`
- `/register`
- `/subscription`
- `/admin/saas`

Main files:

- `views/LandingPage.tsx`
- `views/RegisterPage.tsx`
- `views/SubscriptionPage.tsx`
- `views/AdminDashboardPage.tsx`
- `api/saas-router.ts (plan, subscription, transaction, admin)`
- `api/payment-router.ts`
- `api/payments/gateway.ts, api/payments/webhook.ts`

## 2. Current state

- **Server-backed:** `plan.list/getBySlug`, `subscription.create/cancel/changePlan/reactivate/getUsage/listByCompany`, `transaction.listByCompany`, `payment.status`, admin stats (`admin.stats`, `allCompanies`, `allSubscriptions`, `allTransactions`, `revenueByMonth`, `checkExpired`).
- `AdminDashboardPage` has no direct `trpc` calls in the page file; verify it reads `admin.*` data (or local data) before relying on it.
- Payments are intentionally closed: with no adapter registered the webhook answers 503 (covered by `api/payments/webhook.test.ts`).

## 3. Target data model

- Existing: `plans`, `subscriptions`, `transactions`, `invoices` (this table is SaaS billing, not customer invoices; see module 06).

## 4. API (tRPC)

- Payment provider adapter implementing the `gateway.ts` interface (verify signature or query provider API before emitting a verified event).

## 5. Implementation steps

1. [ ] Choose the payment provider (open decision in the architecture doc).
2. [ ] Implement the adapter, register it, add signature verification tests.
3. [ ] Wire `AdminDashboardPage` to `admin.*` procedures if it is not already.
4. [ ] Add plan limits (users, modules) enforcement in the API using `subscription.getUsage`.
5. [ ] Schedule `admin.checkExpired` (cron/route) instead of a manual call.
6. [ ] Landing page: make it server-rendered (it only needs `plan.list`); currently it is client-rendered.

## 6. Depends on

- 01 Core & IAM (companies, permissions)

## 7. Acceptance criteria

- [ ] A paid transaction activates the subscription exactly once (idempotent webhook).
- [ ] Plan limits are enforced server-side.

## 8. Risks & notes

- Do not enable payments before the provider decision and webhook signature checks.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
