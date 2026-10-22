import { createHash } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { expenseClaimEvents, expenseClaims, users } from "@db/schema";
import { createRouter, authedQuery, assertCompanyAccess, getCompanyAccessRole } from "./middleware";
import { getDb } from "./queries/connection";
import { isDesignMode } from "./design-mode";
import { createPrivateDownloadUrl, documentServiceCapabilities, storeScannedDocument, deleteStoredDocument } from "./documents/storage";
import { assertSubscriptionFeature } from "./subscription-quota";
import { resolveCompanyCurrencyCode } from "./company-currency";
import { canReviewExpenses, canTransitionExpense, type ExpenseStatus } from "@/lib/finance/expense-policy";

const demoExpenses = new Map<number, ExpenseRecord[]>();
type ExpenseRecord = {
  id: number;
  companyId: number;
  employeeUserId: number;
  employeeName: string;
  description: string;
  amount: number;
  currencyCode: string;
  category: string;
  incurredOn: string;
  notes: string | null;
  status: ExpenseStatus;
  decisionNote: string | null;
  decidedByUserId: number | null;
  decidedAt: Date | null;
  receiptName: string | null;
  receiptAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function isIsoDateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function isUploadAvailable() {
  return documentServiceCapabilities().upload;
}

function mapExpense(row: typeof expenseClaims.$inferSelect, employeeName: string): ExpenseRecord {
  return {
    id: row.id,
    companyId: row.companyId,
    employeeUserId: row.employeeUserId,
    employeeName,
    description: row.description,
    amount: Number(row.amount),
    currencyCode: row.currencyCode,
    category: row.category,
    incurredOn: row.incurredOn,
    notes: row.notes,
    status: row.status,
    decisionNote: row.decisionNote,
    decidedByUserId: row.decidedByUserId,
    decidedAt: row.decidedAt,
    receiptName: row.receiptName,
    receiptAvailable: Boolean(row.receiptStorageKey),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const companyInput = z.object({ companyId: z.number().int().positive() });
const expenseDecision = z.enum(["approved", "rejected"]);

export const expenseRouter = createRouter({
  capabilities: authedQuery.query(() => ({ receiptUpload: isUploadAvailable() })),

  list: authedQuery.input(companyInput).query(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "expenses");
    const role = await getCompanyAccessRole(ctx.user, input.companyId);
    const canReview = canReviewExpenses(role);
    if (isDesignMode) {
      return (demoExpenses.get(input.companyId) ?? []).filter((expense) => canReview || expense.employeeUserId === ctx.user.id);
    }

    const rows = await getDb().select({
      expense: expenseClaims,
      employeeName: users.name,
      employeeEmail: users.email,
    }).from(expenseClaims)
      .leftJoin(users, eq(expenseClaims.employeeUserId, users.id))
      .where(canReview
        ? eq(expenseClaims.companyId, input.companyId)
        : and(eq(expenseClaims.companyId, input.companyId), eq(expenseClaims.employeeUserId, ctx.user.id)))
      .orderBy(desc(expenseClaims.createdAt));
    return rows.map(({ expense, employeeName, employeeEmail }) => mapExpense(expense, employeeName || employeeEmail || "Employé"));
  }),

  create: authedQuery.input(companyInput.extend({
    description: z.string().trim().min(2).max(255),
    amount: z.number().finite().positive().max(1_000_000_000_000),
    category: z.string().trim().min(2).max(120),
    incurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isIsoDateOnly, "Date invalide."),
    notes: z.string().trim().max(5000).optional(),
    receiptBase64: z.string().max(Math.ceil(1_500_000 * 4 / 3) + 8).optional(),
    receiptName: z.string().trim().max(180).optional(),
  })).mutation(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "expenses");
    const currencyCode = await resolveCompanyCurrencyCode(input.companyId);
    if (input.receiptBase64 && !isUploadAvailable()) {
      throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le stockage privé et l’analyse antivirus doivent être configurés pour joindre un justificatif." });
    }

    let receiptBytes: Buffer | undefined;
    if (input.receiptBase64) {
      receiptBytes = Buffer.from(input.receiptBase64, "base64");
      if (receiptBytes.toString("base64") !== input.receiptBase64 || receiptBytes.byteLength === 0 || receiptBytes.byteLength > 1_500_000) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le justificatif est invalide ou dépasse la taille maximale autorisée." });
      }
    }

    const employeeName = ctx.user.name || ctx.user.email || "Employé";
    if (isDesignMode) {
      const expenses = demoExpenses.get(input.companyId) ?? [];
      const now = new Date();
      const expense: ExpenseRecord = {
        id: Date.now(), companyId: input.companyId, employeeUserId: ctx.user.id, employeeName,
        description: input.description, amount: input.amount, category: input.category,
        currencyCode,
        incurredOn: input.incurredOn, notes: input.notes || null, status: "pending",
        decisionNote: null, decidedByUserId: null, decidedAt: null,
        receiptName: input.receiptBase64 ? input.receiptName || "justificatif.jpg" : null,
        receiptAvailable: Boolean(input.receiptBase64), createdAt: now, updatedAt: now,
      };
      demoExpenses.set(input.companyId, [expense, ...expenses]);
      return expense;
    }

    const db = getDb();
    const [created] = await db.transaction(async (tx) => {
      const [claim] = await tx.insert(expenseClaims).values({
        companyId: input.companyId,
        employeeUserId: ctx.user.id,
        description: input.description,
        amount: input.amount.toFixed(2),
        currencyCode,
        category: input.category,
        incurredOn: input.incurredOn,
        notes: input.notes || null,
      }).$returningId();
      await tx.insert(expenseClaimEvents).values({
        companyId: input.companyId,
        claimId: claim.id,
        eventType: "submitted",
        actorUserId: ctx.user.id,
      });
      return [claim] as const;
    });

    let storedKey: string | undefined;
    try {
      if (receiptBytes) {
        const stored = await storeScannedDocument({
          companyId: input.companyId,
          documentId: created.id,
          version: 1,
          mimeType: "image/jpeg",
          bytes: receiptBytes,
        });
        storedKey = stored.key;
        const receiptSha256 = createHash("sha256").update(receiptBytes).digest("hex");
        await db.update(expenseClaims).set({
          receiptStorageKey: stored.key,
          receiptName: input.receiptName || "justificatif.jpg",
          receiptMimeType: "image/jpeg",
          receiptSha256,
          updatedAt: new Date(),
        }).where(and(eq(expenseClaims.id, created.id), eq(expenseClaims.companyId, input.companyId)));
      }
      const [row] = await db.select({ expense: expenseClaims }).from(expenseClaims)
        .where(and(eq(expenseClaims.id, created.id), eq(expenseClaims.companyId, input.companyId))).limit(1);
      if (!row) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La note de frais créée est introuvable." });
      return mapExpense(row.expense, employeeName);
    } catch (error) {
      if (storedKey) await deleteStoredDocument(storedKey).catch(() => undefined);
      await db.delete(expenseClaimEvents).where(and(eq(expenseClaimEvents.companyId, input.companyId), eq(expenseClaimEvents.claimId, created.id))).catch(() => undefined);
      await db.delete(expenseClaims).where(and(eq(expenseClaims.companyId, input.companyId), eq(expenseClaims.id, created.id))).catch(() => undefined);
      throw error;
    }
  }),

  decide: authedQuery.input(companyInput.extend({
    expenseId: z.number().int().positive(),
    status: expenseDecision,
    decisionNote: z.string().trim().max(2000).optional(),
  })).mutation(async ({ ctx, input }) => {
    const role = await getCompanyAccessRole(ctx.user, input.companyId);
    if (!canReviewExpenses(role)) throw new TRPCError({ code: "FORBIDDEN", message: "Seuls un responsable, un administrateur ou le propriétaire peuvent traiter une note de frais." });
    await assertSubscriptionFeature(input.companyId, "expenses");
    if (isDesignMode) {
      const expenses = demoExpenses.get(input.companyId) ?? [];
      const current = expenses.find((expense) => expense.id === input.expenseId);
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Note de frais introuvable." });
      if (!canTransitionExpense(current.status, input.status)) throw new TRPCError({ code: "CONFLICT", message: "Cette note de frais a déjà été traitée." });
      const updated = { ...current, status: input.status, decisionNote: input.decisionNote || null, decidedByUserId: ctx.user.id, decidedAt: new Date(), updatedAt: new Date() };
      demoExpenses.set(input.companyId, expenses.map((expense) => expense.id === input.expenseId ? updated : expense));
      return updated;
    }

    const db = getDb();
    return db.transaction(async (tx) => {
      const [current] = await tx.select().from(expenseClaims).where(and(
        eq(expenseClaims.id, input.expenseId), eq(expenseClaims.companyId, input.companyId),
      )).limit(1).for("update");
      if (!current) throw new TRPCError({ code: "NOT_FOUND", message: "Note de frais introuvable." });
      if (!canTransitionExpense(current.status, input.status)) throw new TRPCError({ code: "CONFLICT", message: "Cette note de frais a déjà été traitée." });
      const now = new Date();
      await tx.update(expenseClaims).set({
        status: input.status,
        decisionNote: input.decisionNote || null,
        decidedByUserId: ctx.user.id,
        decidedAt: now,
        updatedAt: now,
      }).where(and(eq(expenseClaims.id, input.expenseId), eq(expenseClaims.companyId, input.companyId), eq(expenseClaims.status, "pending")));
      await tx.insert(expenseClaimEvents).values({
        companyId: input.companyId,
        claimId: input.expenseId,
        eventType: input.status,
        actorUserId: ctx.user.id,
        detailsJson: input.decisionNote ? JSON.stringify({ note: input.decisionNote }) : null,
      });
      return { ...current, status: input.status, decisionNote: input.decisionNote || null, decidedByUserId: ctx.user.id, decidedAt: now, updatedAt: now };
    });
  }),

  receiptDownloadUrl: authedQuery.input(companyInput.extend({ expenseId: z.number().int().positive() })).query(async ({ ctx, input }) => {
    await assertCompanyAccess(ctx.user, input.companyId);
    await assertSubscriptionFeature(input.companyId, "expenses");
    const role = await getCompanyAccessRole(ctx.user, input.companyId);
    if (isDesignMode) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun justificatif serveur n’est disponible en prévisualisation." });
    const [claim] = await getDb().select({
      receiptStorageKey: expenseClaims.receiptStorageKey,
      receiptName: expenseClaims.receiptName,
      employeeUserId: expenseClaims.employeeUserId,
    }).from(expenseClaims).where(and(
      eq(expenseClaims.companyId, input.companyId), eq(expenseClaims.id, input.expenseId),
    )).limit(1);
    if (!claim || !claim.receiptStorageKey) throw new TRPCError({ code: "NOT_FOUND", message: "Justificatif introuvable." });
    if (!canReviewExpenses(role) && claim.employeeUserId !== ctx.user.id) throw new TRPCError({ code: "NOT_FOUND", message: "Justificatif introuvable." });
    return { url: await createPrivateDownloadUrl(claim.receiptStorageKey, claim.receiptName || "justificatif.jpg") };
  }),
});
