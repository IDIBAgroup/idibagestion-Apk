# Module 01 — Core & IAM (auth, users, roles, departments)

**Status:** Partially done (server)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/login`
- `/register`
- `/admin/users`
- `/admin/roles`
- `/admin/departments`
- `/join-company`

Main files:

- `views/LoginPage.tsx`
- `views/RegisterPage.tsx`
- `views/UsersPage.tsx`
- `views/RolesPage.tsx`
- `views/DepartmentsPage.tsx`
- `components/portal-routes.tsx (CompanyInvitationRoute)`
- `components/guards.tsx`
- `components/shared/CompanySwitcher.tsx`
- `hooks/useAuth.ts`
- `hooks/useActiveCompany.ts`
- `stores/companySelectionStore.ts`
- `api/auth-router.ts, api/auth/*, api/google-auth.ts, api/saas-router.ts (companyRouter)`

## 2. Current state

- **Server-backed:** login/logout/me/changePassword (`auth.*`), Google OAuth, sessions, company creation, memberships and invitations (`company.*`: members, accessRole, createInvite, acceptInvite, revokeAccess).
- **Still local (localStorage):** `RolesPage` (collection `roles`), `DepartmentsPage` (`departments`), and the profile fields on `UsersPage` (`users`, `departments`, `roles`).
- Company roles today are only owner / admin / manager / member (`companyMemberships`). There are no fine-grained per-module permissions yet.

## 3. Target data model

- Existing: `users`, `userSessions`, `googleAuthTransactions`, `companies`, `companyMemberships`, `companyAccessInvitations`.
- To add: `departments` (companyId, name, headUserId, parentId), `roles` + `role_permissions` (companyId, module, action), `membership.departmentId`, `audit_logs` (companyId, actorId, action, entity, entityId, meta, createdAt).

## 4. API (tRPC)

- `department.list/create/update/delete`
- `role.list/create/update/delete`, `role.assign`
- `audit.list` (admin only)
- Permission helper `assertPermission(ctx, companyId, module, action)` in `api/middleware.ts`, default deny.

## 5. Implementation steps

1. [ ] Add `departments`, `roles`, `role_permissions`, `audit_logs` to `db/schema.ts`; generate a migration (`npm run db:generate`) and review it.
2. [ ] Add `permission` middleware and use it in every new router from here on.
3. [ ] Create `department` and `role` routers scoped by `companyId` (check membership first).
4. [ ] Replace `getAll('departments')` / `getAll('roles')` in `DepartmentsPage`, `RolesPage`, `UsersPage`, `SettingsPage` with `trpc.department.*` / `trpc.role.*`.
5. [ ] Drive `Sidebar.isItemEnabled` from the user's real permissions instead of `idibages_settings_v1` in localStorage.
6. [ ] Write audit entries for membership, role and department changes.
7. [ ] Remove the demo users/roles from `data/seed.ts` and add a server seed in `db/seed.ts`.

## 6. Depends on

- None (foundation). Everything else depends on this module.

## 7. Acceptance criteria

- [ ] A user without the right permission gets a 403 from the API, not only a hidden menu.
- [ ] Roles/departments survive a browser clear and are shared across users of the company.
- [ ] Every permission change appears in the audit log.

## 8. Risks & notes

- Existing legacy owner access is still accepted during migration; decide when to remove it.
- Do not weaken the existing invitation hashing and 7-day expiry.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
