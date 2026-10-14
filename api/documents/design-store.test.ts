import { describe, expect, it } from "vitest";
import {
  createDesignDraft,
  createDesignTemplate,
  listDesignDocumentEvents,
  listDesignDocuments,
  listDesignTemplates,
  setDesignTemplateStatus,
  updateDesignDraft,
  updateDesignTemplate,
  voidDesignDocument,
} from "./design-store";

describe("document studio design-mode store", () => {
  const companyId = Date.now();
  const actorUserId = 1;

  it("creates, edits and cancels drafts while recording events per company", () => {
    const created = createDesignDraft({
      companyId,
      documentType: "contrat",
      title: "Contrat de test",
      classification: "internal",
      metadataJson: JSON.stringify({ content: "Texte initial" }),
      actorUserId,
    });

    expect(listDesignDocuments(companyId)).toHaveLength(1);
    expect(listDesignDocuments(companyId + 1)).toHaveLength(0);

    updateDesignDraft({
      companyId,
      documentId: created.id,
      documentType: "contrat",
      title: "Contrat modifié",
      classification: "public",
      metadataJson: JSON.stringify({ content: "Texte mis à jour" }),
      actorUserId,
    });
    expect(listDesignDocuments(companyId)[0].title).toBe("Contrat modifié");
    expect(listDesignDocumentEvents(companyId, created.id).map((event) => event.eventType)).toEqual(["draft_updated", "draft_created"]);

    expect(voidDesignDocument(companyId, created.id, actorUserId)).toEqual({ success: true, alreadyVoided: false });
    expect(listDesignDocuments(companyId)[0].status).toBe("void");
    expect(() => updateDesignDraft({
      companyId, documentId: created.id, documentType: "contrat", title: "Interdit",
      classification: "internal", actorUserId,
    })).toThrow("Seuls les brouillons peuvent être modifiés.");
  });

  it("versions templates and prevents reactivating an archived template", () => {
    const created = createDesignTemplate({
      companyId,
      name: "Modele test",
      documentType: "contrat",
      layoutJson: JSON.stringify({ content: "Version 1" }),
      activateImmediately: false,
      actorUserId,
    });

    expect(created.status).toBe("draft");
    setDesignTemplateStatus(companyId, created.id, "active");
    const updated = updateDesignTemplate({
      companyId,
      templateId: created.id,
      name: "Modele test",
      documentType: "contrat",
      layoutJson: JSON.stringify({ content: "Version 2" }),
    });
    expect(updated.version).toBe(2);
    expect(listDesignTemplates(companyId)[0].layoutJson).toContain("Version 2");

    setDesignTemplateStatus(companyId, created.id, "archived");
    expect(() => setDesignTemplateStatus(companyId, created.id, "active")).toThrow("Modèle introuvable ou archivé.");
  });
});
