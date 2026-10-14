# Module 06 — Sales documents: invoices, quotes, letterhead

**Status:** Not started (partial server data for quotes)  
**Reference docs:** [architecture cible](../architecture/architecture-cible-saas.md) · [implementation index](README.md)

## 1. Scope

Routes:

- `/finance/invoices`
- `/finance/quotes`
- `/finance/invoice-header`

Main files:

- `views/InvoicesPage.tsx`
- `views/DevisPage.tsx`
- `views/InvoiceHeaderPage.tsx`
- `stores/brandingStore.ts`
- `types.ts (Invoice, InvoiceReminder)`

## 2. Current state

- `InvoicesPage` and quotes use local `invoices`, `invoiceReminders`, `quotes`; `DevisPage` reads clients/products from the server (`customer`, `product`).
- `InvoiceHeaderPage` stores letterhead settings in `brandingStore` (local).
- PDF generation uses `jspdf` / `html2canvas` in the browser.

## 3. Target data model

- Important: the existing `invoices` table is the **SaaS subscription invoice** table. Customer invoices need new tables: `customer_invoices` (companyId, clientId, number, status, issueDate, dueDate, currency, totals), `invoice_lines`, `quotes`, `quote_lines`, `invoice_reminders`, `document_sequences` (gapless numbering per company/year), `company_branding` (letterhead).

## 4. API (tRPC)

- `quote.list/create/update/send/accept/convertToInvoice`
- `customerInvoice.list/create/update/issue/markPaid/cancel`
- `reminder.schedule/list`
- `branding.get/update`

## 5. Implementation steps

1. [ ] Create the new tables (do not reuse SaaS `invoices`). Add a gapless numbering helper in a transaction.
2. [ ] Quotes router, then port `DevisPage`.
3. [ ] Invoices router with issue/lock semantics (issued invoices are immutable; corrections via credit note).
4. [ ] Port `InvoicesPage`; payments recorded as `invoice_payments`.
5. [ ] Server-side branding for `InvoiceHeaderPage`; keep PDF rendering client-side first, move to server later if needed.
6. [ ] Emit `InvoiceIssued` for the accounting module (07).

## 6. Depends on

- 01 Core & IAM
- 03 CRM (clients/products)

## 7. Acceptance criteria

- [ ] Invoice numbers are unique and sequential per company and year.
- [ ] An issued invoice cannot be edited.

## 8. Risks & notes

- Tax rules (TVA/IR) must be validated with a local accountant before production.

## 9. Definition of done

- [ ] Tables + migration reviewed (`npm run db:generate`, `npm run db:check`)
- [ ] Router with company scoping and permission checks, default deny
- [ ] Page reads/writes through `trpc.*`; no import of `@/lib/db` for this module's collections
- [ ] Demo seed for this module removed from `data/seed.ts`
- [ ] Vitest tests for the router; `npm run check`, `npm run lint`, `npm run build` pass
