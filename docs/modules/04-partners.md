# Module 04 — Business partners & commissions

**Status:** Mostly done (server + UI)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/admin/partners`
- `/portal/partner`

Main files:

- `views/AdminPartnersPage.tsx`
- `views/PartnerPortalPage.tsx`
- `components/portal-routes.tsx (PartnerPortalRoute)`
- `api/partner-router.ts`
- `db/partner_tables.sql, db/seed-partners.ts`
- `db/schema.ts (partner* tables)`

## 2. Current state

- **Server has** the full set: levels, create/claim account invite, partners CRUD, prospects, opportunities, commissions (create, validate, pay), notifications, documents, stats, admin stats.
- **UI uses:** `createAccountInvite`, `listPartners` (admin) and `mine`, `createProspect`, `getPartnerStats`, `listCommissions`, `listLevels`, `listNotifications`, `listProspects`, `markNotificationRead` (portal).
- Not used yet by any page: opportunity updates, commission validate/pay screens, partner documents.

## 3. Target data model

- Existing: `partnerLevels`, `partners`, `partnerAccountInvitations`, `partnerProspects`, `partnerOpportunities`, `partnerCommissions`, `partnerNotifications`, `partnerDocuments`.

## 4. API (tRPC)

- Already present: see `api/partner-router.ts`. Missing only UI wiring.

## 5. Implementation steps

1. [ ] Admin UI: list prospects/opportunities, update stage (`updateOpportunity`).
2. [ ] Admin UI: create, validate and pay commissions (`createCommission`, `validateCommission`, `payCommission`).
3. [ ] Portal UI: documents list and download (`partnerDocuments` + file storage, see module 10).
4. [ ] Show `adminStats` on the admin page.
5. [ ] Link a won opportunity to CRM (module 03) so a client is created automatically.
6. [ ] Decide and document commission rules (rates per level) before automating.

## 6. Depends on

- 01 Core & IAM
- 03 CRM (conversion)

## 7. Acceptance criteria

- [ ] A partner sees only their own prospects and commissions.
- [ ] Commission lifecycle pending, validated, paid is traceable in the audit log.

## 8. Risks & notes

- Commission payment is a financial action: require admin role and audit entry.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
