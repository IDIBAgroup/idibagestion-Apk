import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { customerInvoiceReminders, businessDocuments, companyProfiles, externalDocumentEvents } from "@db/schema";
import { assertCompanyAccess, assertCompanyManagementAccess, authedQuery, createRouter } from "./middleware";
import { getDb } from "./queries/connection";
import { isDesignMode } from "./design-mode";
import { findDemoSalesDocument, listDemoSalesDocuments } from "./sales-document-router";
import { assertSubscriptionFeature } from "./subscription-quota";

const reminderTypes = ["before_due", "on_due", "after_due_7", "after_due_15", "after_due_30", "final"] as const;
type ReminderStatus = "scheduled" | "sent" | "failed" | "cancelled";
export function canTransitionInvoiceReminder(current: string, next: string) {
  return current === "scheduled" && ["sent", "failed", "cancelled"].includes(next);
}
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Date de relance invalide.");

type ReminderView = {
  id: string; companyId: string; invoiceId: string; invoiceNumber: string; clientName: string;
  reminderType: (typeof reminderTypes)[number]; reminderDate: string; sentDate?: string;
  status: ReminderStatus; templateUsed: string; notes?: string; createdAt: string;
};

type InvoiceReminderMetadata = { number?: string; clientName?: string; kind?: string; status?: string };
function parseInvoiceReminderMetadata(raw: string | null): InvoiceReminderMetadata {
  try {
    const value: unknown = JSON.parse(raw ?? "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value as InvoiceReminderMetadata : {};
  } catch { return {}; }
}

const demoReminders = new Map<number, ReminderView[]>();

export const invoiceReminderRouter = createRouter({
  list: authedQuery.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "invoices");
    if (isDesignMode) return demoReminders.get(input.companyId) ?? [];
    const rows = await getDb().select().from(customerInvoiceReminders)
      .where(eq(customerInvoiceReminders.companyId, input.companyId)).orderBy(desc(customerInvoiceReminders.reminderDate));
    if (!rows.length) return [];
    const invoiceIds = [...new Set(rows.map((row) => row.invoiceDocumentId))];
    const docs = await getDb().select().from(businessDocuments).where(and(
      eq(businessDocuments.companyId, input.companyId), inArray(businessDocuments.id, invoiceIds),
    ));
    const invoices = new Map(docs.map((doc) => {
      const payload = parseInvoiceReminderMetadata(doc.metadataJson);
      return [doc.id, { number: payload.number ?? doc.documentNumber ?? "", clientName: payload.clientName ?? doc.title }];
    }));
    return rows.map((row) => ({
      id: String(row.id), companyId: String(row.companyId), invoiceId: String(row.invoiceDocumentId),
      invoiceNumber: invoices.get(row.invoiceDocumentId)?.number ?? "", clientName: invoices.get(row.invoiceDocumentId)?.clientName ?? "",
      reminderType: row.reminderType, reminderDate: row.reminderDate, sentDate: row.sentAt?.toISOString(),
      status: row.status, templateUsed: row.templateUsed, notes: row.notes ?? undefined, createdAt: row.createdAt.toISOString(),
    } satisfies ReminderView));
  }),

  schedule: authedQuery.input(z.object({
    companyId: z.number().int().positive(), invoiceId: z.string().regex(/^(\d+|demo-\d+)$/),
    reminderType: z.enum(reminderTypes), reminderDate: dateSchema, templateUsed: z.string().trim().min(1).max(180),
    notes: z.string().max(2000).optional(),
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyManagementAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "invoices");
    if (isDesignMode) {
      const invoice = findDemoSalesDocument(input.companyId, input.invoiceId, "invoice");
      if (!invoice || (invoice.status !== "pending" && invoice.status !== "overdue")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La relance exige une facture émise et non réglée." });
      const reminders = demoReminders.get(input.companyId) ?? [];
      if (reminders.some((row) => row.invoiceId === invoice.id && row.reminderType === input.reminderType && row.reminderDate === input.reminderDate)) throw new TRPCError({ code: "CONFLICT", message: "Cette relance existe déjà." });
      const reminder: ReminderView = {
        id: `demo-${Date.now()}`, companyId: String(input.companyId), invoiceId: invoice.id, invoiceNumber: invoice.number,
        clientName: invoice.clientName, reminderType: input.reminderType, reminderDate: input.reminderDate,
        status: "scheduled", templateUsed: input.templateUsed, notes: input.notes, createdAt: new Date().toISOString(),
      };
      demoReminders.set(input.companyId, [reminder, ...reminders]);
      return reminder;
    }
    const db = getDb();
    const [invoiceRow] = await db.select().from(businessDocuments).where(and(
      eq(businessDocuments.id, Number(input.invoiceId)), eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "sales_invoice"),
    )).limit(1);
    if (!invoiceRow) throw new TRPCError({ code: "NOT_FOUND", message: "Facture introuvable dans cette entreprise." });
    const invoice = parseInvoiceReminderMetadata(invoiceRow.metadataJson);
    if (invoice.kind !== "invoice" || (invoice.status !== "pending" && invoice.status !== "overdue")) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La relance exige une facture émise et non réglée." });
    const [existing] = await db.select({ id: customerInvoiceReminders.id }).from(customerInvoiceReminders).where(and(
      eq(customerInvoiceReminders.companyId, input.companyId), eq(customerInvoiceReminders.invoiceDocumentId, invoiceRow.id),
      eq(customerInvoiceReminders.reminderType, input.reminderType), eq(customerInvoiceReminders.reminderDate, input.reminderDate),
    )).limit(1);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Cette relance existe déjà." });
    const [created] = await db.transaction(async (tx) => {
      const [inserted] = await tx.insert(customerInvoiceReminders).values({
        companyId: input.companyId, invoiceDocumentId: invoiceRow.id, reminderType: input.reminderType,
        reminderDate: input.reminderDate, templateUsed: input.templateUsed, notes: input.notes,
        createdByUserId: ctx.user.id,
      }).$returningId();
      await tx.insert(externalDocumentEvents).values({ companyId: input.companyId, documentId: invoiceRow.id, eventType: "invoice_reminder_scheduled", actorUserId: ctx.user.id, detailsJson: JSON.stringify({ reminderId: inserted.id, type: input.reminderType, date: input.reminderDate }) });
      return [inserted];
    });
    return {
      id: String(created.id), companyId: String(input.companyId), invoiceId: String(invoiceRow.id),
      invoiceNumber: invoice.number ?? invoiceRow.documentNumber ?? `FAC-${invoiceRow.id}`,
      clientName: invoice.clientName ?? invoiceRow.title ?? "Client",
      reminderType: input.reminderType, reminderDate: input.reminderDate,
      status: "scheduled" as const, templateUsed: input.templateUsed, notes: input.notes, createdAt: new Date().toISOString(),
    } satisfies ReminderView;
  }),

  generateForOverdue: authedQuery.input(z.object({ companyId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
    await assertCompanyManagementAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "invoices");
    if (isDesignMode) {
      const reminders = demoReminders.get(input.companyId) ?? [];
      const added: ReminderView[] = [];
      const today = new Date().toISOString().slice(0, 10);
      const scheduleDate = new Date(`${today}T00:00:00.000Z`); scheduleDate.setUTCDate(scheduleDate.getUTCDate() + 7);
      const reminderDate = scheduleDate.toISOString().slice(0, 10);
      for (const invoice of listDemoSalesDocuments(input.companyId, "invoice").filter((item) => item.status === "overdue")) {
        const exists = reminders.some((item) => item.invoiceId === invoice.id && item.reminderType === "after_due_7");
        if (exists) continue;
        added.push({ id: `demo-${Date.now()}-${added.length}`, companyId: String(input.companyId), invoiceId: invoice.id, invoiceNumber: invoice.number, clientName: invoice.clientName, reminderType: "after_due_7", reminderDate, status: "scheduled", templateUsed: "7 jours après l'échéance", createdAt: new Date().toISOString() });
      }
      demoReminders.set(input.companyId, [...added, ...reminders]);
      return { count: added.length };
    }
    const db = getDb();
    const rows = await db.select().from(businessDocuments).where(and(
      eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "sales_invoice"),
    ));
    const candidates = rows.flatMap((row) => {
      try {
        const invoice = parseInvoiceReminderMetadata(row.metadataJson);
        return invoice.kind === "invoice" && invoice.status === "overdue" ? [{ row, invoice }] : [];
      } catch { return []; }
    });
    if (!candidates.length) return { count: 0 };
    const [profile] = await db.select({ timezone: companyProfiles.timezone }).from(companyProfiles).where(eq(companyProfiles.companyId, input.companyId)).limit(1);
    const todayParts = new Intl.DateTimeFormat("en-CA", { timeZone: profile?.timezone ?? "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
    const today = `${todayParts.find((part) => part.type === "year")?.value}-${todayParts.find((part) => part.type === "month")?.value}-${todayParts.find((part) => part.type === "day")?.value}`;
    const scheduleDate = new Date(`${today}T00:00:00.000Z`); scheduleDate.setUTCDate(scheduleDate.getUTCDate() + 7);
    const reminderDate = scheduleDate.toISOString().slice(0, 10);
    const existingRows = await db.select({ invoiceDocumentId: customerInvoiceReminders.invoiceDocumentId }).from(customerInvoiceReminders).where(and(
      eq(customerInvoiceReminders.companyId, input.companyId), eq(customerInvoiceReminders.reminderType, "after_due_7"),
    ));
    const existingIds = new Set(existingRows.map((row) => row.invoiceDocumentId));
    const create = candidates.filter(({ row }) => !existingIds.has(row.id));
    if (!create.length) return { count: 0 };
    const inserted = await db.transaction(async (tx) => {
      const created = await tx.insert(customerInvoiceReminders).values(create.map(({ row }) => ({
        companyId: input.companyId, invoiceDocumentId: row.id, reminderType: "after_due_7" as const,
        reminderDate, templateUsed: "7 jours après l'échéance", createdByUserId: ctx.user.id,
      }))).$returningId();
      await tx.insert(externalDocumentEvents).values(created.map((reminder, index) => ({
        companyId: input.companyId, documentId: create[index].row.id, eventType: "invoice_reminder_scheduled", actorUserId: ctx.user.id,
        detailsJson: JSON.stringify({ reminderId: reminder.id, type: "after_due_7", date: reminderDate, generated: true }),
      })));
      return created;
    });
    return { count: inserted.length };
  }),

  setStatus: authedQuery.input(z.object({
    companyId: z.number().int().positive(), id: z.string().regex(/^(\d+|demo-\d+)$/), status: z.enum(["sent", "failed", "cancelled"]),
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyManagementAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "invoices");
    if (isDesignMode) {
      const reminders = demoReminders.get(input.companyId) ?? [];
      const reminder = reminders.find((item) => item.id === input.id);
      if (!reminder) throw new TRPCError({ code: "NOT_FOUND", message: "Relance introuvable." });
      if (!canTransitionInvoiceReminder(reminder.status, input.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seule une relance programmée peut changer d'état." });
      demoReminders.set(input.companyId, reminders.map((item) => item.id === reminder.id ? { ...item, status: input.status, sentDate: input.status === "sent" ? new Date().toISOString() : undefined } : item));
      return { success: true };
    }
    const db = getDb();
    const [row] = await db.select().from(customerInvoiceReminders).where(and(
      eq(customerInvoiceReminders.id, Number(input.id)), eq(customerInvoiceReminders.companyId, input.companyId),
    )).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Relance introuvable." });
    if (!canTransitionInvoiceReminder(row.status, input.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seule une relance programmée peut changer d'état." });
    const sentAt = input.status === "sent" ? new Date() : null;
    await db.transaction(async (tx) => {
      await tx.update(customerInvoiceReminders).set({ status: input.status, sentAt, sentByUserId: input.status === "sent" ? ctx.user.id : null })
        .where(and(eq(customerInvoiceReminders.id, row.id), eq(customerInvoiceReminders.companyId, input.companyId)));
      await tx.insert(externalDocumentEvents).values({ companyId: input.companyId, documentId: row.invoiceDocumentId, eventType: `invoice_reminder_${input.status}`, actorUserId: ctx.user.id, detailsJson: JSON.stringify({ reminderId: row.id }) });
    });
    return { success: true };
  }),
});
