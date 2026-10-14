# Module 11 — External portals (client, vendor) & portal accounts

**Status:** Not started (disabled in production)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/portal/client`
- `/portal/vendor`
- `/portal/simple`
- `/portal/test`
- `/admin/portals`
- `/admin/news`

Main files:

- `views/ClientPortalPage.tsx (965 lines)`
- `views/VendorPortalPage.tsx`
- `views/SimplePortalPage.tsx`
- `views/TestPage.tsx`
- `views/admin/AdminPortalsPage.tsx (814 lines)`
- `components/shared/PortalNews.tsx, PortalTickets.tsx, PortalSettings.tsx, PortalChatBubbles.tsx`
- `lib/api.ts (simulated portal REST API)`

## 2. Current state

- Portals run on demo data from `lib/api.ts` (localStorage): `portalUsers`, `portalProjects`, `portalInvoices`, `portalPayments`, `portalContracts`, `portalActivities`, `portalNotifications`, `portalNews`, `portalTickets`.
- They are intentionally unavailable in production (`PortalUnavailable`), and the simulated login in `lib/api.ts` is not real authentication.

## 3. Target data model

- Prefer reusing real entities: portal client = a `clients` contact with an invitation; vendor = new `vendors` table. Add `portal_accounts` (userId, companyId, type, scope), `portal_news`, `portal_tickets`.

## 4. API (tRPC)

- `portal.client.projects/invoices/quotes/pay`
- `portal.vendor.purchaseOrders/invoices`
- `portalAccount.invite/revoke` (admin)
- `news.*`

## 5. Implementation steps

1. [ ] Define identity: portal users log in through the same session system with a restricted `portal` role (reuse the invitation pattern from partners).
2. [ ] Client portal reads real projects/invoices/quotes filtered by their client id only.
3. [ ] Vendor portal needs a vendors + purchase orders model (not in the app today).
4. [ ] Admin portal accounts page and news.
5. [ ] Remove the simulated login from `lib/api.ts` and the `portal/simple` and `portal/test` pages.

## 6. Depends on

- 03 CRM
- 05 Projects
- 06 Sales documents

## 7. Acceptance criteria

- [ ] A client user can never see another client's data.
- [ ] `PortalUnavailable` is removed only when real data is wired.

## 8. Risks & notes

- Payments from the portal stay disabled until module 02 payments are enabled.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
