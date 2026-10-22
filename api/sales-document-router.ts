import { z } from "zod";
import { and, desc, eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery, assertCompanyAccess, assertCompanyManagementAccess } from "./middleware";
import { getDb } from "./queries/connection";
import { businessDocuments, companyProfiles, companyTaxRules, externalDocumentEvents, salesDocumentSequences } from "@db/schema";
import { isDesignMode } from "./design-mode";
import { assertSubscriptionFeature, assertSubscriptionQuota, getSubscriptionFeatureAccess } from "./subscription-quota";

const kinds = ["quote", "order", "delivery", "invoice"] as const;
function featureForSalesKind(kind: (typeof kinds)[number]) {
  return kind === "quote" ? "quotes" : kind === "order" ? "orders" : kind === "delivery" ? "delivery_notes" : "invoices";
}
const orderStatuses = ["draft", "confirmed", "in_progress", "partially_delivered", "delivered", "cancelled"] as const;
const deliveryStatuses = ["draft", "prepared", "shipped", "delivered", "cancelled"] as const;
const quoteStatuses = ["draft", "sent", "counter_proposal", "accepted", "rejected", "expired", "converted"] as const;
const invoiceStatuses = ["draft", "pending", "paid", "overdue", "cancelled"] as const;
const statusTransitions: Record<(typeof kinds)[number], Record<string, string[]>> = {
  quote: { draft: ["sent", "rejected", "expired"], sent: ["accepted", "rejected", "expired", "counter_proposal"], counter_proposal: ["accepted", "rejected"] },
  order: { draft: ["confirmed", "cancelled"], confirmed: ["cancelled"] },
  delivery: { draft: ["prepared", "cancelled"], prepared: ["shipped", "cancelled"], shipped: ["delivered", "cancelled"] },
  invoice: { draft: ["pending", "cancelled"], pending: ["paid", "overdue", "cancelled"], overdue: ["paid", "cancelled"] },
};

export function canTransitionSalesDocument(kind: (typeof kinds)[number], current: string, next: string) {
  return statusTransitions[kind][current]?.includes(next) ?? false;
}
const itemSchema = z.object({
  productId: z.string().max(80).optional(),
  description: z.string().trim().min(1).max(1000),
  quantity: z.number().finite().positive().max(1_000_000),
  unitPrice: z.number().finite().min(0).max(1_000_000_000),
});
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}, "Date invalide.");

type SalesItem = { productId?: string; description: string; quantity: number; unitPrice: number; tax: number; total: number };
type SalesPayload = {
  kind: (typeof kinds)[number];
  number: string;
  clientId?: string;
  clientName: string;
  clientEmail?: string;
  clientNiu?: string;
  clientRccm?: string;
  date: string;
  expiryDate?: string;
  dueDate?: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  deliveryAddress?: string;
  orderId?: string;
  orderNumber?: string;
  carrier?: string;
  trackingNumber?: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  items: SalesItem[];
  notes?: string;
  sourceQuoteId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
};

type StoredDocument = typeof businessDocuments.$inferSelect;
type UserDocument = {
  id: string; companyId: string; kind: "quote" | "order" | "delivery" | "invoice"; number: string; clientId?: string; clientName: string; clientEmail?: string;
  clientNiu?: string; clientRccm?: string; date: string; expiryDate?: string; dueDate?: string; deliveryDate?: string; expectedDeliveryDate?: string; deliveryAddress?: string;
  orderId?: string; orderNumber?: string; carrier?: string; trackingNumber?: string;
  amount: number; tax: number; total: number; status: string; items: SalesItem[]; notes?: string;
  sourceQuoteId?: string; createdAt: string; updatedAt: string;
};

const demoDocuments = new Map<number, UserDocument[]>();
let demoId = 1;

export function findDemoSalesDocument(companyId: number, id: string, kind: (typeof kinds)[number]) {
  return demoDocuments.get(companyId)?.find((document) => document.id === id && document.kind === kind);
}

export function listDemoSalesDocuments(companyId: number, kind: (typeof kinds)[number]) {
  return (demoDocuments.get(companyId) ?? []).filter((document) => document.kind === kind);
}

function parseMetadata(row: StoredDocument): SalesPayload | null {
  if (!row.metadataJson) return null;
  try {
    const payload = JSON.parse(row.metadataJson) as SalesPayload;
    if (!kinds.includes(payload.kind) || !Array.isArray(payload.items)) return null;
    return payload;
  } catch {
    return null;
  }
}

function mapDocument(row: StoredDocument, payload: SalesPayload): UserDocument {
  return {
    id: String(row.id), companyId: String(row.companyId), kind: payload.kind, number: payload.number || row.documentNumber || "",
    clientId: payload.clientId, clientName: payload.clientName, clientEmail: payload.clientEmail,
    clientNiu: payload.clientNiu, clientRccm: payload.clientRccm,
    date: payload.date, expiryDate: payload.expiryDate, dueDate: payload.dueDate, deliveryDate: payload.deliveryDate, expectedDeliveryDate: payload.expectedDeliveryDate,
    deliveryAddress: payload.deliveryAddress, orderId: payload.orderId, orderNumber: payload.orderNumber,
    carrier: payload.carrier, trackingNumber: payload.trackingNumber,
    amount: payload.amount, tax: payload.tax, total: payload.total, status: payload.status,
    items: payload.items, notes: payload.notes,
    sourceQuoteId: payload.sourceQuoteId, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
  };
}

export function invoicePayloadFromAcceptedQuote(quote: SalesPayload, quoteId: string, number: string, date: string, dueDate: string, now: string): SalesPayload {
  return {
    ...quote, kind: "invoice", number, date, dueDate, status: "draft", sourceQuoteId: quoteId,
    notes: [quote.notes, `Émise à partir du devis ${quote.number}.`].filter(Boolean).join("\n"),
    createdAt: now, updatedAt: now,
  };
}

function storageStatus(kind: SalesPayload["kind"], status: string) {
  if (["cancelled", "rejected", "expired"].includes(status)) return "void" as const;
  if (status === "draft") return "draft" as const;
  if (["confirmed", "prepared", "sent", "counter_proposal", "pending", "overdue"].includes(status)) return "approved" as const;
  return "finalized" as const;
}

async function localDateForCompany(companyId: number) {
  const db = getDb();
  const [profile] = await db.select({ timezone: companyProfiles.timezone })
    .from(companyProfiles).where(eq(companyProfiles.companyId, companyId)).limit(1);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: profile?.timezone ?? "UTC", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === "year")?.value}-${parts.find((part) => part.type === "month")?.value}-${parts.find((part) => part.type === "day")?.value}`;
}

async function activeVatRate(companyId: number, transactionDate?: string) {
  const db = getDb();
  const [profile] = await db.select({ countryCode: companyProfiles.countryCode })
    .from(companyProfiles).where(eq(companyProfiles.companyId, companyId)).limit(1);
  if (!profile) return 0;
  const today = transactionDate ?? await localDateForCompany(companyId);
  const rules = await db.select().from(companyTaxRules).where(and(
    eq(companyTaxRules.companyId, companyId),
    eq(companyTaxRules.countryCode, profile.countryCode),
    eq(companyTaxRules.taxType, "vat"),
    eq(companyTaxRules.isActive, true),
  ));
  const rule = rules.find((item) => item.effectiveFrom <= today && (!item.effectiveTo || item.effectiveTo >= today));
  return rule ? rule.rateBasisPoints / 100 : 0;
}

async function nextNumber(tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0], companyId: number, kind: (typeof kinds)[number], year: number) {
  await tx.insert(salesDocumentSequences).values({ companyId, kind, fiscalYear: year, lastValue: 0 })
    .onDuplicateKeyUpdate({ set: { lastValue: sql`${salesDocumentSequences.lastValue} + 1` } });
  const [sequence] = await tx.select().from(salesDocumentSequences).where(and(
    eq(salesDocumentSequences.companyId, companyId), eq(salesDocumentSequences.kind, kind), eq(salesDocumentSequences.fiscalYear, year),
  )).limit(1).for("update");
  const value = Math.max(1, sequence?.lastValue ?? 1);
  if (sequence?.lastValue === 0) {
    await tx.update(salesDocumentSequences).set({ lastValue: value }).where(eq(salesDocumentSequences.id, sequence.id));
  }
  const prefix = kind === "quote" ? "DEV" : kind === "order" ? "BC" : kind === "delivery" ? "BL" : "FAC";
  return `${prefix}-${year}-${String(value).padStart(4, "0")}`;
}

export function calculateItems(items: z.infer<typeof itemSchema>[], vatRate: number): SalesItem[] {
  return items.map((item) => {
    const amount = Math.round(item.quantity * item.unitPrice);
    const tax = Math.round(amount * vatRate / 100);
    return { ...item, tax, total: amount + tax };
  });
}

function deriveOrderStatus(orderId: string, order: SalesPayload, deliveries: SalesPayload[]): SalesPayload["status"] {
  const active = deliveries.filter((item) => item.kind === "delivery" && item.orderId === orderId && item.status !== "cancelled");
  const deliveredQuantity = new Map<string, number>();
  for (const delivery of active.filter((item) => item.status === "delivered")) {
    for (const item of delivery.items) {
      const key = item.productId || item.description.toLocaleLowerCase("fr");
      deliveredQuantity.set(key, (deliveredQuantity.get(key) ?? 0) + item.quantity);
    }
  }
  const hasDelivered = deliveredQuantity.size > 0;
  const fullyDelivered = order.items.every((item) => (deliveredQuantity.get(item.productId || item.description.toLocaleLowerCase("fr")) ?? 0) >= item.quantity);
  if (hasDelivered && fullyDelivered) return "delivered";
  if (hasDelivered) return "partially_delivered";
  if (active.some((item) => item.status === "prepared" || item.status === "shipped")) return "in_progress";
  return order.status === "draft" ? "draft" : "confirmed";
}

export const salesDocumentRouter = createRouter({
  list: authedQuery.input(z.object({ companyId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    const access = await getSubscriptionFeatureAccess(input.companyId);
    const visibleTypes = [
      ...(access.has("quotes") ? ["sales_quote"] : []),
      ...(access.has("orders") ? ["sales_order"] : []),
      ...(access.has("delivery_notes") ? ["delivery_note"] : []),
      ...(access.has("invoices") ? ["sales_invoice"] : []),
    ];
    if (!visibleTypes.length) return [];
    if (isDesignMode) return demoDocuments.get(input.companyId) ?? [];
    const rows = await getDb().select().from(businessDocuments).where(and(
      eq(businessDocuments.companyId, input.companyId),
    )).orderBy(desc(businessDocuments.createdAt));
    return rows.flatMap((row) => {
      if (!visibleTypes.includes(row.documentType)) return [];
      const payload = parseMetadata(row);
      return payload && !payload.deletedAt ? [mapDocument(row, payload)] : [];
    });
  }),

  save: authedQuery.input(z.object({
    companyId: z.number().int().positive(), kind: z.enum(kinds), id: z.string().optional(),
    clientId: z.string().max(80).optional(), clientName: z.string().trim().min(1).max(255), clientEmail: z.string().email().optional().or(z.literal("")),
    clientNiu: z.string().max(100).optional(), clientRccm: z.string().max(100).optional(),
    date: dateSchema, expiryDate: dateSchema.optional(), dueDate: dateSchema.optional(), deliveryDate: dateSchema.optional(), expectedDeliveryDate: dateSchema.optional(),
    deliveryAddress: z.string().max(2000).optional(), orderId: z.string().max(80).optional(),
    carrier: z.string().max(180).optional(), trackingNumber: z.string().max(180).optional(),
    items: z.array(itemSchema).min(1).max(300), notes: z.string().max(5000).optional(),
    taxable: z.boolean().optional(),
    initialStatus: z.enum(["draft", "pending"]).optional(),
  }).refine((input) => !input.expiryDate || input.expiryDate >= input.date, {
    path: ["expiryDate"], message: "La date de validité doit être égale ou postérieure à la date du document.",
  }).refine((input) => input.kind !== "invoice" || Boolean(input.dueDate), {
    path: ["dueDate"], message: "La date d'échéance est obligatoire pour une facture.",
  }).refine((input) => !input.dueDate || input.dueDate >= input.date, {
    path: ["dueDate"], message: "La date d'échéance doit être égale ou postérieure à la date de facture.",
  }).refine((input) => input.kind === "invoice" || input.initialStatus === undefined, {
    path: ["initialStatus"], message: "Le statut initial n'est configurable que sur une facture.",
  }).refine((input) => input.kind === "invoice" || input.taxable === undefined, {
    path: ["taxable"], message: "L'option de TVA ne s'applique qu'aux factures.",
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, featureForSalesKind(input.kind));
    if (input.kind === "invoice" && !input.id) await assertSubscriptionQuota(input.companyId, "invoices");
    const configuredVatRate = isDesignMode ? 0 : await activeVatRate(input.companyId, input.date);
    const vatRate = input.kind === "invoice" && input.taxable === false ? 0 : configuredVatRate;
    const items = calculateItems(input.items, vatRate);
    const amount = items.reduce((sum, item) => sum + Math.round(item.quantity * item.unitPrice), 0);
    const tax = items.reduce((sum, item) => sum + item.tax, 0);
    if (input.kind === "delivery" && input.orderId) {
      const orderId = Number(input.orderId);
      const parent = isDesignMode
        ? (demoDocuments.get(input.companyId) ?? []).find((item) => item.id === input.orderId && item.kind === "order" && item.status !== "cancelled")
        : await getDb().select().from(businessDocuments).where(and(
          eq(businessDocuments.id, orderId), eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "sales_order"),
        )).limit(1).then(([row]) => row && parseMetadata(row));
      if (!parent || (parent as SalesPayload).kind !== "order" || (parent as SalesPayload).status === "cancelled") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "La commande liée est introuvable ou annulée." });
      }
    }

    if (isDesignMode) {
      const records = demoDocuments.get(input.companyId) ?? [];
      const current = input.id ? records.find((item) => item.id === input.id) : undefined;
      if (input.id && !current) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
      if (current && current.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seuls les brouillons peuvent être modifiés." });
      const now = new Date().toISOString();
      const prefix = input.kind === "quote" ? "DEV" : input.kind === "order" ? "BC" : input.kind === "delivery" ? "BL" : "FAC";
      const number = current?.number ?? `${prefix}-${new Date().getFullYear()}-${String(demoId++).padStart(4, "0")}`;
      const payload: UserDocument = {
        id: current?.id ?? `demo-${demoId++}`, companyId: String(input.companyId), kind: input.kind, number,
        clientId: input.clientId, clientName: input.clientName, clientEmail: input.clientEmail || undefined,
        clientNiu: input.clientNiu, clientRccm: input.clientRccm, date: input.date, expiryDate: input.expiryDate, dueDate: input.dueDate,
        deliveryDate: input.deliveryDate, expectedDeliveryDate: input.expectedDeliveryDate,
        deliveryAddress: input.deliveryAddress, orderId: input.orderId, carrier: input.carrier, trackingNumber: input.trackingNumber,
        amount, tax, total: amount + tax, status: current?.status ?? input.initialStatus ?? "draft", items,
        notes: input.notes, createdAt: current?.createdAt ?? now, updatedAt: now,
      };
      demoDocuments.set(input.companyId, current ? records.map((item) => item.id === current.id ? payload : item) : [payload, ...records]);
      return payload;
    }

    const db = getDb();
    const now = new Date();
    const savedId = input.id ? Number(input.id) : undefined;
    const result = await db.transaction(async (tx) => {
      let current: StoredDocument | undefined;
      if (savedId) {
        [current] = await tx.select().from(businessDocuments).where(and(
          eq(businessDocuments.id, savedId), eq(businessDocuments.companyId, input.companyId),
          eq(businessDocuments.documentType, input.kind === "quote" ? "sales_quote" : input.kind === "order" ? "sales_order" : input.kind === "delivery" ? "delivery_note" : "sales_invoice"),
        )).limit(1);
        if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
        const previous = parseMetadata(current);
        if (previous?.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seuls les brouillons peuvent être modifiés." });
      }
      const number = current?.documentNumber ?? await nextNumber(tx, input.companyId, input.kind, Number(input.date.slice(0, 4)));
      const previous = current ? parseMetadata(current) : null;
      let linkedOrderNumber: string | undefined;
      if (input.kind === "delivery" && input.orderId) {
        const [parentRow] = await tx.select().from(businessDocuments).where(and(
          eq(businessDocuments.id, Number(input.orderId)), eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "sales_order"),
        )).limit(1);
        linkedOrderNumber = parentRow?.documentNumber ?? undefined;
      }
      const payload: SalesPayload = {
        kind: input.kind, number, clientId: input.clientId, clientName: input.clientName,
        clientEmail: input.clientEmail || undefined, clientNiu: input.clientNiu, clientRccm: input.clientRccm,
        date: input.date, expiryDate: input.expiryDate, dueDate: input.dueDate, deliveryDate: input.deliveryDate,
        expectedDeliveryDate: input.expectedDeliveryDate, deliveryAddress: input.deliveryAddress,
        orderId: input.orderId, orderNumber: linkedOrderNumber, carrier: input.carrier, trackingNumber: input.trackingNumber,
        amount, tax, total: amount + tax, status: previous?.status ?? input.initialStatus ?? "draft", items,
        notes: input.notes, createdAt: previous?.createdAt ?? now.toISOString(), updatedAt: now.toISOString(),
      };
      const documentType = input.kind === "quote" ? "sales_quote" : input.kind === "order" ? "sales_order" : input.kind === "delivery" ? "delivery_note" : "sales_invoice";
      const title = `${number} — ${input.clientName}`;
      let documentId = current?.id;
      if (current) {
        await tx.update(businessDocuments).set({ title, metadataJson: JSON.stringify(payload), updatedAt: now })
          .where(and(eq(businessDocuments.id, current.id), eq(businessDocuments.companyId, input.companyId)));
        await tx.insert(externalDocumentEvents).values({ companyId: input.companyId, documentId: current.id, eventType: `${input.kind}_updated`, actorUserId: ctx.user.id });
      } else {
        const [created] = await tx.insert(businessDocuments).values({
          companyId: input.companyId, documentType, documentNumber: number, title,
          classification: "internal", status: storageStatus(input.kind, payload.status), metadataJson: JSON.stringify(payload), createdByUserId: ctx.user.id,
        }).$returningId();
        documentId = created.id;
        await tx.insert(externalDocumentEvents).values({ companyId: input.companyId, documentId, eventType: `${input.kind}_created`, actorUserId: ctx.user.id });
      }
      return { id: String(documentId), companyId: String(input.companyId), ...payload };
    });
    return result;
  }),

  convertQuoteToInvoice: authedQuery.input(z.object({
    companyId: z.number().int().positive(), quoteId: z.string().regex(/^(\d+|demo-\d+)$/),
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyManagementAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "quotes");
    await assertSubscriptionFeature(input.companyId, "invoices");
    await assertSubscriptionQuota(input.companyId, "invoices");
    const today = isDesignMode ? new Date().toISOString().slice(0, 10) : await localDateForCompany(input.companyId);
    const due = new Date(`${today}T00:00:00.000Z`);
    due.setUTCDate(due.getUTCDate() + 30);
    const dueDate = due.toISOString().slice(0, 10);
    if (isDesignMode) {
      const records = demoDocuments.get(input.companyId) ?? [];
      const quote = records.find((item) => item.id === input.quoteId && item.kind === "quote");
      if (!quote) throw new TRPCError({ code: "NOT_FOUND", message: "Devis introuvable." });
      const existing = records.find((item) => item.kind === "invoice" && item.sourceQuoteId === quote.id);
      if (existing) return existing;
      if (quote.status !== "accepted") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seul un devis accepté peut être converti en facture." });
      const now = new Date().toISOString();
      const number = `FAC-${today.slice(0, 4)}-${String(demoId++).padStart(4, "0")}`;
      const invoice: UserDocument = {
        ...invoicePayloadFromAcceptedQuote(quote as SalesPayload, quote.id, number, today, dueDate, now), id: `demo-${demoId++}`, companyId: String(input.companyId),
      };
      demoDocuments.set(input.companyId, [invoice, ...records.map((item) => item.id === quote.id ? { ...item, status: "converted", updatedAt: now } : item)]);
      return invoice;
    }

    const db = getDb();
    return db.transaction(async (tx) => {
      const quoteId = Number(input.quoteId);
      const [quoteRow] = await tx.select().from(businessDocuments).where(and(
        eq(businessDocuments.id, quoteId), eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "sales_quote"),
      )).limit(1).for("update");
      if (!quoteRow) throw new TRPCError({ code: "NOT_FOUND", message: "Devis introuvable." });
      const quote = parseMetadata(quoteRow);
      if (!quote) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Données du devis illisibles." });
      const invoiceRows = await tx.select().from(businessDocuments).where(and(
        eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "sales_invoice"),
      ));
      const existingRow = invoiceRows.find((row) => parseMetadata(row)?.sourceQuoteId === String(quoteRow.id));
      if (existingRow) {
        const existingPayload = parseMetadata(existingRow);
        if (!existingPayload) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Facture liée illisible." });
        return mapDocument(existingRow, existingPayload);
      }
      if (quote.status !== "accepted") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seul un devis accepté peut être converti en facture." });

      const now = new Date();
      const number = await nextNumber(tx, input.companyId, "invoice", Number(today.slice(0, 4)));
      const invoicePayload = invoicePayloadFromAcceptedQuote(quote, String(quoteRow.id), number, today, dueDate, now.toISOString());
      const title = `${number} — ${quote.clientName}`;
      const [created] = await tx.insert(businessDocuments).values({
        companyId: input.companyId, documentType: "sales_invoice", documentNumber: number, title,
        classification: "internal", status: "draft", metadataJson: JSON.stringify(invoicePayload), createdByUserId: ctx.user.id,
      }).$returningId();
      await tx.update(businessDocuments).set({ status: "finalized", metadataJson: JSON.stringify({ ...quote, status: "converted", updatedAt: now.toISOString() }), updatedAt: now })
        .where(and(eq(businessDocuments.id, quoteRow.id), eq(businessDocuments.companyId, input.companyId)));
      await tx.insert(externalDocumentEvents).values([
        { companyId: input.companyId, documentId: created.id, eventType: "invoice_created_from_quote", actorUserId: ctx.user.id, detailsJson: JSON.stringify({ quoteId: quoteRow.id, quoteNumber: quote.number }) },
        { companyId: input.companyId, documentId: quoteRow.id, eventType: "quote_converted_to_invoice", actorUserId: ctx.user.id, detailsJson: JSON.stringify({ invoiceId: created.id, invoiceNumber: number }) },
      ]);
      return mapDocument({ ...quoteRow, id: created.id, documentType: "sales_invoice", documentNumber: number, title, status: "draft", metadataJson: JSON.stringify(invoicePayload), createdAt: now, updatedAt: now }, invoicePayload);
    });
  }),

  setStatus: authedQuery.input(z.object({ companyId: z.number().int().positive(), id: z.string().regex(/^(\d+|demo-\d+)$/), kind: z.enum(kinds), status: z.string() })).mutation(async ({ ctx, input }) => {
    await assertCompanyManagementAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, featureForSalesKind(input.kind));
    const allowed = input.kind === "quote" ? quoteStatuses : input.kind === "order" ? orderStatuses : input.kind === "delivery" ? deliveryStatuses : invoiceStatuses;
    if (!allowed.includes(input.status as never)) throw new TRPCError({ code: "BAD_REQUEST", message: "Statut invalide." });
    if (isDesignMode) {
      const records = demoDocuments.get(input.companyId) ?? [];
      const current = records.find((item) => item.id === input.id);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
      if (current.kind !== input.kind) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
      if (!canTransitionSalesDocument(input.kind, current.status, input.status)) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Transition de statut non autorisée depuis l’état actuel." });
      if (current.kind === "order" && input.status === "cancelled" && records.some((item) => item.kind === "delivery" && item.orderId === current.id && item.status !== "cancelled")) throw new TRPCError({ code: "CONFLICT", message: "Des livraisons actives sont encore liées à cette commande." });
      demoDocuments.set(input.companyId, records.map((item) => item.id === input.id ? { ...item, status: input.status, updatedAt: new Date().toISOString() } : item));
      return { success: true };
    }
    const db = getDb();
    const documentId = Number(input.id);
    const type = input.kind === "quote" ? "sales_quote" : input.kind === "order" ? "sales_order" : input.kind === "delivery" ? "delivery_note" : "sales_invoice";
    const [row] = await db.select().from(businessDocuments).where(and(eq(businessDocuments.id, documentId), eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, type))).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
    const payload = parseMetadata(row);
    if (!payload) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Données du document illisibles." });
    if (!canTransitionSalesDocument(input.kind, payload.status, input.status)) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Transition de statut non autorisée depuis l’état actuel." });
    }
    if (input.kind === "order" && input.status === "cancelled") {
      const deliveryRows = await db.select().from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "delivery_note")));
      const hasActiveDelivery = deliveryRows.some((entry) => {
        const delivery = parseMetadata(entry);
        return delivery?.orderId === String(row.id) && delivery.status !== "cancelled";
      });
      if (hasActiveDelivery) throw new TRPCError({ code: "CONFLICT", message: "Des livraisons actives sont encore liées à cette commande." });
    }
    const updated = { ...payload, status: input.status, updatedAt: new Date().toISOString() };
    await db.transaction(async (tx) => {
      await tx.update(businessDocuments).set({ status: storageStatus(input.kind, input.status), metadataJson: JSON.stringify(updated), updatedAt: new Date() })
        .where(and(eq(businessDocuments.id, documentId), eq(businessDocuments.companyId, input.companyId)));
      await tx.insert(externalDocumentEvents).values({ companyId: input.companyId, documentId, eventType: `${input.kind}_status_changed`, actorUserId: ctx.user.id, detailsJson: JSON.stringify({ from: payload.status, to: input.status }) });
      if (input.kind === "delivery" && payload.orderId) {
        const orderRows = await tx.select().from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "sales_order")));
        const orderRow = orderRows.find((entry) => String(entry.id) === payload.orderId);
        const order = orderRow && parseMetadata(orderRow);
        if (orderRow && order) {
          const deliveryRows = await tx.select().from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "delivery_note")));
          const deliveryPayloads = deliveryRows.flatMap((entry) => {
            const value = entry.id === documentId ? updated : parseMetadata(entry);
            return value ? [value] : [];
          });
          const nextStatus = deriveOrderStatus(String(orderRow.id), order, deliveryPayloads);
          const next = { ...order, status: nextStatus, updatedAt: new Date().toISOString() };
          await tx.update(businessDocuments).set({ status: storageStatus("order", nextStatus), metadataJson: JSON.stringify(next), updatedAt: new Date() })
            .where(and(eq(businessDocuments.id, orderRow.id), eq(businessDocuments.companyId, input.companyId)));
        }
      }
    });
    return { success: true };
  }),

  delete: authedQuery.input(z.object({ companyId: z.number().int().positive(), id: z.string().regex(/^(\d+|demo-\d+)$/), kind: z.enum(kinds) })).mutation(async ({ ctx, input }) => {
    await assertCompanyManagementAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, featureForSalesKind(input.kind));
    if (isDesignMode) {
      const records = demoDocuments.get(input.companyId) ?? [];
      const target = records.find((item) => item.id === input.id && item.kind === input.kind);
      if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
      if (target.status !== "draft" && target.status !== "cancelled" && target.status !== "rejected" && target.status !== "expired") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seuls les brouillons, refus ou expirations peuvent être supprimés." });
      if (target.kind === "order" && records.some((item) => item.kind === "delivery" && item.orderId === target.id && item.status !== "cancelled")) throw new TRPCError({ code: "CONFLICT", message: "Des livraisons actives sont encore liées à cette commande." });
      demoDocuments.set(input.companyId, records.filter((item) => item.id !== input.id));
      return { success: true };
    }
    const db = getDb();
    const documentId = Number(input.id);
    const [row] = await db.select().from(businessDocuments).where(and(
      eq(businessDocuments.id, documentId), eq(businessDocuments.companyId, input.companyId),
      eq(businessDocuments.documentType, input.kind === "quote" ? "sales_quote" : input.kind === "order" ? "sales_order" : input.kind === "delivery" ? "delivery_note" : "sales_invoice"),
    )).limit(1);
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
    const payload = parseMetadata(row);
    if (!payload) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Données du document illisibles." });
    const deletableStatus = payload.status === "draft" || payload.status === "cancelled" || (input.kind === "quote" && (payload.status === "rejected" || payload.status === "expired"));
    if (!deletableStatus) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seuls les brouillons, refus ou expirations peuvent être supprimés." });
    if (input.kind === "order") {
      const deliveryRows = await db.select().from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "delivery_note")));
      if (deliveryRows.some((entry) => { const delivery = parseMetadata(entry); return delivery?.orderId === String(row.id) && delivery.status !== "cancelled"; })) {
        throw new TRPCError({ code: "CONFLICT", message: "Des livraisons actives sont encore liées à cette commande." });
      }
    }
    await db.transaction(async (tx) => {
      const deletedAt = new Date().toISOString();
      await tx.update(businessDocuments).set({ status: "void", metadataJson: JSON.stringify({ ...payload, deletedAt }), updatedAt: new Date() }).where(and(eq(businessDocuments.id, documentId), eq(businessDocuments.companyId, input.companyId)));
      await tx.insert(externalDocumentEvents).values({ companyId: input.companyId, documentId, eventType: `${input.kind}_deleted`, actorUserId: ctx.user.id });
      if (input.kind === "delivery" && payload.orderId) {
        const orderRows = await tx.select().from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "sales_order")));
        const orderRow = orderRows.find((entry) => String(entry.id) === payload.orderId);
        const order = orderRow && parseMetadata(orderRow);
        if (orderRow && order) {
          const deliveryRows = await tx.select().from(businessDocuments).where(and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, "delivery_note")));
          const remaining = deliveryRows.filter((entry) => entry.id !== documentId).flatMap((entry) => {
            const value = parseMetadata(entry);
            return value ? [value] : [];
          });
          const nextStatus = deriveOrderStatus(String(orderRow.id), order, remaining);
          const next = { ...order, status: nextStatus, updatedAt: deletedAt };
          await tx.update(businessDocuments).set({ status: storageStatus("order", nextStatus), metadataJson: JSON.stringify(next), updatedAt: new Date() })
            .where(and(eq(businessDocuments.id, orderRow.id), eq(businessDocuments.companyId, input.companyId)));
        }
      }
    });
    return { success: true };
  }),
});
