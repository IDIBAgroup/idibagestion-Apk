import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { and, desc, eq, gte, inArray, isNotNull, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  businessDocuments,
  businessDocumentVersions,
  externalDocumentComments,
  documentTemplates,
  documentTemplateVersions,
  externalDocumentEvents,
  externalShareChallenges,
  externalShareSessions,
  externalDocumentShares,
  documentSignatureRequests,
  documentSignatureEvents,
  companyMemberships,
  companies,
  users,
} from "@db/schema";
import { createRouter, authedQuery, publicQuery, assertCompanyAccess, assertCompanyManagementAccess } from "./middleware";
import { getDb } from "./queries/connection";
import { createPrivateDownloadUrl, deleteStoredDocument, documentServiceCapabilities, MAX_DOCUMENT_UPLOAD_BYTES, readPrivateDocument, storeScannedDocument } from "./documents/storage";
import { externalOtpEmailReady, sendExternalAccessCode } from "./documents/email";
import { getEnvelopeStatus, isDocuSignConfigured, sendEnvelopeForSignature } from "./documents/docusign";
import { isDesignMode } from "./design-mode";
import {
  createDesignDraft, createDesignTemplate, listDesignDocumentEvents, listDesignDocuments,
  listDesignTemplates, setDesignTemplateStatus, updateDesignDraft, updateDesignTemplate, voidDesignDocument,
} from "./documents/design-store";

const hashShareToken = (token: string) => createHash("sha256").update(token).digest("hex");
const hashOtp = (challenge: string, otp: string) => createHash("sha256").update(`${challenge}:${otp}`).digest("hex");

async function findOtpVerifiedShare(token: string, sessionToken: string) {
  if (isDesignMode) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun partage externe n’est disponible dans l’aperçu local." });
  const db = getDb();
  const [share] = await db.select().from(externalDocumentShares)
    .where(eq(externalDocumentShares.tokenHash, hashShareToken(token))).limit(1);
  const [session] = share ? await db.select().from(externalShareSessions).where(and(
    eq(externalShareSessions.shareId, share.id),
    eq(externalShareSessions.sessionHash, hashShareToken(sessionToken)),
    isNull(externalShareSessions.revokedAt),
  )).limit(1) : [];
  const now = new Date();
  if (!share || !session || share.revokedAt || share.expiresAt <= now || session.expiresAt <= now) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Lien ou session expiré. Redemandez un code d’accès." });
  }
  const [document] = await db.select().from(businessDocuments).where(and(
    eq(businessDocuments.id, share.documentId),
    eq(businessDocuments.companyId, share.companyId),
  )).limit(1);
  if (!document || document.status !== "finalized" || document.classification !== "public") {
    throw new TRPCError({ code: "NOT_FOUND", message: "Document partagé introuvable." });
  }
  return { db, share, session, document };
}

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return "adresse e-mail destinataire";
  return `${name.slice(0, 1)}${"•".repeat(Math.max(2, Math.min(name.length - 1, 6)))}@${domain}`;
}

export const documentRouter = createRouter({
  capabilities: publicQuery.query(() => ({
    ...documentServiceCapabilities(),
    demoMode: isDesignMode,
  })),

  list: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentType: z.string().max(80).optional() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) return listDesignDocuments(input.companyId, input.documentType);
      const db = getDb();
      const rows = await db.select({
        id: businessDocuments.id,
        companyId: businessDocuments.companyId,
        templateId: businessDocuments.templateId,
        documentType: businessDocuments.documentType,
        documentNumber: businessDocuments.documentNumber,
        title: businessDocuments.title,
        classification: businessDocuments.classification,
        status: businessDocuments.status,
        metadataJson: businessDocuments.metadataJson,
        mimeType: businessDocuments.mimeType,
        sha256: businessDocuments.sha256,
        createdByUserId: businessDocuments.createdByUserId,
        finalizedAt: businessDocuments.finalizedAt,
        createdAt: businessDocuments.createdAt,
        updatedAt: businessDocuments.updatedAt,
      }).from(businessDocuments).where(input.documentType
        ? and(eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.documentType, input.documentType))
        : eq(businessDocuments.companyId, input.companyId)).orderBy(desc(businessDocuments.createdAt));
      return rows;
    }),

  createDraft: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      documentType: z.string().trim().min(1).max(80),
      title: z.string().trim().min(1).max(255),
      classification: z.enum(["public", "internal", "confidential", "restricted"]).default("internal"),
      metadataJson: z.string().max(100_000).nullable().optional(),
      templateId: z.number().int().positive().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) {
        if (input.templateId && !listDesignTemplates(input.companyId).some((template) => template.id === input.templateId && template.status === "active")) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Modèle actif introuvable." });
        }
        const document = createDesignDraft({ ...input, actorUserId: ctx.user.id });
        return { id: document.id, status: "draft" as const };
      }
      const db = getDb();
      if (input.templateId) {
        const [template] = await db.select({ id: documentTemplates.id, status: documentTemplates.status })
          .from(documentTemplates).where(and(
            eq(documentTemplates.id, input.templateId),
            eq(documentTemplates.companyId, input.companyId),
            eq(documentTemplates.status, "active"),
          )).limit(1);
        if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Modèle actif introuvable" });
      }
      const [inserted] = await db.insert(businessDocuments).values({
        companyId: input.companyId,
        documentType: input.documentType,
        title: input.title,
        classification: input.classification,
        metadataJson: input.metadataJson,
        templateId: input.templateId,
        createdByUserId: ctx.user.id,
      }).$returningId();
      await db.insert(externalDocumentEvents).values({
        companyId: input.companyId,
        documentId: inserted.id,
        eventType: "draft_created",
        actorUserId: ctx.user.id,
      });
      return { id: inserted.id, status: "draft" as const };
    }),

  updateDraft: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      documentId: z.number().int().positive(),
      documentType: z.string().trim().min(1).max(80),
      title: z.string().trim().min(1).max(255),
      classification: z.enum(["public", "internal", "confidential", "restricted"]),
      metadataJson: z.string().max(100_000).nullable().optional(),
      templateId: z.number().int().positive().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (isDesignMode) {
        if (input.templateId && !listDesignTemplates(input.companyId).some((template) => template.id === input.templateId && template.status === "active")) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Modèle actif introuvable." });
        }
        return updateDesignDraft({ ...input, actorUserId: ctx.user.id });
      }
      const db = getDb();
      const [document] = await db.select({ id: businessDocuments.id, status: businessDocuments.status })
        .from(businessDocuments).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId))).limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
      if (document.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seuls les brouillons peuvent être modifiés." });
      if (input.templateId) {
        const [template] = await db.select({ id: documentTemplates.id }).from(documentTemplates).where(and(
          eq(documentTemplates.id, input.templateId), eq(documentTemplates.companyId, input.companyId), eq(documentTemplates.status, "active"),
        )).limit(1);
        if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Modèle actif introuvable." });
      }
      await db.update(businessDocuments).set({
        title: input.title, documentType: input.documentType, classification: input.classification,
        metadataJson: input.metadataJson, templateId: input.templateId ?? null, updatedAt: new Date(),
      }).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId), eq(businessDocuments.status, "draft")));
      await db.insert(externalDocumentEvents).values({ companyId: input.companyId, documentId: input.documentId, eventType: "draft_updated", actorUserId: ctx.user.id });
      return { success: true };
    }),

  uploadFile: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      documentId: z.number().int().positive(),
      mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
      fileName: z.string().trim().min(1).max(180),
      base64: z.string().min(4).max(Math.ceil(MAX_DOCUMENT_UPLOAD_BYTES * 4 / 3) + 8),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (!documentServiceCapabilities().upload) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configurez le stockage privé et le service antivirus pour téléverser un fichier." });
      if (isDesignMode) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le téléversement sécurisé n’est pas disponible dans l’aperçu local." });
      const db = getDb();
      const [document] = await db.select({ id: businessDocuments.id, status: businessDocuments.status })
        .from(businessDocuments).where(and(
          eq(businessDocuments.id, input.documentId),
          eq(businessDocuments.companyId, input.companyId),
        )).limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
      if (document.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seuls les brouillons peuvent recevoir un fichier." });
      const bytes = Buffer.from(input.base64, "base64");
      if (bytes.toString("base64") !== input.base64 || bytes.byteLength > MAX_DOCUMENT_UPLOAD_BYTES) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier encodé est invalide ou dépasse 10 Mo." });
      }
      const [lastVersion] = await db.select({ version: businessDocumentVersions.version })
        .from(businessDocumentVersions).where(and(
          eq(businessDocumentVersions.companyId, input.companyId),
          eq(businessDocumentVersions.documentId, input.documentId),
        )).orderBy(desc(businessDocumentVersions.version)).limit(1);
      const version = (lastVersion?.version ?? 0) + 1;
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const stored = await storeScannedDocument({
        companyId: input.companyId,
        documentId: input.documentId,
        version,
        mimeType: input.mimeType,
        bytes,
      });
      try {
        const now = new Date();
        await db.insert(businessDocumentVersions).values({
          companyId: input.companyId,
          documentId: input.documentId,
          version,
          storageKey: stored.key,
          mimeType: input.mimeType,
          sha256,
          snapshotJson: JSON.stringify({ fileName: input.fileName }),
          createdByUserId: ctx.user.id,
        });
        await db.update(businessDocuments).set({
          storageKey: stored.key,
          mimeType: input.mimeType,
          sha256,
          updatedAt: now,
        }).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId)));
        await db.insert(externalDocumentEvents).values({
          companyId: input.companyId,
          documentId: input.documentId,
          eventType: "file_uploaded_and_scanned",
          actorUserId: ctx.user.id,
          detailsJson: JSON.stringify({ version, sha256, mimeType: input.mimeType, fileName: input.fileName }),
        });
      } catch (error) {
        await deleteStoredDocument(stored.key).catch(() => undefined);
        throw error;
      }
      return { version, sha256, mimeType: input.mimeType };
    }),

  finalize: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (isDesignMode) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Téléversez un PDF avec le stockage privé et l’analyse antivirus configurés avant de le finaliser." });
      const db = getDb();
      const [document] = await db.select({
        status: businessDocuments.status,
        storageKey: businessDocuments.storageKey,
        sha256: businessDocuments.sha256,
      }).from(businessDocuments).where(and(
        eq(businessDocuments.id, input.documentId),
        eq(businessDocuments.companyId, input.companyId),
      )).limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
      if (!documentServiceCapabilities().download) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le stockage privé des documents n’est pas configuré." });
      if (document.status !== "draft" || !document.storageKey || !document.sha256) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Téléversez et analysez un fichier avant sa finalisation." });
      }
      const finalizedAt = new Date();
      await db.update(businessDocuments).set({ status: "finalized", finalizedAt, updatedAt: finalizedAt })
        .where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId)));
      await db.insert(externalDocumentEvents).values({
        companyId: input.companyId,
        documentId: input.documentId,
        eventType: "document_finalized",
        actorUserId: ctx.user.id,
        detailsJson: JSON.stringify({ sha256: document.sha256 }),
      });
      return { success: true, finalizedAt };
    }),

  voidDocument: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (isDesignMode) return voidDesignDocument(input.companyId, input.documentId, ctx.user.id);
      const db = getDb();
      return db.transaction(async (tx) => {
        const [document] = await tx.select({ id: businessDocuments.id, status: businessDocuments.status }).from(businessDocuments).where(and(
          eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId),
        )).limit(1).for("update");
        if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
        if (document.status === "void") return { success: true, alreadyVoided: true };
        const [pendingProviderRequest] = await tx.select({ id: documentSignatureRequests.id }).from(documentSignatureRequests).where(and(
          eq(documentSignatureRequests.companyId, input.companyId), eq(documentSignatureRequests.documentId, input.documentId),
          eq(documentSignatureRequests.signatureKind, "provider_signature"), eq(documentSignatureRequests.status, "pending"),
        )).limit(1);
        if (pendingProviderRequest) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Actualisez ou annulez d’abord la demande DocuSign en cours." });
        const pendingInternal = await tx.select({ id: documentSignatureRequests.id }).from(documentSignatureRequests).where(and(
          eq(documentSignatureRequests.companyId, input.companyId), eq(documentSignatureRequests.documentId, input.documentId),
          eq(documentSignatureRequests.signatureKind, "internal_acknowledgement"), eq(documentSignatureRequests.status, "pending"),
        ));
        const now = new Date();
        await tx.update(businessDocuments).set({ status: "void", updatedAt: now }).where(and(
          eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId),
        ));
        await tx.update(externalDocumentShares).set({ revokedAt: now }).where(and(
          eq(externalDocumentShares.companyId, input.companyId), eq(externalDocumentShares.documentId, input.documentId), isNull(externalDocumentShares.revokedAt),
        ));
        await tx.update(documentSignatureRequests).set({ status: "cancelled", completedAt: now }).where(and(
          eq(documentSignatureRequests.companyId, input.companyId), eq(documentSignatureRequests.documentId, input.documentId),
          eq(documentSignatureRequests.signatureKind, "internal_acknowledgement"), eq(documentSignatureRequests.status, "pending"),
        ));
        if (pendingInternal.length) await tx.insert(documentSignatureEvents).values(pendingInternal.map((request) => ({
          companyId: input.companyId, requestId: request.id, eventType: "internal_signature_cancelled", actorUserId: ctx.user.id,
          payloadJson: JSON.stringify({ reason: "document_voided", voidedAt: now.toISOString() }),
        })));
        await tx.insert(externalDocumentEvents).values({ companyId: input.companyId, documentId: input.documentId, eventType: "document_voided", actorUserId: ctx.user.id });
        return { success: true, alreadyVoided: false };
      });
    }),

  downloadFile: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun fichier téléversé dans l’aperçu local." });
      const [document] = await getDb().select({
        title: businessDocuments.title,
        storageKey: businessDocuments.storageKey,
        status: businessDocuments.status,
      }).from(businessDocuments).where(and(
        eq(businessDocuments.id, input.documentId),
        eq(businessDocuments.companyId, input.companyId),
      )).limit(1);
      if (!document?.storageKey || document.status === "void") throw new TRPCError({ code: "NOT_FOUND", message: "Fichier introuvable" });
      return { url: await createPrivateDownloadUrl(document.storageKey, document.title) };
    }),

  listVersions: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) return [];
      return getDb().select({
        id: businessDocumentVersions.id,
        version: businessDocumentVersions.version,
        mimeType: businessDocumentVersions.mimeType,
        sha256: businessDocumentVersions.sha256,
        snapshotJson: businessDocumentVersions.snapshotJson,
        createdByUserId: businessDocumentVersions.createdByUserId,
        createdAt: businessDocumentVersions.createdAt,
      }).from(businessDocumentVersions).where(and(
        eq(businessDocumentVersions.companyId, input.companyId), eq(businessDocumentVersions.documentId, input.documentId),
      )).orderBy(desc(businessDocumentVersions.version));
    }),

  downloadVersion: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive(), versionId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) throw new TRPCError({ code: "NOT_FOUND", message: "Aucune version téléversée dans l’aperçu local." });
      const [version] = await getDb().select({ storageKey: businessDocumentVersions.storageKey, snapshotJson: businessDocumentVersions.snapshotJson, version: businessDocumentVersions.version }).from(businessDocumentVersions).where(and(
        eq(businessDocumentVersions.id, input.versionId), eq(businessDocumentVersions.companyId, input.companyId), eq(businessDocumentVersions.documentId, input.documentId),
      )).limit(1);
      if (!version?.storageKey) throw new TRPCError({ code: "NOT_FOUND", message: "Version documentaire introuvable." });
      let fileName = `document-v${version.version}`;
      try {
        const snapshot = JSON.parse(version.snapshotJson || "{}") as { fileName?: unknown };
        if (typeof snapshot.fileName === "string") fileName = snapshot.fileName;
      } catch { /* Keep the safe fallback filename. */ }
      return { url: await createPrivateDownloadUrl(version.storageKey, fileName) };
    }),

  listDocumentEvents: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) return listDesignDocumentEvents(input.companyId, input.documentId);
      return getDb().select({
        id: externalDocumentEvents.id,
        eventType: externalDocumentEvents.eventType,
        actorUserId: externalDocumentEvents.actorUserId,
        detailsJson: externalDocumentEvents.detailsJson,
        createdAt: externalDocumentEvents.createdAt,
      }).from(externalDocumentEvents).where(and(
        eq(externalDocumentEvents.companyId, input.companyId), eq(externalDocumentEvents.documentId, input.documentId),
      )).orderBy(desc(externalDocumentEvents.createdAt)).limit(100);
    }),

  listTemplates: authedQuery
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) return listDesignTemplates(input.companyId);
      const db = getDb();
      const templates = await db.select().from(documentTemplates)
        .where(eq(documentTemplates.companyId, input.companyId))
        .orderBy(desc(documentTemplates.updatedAt));
      const versions = await db.select({ templateId: documentTemplateVersions.templateId, version: documentTemplateVersions.version, layoutJson: documentTemplateVersions.layoutJson })
        .from(documentTemplateVersions).where(eq(documentTemplateVersions.companyId, input.companyId))
        .orderBy(desc(documentTemplateVersions.version));
      const latestVersion = new Map<number, typeof versions[number]>();
      for (const version of versions) if (!latestVersion.has(version.templateId)) latestVersion.set(version.templateId, version);
      return templates.map((template) => ({ ...template, layoutJson: latestVersion.get(template.id)?.layoutJson ?? null }));
    }),

  createTemplate: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      name: z.string().trim().min(1).max(180),
      documentType: z.string().trim().min(1).max(80),
      layoutJson: z.string().min(2).max(100_000),
      activateImmediately: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      try { JSON.parse(input.layoutJson); } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le contenu du modèle doit être un JSON valide" });
      }
      if (isDesignMode) return createDesignTemplate({ ...input, actorUserId: ctx.user.id });
      const db = getDb();
      const [inserted] = await db.insert(documentTemplates).values({
        companyId: input.companyId,
        name: input.name,
        documentType: input.documentType,
        status: input.activateImmediately ? "active" : "draft",
        createdByUserId: ctx.user.id,
      }).$returningId();
      await db.insert(documentTemplateVersions).values({
        companyId: input.companyId,
        templateId: inserted.id,
        version: 1,
        layoutJson: input.layoutJson,
        createdByUserId: ctx.user.id,
      });
      return { id: inserted.id, version: 1, status: input.activateImmediately ? "active" as const : "draft" as const };
    }),

  updateTemplate: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      templateId: z.number().int().positive(),
      name: z.string().trim().min(1).max(180),
      documentType: z.string().trim().min(1).max(80),
      layoutJson: z.string().min(2).max(100_000),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      try { JSON.parse(input.layoutJson); } catch {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Le contenu du modèle doit être un JSON valide." });
      }
      if (isDesignMode) return updateDesignTemplate(input);
      const db = getDb();
      const [template] = await db.select({ id: documentTemplates.id, currentVersion: documentTemplates.currentVersion, status: documentTemplates.status })
        .from(documentTemplates).where(and(
          eq(documentTemplates.id, input.templateId), eq(documentTemplates.companyId, input.companyId),
        )).limit(1);
      if (!template || template.status === "archived") throw new TRPCError({ code: "NOT_FOUND", message: "Modèle introuvable ou archivé." });
      const version = template.currentVersion + 1;
      await db.insert(documentTemplateVersions).values({
        companyId: input.companyId,
        templateId: input.templateId,
        version,
        layoutJson: input.layoutJson,
        createdByUserId: ctx.user.id,
      });
      await db.update(documentTemplates).set({ name: input.name, documentType: input.documentType, currentVersion: version, updatedAt: new Date() }).where(and(
        eq(documentTemplates.id, input.templateId), eq(documentTemplates.companyId, input.companyId),
      ));
      return { success: true, version };
    }),

  activateTemplate: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), templateId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (isDesignMode) return setDesignTemplateStatus(input.companyId, input.templateId, "active");
      const db = getDb();
      const [template] = await db.select({ id: documentTemplates.id, status: documentTemplates.status })
        .from(documentTemplates).where(and(
          eq(documentTemplates.id, input.templateId),
          eq(documentTemplates.companyId, input.companyId),
        )).limit(1);
      if (!template || template.status === "archived") throw new TRPCError({ code: "NOT_FOUND", message: "Modèle introuvable ou archivé." });
      await db.update(documentTemplates).set({ status: "active", updatedAt: new Date() }).where(and(
        eq(documentTemplates.id, input.templateId),
        eq(documentTemplates.companyId, input.companyId),
      ));
      return { success: true };
    }),

  archiveTemplate: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), templateId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (isDesignMode) return setDesignTemplateStatus(input.companyId, input.templateId, "archived");
      const db = getDb();
      const [template] = await db.select({ id: documentTemplates.id, status: documentTemplates.status }).from(documentTemplates).where(and(
        eq(documentTemplates.id, input.templateId), eq(documentTemplates.companyId, input.companyId),
      )).limit(1);
      if (!template) throw new TRPCError({ code: "NOT_FOUND", message: "Modèle introuvable." });
      if (template.status !== "archived") await db.update(documentTemplates).set({ status: "archived", updatedAt: new Date() }).where(and(
        eq(documentTemplates.id, input.templateId), eq(documentTemplates.companyId, input.companyId),
      ));
      return { success: true };
    }),

  listSignatures: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) return [];
      return getDb().select({
        id: documentSignatureRequests.id,
        signerUserId: documentSignatureRequests.signerUserId,
        signerEmail: documentSignatureRequests.signerEmail,
        status: documentSignatureRequests.status,
        signatureKind: documentSignatureRequests.signatureKind,
        documentSha256: documentSignatureRequests.documentSha256,
        createdByUserId: documentSignatureRequests.createdByUserId,
        provider: documentSignatureRequests.provider,
        providerReference: documentSignatureRequests.providerReference,
        lastStatusCheckedAt: documentSignatureRequests.lastStatusCheckedAt,
        completedAt: documentSignatureRequests.completedAt,
        createdAt: documentSignatureRequests.createdAt,
      }).from(documentSignatureRequests).where(and(
        eq(documentSignatureRequests.companyId, input.companyId),
        eq(documentSignatureRequests.documentId, input.documentId),
      )).orderBy(desc(documentSignatureRequests.createdAt));
    }),

  listInternalSigners: authedQuery
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) return [{ userId: ctx.user.id, name: ctx.user.name, email: ctx.user.email, role: "owner" as const }];
      const db = getDb();
      const memberships = await db.select({
        userId: companyMemberships.userId,
        name: users.name,
        email: users.email,
        role: companyMemberships.role,
      }).from(companyMemberships).innerJoin(users, eq(companyMemberships.userId, users.id)).where(and(
        eq(companyMemberships.companyId, input.companyId),
        eq(companyMemberships.status, "active"),
      ));
      const [company] = await db.select({ ownerUserId: companies.ownerUserId }).from(companies)
        .where(eq(companies.id, input.companyId)).limit(1);
      if (company?.ownerUserId && !memberships.some((member) => member.userId === company.ownerUserId)) {
        const [owner] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users)
          .where(eq(users.id, company.ownerUserId)).limit(1);
        if (owner) memberships.push({ userId: owner.id, name: owner.name, email: owner.email, role: "owner" });
      }
      return memberships.filter((member) => member.email).sort((a, b) => (a.name || a.email || "").localeCompare(b.name || b.email || ""));
    }),

  listMyInternalSignatures: authedQuery
    .input(z.object({ companyId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) return [];
      const db = getDb();
      const requests = await db.select({
        id: documentSignatureRequests.id,
        documentId: documentSignatureRequests.documentId,
        documentTitle: businessDocuments.title,
        documentSha256: documentSignatureRequests.documentSha256,
        status: documentSignatureRequests.status,
        createdAt: documentSignatureRequests.createdAt,
        requesterUserId: documentSignatureRequests.createdByUserId,
      }).from(documentSignatureRequests).innerJoin(businessDocuments, and(
        eq(businessDocuments.id, documentSignatureRequests.documentId),
        eq(businessDocuments.companyId, documentSignatureRequests.companyId),
      )).where(and(
        eq(documentSignatureRequests.companyId, input.companyId),
        eq(documentSignatureRequests.signerUserId, ctx.user.id),
        eq(documentSignatureRequests.signatureKind, "internal_acknowledgement"),
        eq(documentSignatureRequests.status, "pending"),
      )).orderBy(desc(documentSignatureRequests.createdAt));
      if (!requests.length) return requests.map((request) => ({ ...request, requestNote: null as string | null }));
      const requestEvents = await db.select({ requestId: documentSignatureEvents.requestId, payloadJson: documentSignatureEvents.payloadJson })
        .from(documentSignatureEvents).where(and(
          eq(documentSignatureEvents.companyId, input.companyId),
          eq(documentSignatureEvents.eventType, "internal_signature_requested"),
          inArray(documentSignatureEvents.requestId, requests.map((request) => request.id)),
        ));
      const noteByRequestId = new Map(requestEvents.map((event) => {
        try {
          const payload = JSON.parse(event.payloadJson ?? "{}") as { note?: unknown };
          return [event.requestId, typeof payload.note === "string" ? payload.note : null] as const;
        } catch { return [event.requestId, null] as const; }
      }));
      return requests.map((request) => ({ ...request, requestNote: noteByRequestId.get(request.id) ?? null }));
    }),

  listSignatureEvents: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) return [];
      return getDb().select({
        id: documentSignatureEvents.id,
        requestId: documentSignatureEvents.requestId,
        eventType: documentSignatureEvents.eventType,
        actorUserId: documentSignatureEvents.actorUserId,
        payloadJson: documentSignatureEvents.payloadJson,
        createdAt: documentSignatureEvents.createdAt,
      }).from(documentSignatureEvents).innerJoin(documentSignatureRequests, and(
        eq(documentSignatureRequests.id, documentSignatureEvents.requestId),
        eq(documentSignatureRequests.companyId, documentSignatureEvents.companyId),
      )).where(and(
        eq(documentSignatureEvents.companyId, input.companyId),
        eq(documentSignatureRequests.documentId, input.documentId),
      )).orderBy(desc(documentSignatureEvents.createdAt));
    }),

  requestInternalSignature: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      documentId: z.number().int().positive(),
      signerUserId: z.number().int().positive(),
      note: z.string().trim().max(1000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (!documentServiceCapabilities().download || isDesignMode) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configurez le stockage privé et téléversez un PDF finalisé avant de demander un visa." });
      const db = getDb();
      const [document] = await db.select({ title: businessDocuments.title, status: businessDocuments.status, storageKey: businessDocuments.storageKey, mimeType: businessDocuments.mimeType, sha256: businessDocuments.sha256 })
        .from(businessDocuments).where(and(eq(businessDocuments.id, input.documentId), eq(businessDocuments.companyId, input.companyId))).limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
      if (document.status !== "finalized" || !document.storageKey || document.mimeType !== "application/pdf" || !document.sha256) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seul un PDF finalisé avec empreinte peut être soumis à validation interne." });
      }
      const pdf = await readPrivateDocument(document.storageKey);
      if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier final n’est pas un PDF valide." });
      const [membership] = await db.select({ userId: companyMemberships.userId }).from(companyMemberships).where(and(
        eq(companyMemberships.companyId, input.companyId), eq(companyMemberships.userId, input.signerUserId), eq(companyMemberships.status, "active"),
      )).limit(1);
      const [company] = await db.select({ ownerUserId: companies.ownerUserId }).from(companies).where(eq(companies.id, input.companyId)).limit(1);
      if (!membership && company?.ownerUserId !== input.signerUserId) throw new TRPCError({ code: "BAD_REQUEST", message: "Le signataire doit être un membre actif de l’entreprise." });
      const [signer] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, input.signerUserId)).limit(1);
      if (!signer?.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Ce membre ne possède pas d’adresse e-mail valide." });
      return db.transaction(async (tx) => {
        const [existing] = await tx.select({ id: documentSignatureRequests.id }).from(documentSignatureRequests).where(and(
          eq(documentSignatureRequests.companyId, input.companyId), eq(documentSignatureRequests.documentId, input.documentId),
          eq(documentSignatureRequests.signerUserId, input.signerUserId), eq(documentSignatureRequests.signatureKind, "internal_acknowledgement"),
          eq(documentSignatureRequests.status, "pending"),
        )).limit(1).for("update");
        if (existing) throw new TRPCError({ code: "CONFLICT", message: "Une demande est déjà en attente pour ce membre." });
        const [request] = await tx.insert(documentSignatureRequests).values({
          companyId: input.companyId, documentId: input.documentId, signerUserId: signer.id, signerEmail: signer.email,
          signatureKind: "internal_acknowledgement", provider: "internal", documentSha256: document.sha256, status: "pending", createdByUserId: ctx.user.id,
        }).$returningId();
        await tx.insert(documentSignatureEvents).values({
          companyId: input.companyId, requestId: request.id, eventType: "internal_signature_requested", actorUserId: ctx.user.id,
          payloadJson: JSON.stringify({ documentTitle: document.title, signerUserId: signer.id, signerEmail: signer.email, documentSha256: document.sha256, note: input.note || null }),
        });
        return { id: request.id, status: "pending" as const };
      });
    }),

  signInternalDocument: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), requestId: z.number().int().positive(), acknowledged: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) throw new TRPCError({ code: "NOT_FOUND", message: "Aucune demande de signature dans l’aperçu local." });
      const db = getDb();
      return db.transaction(async (tx) => {
        const [request] = await tx.select().from(documentSignatureRequests).where(and(
          eq(documentSignatureRequests.id, input.requestId), eq(documentSignatureRequests.companyId, input.companyId),
          eq(documentSignatureRequests.signerUserId, ctx.user.id), eq(documentSignatureRequests.signatureKind, "internal_acknowledgement"),
          eq(documentSignatureRequests.status, "pending"),
        )).limit(1).for("update");
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Demande en attente introuvable pour votre compte." });
        const [document] = await tx.select({ status: businessDocuments.status, storageKey: businessDocuments.storageKey, sha256: businessDocuments.sha256 })
          .from(businessDocuments).where(and(eq(businessDocuments.id, request.documentId), eq(businessDocuments.companyId, input.companyId))).limit(1);
        if (!document || document.status !== "finalized" || !document.storageKey || !request.documentSha256 || document.sha256 !== request.documentSha256) {
          throw new TRPCError({ code: "CONFLICT", message: "Le document a changé depuis la demande. Demandez une nouvelle validation." });
        }
        const signedAt = new Date();
        await tx.update(documentSignatureRequests).set({ status: "signed", completedAt: signedAt }).where(and(
          eq(documentSignatureRequests.id, request.id), eq(documentSignatureRequests.companyId, input.companyId), eq(documentSignatureRequests.status, "pending"),
        ));
        await tx.insert(documentSignatureEvents).values({
          companyId: input.companyId, requestId: request.id, eventType: "internal_signature_signed", actorUserId: ctx.user.id,
          payloadJson: JSON.stringify({ signerEmail: request.signerEmail, documentSha256: request.documentSha256, acknowledged: true, attestationVersion: 1, signedAt: signedAt.toISOString() }),
        });
        return { status: "signed" as const, completedAt: signedAt };
      });
    }),

  declineInternalSignature: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), requestId: z.number().int().positive(), reason: z.string().trim().min(3).max(1000) }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) throw new TRPCError({ code: "NOT_FOUND", message: "Aucune demande de signature dans l’aperçu local." });
      const db = getDb();
      return db.transaction(async (tx) => {
        const [request] = await tx.select().from(documentSignatureRequests).where(and(
          eq(documentSignatureRequests.id, input.requestId), eq(documentSignatureRequests.companyId, input.companyId),
          eq(documentSignatureRequests.signerUserId, ctx.user.id), eq(documentSignatureRequests.signatureKind, "internal_acknowledgement"),
          eq(documentSignatureRequests.status, "pending"),
        )).limit(1).for("update");
        if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "Demande en attente introuvable pour votre compte." });
        const completedAt = new Date();
        await tx.update(documentSignatureRequests).set({ status: "declined", completedAt }).where(and(
          eq(documentSignatureRequests.id, request.id), eq(documentSignatureRequests.companyId, input.companyId), eq(documentSignatureRequests.status, "pending"),
        ));
        await tx.insert(documentSignatureEvents).values({
          companyId: input.companyId, requestId: request.id, eventType: "internal_signature_declined", actorUserId: ctx.user.id,
          payloadJson: JSON.stringify({ signerEmail: request.signerEmail, documentSha256: request.documentSha256, reason: input.reason, declinedAt: completedAt.toISOString() }),
        });
        return { status: "declined" as const, completedAt };
      });
    }),

  sendDocuSignRequest: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      documentId: z.number().int().positive(),
      signerName: z.string().trim().min(1).max(100),
      signerEmail: z.string().trim().email().max(320),
      anchorText: z.string().trim().min(3).max(80).default("{{SIGN_HERE}}"),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (!isDocuSignConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configurez les identifiants DocuSign et le consentement JWT avant d’envoyer une signature." });
      const db = getDb();
      const [document] = await db.select({
        title: businessDocuments.title,
        status: businessDocuments.status,
        storageKey: businessDocuments.storageKey,
        mimeType: businessDocuments.mimeType,
        sha256: businessDocuments.sha256,
      }).from(businessDocuments).where(and(
        eq(businessDocuments.id, input.documentId),
        eq(businessDocuments.companyId, input.companyId),
      )).limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
      if (document.status !== "finalized" || !document.storageKey || document.mimeType !== "application/pdf" || !document.sha256) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seul un document PDF finalisé peut être envoyé en signature." });
      }
      const pdf = await readPrivateDocument(document.storageKey);
      if (!pdf.subarray(0, 5).equals(Buffer.from("%PDF-"))) throw new TRPCError({ code: "BAD_REQUEST", message: "Le fichier final n’est pas un PDF valide." });
      const [request] = await db.insert(documentSignatureRequests).values({
        companyId: input.companyId,
        documentId: input.documentId,
        signerEmail: input.signerEmail,
        signatureKind: "provider_signature",
        provider: "docusign",
        status: "pending",
        createdByUserId: ctx.user.id,
      }).$returningId();
      await db.insert(documentSignatureEvents).values({
        companyId: input.companyId,
        requestId: request.id,
        eventType: "provider_request_created",
        actorUserId: ctx.user.id,
        payloadJson: JSON.stringify({ provider: "docusign", signerEmail: input.signerEmail, documentSha256: document.sha256 }),
      });
      try {
        const envelope = await sendEnvelopeForSignature({
          transactionId: `idiba-${input.companyId}-${request.id}`,
          documentTitle: document.title,
          documentBase64: pdf.toString("base64"),
          signerName: input.signerName,
          signerEmail: input.signerEmail,
          anchorText: input.anchorText,
        });
        await db.update(documentSignatureRequests).set({ providerReference: envelope.envelopeId }).where(and(
          eq(documentSignatureRequests.id, request.id),
          eq(documentSignatureRequests.companyId, input.companyId),
        ));
        await db.insert(documentSignatureEvents).values({
          companyId: input.companyId,
          requestId: request.id,
          eventType: "provider_envelope_sent",
          actorUserId: ctx.user.id,
          payloadJson: JSON.stringify({ provider: "docusign", envelopeId: envelope.envelopeId, status: envelope.status }),
        });
        return { id: request.id, status: "pending" as const };
      } catch (error) {
        await db.update(documentSignatureRequests).set({ status: "cancelled" }).where(and(
          eq(documentSignatureRequests.id, request.id),
          eq(documentSignatureRequests.companyId, input.companyId),
        ));
        await db.insert(documentSignatureEvents).values({
          companyId: input.companyId,
          requestId: request.id,
          eventType: "provider_envelope_failed",
          actorUserId: ctx.user.id,
          payloadJson: JSON.stringify({ provider: "docusign" }),
        });
        throw error;
      }
    }),

  refreshDocuSignStatus: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (isDesignMode) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La connexion DocuSign n’est pas disponible dans l’aperçu local." });
      const db = getDb();
      const [request] = await db.select().from(documentSignatureRequests).where(and(
        eq(documentSignatureRequests.id, input.requestId),
        eq(documentSignatureRequests.companyId, input.companyId),
        eq(documentSignatureRequests.provider, "docusign"),
      )).limit(1);
      if (!request?.providerReference) throw new TRPCError({ code: "NOT_FOUND", message: "Demande DocuSign introuvable." });
      if (["signed", "declined", "cancelled"].includes(request.status)) return { status: request.status, completedAt: request.completedAt };
      if (!isDocuSignConfigured()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "La configuration DocuSign n’est plus disponible." });
      const minNextCheck = 15 * 60_000;
      if (request.lastStatusCheckedAt && Date.now() - request.lastStatusCheckedAt.getTime() < minNextCheck) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Pour limiter les appels à DocuSign, le statut peut être actualisé au plus une fois toutes les 15 minutes." });
      }
      const checkedAt = new Date();
      await db.update(documentSignatureRequests).set({ lastStatusCheckedAt: checkedAt }).where(and(
        eq(documentSignatureRequests.id, request.id), eq(documentSignatureRequests.companyId, input.companyId),
      ));
      const providerState = await getEnvelopeStatus(request.providerReference);
      const status = providerState.status === "completed" ? "signed"
        : providerState.status === "declined" ? "declined"
          : ["voided", "deleted"].includes(providerState.status) ? "cancelled" : "pending";
      const completedAt = status === "signed" ? providerState.completedAt ?? checkedAt : null;
      await db.update(documentSignatureRequests).set({ status, completedAt, lastStatusCheckedAt: checkedAt }).where(and(
        eq(documentSignatureRequests.id, request.id), eq(documentSignatureRequests.companyId, input.companyId),
      ));
      await db.insert(documentSignatureEvents).values({
        companyId: input.companyId,
        requestId: request.id,
        eventType: "provider_status_refreshed",
        actorUserId: ctx.user.id,
        payloadJson: JSON.stringify({ provider: "docusign", providerStatus: providerState.status, status }),
      });
      return { status, completedAt };
    }),

  createShare: authedQuery
    .input(z.object({
      companyId: z.number().int().positive(),
      documentId: z.number().int().positive(),
      recipientEmail: z.string().email().max(320),
      permission: z.enum(["view", "comment", "upload"]).default("view"),
      expiresInHours: z.number().int().min(1).max(24 * 30).default(72),
    }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (!externalOtpEmailReady()) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Configurez le fournisseur e-mail OTP avant de créer un partage externe." });
      }
      const db = getDb();
      const [document] = await db.select({
        id: businessDocuments.id,
        status: businessDocuments.status,
        classification: businessDocuments.classification,
        storageKey: businessDocuments.storageKey,
        sha256: businessDocuments.sha256,
      }).from(businessDocuments).where(and(
        eq(businessDocuments.id, input.documentId),
        eq(businessDocuments.companyId, input.companyId),
      )).limit(1);
      if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable" });
      if (document.status !== "finalized" || document.classification !== "public" || !document.storageKey || !document.sha256) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seul un document public finalisé et stocké peut être partagé" });
      }
      if (!documentServiceCapabilities().download) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le stockage privé n’est pas configuré." });
      if (input.permission === "upload" && !documentServiceCapabilities().upload) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Le dépôt externe exige le service antivirus." });
      const token = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Date.now() + input.expiresInHours * 60 * 60 * 1000);
      const [inserted] = await db.insert(externalDocumentShares).values({
        companyId: input.companyId,
        documentId: input.documentId,
        tokenHash: hashShareToken(token),
        recipientEmail: input.recipientEmail,
        permission: input.permission,
        expiresAt,
        createdByUserId: ctx.user.id,
      }).$returningId();
      await db.insert(externalDocumentEvents).values({
        companyId: input.companyId,
        documentId: input.documentId,
        shareId: inserted.id,
        eventType: "share_created",
        actorUserId: ctx.user.id,
        detailsJson: JSON.stringify({ expiresAt, permission: input.permission }),
      });
      return { id: inserted.id, token, expiresAt };
    }),

  listShares: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (isDesignMode) return [];
      return getDb().select({
        id: externalDocumentShares.id,
        recipientEmail: externalDocumentShares.recipientEmail,
        permission: externalDocumentShares.permission,
        expiresAt: externalDocumentShares.expiresAt,
        revokedAt: externalDocumentShares.revokedAt,
        createdAt: externalDocumentShares.createdAt,
      }).from(externalDocumentShares).where(and(
        eq(externalDocumentShares.companyId, input.companyId),
        eq(externalDocumentShares.documentId, input.documentId),
      )).orderBy(desc(externalDocumentShares.createdAt));
    }),

  listExternalComments: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      if (isDesignMode) return [];
      return getDb().select({
        id: externalDocumentComments.id,
        body: externalDocumentComments.body,
        attachmentName: externalDocumentComments.attachmentName,
        attachmentMimeType: externalDocumentComments.attachmentMimeType,
        attachmentSha256: externalDocumentComments.attachmentSha256,
        createdAt: externalDocumentComments.createdAt,
      }).from(externalDocumentComments).where(and(
        eq(externalDocumentComments.companyId, input.companyId),
        eq(externalDocumentComments.documentId, input.documentId),
      )).orderBy(externalDocumentComments.createdAt);
    }),

  downloadExternalAttachment: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), documentId: z.number().int().positive(), commentId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      await assertCompanyAccess(ctx.user, input.companyId);
      const [comment] = await getDb().select({ storageKey: externalDocumentComments.attachmentStorageKey, fileName: externalDocumentComments.attachmentName })
        .from(externalDocumentComments).where(and(
          eq(externalDocumentComments.id, input.commentId),
          eq(externalDocumentComments.companyId, input.companyId),
          eq(externalDocumentComments.documentId, input.documentId),
        )).limit(1);
      if (!comment?.storageKey) throw new TRPCError({ code: "NOT_FOUND", message: "Fichier transmis introuvable." });
      return { url: await createPrivateDownloadUrl(comment.storageKey, comment.fileName || "piece-jointe") };
    }),

  revokeShare: authedQuery
    .input(z.object({ companyId: z.number().int().positive(), shareId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      await assertCompanyManagementAccess(ctx.user, input.companyId);
      if (isDesignMode) return { success: false };
      const db = getDb();
      const [share] = await db.select().from(externalDocumentShares).where(and(
        eq(externalDocumentShares.id, input.shareId),
        eq(externalDocumentShares.companyId, input.companyId),
        isNull(externalDocumentShares.revokedAt),
      )).limit(1);
      if (!share) return { success: false };
      await db.update(externalDocumentShares).set({ revokedAt: new Date() }).where(eq(externalDocumentShares.id, share.id));
      await db.insert(externalDocumentEvents).values({
        companyId: share.companyId,
        documentId: share.documentId,
        shareId: share.id,
        eventType: "share_revoked",
        actorUserId: ctx.user.id,
      });
      return { success: true };
    }),

  /** Public links reveal only public document metadata. File delivery needs a configured private storage adapter. */
  openPublicShare: publicQuery
    .input(z.object({ token: z.string().min(40).max(100).regex(/^[A-Za-z0-9_-]+$/) }))
    .query(async ({ input }) => {
      if (isDesignMode) return { valid: false as const };
      const db = getDb();
      const [share] = await db.select().from(externalDocumentShares)
        .where(eq(externalDocumentShares.tokenHash, hashShareToken(input.token))).limit(1);
      const now = new Date();
      if (!share || share.revokedAt || share.expiresAt <= now) return { valid: false as const };
      const [document] = await db.select({
        status: businessDocuments.status,
        classification: businessDocuments.classification,
      }).from(businessDocuments).where(and(
        eq(businessDocuments.id, share.documentId),
        eq(businessDocuments.companyId, share.companyId),
      )).limit(1);
      if (!document || document.status !== "finalized" || document.classification !== "public") {
        return { valid: false as const };
      }
      return {
        valid: true as const,
        otpRequired: true as const,
        recipientHint: share.recipientEmail ? maskEmail(share.recipientEmail) : null,
        expiresAt: share.expiresAt,
      };
    }),

  startPublicShareOtp: publicQuery
    .input(z.object({ token: z.string().min(40).max(100).regex(/^[A-Za-z0-9_-]+$/) }))
    .mutation(async ({ input }) => {
      if (!externalOtpEmailReady()) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "L’envoi des codes d’accès n’est pas configuré." });
      const db = getDb();
      const [share] = await db.select().from(externalDocumentShares)
        .where(eq(externalDocumentShares.tokenHash, hashShareToken(input.token))).limit(1);
      const now = new Date();
      if (!share || share.revokedAt || share.expiresAt <= now || !share.recipientEmail) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lien externe invalide ou expiré." });
      }
      const recentChallenges = await db.select({ id: externalShareChallenges.id }).from(externalShareChallenges).where(and(
        eq(externalShareChallenges.shareId, share.id),
        gte(externalShareChallenges.createdAt, new Date(now.getTime() - 15 * 60_000)),
      )).limit(5);
      if (recentChallenges.length >= 5) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Trop de demandes de code. Réessayez dans 15 minutes." });
      const challenge = randomBytes(32).toString("base64url");
      const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
      const expiresAt = new Date(now.getTime() + 10 * 60_000);
      const [challengeRecord] = await db.insert(externalShareChallenges).values({
        shareId: share.id,
        challengeHash: hashShareToken(challenge),
        otpHash: hashOtp(challenge, code),
        expiresAt,
      }).$returningId();
      try {
        await sendExternalAccessCode(share.recipientEmail, code);
      } catch (error) {
        await db.update(externalShareChallenges).set({ consumedAt: new Date() })
          .where(eq(externalShareChallenges.id, challengeRecord.id));
        throw error;
      }
      return { challenge, expiresAt };
    }),

  verifyPublicShareOtp: publicQuery
    .input(z.object({
      token: z.string().min(40).max(100).regex(/^[A-Za-z0-9_-]+$/),
      challenge: z.string().min(40).max(100).regex(/^[A-Za-z0-9_-]+$/),
      code: z.string().regex(/^\d{6}$/),
    }))
    .mutation(async ({ input }) => {
      if (isDesignMode) throw new TRPCError({ code: "NOT_FOUND", message: "Aucun lien externe n’est disponible dans l’aperçu local." });
      const db = getDb();
      const [share] = await db.select().from(externalDocumentShares)
        .where(eq(externalDocumentShares.tokenHash, hashShareToken(input.token))).limit(1);
      const [challenge] = share ? await db.select().from(externalShareChallenges).where(and(
        eq(externalShareChallenges.shareId, share.id),
        eq(externalShareChallenges.challengeHash, hashShareToken(input.challenge)),
        isNull(externalShareChallenges.consumedAt),
      )).limit(1) : [];
      const now = new Date();
      if (!share || !challenge || share.revokedAt || share.expiresAt <= now || challenge.expiresAt <= now || challenge.attempts >= 5) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Code invalide ou expiré." });
      }
      const providedHash = Buffer.from(hashOtp(input.challenge, input.code), "hex");
      const storedHash = Buffer.from(challenge.otpHash, "hex");
      if (!timingSafeEqual(providedHash, storedHash)) {
        await db.update(externalShareChallenges).set({ attempts: challenge.attempts + 1 })
          .where(eq(externalShareChallenges.id, challenge.id));
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Code invalide ou expiré." });
      }
      const [document] = await db.select({ id: businessDocuments.id, status: businessDocuments.status, classification: businessDocuments.classification })
        .from(businessDocuments).where(and(
          eq(businessDocuments.id, share.documentId),
          eq(businessDocuments.companyId, share.companyId),
        )).limit(1);
      if (!document || document.status !== "finalized" || document.classification !== "public") {
        throw new TRPCError({ code: "NOT_FOUND", message: "Document partagé introuvable." });
      }
      await db.update(externalShareChallenges).set({ consumedAt: now }).where(eq(externalShareChallenges.id, challenge.id));
      const sessionToken = randomBytes(32).toString("base64url");
      const expiresAt = new Date(Math.min(now.getTime() + 8 * 60 * 60_000, share.expiresAt.getTime()));
      await db.insert(externalShareSessions).values({
        shareId: share.id,
        sessionHash: hashShareToken(sessionToken),
        expiresAt,
      });
      await db.insert(externalDocumentEvents).values({
        companyId: share.companyId,
        documentId: share.documentId,
        shareId: share.id,
        eventType: "share_otp_verified",
      });
      return { sessionToken, expiresAt };
    }),

  getPublicShareContent: publicQuery
    .input(z.object({ token: z.string().min(40).max(100), sessionToken: z.string().min(40).max(100) }))
    .query(async ({ input }) => {
      const { db, share, document } = await findOtpVerifiedShare(input.token, input.sessionToken);
      await db.insert(externalDocumentEvents).values({
        companyId: share.companyId,
        documentId: share.documentId,
        shareId: share.id,
        eventType: "share_document_opened",
      });
      return {
        document: { id: document.id, title: document.title, documentType: document.documentType, documentNumber: document.documentNumber, sha256: document.sha256 },
        permission: share.permission,
        expiresAt: share.expiresAt,
        downloadUrl: document.storageKey ? await createPrivateDownloadUrl(document.storageKey, document.title) : null,
      };
    }),

  listPublicShareComments: publicQuery
    .input(z.object({ token: z.string().min(40).max(100), sessionToken: z.string().min(40).max(100) }))
    .query(async ({ input }) => {
      const { db, share } = await findOtpVerifiedShare(input.token, input.sessionToken);
      return db.select({ id: externalDocumentComments.id, body: externalDocumentComments.body, attachmentName: externalDocumentComments.attachmentName, attachmentMimeType: externalDocumentComments.attachmentMimeType, createdAt: externalDocumentComments.createdAt })
        .from(externalDocumentComments).where(eq(externalDocumentComments.shareId, share.id))
        .orderBy(externalDocumentComments.createdAt);
    }),

  downloadPublicShareAttachment: publicQuery
    .input(z.object({ token: z.string().min(40).max(100), sessionToken: z.string().min(40).max(100), commentId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const { db, share } = await findOtpVerifiedShare(input.token, input.sessionToken);
      if (share.permission === "view") throw new TRPCError({ code: "FORBIDDEN", message: "Ce lien ne donne pas accès aux pièces jointes des échanges." });
      const [comment] = await db.select({ storageKey: externalDocumentComments.attachmentStorageKey, fileName: externalDocumentComments.attachmentName })
        .from(externalDocumentComments).where(and(
          eq(externalDocumentComments.id, input.commentId), eq(externalDocumentComments.companyId, share.companyId),
          eq(externalDocumentComments.documentId, share.documentId), eq(externalDocumentComments.shareId, share.id),
        )).limit(1);
      if (!comment?.storageKey) throw new TRPCError({ code: "NOT_FOUND", message: "Pièce jointe introuvable." });
      return { url: await createPrivateDownloadUrl(comment.storageKey, comment.fileName || "piece-jointe") };
    }),

  addPublicShareComment: publicQuery
    .input(z.object({ token: z.string().min(40).max(100), sessionToken: z.string().min(40).max(100), body: z.string().trim().min(1).max(3000) }))
    .mutation(async ({ input }) => {
      const { db, share } = await findOtpVerifiedShare(input.token, input.sessionToken);
      if (share.permission !== "comment") throw new TRPCError({ code: "FORBIDDEN", message: "Ce lien ne permet pas les commentaires." });
      const recentComments = await db.select({ id: externalDocumentComments.id }).from(externalDocumentComments).where(and(
        eq(externalDocumentComments.shareId, share.id),
        gte(externalDocumentComments.createdAt, new Date(Date.now() - 60 * 60_000)),
      )).limit(50);
      if (recentComments.length >= 50) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "La limite de commentaires pour ce partage est atteinte." });
      const [inserted] = await db.insert(externalDocumentComments).values({
        companyId: share.companyId,
        documentId: share.documentId,
        shareId: share.id,
        body: input.body,
      }).$returningId();
      await db.insert(externalDocumentEvents).values({ companyId: share.companyId, documentId: share.documentId, shareId: share.id, eventType: "external_comment_added" });
      return { id: inserted.id };
    }),

  uploadPublicShareAttachment: publicQuery
    .input(z.object({
      token: z.string().min(40).max(100),
      sessionToken: z.string().min(40).max(100),
      fileName: z.string().trim().min(1).max(180),
      mimeType: z.enum(["application/pdf", "image/png", "image/jpeg"]),
      base64: z.string().min(4).max(Math.ceil(MAX_DOCUMENT_UPLOAD_BYTES * 4 / 3) + 8),
      note: z.string().trim().max(1000).optional(),
    }))
    .mutation(async ({ input }) => {
      const { db, share } = await findOtpVerifiedShare(input.token, input.sessionToken);
      if (share.permission !== "upload") throw new TRPCError({ code: "FORBIDDEN", message: "Ce lien ne permet pas le dépôt de fichiers." });
      const recentUploads = await db.select({ id: externalDocumentComments.id }).from(externalDocumentComments).where(and(
        eq(externalDocumentComments.shareId, share.id),
        isNotNull(externalDocumentComments.attachmentStorageKey),
        gte(externalDocumentComments.createdAt, new Date(Date.now() - 24 * 60 * 60_000)),
      )).limit(20);
      if (recentUploads.length >= 10) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "La limite quotidienne de dépôts pour ce lien est atteinte." });
      const bytes = Buffer.from(input.base64, "base64");
      if (bytes.toString("base64") !== input.base64 || bytes.byteLength > MAX_DOCUMENT_UPLOAD_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "Fichier encodé invalide ou trop volumineux." });
      const sha256 = createHash("sha256").update(bytes).digest("hex");
      const stored = await storeScannedDocument({ companyId: share.companyId, documentId: share.documentId, version: Date.now(), mimeType: input.mimeType, bytes });
      try {
        const [inserted] = await db.insert(externalDocumentComments).values({
          companyId: share.companyId,
          documentId: share.documentId,
          shareId: share.id,
          body: input.note || "Fichier transmis par le destinataire.",
          attachmentStorageKey: stored.key,
          attachmentName: input.fileName,
          attachmentMimeType: input.mimeType,
          attachmentSha256: sha256,
        }).$returningId();
        await db.insert(externalDocumentEvents).values({ companyId: share.companyId, documentId: share.documentId, shareId: share.id, eventType: "external_file_uploaded", detailsJson: JSON.stringify({ commentId: inserted.id, sha256, mimeType: input.mimeType }) });
        return { id: inserted.id, sha256 };
      } catch (error) {
        await deleteStoredDocument(stored.key).catch(() => undefined);
        throw error;
      }
    }),
});
