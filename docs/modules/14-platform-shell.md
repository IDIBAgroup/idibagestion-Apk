# Module 14 — Platform shell, settings & cross-cutting

**Status:** Ongoing  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/settings`
- `(layout, sidebar, header, search, toasts)`

Main files:

- `views/SettingsPage.tsx (848 lines)`
- `components/layout/AppLayout.tsx, Sidebar.tsx, Header.tsx`
- `components/shared/ToastProvider.tsx, SearchModal.tsx`
- `stores/uiStore.ts, brandingStore.ts, offlineStore.ts, companyStore.ts`
- `lib/db.ts, lib/navigation.tsx`
- `data/seed.ts`
- `legacy-vite/`
- `tech-spec.md`

## 2. Current state

- Settings mix server calls (`auth.me`, `changePassword`) with local ones (module toggles in `idibages_settings_v1`, branding, chat, products).
- `lib/db.ts` (collection store with seed data, ~50 collections) is the local stand-in for the backend; it should shrink as modules move.
- Frontend runs entirely client-side (`'use client'` on every route); pages are not server-rendered.

## 3. Target data model

- To add: `company_settings` (modules enabled, locale, currency), `user_preferences`, `notifications`, `notification_preferences`, `company_branding` (shared with module 06).

## 4. API (tRPC)

- `settings.get/update`
- `notification.list/markRead/subscribe`
- `search.query`

## 5. Implementation steps

1. [ ] Server-side `company_settings` replaces `idibages_settings_v1`; Sidebar reads it through a query.
2. [ ] Notifications table + bell in the Header; modules push events to it.
3. [ ] Delete `lib/db.ts`, `data/seed.ts` and `localStorage` fallbacks module by module; remove them completely after module 13.
4. [ ] Offline queue (`offlineStore`): decide whether to keep; if yes, queue tRPC mutations, not localStorage records.
5. [ ] Next.js follow-ups: delete `legacy-vite/`; move landing to a server component; update `tech-spec.md` to the Next.js stack; add `output`/deployment config and a Dockerfile.
6. [ ] Add CI: `npm run check`, `npm run lint`, `npm test`, `npm run build`.

## 6. Depends on

- Runs in parallel with every module

## 7. Acceptance criteria

- [ ] No page imports from `@/lib/db` once all modules are migrated.
- [ ] CI passes on every PR.

## 8. Risks & notes

- Removing `lib/db.ts` too early breaks pages that still use it; delete per module.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
