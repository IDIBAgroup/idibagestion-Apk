# Module 05 — Projects, tasks & planning

**Status:** Not started (local only)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/projects`
- `/projects/[id]`
- `/marketing`
- `/innovation`

Main files:

- `views/ProjectsPage.tsx`
- `views/ProjectDetailPage.tsx`
- `views/MarketingCalendar.tsx`
- `views/InnovationPage.tsx`
- `types.ts (Project, Task, TimeEntry, CalendarEvent, Idea)`

## 2. Current state

- All data is in localStorage (`lib/db.ts`): `projects`, `tasks`, `timeEntries`, `calendarEvents`, `ideas`.
- Kanban and detail view exist and work on demo data (see `data/seed.ts`).
- No server table, router or permission check for any of it.

## 3. Target data model

- To add: `projects` (companyId, name, clientId, ownerId, status, budgetXAF, startDate, endDate), `project_members`, `tasks` (projectId, assigneeId, status, priority, dueDate, position), `time_entries`, `calendar_events`, `ideas` + `idea_votes/comments`.

## 4. API (tRPC)

- `project.list/get/create/update/archive`
- `task.list/create/update/move/delete`
- `timeEntry.create/list`
- `calendar.list/create/update/delete`
- `idea.list/create/vote/comment/setStatus`

## 5. Implementation steps

1. [ ] Schema + migration for projects, members, tasks, time entries.
2. [ ] Routers with company scoping and membership/permission checks (`projects` module permissions).
3. [ ] Port `ProjectsPage` (list/kanban), then `ProjectDetailPage`; keep optimistic updates for drag and drop.
4. [ ] Port `MarketingCalendar` and `InnovationPage` (small, independent: good first slices).
5. [ ] Notifications: assigned task, status change (hook into module 14 notifications).
6. [ ] Remove `seedProjects`, `seedTasks`, etc. once the pages read from the server.

## 6. Depends on

- 01 Core & IAM
- 03 CRM (project from won opportunity)

## 7. Acceptance criteria

- [ ] Task moves persist and are visible to other members immediately after refresh.
- [ ] Non-members cannot read a private project.

## 8. Risks & notes

- Task ordering needs a stable `position` column to avoid reorder conflicts.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
