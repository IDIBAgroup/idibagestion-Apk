# Module 10 — Workplace: library, chat, support

**Status:** Not started (local only)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/library`
- `/chat`
- `/support`

Main files:

- `views/LibraryPage.tsx`
- `views/ChatPage.tsx (1,189 lines)`
- `views/SupportPage.tsx`
- `components/shared/ChatBubbles.tsx`
- `components/shared/SearchModal.tsx`
- `types.ts (Chat, ChatMessage, Meeting, Ticket)`

## 2. Current state

- Local collections: `libraryDocuments`, `chats`, `chatMessages`, `meetings`, `tickets`.
- Chat is simulated; there is no real-time transport. Library has no real file upload.

## 3. Target data model

- To add: `documents` + `document_versions` + `document_shares`, `channels`, `channel_members`, `messages`, `meetings`, `tickets` + `ticket_comments`, `files` (object storage metadata).

## 4. API (tRPC)

- `file.createUploadUrl/confirm` (S3 presigned; `@aws-sdk/s3-request-presigner` is already installed)
- `document.*`
- `ticket.*`
- `channel.*`, `message.send/list`
- Realtime: SSE or WebSocket endpoint (see risks).

## 5. Implementation steps

1. [ ] Support tickets first (plain CRUD).
2. [ ] File storage via S3 presigned URLs; then Library on top of it.
3. [ ] Chat: choose transport (polling to start, then SSE/WebSocket); Next.js route handlers do not hold WebSockets on serverless hosts.
4. [ ] Meetings: store schedule; video provider is an open decision.
5. [ ] Global search (`SearchModal`) on the server across projects, invoices, tickets, users.

## 6. Depends on

- 01 Core & IAM

## 7. Acceptance criteria

- [ ] Uploaded files are private by default and only accessible via signed URLs.
- [ ] Messages are delivered to all channel members without refresh.

## 8. Risks & notes

- Real-time chat may need a separate process; keep the transport behind an interface.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
