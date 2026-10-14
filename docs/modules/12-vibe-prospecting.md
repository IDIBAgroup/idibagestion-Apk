# Module 12 — Vibe prospecting (AI sales intelligence)

**Status:** Not started (local only, AI-dependent)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/vibe/dashboard`
- `/vibe/prospecting`
- `/vibe/trends`
- `/vibe/signals`
- `/vibe/leads`
- `/vibe/outreach`
- `/vibe/train-ai`

Main files:

- `views/vibe/VibeDashboardPage.tsx`
- `views/vibe/VibeProspectingPage.tsx (1,069 lines)`
- `views/vibe/VibeTrendsPage.tsx`
- `views/vibe/VibeSignalsPage.tsx`
- `views/vibe/VibeLeadsPage.tsx`
- `views/vibe/VibeOutreachPage.tsx`
- `views/vibe/VibeTrainAIPage.tsx`
- `views/vibe/AILeadSearchModal.tsx, VibeAnalyzerModal.tsx, VibeTrendDetector.tsx`
- `stores/vibeStore.ts`

## 2. Current state

- Local collections: `leads`, `signals`, `trends`, `campaigns`, `messages`, `prospects`, `sequences`, `savedLists`.
- AI behaviour (lead search, analyzer, trend detection, message generation) is simulated on the client.

## 3. Target data model

- To add: `leads`, `lead_signals`, `trends`, `campaigns`, `outreach_messages`, `sequences` + `sequence_steps`, `saved_lists`, `ai_training_docs`, `ai_usage_log`.

## 4. API (tRPC)

- `lead.*`, `signal.*`, `trend.*`
- `campaign.*`, `outreach.generate/send`
- `ai.leadSearch`, `ai.analyze`, `ai.generateMessage` (server-side only, with the model API key kept in env)

## 5. Implementation steps

1. [ ] Port the plain CRUD pages first (leads, signals, trends, campaigns) with the same patterns as module 03.
2. [ ] Introduce an `ai` service in `api/` that calls the Claude API; keep the key server-side and add per-company rate limits and usage logging.
3. [ ] Replace the simulated generators in the modals with `trpc.ai.*`.
4. [ ] Train-AI page: store company documents and pass them as context.
5. [ ] Outreach sending (email) needs a provider decision and consent/opt-out handling.
6. [ ] Convert a lead to a client/opportunity (module 03).

## 6. Depends on

- 01 Core
- 03 CRM

## 7. Acceptance criteria

- [ ] No AI key or prompt is reachable from the browser.
- [ ] Usage is metered and limited per plan.

## 8. Risks & notes

- Prospecting scraped or purchased data raises privacy/compliance questions; decide the data sources first.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
