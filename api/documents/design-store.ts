import { TRPCError } from "@trpc/server";

type DocumentStatus = "draft" | "review" | "approved" | "finalized" | "void";
type Classification = "public" | "internal" | "confidential" | "restricted";
type TemplateStatus = "draft" | "active" | "archived";

export type DesignDocument = {
  id: number;
  companyId: number;
  templateId: number | null;
  documentType: string;
  documentNumber: string | null;
  title: string;
  classification: Classification;
  status: DocumentStatus;
  metadataJson: string | null;
  mimeType: string | null;
  sha256: string | null;
  createdByUserId: number;
  finalizedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DesignTemplate = {
  id: number;
  companyId: number;
  name: string;
  documentType: string;
  status: TemplateStatus;
  currentVersion: number;
  createdByUserId: number;
  createdAt: Date;
  updatedAt: Date;
  layoutJson: string;
};

export type DesignDocumentEvent = {
  id: number;
  companyId: number;
  documentId: number;
  eventType: string;
  actorUserId: number | null;
  detailsJson: string | null;
  createdAt: Date;
};

const documents: DesignDocument[] = [];
const templates: DesignTemplate[] = [];
const events: DesignDocumentEvent[] = [];
let nextDocumentId = 1;
let nextTemplateId = 1;
let nextEventId = 1;

function recordEvent(companyId: number, documentId: number, eventType: string, actorUserId: number | null, detailsJson: string | null = null) {
  events.unshift({ id: nextEventId++, companyId, documentId, eventType, actorUserId, detailsJson, createdAt: new Date() });
}

export function listDesignDocuments(companyId: number, documentType?: string) {
  return documents.filter((item) => item.companyId === companyId && (!documentType || item.documentType === documentType));
}

export function createDesignDraft(input: {
  companyId: number; documentType: string; title: string; classification: Classification;
  metadataJson?: string | null; templateId?: number; actorUserId: number;
}) {
  const now = new Date();
  const document: DesignDocument = {
    id: nextDocumentId++, companyId: input.companyId, templateId: input.templateId ?? null,
    documentType: input.documentType, documentNumber: null, title: input.title, classification: input.classification,
    status: "draft", metadataJson: input.metadataJson ?? null, mimeType: null, sha256: null,
    createdByUserId: input.actorUserId, finalizedAt: null, createdAt: now, updatedAt: now,
  };
  documents.unshift(document);
  recordEvent(input.companyId, document.id, "draft_created", input.actorUserId);
  return document;
}

export function updateDesignDraft(input: {
  companyId: number; documentId: number; documentType: string; title: string; classification: Classification;
  metadataJson?: string | null; templateId?: number | null; actorUserId: number;
}) {
  const document = documents.find((item) => item.id === input.documentId && item.companyId === input.companyId);
  if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
  if (document.status !== "draft") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Seuls les brouillons peuvent être modifiés." });
  Object.assign(document, {
    documentType: input.documentType, title: input.title, classification: input.classification,
    metadataJson: input.metadataJson ?? null, templateId: input.templateId ?? null, updatedAt: new Date(),
  });
  recordEvent(input.companyId, document.id, "draft_updated", input.actorUserId);
  return { success: true };
}

export function voidDesignDocument(companyId: number, documentId: number, actorUserId: number) {
  const document = documents.find((item) => item.id === documentId && item.companyId === companyId);
  if (!document) throw new TRPCError({ code: "NOT_FOUND", message: "Document introuvable." });
  if (document.status === "void") return { success: true, alreadyVoided: true };
  document.status = "void";
  document.updatedAt = new Date();
  recordEvent(companyId, documentId, "document_voided", actorUserId);
  return { success: true, alreadyVoided: false };
}

export function listDesignDocumentEvents(companyId: number, documentId: number) {
  return events.filter((item) => item.companyId === companyId && item.documentId === documentId).slice(0, 100);
}

export function listDesignTemplates(companyId: number) {
  return templates.filter((item) => item.companyId === companyId);
}

export function createDesignTemplate(input: {
  companyId: number; name: string; documentType: string; layoutJson: string; activateImmediately: boolean; actorUserId: number;
}) {
  const now = new Date();
  const template: DesignTemplate = {
    id: nextTemplateId++, companyId: input.companyId, name: input.name, documentType: input.documentType,
    status: input.activateImmediately ? "active" : "draft", currentVersion: 1,
    createdByUserId: input.actorUserId, createdAt: now, updatedAt: now, layoutJson: input.layoutJson,
  };
  templates.unshift(template);
  return { id: template.id, version: 1, status: template.status };
}

export function updateDesignTemplate(input: { companyId: number; templateId: number; name: string; documentType: string; layoutJson: string }) {
  const template = templates.find((item) => item.id === input.templateId && item.companyId === input.companyId);
  if (!template || template.status === "archived") throw new TRPCError({ code: "NOT_FOUND", message: "Modèle introuvable ou archivé." });
  template.name = input.name;
  template.documentType = input.documentType;
  template.layoutJson = input.layoutJson;
  template.currentVersion += 1;
  template.updatedAt = new Date();
  return { success: true, version: template.currentVersion };
}

export function setDesignTemplateStatus(companyId: number, templateId: number, status: "active" | "archived") {
  const template = templates.find((item) => item.id === templateId && item.companyId === companyId);
  if (!template || (status === "active" && template.status === "archived")) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Modèle introuvable ou archivé." });
  }
  template.status = status;
  template.updatedAt = new Date();
  return { success: true };
}
