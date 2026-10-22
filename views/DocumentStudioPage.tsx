'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { jsPDF } from 'jspdf';
import { Archive, Building2, Camera, Check, Clock3, Copy, Download, ExternalLink, FileCheck2, FilePlus2, FileText, History, LockKeyhole, Pencil, Plus, QrCode, RefreshCw, ScanLine, Send, ShieldAlert, ShieldCheck, Share2, Stamp, Upload, X } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { trpc } from '@/providers/trpc';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';
import { registerExposePdfFont } from '@/lib/pdf-font';
import { useCollection } from '@/components/clients/shared';
import type { Client, Supplier } from '@/types';

type StudioTab = 'documents' | 'templates' | 'sharing' | 'signatures';
type VisualDocumentStyle = 'corporate' | 'modern' | 'minimal';
type TemplateHeaderFields = {
  documentNumber: string; documentDate: string; clientReference: string;
  companyName: string; companyAddress: string; companyPhone: string; companyEmail: string; companyRccm: string; companyNiu: string; companyBank: string; companyRib: string;
  recipientName: string; recipientAddress: string; recipientPhone: string; recipientEmail: string; recipientRccm: string; recipientNiu: string;
};
type TemplateFooterFields = { bankDetails: string; capital: string; customNote: string; legalNotice: string };
type VisualTemplateConfig = { style: VisualDocumentStyle; primaryColor: string; showLogo: boolean; showFooter: boolean; showQr: boolean; headerFields: TemplateHeaderFields; footerFields: TemplateFooterFields };

const TEMPLATE_DOCUMENT_TYPES = [
  { value: 'facture', label: 'Facture' },
  { value: 'devis', label: 'Devis' },
  { value: 'bon_commande', label: 'Bon de commande' },
  { value: 'bon_livraison', label: 'Bon de livraison' },
  { value: 'contrat', label: 'Contrat' },
  { value: 'lettre', label: 'Lettre / courrier' },
  { value: 'rapport', label: 'Rapport' },
  { value: 'procedure', label: 'Procédure' },
  { value: 'note_service', label: 'Note de service' },
  { value: 'attestation', label: 'Attestation' },
  { value: 'bulletin_paie', label: 'Bulletin de paie' },
  { value: 'autre', label: 'Autre document' },
] as const;

const DEFAULT_HEADER_FIELDS: TemplateHeaderFields = {
  documentNumber: '{{NUMERO_DOCUMENT}}', documentDate: '{{DATE}}', clientReference: '{{REFERENCE_CLIENT}}',
  companyName: '', companyAddress: '', companyPhone: '', companyEmail: '', companyRccm: '', companyNiu: '', companyBank: '', companyRib: '',
  recipientName: '{{NOM_CLIENT}}', recipientAddress: '{{ADRESSE_CLIENT}}', recipientPhone: '', recipientEmail: '', recipientRccm: '', recipientNiu: '',
};
const DEFAULT_FOOTER_FIELDS: TemplateFooterFields = { bankDetails: '', capital: '', customNote: '', legalNotice: '' };

const DEFAULT_VISUAL_TEMPLATE: VisualTemplateConfig = { style: 'modern', primaryColor: '#00507C', showLogo: true, showFooter: true, showQr: true, headerFields: DEFAULT_HEADER_FIELDS, footerFields: DEFAULT_FOOTER_FIELDS };
const VISUAL_TEMPLATE_COLORS = ['#00507C', '#00856A', '#D66B13', '#333333'];

const tabs: { id: StudioTab; label: string; icon: typeof FileText }[] = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'templates', label: 'Modèles', icon: FileCheck2 },
  { id: 'sharing', label: 'Partages externes', icon: Share2 },
  { id: 'signatures', label: 'Signatures & cachets', icon: Stamp },
];

const statusLabel: Record<string, string> = {
  draft: 'Brouillon', review: 'En validation', approved: 'Approuvé', finalized: 'Finalisé', void: 'Annulé',
};

function parseTemplateLayout(layoutJson: string | null | undefined): Record<string, unknown> {
  if (!layoutJson) return {};
  try {
    const value: unknown = JSON.parse(layoutJson);
    return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  } catch { return {}; }
}

function parseVisualTemplateConfig(value: unknown): VisualTemplateConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_VISUAL_TEMPLATE;
  const input = value as Partial<VisualTemplateConfig>;
  return {
    style: input.style === 'corporate' || input.style === 'minimal' ? input.style : 'modern',
    primaryColor: typeof input.primaryColor === 'string' && /^#[0-9a-f]{6}$/i.test(input.primaryColor) ? input.primaryColor : DEFAULT_VISUAL_TEMPLATE.primaryColor,
    showLogo: input.showLogo !== false,
    showFooter: input.showFooter !== false,
    showQr: input.showQr !== false,
    headerFields: { ...DEFAULT_HEADER_FIELDS, ...(input.headerFields && typeof input.headerFields === 'object' ? input.headerFields : {}) },
    footerFields: { ...DEFAULT_FOOTER_FIELDS, ...(input.footerFields && typeof input.footerFields === 'object' ? input.footerFields : {}) },
  };
}

function getTemplateDocumentLayout(documentType: string): 'financial' | 'logistics' | 'contract' | 'general' {
  const type = documentType.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replaceAll('-', '_').replaceAll(' ', '_');
  if (type.includes('facture') || type.includes('devis')) return 'financial';
  if (type.includes('commande') || type.includes('livraison')) return 'logistics';
  if (type.includes('contrat')) return 'contract';
  return 'general';
}

function getTemplateDocumentLabel(documentType: string) {
  return TEMPLATE_DOCUMENT_TYPES.find((type) => type.value === documentType)?.label ?? documentType;
}

function parseDocumentContent(metadataJson: string | null | undefined): string {
  if (!metadataJson) return '';
  try {
    const value: unknown = JSON.parse(metadataJson);
    return value && typeof value === 'object' && !Array.isArray(value) && typeof (value as Record<string, unknown>).content === 'string'
      ? (value as Record<string, string>).content
      : '';
  } catch { return ''; }
}

function parseDocumentVisualConfig(metadataJson: string | null | undefined): VisualTemplateConfig {
  if (!metadataJson) return DEFAULT_VISUAL_TEMPLATE;
  try { return parseVisualTemplateConfig((JSON.parse(metadataJson) as Record<string, unknown>).visual); } catch { return DEFAULT_VISUAL_TEMPLATE; }
}

const documentEventLabels: Record<string, string> = {
  draft_created: 'Brouillon créé',
  draft_updated: 'Brouillon modifié',
  file_uploaded_and_scanned: 'Fichier téléversé et analysé',
  document_finalized: 'Document finalisé',
  document_voided: 'Document annulé',
  share_created: 'Lien externe créé',
  share_revoked: 'Lien externe révoqué',
  share_otp_verified: 'Accès externe vérifié',
  share_document_opened: 'Document consulté',
  external_comment_added: 'Commentaire reçu',
  external_file_uploaded: 'Fichier externe reçu',
};

function documentEventLabel(eventType: string) {
  return documentEventLabels[eventType] ?? eventType.replaceAll('_', ' ');
}

function summarizeDocumentEvent(detailsJson: string) {
  try {
    const data = JSON.parse(detailsJson) as Record<string, unknown>;
    const parts = ['fileName', 'version', 'mimeType', 'permission', 'expiresAt', 'sha256']
      .filter((key) => typeof data[key] === 'string' || typeof data[key] === 'number')
      .map((key) => `${key}: ${String(data[key])}`);
    return parts.join(' · ');
  } catch { return ''; }
}

function parseSignatureWorkflowNote(note?: string | null): { includeCompanyStamp: boolean; placement: 'last_page' | 'custom'; anchor: string | null; instruction: string | null } | null {
  if (!note) return null;
  try {
    const value = JSON.parse(note) as Record<string, unknown>;
    if (value.workflow !== 'signature_and_stamp') return null;
    return {
      includeCompanyStamp: value.includeCompanyStamp === true,
      placement: value.placement === 'custom' ? 'custom' : 'last_page',
      anchor: typeof value.anchor === 'string' ? value.anchor : null,
      instruction: typeof value.instruction === 'string' ? value.instruction : null,
    };
  } catch { return null; }
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character);
}

function downloadEditableTemplate(name: string, body: string, visual: VisualTemplateConfig = DEFAULT_VISUAL_TEMPLATE, documentType = 'autre', language: 'fr' | 'en' | 'es' = 'fr') {
  const config = parseVisualTemplateConfig(visual);
  const signatureAlignment = language === 'fr' ? 'right' : 'left';
  const borderStyle = config.style === 'minimal' ? '1px solid #e2e8f0' : `3px solid ${config.primaryColor}`;
  const headerFields = config.headerFields;
  const footerFields = config.footerFields;
  const headerDetails = [
    headerFields.companyName,
    headerFields.companyAddress,
    [headerFields.companyPhone, headerFields.companyEmail].filter(Boolean).join(' · '),
    [headerFields.companyRccm && `RCCM ${headerFields.companyRccm}`, headerFields.companyNiu && `NIU ${headerFields.companyNiu}`].filter(Boolean).join(' · '),
    [headerFields.companyBank && `Compte bancaire ${headerFields.companyBank}`, headerFields.companyRib && `RIB ${headerFields.companyRib}`].filter(Boolean).join(' · '),
  ].filter(Boolean).map((value) => escapeHtml(String(value))).join('<br>');
  const paperDetails = `<section class="paper-details ${getTemplateDocumentLayout(documentType)}"><div><strong>${escapeHtml(getTemplateDocumentLabel(documentType))} ${escapeHtml(headerFields.documentNumber)}</strong><br>${escapeHtml(headerFields.documentDate)} · ${escapeHtml(headerFields.clientReference)}</div><div><strong>${escapeHtml(headerFields.recipientName)}</strong><br>${escapeHtml(headerFields.recipientAddress)}<br>${escapeHtml(headerFields.recipientPhone)} · ${escapeHtml(headerFields.recipientEmail)}</div><small>${headerDetails}</small></section>`;
  const footerDetails = [footerFields.bankDetails || headerFields.companyBank, footerFields.capital, footerFields.customNote, footerFields.legalNotice].filter(Boolean).map((value) => escapeHtml(String(value))).join(' · ');
  const logo = config.showLogo ? `<div class="brand">${escapeHtml(name)}</div>` : '';
  const footer = config.showFooter ? `<footer>${escapeHtml(name)} · Document généré depuis le Studio documentaire</footer>` : '';
  const verification = config.showQr ? '<div class="verification">Zone de vérification du document</div>' : '';
  const signature = `<section class="signature" style="text-align:${signatureAlignment}"><div>Signature autorisée</div><div class="signature-line"></div></section>`;
  const html = `<!doctype html><html lang="${language}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(name)}</title><style>:root{--brand:${config.primaryColor}}body{max-width:850px;margin:32px auto;padding:44px;color:#172b3a;font:15px/1.65 Arial,sans-serif;border:1px solid #d8e1e8;background:#fff}.brand{color:var(--brand);font-weight:700;font-size:12px;margin-bottom:20px}.paper-details{display:grid;grid-template-columns:1fr auto;gap:18px;border-bottom:1px solid #d8e1e8;padding:14px 0;color:#475569;font-size:12px}.paper-details.contract{grid-template-columns:1fr 1fr}.paper-details.logistics{border-left:4px solid var(--brand);padding-left:12px}h1{color:${config.style === 'minimal' ? '#172b3a' : 'var(--brand)'};font-size:25px;border-bottom:${borderStyle};padding-bottom:14px;text-transform:${config.style === 'corporate' ? 'uppercase' : 'none'}}pre{white-space:pre-wrap;font:inherit}.signature{margin-top:38px;font-size:12px}.signature-line{width:180px;max-width:45%;margin-top:34px;border-bottom:1px solid #94a3b8;${signatureAlignment === 'right' ? 'margin-left:auto' : 'margin-right:auto'}}footer,.verification{border-top:1px solid #d8e1e8;margin-top:30px;padding-top:12px;color:#64748b;font-size:11px}.verification{margin-top:16px}@media print{body{border:0;margin:0;padding:0}}</style></head><body contenteditable="true">${logo}<h1>${escapeHtml(name)}</h1>${paperDetails}<pre>${escapeHtml(body)}</pre>${signature}${verification}${footerDetails ? `<footer>${footerDetails}</footer>` : footer}</body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'modele'}.html`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

async function downloadDocumentPdf(name: string, body: string, companyName: string, visual: VisualTemplateConfig = DEFAULT_VISUAL_TEMPLATE, documentType = 'autre', language: 'fr' | 'en' | 'es' = 'fr') {
  const pdf = new jsPDF({ format: 'a4', unit: 'mm', compress: true });
  const config = parseVisualTemplateConfig(visual);
  const rgb = config.primaryColor.match(/[\da-f]{2}/gi)?.map((part) => parseInt(part, 16)) ?? [0, 80, 124];
  await registerExposePdfFont(pdf);
  const margin = 20;
  const contentWidth = 170;
  const bottom = 248;
  const signatureAlignment = language === 'fr' ? 'right' : 'left';
  let y = 25;

  pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
  pdf.rect(0, 0, 210, 13, 'F');
  pdf.setFont('Expose', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  if (config.showLogo) pdf.text(`${companyName} · Studio documentaire`, margin, 8.5);

  pdf.setTextColor(config.style === 'minimal' ? 23 : rgb[0], config.style === 'minimal' ? 43 : rgb[1], config.style === 'minimal' ? 58 : rgb[2]);
  pdf.setFontSize(19);
  const titleLines = pdf.splitTextToSize(name, contentWidth) as string[];
  pdf.text(titleLines, margin, y);
  y += titleLines.length * 8 + 3;
  pdf.setDrawColor(rgb[0], rgb[1], rgb[2]);
  pdf.setLineWidth(1.2);
  pdf.line(margin, y, 190, y);
  y += 9;

  pdf.setFontSize(10);
  pdf.setTextColor(45, 55, 65);
  const headerLines = [getTemplateDocumentLabel(documentType), config.headerFields.companyName || companyName, config.headerFields.companyAddress, [config.headerFields.companyPhone, config.headerFields.companyEmail].filter(Boolean).join(' · '), [config.headerFields.companyRccm && `RCCM ${config.headerFields.companyRccm}`, config.headerFields.companyNiu && `NIU ${config.headerFields.companyNiu}`].filter(Boolean).join(' · '), [config.headerFields.companyBank && `Compte bancaire ${config.headerFields.companyBank}`, config.headerFields.companyRib && `RIB ${config.headerFields.companyRib}`].filter(Boolean).join(' · '), config.headerFields.documentNumber, config.headerFields.documentDate, config.headerFields.clientReference, config.headerFields.recipientName, config.headerFields.recipientAddress, config.headerFields.recipientPhone, config.headerFields.recipientEmail, config.headerFields.recipientRccm && `RCCM ${config.headerFields.recipientRccm}`, config.headerFields.recipientNiu && `NIU ${config.headerFields.recipientNiu}`].filter(Boolean).map(String);
  for (const line of headerLines) {
    const wrappedLines = pdf.splitTextToSize(line, contentWidth) as string[];
    pdf.text(wrappedLines, margin, y, { lineHeightFactor: 1.2 });
    y += Math.max(4.5, wrappedLines.length * 4.5);
  }
  y += 3;
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  for (const line of lines) {
    const wrappedLines = pdf.splitTextToSize(line || ' ', contentWidth) as string[];
    const height = Math.max(5.2, wrappedLines.length * 5.2);
    if (y + height > bottom) {
      pdf.addPage();
      y = 22;
    }
    pdf.text(wrappedLines, margin, y, { lineHeightFactor: 1.25 });
    y += height;
  }

  const pageCount = pdf.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    pdf.setPage(page);
    pdf.setFontSize(8);
    pdf.setTextColor(110, 120, 130);
    if (page === pageCount) {
      pdf.setFontSize(9);
      const signatureX = signatureAlignment === 'right' ? 190 : margin;
      const signatureTextAlign = signatureAlignment === 'right' ? 'right' : 'left';
      pdf.text(language === 'fr' ? 'Signature autorisée' : 'Authorized signature', signatureX, 258, { align: signatureTextAlign });
      pdf.setDrawColor(148, 163, 184);
      pdf.line(signatureAlignment === 'right' ? 150 : margin, 270, signatureAlignment === 'right' ? 190 : 60, 270);
    }
    pdf.setFontSize(8);
    if (config.showFooter) {
      const footerLine = [config.footerFields.bankDetails || config.headerFields.companyBank, config.footerFields.capital, config.footerFields.legalNotice, `${new Date().toLocaleDateString('fr-FR')} · ${page}/${pageCount}`].filter(Boolean).join(' · ');
      pdf.text(footerLine, 190, 288, { align: 'right', maxWidth: 170 });
    }
  }

  const safeName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'document';
  pdf.save(`${safeName}.pdf`);
}

export function DocumentStudioPage() {
  const { companyId, company, isLoading: companyLoading } = useActiveCompany();
  const language = useBrandingStore((state) => state.language);
  const signatureAlignment = language === 'fr' ? 'right' : 'left';
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [tab, setTab] = useState<StudioTab>('documents');
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('autre');
  const [classification, setClassification] = useState<'internal' | 'public' | 'confidential' | 'restricted'>('internal');
  const [draftTemplateId, setDraftTemplateId] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState('autre');
  const [editingTemplate, setEditingTemplate] = useState<{ id: number; name: string; documentType: string; layoutJson: string }>();
  const [templateBody, setTemplateBody] = useState('');
  const [newTemplateBody, setNewTemplateBody] = useState('');
  const [visualTemplate, setVisualTemplate] = useState<VisualTemplateConfig>(DEFAULT_VISUAL_TEMPLATE);
  const [draftBody, setDraftBody] = useState('');
  const [draftVisualConfig, setDraftVisualConfig] = useState<VisualTemplateConfig>(DEFAULT_VISUAL_TEMPLATE);
  const [editingDraft, setEditingDraft] = useState<{ id: number; title: string; documentType: string; classification: 'internal' | 'public' | 'confidential' | 'restricted'; metadataJson: string | null; templateId: number | null } | null>(null);
  const [versionHistoryDocumentId, setVersionHistoryDocumentId] = useState<number>();
  const [selectedDocumentId, setSelectedDocumentId] = useState<number>();
  const [createdShareUrl, setCreatedShareUrl] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientContactKey, setRecipientContactKey] = useState('manual');
  const [shareExpiryHours, setShareExpiryHours] = useState(72);
  const [sharePermission, setSharePermission] = useState<'view' | 'comment' | 'upload'>('view');
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signatureAnchor, setSignatureAnchor] = useState('{{SIGN_HERE}}');
  const [internalSignerUserId, setInternalSignerUserId] = useState('');
  const [internalSignatureNote, setInternalSignatureNote] = useState('');
  const [signaturePlacement, setSignaturePlacement] = useState<'last_page' | 'custom'>('last_page');
  const [includeCompanyStamp, setIncludeCompanyStamp] = useState(true);
  const [internalDeclineReason, setInternalDeclineReason] = useState('');
  const [attestedSignatureIds, setAttestedSignatureIds] = useState<Set<number>>(() => new Set());
  const fileInput = useRef<HTMLInputElement>(null);
  const scanFileInput = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<number>();
  const companyNumericId = companyId ? Number(companyId) : 0;
  const enabled = Number.isSafeInteger(companyNumericId) && companyNumericId > 0;
  const clients = useCollection('clients') as Client[];
  const suppliers = useCollection('suppliers') as Supplier[];
  const externalContacts = useMemo(() => {
    const companyKey = String(companyId ?? '');
    const localCompanyKey = companyKey === '1' ? 'comp-1' : companyKey;
    const clientContacts = clients
      .filter((client) => client.companyId === localCompanyKey && client.status === 'active')
      .map((client) => ({ key: `client:${client.id}`, kind: 'client' as const, label: client.name, email: client.contactEmail || client.email }))
      .filter((contact) => Boolean(contact.email));
    const vendorContacts = suppliers
      .filter((supplier) => supplier.companyId === localCompanyKey && supplier.status === 'active')
      .map((supplier) => ({ key: `supplier:${supplier.id}`, kind: 'vendor' as const, label: supplier.name, email: supplier.contactEmail || supplier.email }))
      .filter((contact) => Boolean(contact.email));
    return { clientContacts, vendorContacts };
  }, [clients, suppliers, companyId]);

  const capabilities = trpc.document.capabilities.useQuery();
  const documents = trpc.document.list.useQuery({ companyId: companyNumericId }, { enabled });
  const templates = trpc.document.listTemplates.useQuery({ companyId: companyNumericId }, { enabled });
  const utils = trpc.useUtils();
  const accessRole = trpc.company.accessRole.useQuery({ companyId: companyNumericId }, { enabled });
  const createDraft = trpc.document.createDraft.useMutation({
    onSuccess: async ({ id }) => {
      await utils.document.list.invalidate({ companyId: companyNumericId });
      await utils.document.listDocumentEvents.invalidate({ companyId: companyNumericId, documentId: id });
      setShowDocumentForm(false);
      setEditingDraft(null);
      setTitle('');
      setDraftTemplateId('');
      setDraftBody('');
      setDraftVisualConfig(DEFAULT_VISUAL_TEMPLATE);
      setSelectedDocumentId(id);
      showToast('Brouillon créé.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const createTemplate = trpc.document.createTemplate.useMutation({
    onSuccess: async ({ status }) => {
      await utils.document.listTemplates.invalidate({ companyId: companyNumericId });
      setShowTemplateForm(false);
      setTemplateName('');
      setNewTemplateBody('');
      showToast(status === 'active' ? 'Modèle ajouté et activé.' : 'Modèle créé en version 1.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const activateTemplate = trpc.document.activateTemplate.useMutation({
    onSuccess: async () => {
      await utils.document.listTemplates.invalidate({ companyId: companyNumericId });
      showToast('Modèle activé et disponible pour les brouillons.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const archiveTemplate = trpc.document.archiveTemplate.useMutation({
    onSuccess: async () => {
      await utils.document.listTemplates.invalidate({ companyId: companyNumericId });
      showToast('Modèle archivé. Il ne sera plus proposé pour les nouveaux brouillons.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const updateTemplate = trpc.document.updateTemplate.useMutation({
    onSuccess: async ({ version }) => {
      await utils.document.listTemplates.invalidate({ companyId: companyNumericId });
      setEditingTemplate(undefined);
      showToast(`Modèle enregistré en version ${version}.`, 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const updateDraft = trpc.document.updateDraft.useMutation({
    onSuccess: async (_result, variables) => {
      await utils.document.list.invalidate({ companyId: companyNumericId });
      await utils.document.listDocumentEvents.invalidate({ companyId: companyNumericId, documentId: variables.documentId });
      setShowDocumentForm(false);
      setEditingDraft(null);
      showToast('Brouillon mis à jour.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const uploadFile = trpc.document.uploadFile.useMutation({
    onSuccess: async ({ version }) => {
      await utils.document.list.invalidate({ companyId: companyNumericId });
      showToast(`Fichier analysé et enregistré en version ${version}.`, 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const finalizeDocument = trpc.document.finalize.useMutation({
    onSuccess: async () => {
      await utils.document.list.invalidate({ companyId: companyNumericId });
      showToast('Document finalisé et verrouillé.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const voidDocument = trpc.document.voidDocument.useMutation({
    onSuccess: async (_result, variables) => {
      await utils.document.list.invalidate({ companyId: companyNumericId });
      await utils.document.listDocumentEvents.invalidate({ companyId: companyNumericId, documentId: variables.documentId });
      await Promise.all([shares.refetch(), myInternalSignatures.refetch()]);
      showToast('Document annulé, liens externes révoqués et visas internes clôturés.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const createShare = trpc.document.createShare.useMutation({
    onSuccess: ({ token }) => {
      setCreatedShareUrl(`${window.location.origin}/share/${token}`);
      showToast('Lien créé. Copiez-le et transmettez-le au destinataire.', 'success');
      void utils.document.listShares.invalidate({ companyId: companyNumericId });
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const selectedDocument = useMemo(
    () => documents.data?.find((document) => document.id === selectedDocumentId) ?? documents.data?.[0],
    [documents.data, selectedDocumentId],
  );
  const documentEvents = trpc.document.listDocumentEvents.useQuery(
    { companyId: companyNumericId, documentId: selectedDocument?.id ?? 0 },
    { enabled: enabled && Boolean(selectedDocument?.id) },
  );
  const signatureDocuments = useMemo(
    () => documents.data?.filter((document) => document.status === 'finalized' && document.mimeType === 'application/pdf') ?? [],
    [documents.data],
  );
  const selectedSignatureDocument = useMemo(
    () => signatureDocuments.find((document) => document.id === selectedDocumentId) ?? signatureDocuments[0],
    [signatureDocuments, selectedDocumentId],
  );
  const shares = trpc.document.listShares.useQuery(
    { companyId: companyNumericId, documentId: selectedDocument?.id ?? 0 },
    { enabled: enabled && !!selectedDocument?.id && ['owner', 'admin', 'platform_admin'].includes(accessRole.data ?? '') },
  );
  const externalComments = trpc.document.listExternalComments.useQuery(
    { companyId: companyNumericId, documentId: selectedDocument?.id ?? 0 },
    { enabled: enabled && !!selectedDocument?.id },
  );
  const signatures = trpc.document.listSignatures.useQuery(
    { companyId: companyNumericId, documentId: selectedSignatureDocument?.id ?? 0 },
    { enabled: enabled && !!selectedSignatureDocument?.id },
  );
  const versions = trpc.document.listVersions.useQuery(
    { companyId: companyNumericId, documentId: versionHistoryDocumentId ?? 0 },
    { enabled: enabled && Boolean(versionHistoryDocumentId) },
  );
  const internalSigners = trpc.document.listInternalSigners.useQuery({ companyId: companyNumericId }, { enabled });
  const myInternalSignatures = trpc.document.listMyInternalSignatures.useQuery({ companyId: companyNumericId }, { enabled });
  const signatureEvents = trpc.document.listSignatureEvents.useQuery(
    { companyId: companyNumericId, documentId: selectedSignatureDocument?.id ?? 0 },
    { enabled: enabled && !!selectedSignatureDocument?.id },
  );
  const refreshSignatureData = async () => {
    await Promise.all([signatures.refetch(), myInternalSignatures.refetch(), signatureEvents.refetch()]);
  };
  const requestInternalSignature = trpc.document.requestInternalSignature.useMutation({
    onSuccess: async () => {
      setInternalSignatureNote('');
      await refreshSignatureData();
      showToast('Demande de visa interne envoyée.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const signInternalDocument = trpc.document.signInternalDocument.useMutation({
    onSuccess: async (_result, variables) => {
      setAttestedSignatureIds((current) => { const next = new Set(current); next.delete(variables.requestId); return next; });
      await refreshSignatureData();
      showToast('Visa interne enregistré avec son horodatage et l’empreinte du document.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const declineInternalSignature = trpc.document.declineInternalSignature.useMutation({
    onSuccess: async () => {
      setInternalDeclineReason('');
      await refreshSignatureData();
      showToast('Demande refusée et motif ajouté à l’historique.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const sendDocuSign = trpc.document.sendDocuSignRequest.useMutation({
    onSuccess: async () => {
      setSignerName('');
      setSignerEmail('');
      await signatures.refetch();
      showToast('Demande envoyée via DocuSign.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const refreshDocuSign = trpc.document.refreshDocuSignStatus.useMutation({
    onSuccess: async ({ status }) => {
      await signatures.refetch();
      showToast(`Statut DocuSign : ${status}.`, 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const revokeShare = trpc.document.revokeShare.useMutation({
    onSuccess: async () => {
      await shares.refetch();
      showToast('Lien révoqué.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  useEffect(() => setCurrentPageTitle('Studio documentaire'), [setCurrentPageTitle]);

  const canShareSelected = selectedDocument?.status === 'finalized'
    && selectedDocument.classification === 'public'
    && Boolean(selectedDocument.sha256);
  const canCreateShare = Boolean(capabilities.data?.download && capabilities.data?.otp);
  const canUploadExternal = Boolean(capabilities.data?.upload);
  const canManageDocuments = ['owner', 'admin', 'platform_admin'].includes(accessRole.data ?? '');

  const uploadToDraft = async (documentId: number, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast('Le fichier dépasse la limite de 10 Mo.', 'error');
      return;
    }
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
      reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
      reader.readAsDataURL(file);
    }).catch((error: Error) => {
      showToast(error.message, 'error');
      return '';
    });
    if (!base64) return;
    if (!['application/pdf', 'image/png', 'image/jpeg'].includes(file.type)) {
      showToast('Formats acceptés : PDF, PNG ou JPEG.', 'error');
      return;
    }
    uploadFile.mutate({ companyId: companyNumericId, documentId, fileName: file.name, mimeType: file.type as 'application/pdf' | 'image/png' | 'image/jpeg', base64 });
  };

  const downloadDocument = async (documentId: number) => {
    try {
      const result = await utils.document.downloadFile.fetch({ companyId: companyNumericId, documentId });
      deliverDownload(result.url);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Téléchargement indisponible.', 'error');
    }
  };

  const downloadDocumentVersion = async (documentId: number, versionId: number) => {
    try {
      const result = await utils.document.downloadVersion.fetch({ companyId: companyNumericId, documentId, versionId });
      deliverDownload(result.url);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Téléchargement indisponible.', 'error');
    }
  };

  const downloadExternalAttachment = async (commentId: number) => {
    if (!selectedDocument) return;
    try {
      const result = await utils.document.downloadExternalAttachment.fetch({ companyId: companyNumericId, documentId: selectedDocument.id, commentId });
      deliverDownload(result.url);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Téléchargement indisponible.', 'error');
    }
  };

  const beginTemplateEdit = (template: NonNullable<typeof templates.data>[number]) => {
    const layout = parseTemplateLayout(template.layoutJson);
    setEditingTemplate({ id: template.id, name: template.name, documentType: template.documentType, layoutJson: template.layoutJson ?? JSON.stringify(layout) });
    setTemplateBody(typeof layout.content === 'string' ? layout.content : JSON.stringify(layout, null, 2));
    setVisualTemplate(parseVisualTemplateConfig(layout.visual));
  };

  const saveTemplateEdit = () => {
    if (!editingTemplate) return;
    const layout = parseTemplateLayout(editingTemplate.layoutJson);
    updateTemplate.mutate({ companyId: companyNumericId, templateId: editingTemplate.id, name: editingTemplate.name, documentType: editingTemplate.documentType, layoutJson: JSON.stringify({ ...layout, content: templateBody, visual: visualTemplate }) });
  };

  const openNewTemplateForm = () => {
    setTemplateName('');
    setTemplateType('facture');
    setNewTemplateBody('');
    setVisualTemplate({ ...DEFAULT_VISUAL_TEMPLATE, headerFields: { ...DEFAULT_HEADER_FIELDS }, footerFields: { ...DEFAULT_FOOTER_FIELDS } });
    setShowTemplateForm(true);
  };

  const resetDraftForm = () => {
    setShowDocumentForm(false);
    setEditingDraft(null);
    setTitle('');
    setDocumentType('autre');
    setClassification('internal');
    setDraftTemplateId('');
    setDraftBody('');
    setDraftVisualConfig(DEFAULT_VISUAL_TEMPLATE);
  };

  const openDraftEditor = (document: NonNullable<typeof documents.data>[number]) => {
    setEditingDraft({ id: document.id, title: document.title, documentType: document.documentType, classification: document.classification, metadataJson: document.metadataJson, templateId: document.templateId });
    setTitle(document.title);
    setDocumentType(document.documentType);
    setClassification(document.classification);
    setDraftTemplateId(document.templateId ? String(document.templateId) : '');
    setDraftBody(parseDocumentContent(document.metadataJson));
    setDraftVisualConfig(parseDocumentVisualConfig(document.metadataJson));
    setShowDocumentForm(true);
  };

  const submitDraftForm = () => {
    const metadataJson = draftBody.trim() ? JSON.stringify({ content: draftBody, visual: draftVisualConfig }) : undefined;
    if (editingDraft) {
      updateDraft.mutate({ companyId: companyNumericId, documentId: editingDraft.id, title, documentType, classification, metadataJson: metadataJson ?? null, templateId: draftTemplateId ? Number(draftTemplateId) : null });
    } else {
      createDraft.mutate({ companyId: companyNumericId, title, documentType, classification, metadataJson, templateId: draftTemplateId ? Number(draftTemplateId) : undefined });
    }
  };

  const deliverDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noreferrer';
    link.click();
  };

  const downloadPdf = async (name: string, body: string, visual: VisualTemplateConfig = DEFAULT_VISUAL_TEMPLATE, type = 'autre') => {
    try {
      await downloadDocumentPdf(name, body, company?.name ?? 'IDIBA', visual, type, language);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'La création du PDF a échoué.', 'error');
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(createdShareUrl);
      showToast('Lien copié.', 'success');
    } catch {
      showToast('Copie impossible : sélectionnez le lien puis copiez-le manuellement.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--accent-primary)]"><FileCheck2 size={17} /> ESPACE DOCUMENTAIRE</div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">Studio documentaire</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">Créez vos documents, structurez vos modèles et suivez les échanges externes de {company?.name ?? 'votre entreprise'}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button disabled={!canManageDocuments} onClick={openNewTemplateForm} className="inline-flex h-10 items-center gap-2 rounded bg-[var(--bg-secondary)] px-4 text-sm font-semibold text-[var(--text-primary)] ring-1 ring-[var(--border-color)] hover:ring-[var(--accent-primary)]"><FileCheck2 size={16} /> Nouveau modèle</button>
          <button onClick={() => { resetDraftForm(); setShowDocumentForm(true); }} className="inline-flex h-10 items-center gap-2 rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white hover:opacity-90"><FilePlus2 size={16} /> Nouveau document</button>
        </div>
      </motion.div>

      {capabilities.data?.demoMode && <div role="status" className="rounded border border-blue-500/25 bg-blue-500/5 px-4 py-3 text-sm text-[var(--text-secondary)]"><span className="font-semibold text-[var(--text-primary)]">Aperçu de démonstration :</span> les brouillons, modèles et historiques restent en mémoire sur ce serveur et seront réinitialisés à son redémarrage. Le téléversement, le partage externe et les signatures réelles nécessitent leurs services sécurisés configurés.</div>}

      <GlassCard hover={false} className="overflow-hidden p-0">
        <div className="flex gap-1 overflow-x-auto border-b border-[var(--border-color)] px-3 pt-3">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${tab === id ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]' : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
              <Icon size={16} />{label}
            </button>
          ))}
        </div>

        <div className="p-5 md:p-6">
          {tab === 'documents' && <>
            <SectionHeading title="Documents de l’entreprise" detail="Les brouillons et leurs métadonnées sont enregistrés côté serveur. Importez les PDF et images produits par un scanner connecté à cet ordinateur." />
            {documents.isLoading || companyLoading ? <LoadingState /> : documents.isError ? <ErrorState message={documents.error.message} /> : documents.data?.length ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead><tr className="border-b border-[var(--border-color)] text-xs uppercase tracking-wide text-[var(--text-muted)]"><th className="px-3 py-3">Document</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Confidentialité</th><th className="px-3 py-3">État</th><th className="px-3 py-3">Créé le</th><th className="px-3 py-3">Actions</th></tr></thead>
                  <tbody>{documents.data.map((document) => <tr key={document.id} onClick={() => setSelectedDocumentId(document.id)} className="cursor-pointer border-b border-[var(--border-color)]/70 last:border-0 hover:bg-[var(--bg-secondary)]/50">
                    <td className="px-3 py-4"><div className="font-semibold text-[var(--text-primary)]">{document.title}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{document.documentNumber || `DOC-${document.id}`}</div></td>
                    <td className="px-3 py-4 text-[var(--text-secondary)]">{document.documentType}</td>
                    <td className="px-3 py-4"><span className="rounded bg-[var(--bg-secondary)] px-2 py-1 text-xs text-[var(--text-secondary)]">{document.classification}</span></td>
                    <td className="px-3 py-4"><StatusChip status={document.status} /></td>
                    <td className="px-3 py-4 text-[var(--text-secondary)]">{new Date(document.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-3 py-3"><div className="flex items-center gap-1">
                      {document.status === 'draft' && canManageDocuments && <button onClick={() => openDraftEditor(document)} title="Modifier le brouillon" className="rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><Pencil size={15} /></button>}
                      {document.status === 'draft' && <><button disabled={!capabilities.data?.upload || uploadFile.isPending} onClick={() => { setUploadTarget(document.id); fileInput.current?.click(); }} title={capabilities.data?.upload ? 'Importer un fichier ou la sortie PDF du scanner connecté' : 'Stockage privé et antivirus à configurer'} className="rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:cursor-not-allowed disabled:opacity-40"><ScanLine size={15} /></button><button disabled={!capabilities.data?.upload || uploadFile.isPending} onClick={() => { setUploadTarget(document.id); scanFileInput.current?.click(); }} title="Scanner une page avec la caméra du téléphone" className="rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:cursor-not-allowed disabled:opacity-40"><Camera size={15} /></button></>}
                      {document.sha256 && <button onClick={() => void downloadDocument(document.id)} title="Télécharger le fichier" className="rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><Download size={15} /></button>}
                      {!document.sha256 && parseDocumentContent(document.metadataJson) && <><button onClick={() => downloadEditableTemplate(document.title, parseDocumentContent(document.metadataJson), parseDocumentVisualConfig(document.metadataJson), document.documentType, language)} title="Télécharger le document modifiable en HTML" className="rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><Download size={15} /></button><button onClick={() => void downloadPdf(document.title, parseDocumentContent(document.metadataJson), parseDocumentVisualConfig(document.metadataJson), document.documentType)} title="Générer le document en PDF" className="rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><FileText size={15} /></button></>}
                      {document.sha256 && <button onClick={() => setVersionHistoryDocumentId(document.id)} title="Afficher les versions du fichier" className="rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"><History size={15} /></button>}
                      {document.status === 'draft' && document.sha256 && canManageDocuments && <button disabled={finalizeDocument.isPending} onClick={() => finalizeDocument.mutate({ companyId: companyNumericId, documentId: document.id })} title="Finaliser et verrouiller" className="rounded p-2 text-emerald-700 hover:bg-emerald-500/10 disabled:opacity-40"><ShieldCheck size={15} /></button>}
                      {document.status !== 'void' && canManageDocuments && <button disabled={voidDocument.isPending} onClick={(event) => { event.stopPropagation(); if (window.confirm(`Annuler « ${document.title} » ? Les liens externes seront révoqués et les visas internes en attente clôturés.`)) voidDocument.mutate({ companyId: companyNumericId, documentId: document.id }); }} title="Annuler le document" className="rounded p-2 text-red-600 hover:bg-red-500/10 disabled:opacity-40"><X size={15} /></button>}
                    </div></td>
                  </tr>)}</tbody>
                </table>
                {selectedDocument && <section className="mt-5 rounded border border-[var(--border-color)] p-4"><h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"><History size={15} />Historique · {selectedDocument.title}</h3>{documentEvents.isLoading ? <p className="mt-3 text-xs text-[var(--text-muted)]">Chargement de l’historique…</p> : documentEvents.isError ? <p role="alert" className="mt-3 text-xs text-red-600">{documentEvents.error.message}</p> : documentEvents.data?.length ? <ol className="mt-3 divide-y divide-[var(--border-color)]">{documentEvents.data.map((event) => <li key={event.id} className="py-2"><div className="text-xs font-semibold text-[var(--text-primary)]">{documentEventLabel(event.eventType)}</div><time className="mt-1 block text-[11px] text-[var(--text-muted)]">{new Date(event.createdAt).toLocaleString('fr-FR')} · compte {event.actorUserId ?? 'externe'}</time>{event.detailsJson && <div className="mt-1 break-all text-[10px] text-[var(--text-muted)]">{summarizeDocumentEvent(event.detailsJson)}</div>}</li>)}</ol> : <p className="mt-3 text-xs text-[var(--text-muted)]">Aucun événement enregistré.</p>}</section>}
                <input ref={fileInput} type="file" accept="application/pdf,image/png,image/jpeg" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file && uploadTarget) void uploadToDraft(uploadTarget, file); event.currentTarget.value = ''; }} />
                <input ref={scanFileInput} type="file" accept="image/jpeg,image/png" capture="environment" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file && uploadTarget) void uploadToDraft(uploadTarget, file); event.currentTarget.value = ''; }} />
              </div>
            ) : <EmptyState icon={Archive} title="Aucun document" detail="Créez un brouillon pour commencer votre espace documentaire." action={<button onClick={() => { resetDraftForm(); setShowDocumentForm(true); }} className="mt-4 inline-flex items-center gap-2 rounded bg-[var(--accent-primary)] px-4 py-2 text-sm font-semibold text-white"><Plus size={15} />Créer un document</button>} />}
          </>}

          {tab === 'templates' && <>
            <SectionHeading title="Mes modèles" detail="Créez vos modèles, personnalisez leur présentation et associez-les aux brouillons." action={<button disabled={!canManageDocuments} onClick={openNewTemplateForm} className="inline-flex items-center gap-2 rounded bg-[var(--accent-primary)] px-3 py-2 text-sm font-semibold text-white"><Plus size={15} />Nouveau modèle</button>} />
            {templates.isLoading ? <LoadingState /> : templates.isError ? <ErrorState message={templates.error.message} /> : templates.data?.length ? <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{templates.data.map((template) => {
              const layout = parseTemplateLayout(template.layoutJson);
              const body = typeof layout.content === 'string' ? layout.content : JSON.stringify(layout, null, 2);
              const visual = parseVisualTemplateConfig(layout.visual);
              return <div key={template.id} className="rounded border border-[var(--border-color)] bg-[var(--bg-secondary)]/50 p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-semibold text-[var(--text-primary)]">{template.name}</div><div className="mt-1 text-sm text-[var(--text-secondary)]">{template.documentType}</div></div><StatusChip status={template.status} /></div><div className="mt-3 text-xs text-[var(--text-muted)]">Version {template.currentVersion} · modifié le {new Date(template.updatedAt).toLocaleDateString('fr-FR')}</div><div className="mt-4 flex flex-wrap gap-2"><button disabled={!canManageDocuments} onClick={() => beginTemplateEdit(template)} className="inline-flex h-8 items-center gap-1.5 rounded border border-[var(--border-color)] px-2.5 text-xs font-semibold text-[var(--text-primary)] disabled:opacity-45"><Pencil size={13} />Modifier</button><button onClick={() => downloadEditableTemplate(template.name, body, visual, template.documentType, language)} className="inline-flex h-8 items-center gap-1.5 rounded border border-[var(--border-color)] px-2.5 text-xs font-semibold text-[var(--text-primary)]"><Download size={13} />HTML</button><button onClick={() => void downloadPdf(template.name, body, visual, template.documentType)} className="inline-flex h-8 items-center gap-1.5 rounded border border-[var(--border-color)] px-2.5 text-xs font-semibold text-[var(--text-primary)]"><FileText size={13} />PDF</button>{template.status === 'draft' && <button disabled={activateTemplate.isPending || !canManageDocuments} onClick={() => activateTemplate.mutate({ companyId: companyNumericId, templateId: template.id })} className="inline-flex h-8 items-center rounded px-2.5 text-xs font-semibold text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 disabled:opacity-40">Activer</button>}{template.status !== 'archived' && <button disabled={!canManageDocuments || archiveTemplate.isPending} onClick={() => archiveTemplate.mutate({ companyId: companyNumericId, templateId: template.id })} className="inline-flex h-8 items-center rounded px-2.5 text-xs font-semibold text-red-600 hover:bg-red-500/10 disabled:opacity-40">Archiver</button>}</div></div>;
            })}</div> : <div className="mt-4 rounded border border-dashed border-[var(--border-color)] p-5 text-sm text-[var(--text-muted)]">Aucun modèle pour le moment. Les modèles que vous fournirez seront ajoutés ici.</div>}
          </>}

          {tab === 'sharing' && <>
            <SectionHeading title="Partages externes" detail="Les liens sont révocables et expirent automatiquement. Seuls les documents publics finalisés peuvent être partagés." />
            {!canCreateShare && <ServiceNotice title="Partage externe indisponible" detail="Configurez le stockage privé et lenvoi des codes OTP par e-mail. Antivirus nécessaire seulement pour autoriser le dépôt externe." />}
            {documents.isError ? <ErrorState message={documents.error.message} /> : documents.data?.length ? <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
              <div className="rounded border border-[var(--border-color)] p-4">
                <label htmlFor="share-document" className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">Document à partager</label>
                <select id="share-document" value={selectedDocument?.id ?? ''} onChange={(event) => { setSelectedDocumentId(Number(event.target.value)); setCreatedShareUrl(''); }} className="h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]">
                  {documents.data.map((document) => <option key={document.id} value={document.id}>{document.title} · {statusLabel[document.status] ?? document.status}</option>)}
                </select>
                <label htmlFor="share-contact" className="mb-2 mt-4 block text-sm font-semibold text-[var(--text-primary)]">Client ou fournisseur</label>
                <select id="share-contact" value={recipientContactKey} onChange={(event) => {
                  const key = event.target.value;
                  setRecipientContactKey(key);
                  const contact = [...externalContacts.clientContacts, ...externalContacts.vendorContacts].find((item) => item.key === key);
                  setRecipientEmail(contact?.email ?? '');
                }} className="h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]">
                  <option value="manual">Saisir une adresse e-mail</option>
                  <optgroup label="Clients">{externalContacts.clientContacts.map((contact) => <option key={contact.key} value={contact.key}>{contact.label} · {contact.email}</option>)}</optgroup>
                  <optgroup label="Registre fournisseurs">{externalContacts.vendorContacts.map((contact) => <option key={contact.key} value={contact.key}>{contact.label} · {contact.email}</option>)}</optgroup>
                </select>
                <label htmlFor="share-email" className="mb-2 mt-4 block text-sm font-semibold text-[var(--text-primary)]">E-mail du destinataire</label>
                <input id="share-email" required type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} placeholder="nom@entreprise.com" className="h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]" />
                <label htmlFor="share-permission" className="mb-2 mt-4 block text-sm font-semibold text-[var(--text-primary)]">Autorisation</label>
                <select id="share-permission" value={sharePermission} onChange={(event) => setSharePermission(event.target.value as typeof sharePermission)} className="h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]"><option value="view">Consulter et télécharger</option><option value="comment">Consulter et commenter</option><option value="upload" disabled={!canUploadExternal}>Consulter et déposer un fichier</option></select>
                <label htmlFor="share-expiry" className="mb-2 mt-4 block text-sm font-semibold text-[var(--text-primary)]">Durée du lien<select id="share-expiry" value={shareExpiryHours} onChange={(event) => setShareExpiryHours(Number(event.target.value))} className="mt-2 h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]"><option value={24}>24 heures</option><option value={72}>3 jours</option><option value={168}>7 jours</option><option value={720}>30 jours</option></select></label>
                <button disabled={!canManageDocuments || !canShareSelected || !canCreateShare || (sharePermission === 'upload' && !canUploadExternal) || !recipientEmail || createShare.isPending} onClick={() => selectedDocument && createShare.mutate({ companyId: companyNumericId, documentId: selectedDocument.id, recipientEmail, permission: sharePermission, expiresInHours: shareExpiryHours })} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"><Share2 size={16} />Créer un lien sécurisé + code OTP</button>
                {!canShareSelected && <p className="mt-2 text-xs text-[var(--text-muted)]">Ce document doit être public, finalisé et doté d’une empreinte avant le partage.</p>}
                {createdShareUrl && <div className="mt-4 rounded border border-emerald-500/30 bg-emerald-500/5 p-3"><div className="text-xs font-semibold text-emerald-700">Lien créé · expiration dans {shareExpiryHours} heures</div><div className="mt-2 flex gap-2"><input readOnly value={createdShareUrl} className="min-w-0 flex-1 rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-2 text-xs text-[var(--text-primary)]" /><button aria-label="Copier le lien" onClick={() => void copyShareLink()} className="rounded border border-[var(--border-color)] px-3 text-[var(--text-primary)]"><Copy size={15} /></button></div></div>}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Liens du document</h3>
                <div className="mt-3 divide-y divide-[var(--border-color)] rounded border border-[var(--border-color)]">{shares.data?.length ? shares.data.map((share) => <div key={share.id} className="flex items-center justify-between gap-3 p-3"><div className="min-w-0"><div className="truncate text-sm font-medium text-[var(--text-primary)]">{share.recipientEmail || 'Lien sans destinataire'}</div><div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-muted)]"><Clock3 size={12} />Expire le {new Date(share.expiresAt).toLocaleString('fr-FR')}</div></div>{share.revokedAt ? <span className="text-xs text-[var(--text-muted)]">Révoqué</span> : <button onClick={() => revokeShare.mutate({ companyId: companyNumericId, shareId: share.id })} className="rounded px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-500/10">Révoquer</button>}</div>) : <div className="p-5 text-sm text-[var(--text-muted)]">Aucun lien créé pour ce document.</div>}</div>
                <h3 className="mt-6 text-sm font-semibold text-[var(--text-primary)]">Commentaires et pièces reçus</h3>
                <div className="mt-3 space-y-2">{externalComments.data?.length ? externalComments.data.map((item) => <article key={item.id} className="rounded border border-[var(--border-color)] p-3"><p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">{item.body}</p>{item.attachmentName && <button onClick={() => void downloadExternalAttachment(item.id)} className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[var(--accent-primary)]"><Download size={13} />{item.attachmentName}</button>}<time className="mt-2 block text-[11px] text-[var(--text-muted)]">{new Date(item.createdAt).toLocaleString('fr-FR')}</time></article>) : <div className="rounded border border-dashed border-[var(--border-color)] p-4 text-sm text-[var(--text-muted)]">Aucun retour externe pour ce document.</div>}</div>
              </div>
            </div> : <EmptyState icon={Share2} title="Aucun document à partager" detail="Ajoutez puis finalisez un document public après configuration du stockage sécurisé." />}
          </>}

          {tab === 'signatures' && <>
            <SectionHeading title="Signature et cachet" detail="Préparez le document, choisissez le signataire et son emplacement, puis envoyez une validation sécurisée." />
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              <ServiceCard icon={Check} title="Visa interne" ready detail="Accord nominatif réservé au compte du signataire, avec horodatage, empreinte SHA-256 et historique." />
              <ServiceCard icon={FileCheck2} title="DocuSign" ready={Boolean(capabilities.data?.providerSignature)} detail={capabilities.data?.providerSignature ? 'Variables présentes ; le compte et le consentement JWT seront validés à l’envoi.' : 'Ajoutez les identifiants serveur et accordez le consentement JWT.'} />
              <ServiceCard icon={ShieldCheck} title="Traçabilité" ready detail="Le visa interne est une approbation authentifiée. Il ne constitue pas une signature électronique qualifiée." />
            </div>
            {documents.isLoading ? <LoadingState /> : documents.isError ? <ErrorState message={documents.error.message} /> : selectedSignatureDocument ? <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded border border-[var(--border-color)] p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div><h3 className="text-sm font-semibold text-[var(--text-primary)]">Finalisation du document</h3><p className="mt-1 text-xs text-[var(--text-muted)]">Sélectionnez un PDF finalisé à préparer pour signature.</p></div>
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">Finalisé</span>
                </div>
                <label htmlFor="signature-document" className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">Document</label>
                <select id="signature-document" value={selectedSignatureDocument.id} onChange={(event) => setSelectedDocumentId(Number(event.target.value))} className="h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]">{signatureDocuments.map((document) => <option key={document.id} value={document.id}>{document.title}</option>)}</select>
                <div className="mt-3 flex items-center justify-between gap-3 rounded bg-[var(--bg-secondary)]/60 p-3">
                  <div className="flex min-w-0 items-center gap-3"><FileText size={18} className="shrink-0 text-[var(--text-secondary)]" /><div className="min-w-0"><div className="truncate text-sm font-semibold text-[var(--text-primary)]">{selectedSignatureDocument.title}</div><div className="mt-0.5 text-xs text-[var(--text-muted)]">{selectedSignatureDocument.documentNumber || `DOC-${selectedSignatureDocument.id}`} · PDF · SHA-256 {selectedSignatureDocument.sha256?.slice(0, 12) || 'à vérifier'}…</div></div></div>
                  <button type="button" onClick={() => void downloadDocument(selectedSignatureDocument.id)} aria-label="Ouvrir le PDF" title="Ouvrir le PDF" className="shrink-0 rounded p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]"><ExternalLink size={16} /></button>
                </div>
                {canManageDocuments && <div className="mt-5 space-y-4">
                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">Signataire</legend>
                    <div className="space-y-2">{internalSigners.data?.map((member) => {
                      const authorizedRole = ['owner', 'admin', 'platform_admin'].includes(String(member.role));
                      return <label key={member.userId} className={`flex cursor-pointer items-center gap-3 rounded border px-3 py-2.5 text-sm ${internalSignerUserId === String(member.userId) ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/5' : 'border-[var(--border-color)]'}`}>
                        <input type="radio" name="internal-signer" value={member.userId} checked={internalSignerUserId === String(member.userId)} onChange={(event) => setInternalSignerUserId(event.target.value)} className="accent-[var(--accent-primary)]" />
                        <span className="min-w-0 flex-1"><span className="block truncate font-medium text-[var(--text-primary)]">{member.name || member.email}</span><span className="mt-0.5 block text-xs text-[var(--text-muted)]">{authorizedRole ? 'Administrateur · habilitation de gestion' : 'Membre · vérifier l’habilitation de signature'}</span></span>
                        {internalSignerUserId === String(member.userId) && authorizedRole && <Check size={16} className="text-[var(--accent-primary)]" />}
                      </label>;
                    })}</div>
                    {internalSigners.isLoading && <p className="text-xs text-[var(--text-muted)]">Chargement des signataires actifs…</p>}
                    {internalSigners.isError && <ErrorState message={internalSigners.error.message} />}
                  </fieldset>
                  <label className="flex cursor-pointer items-center gap-3 rounded border border-[var(--border-color)] px-3 py-3 text-sm text-[var(--text-primary)]"><input type="checkbox" checked={includeCompanyStamp} onChange={(event) => setIncludeCompanyStamp(event.target.checked)} className="size-4 accent-[var(--accent-primary)]" /><span>Prévoir également le cachet de l’entreprise</span><Stamp size={17} className="ml-auto text-[var(--text-secondary)]" /></label>
                  <fieldset>
                    <legend className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">Emplacement de la signature</legend>
                    <div className="space-y-2">
                      <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--text-primary)]"><input type="radio" name="signature-placement" value="last_page" checked={signaturePlacement === 'last_page'} onChange={() => setSignaturePlacement('last_page')} className="accent-[var(--accent-primary)]" />Zone de signature de la dernière page</label>
                      <label className="flex cursor-pointer items-center gap-3 text-sm text-[var(--text-primary)]"><input type="radio" name="signature-placement" value="custom" checked={signaturePlacement === 'custom'} onChange={() => setSignaturePlacement('custom')} className="accent-[var(--accent-primary)]" />Position personnalisée sur le document</label>
                    </div>
                    {signaturePlacement === 'custom' && <div className="mt-3"><label htmlFor="signature-anchor" className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">Repère exact présent dans le PDF</label><input id="signature-anchor" value={signatureAnchor} onChange={(event) => setSignatureAnchor(event.target.value)} maxLength={80} className="h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 font-mono text-sm text-[var(--text-primary)]" /><p className="mt-1 text-xs text-[var(--text-muted)]">Le repère doit déjà apparaître dans le PDF. Il sera transmis au signataire comme consigne de placement.</p></div>}
                  </fieldset>
                  <label htmlFor="internal-signature-note" className="block text-xs font-semibold text-[var(--text-secondary)]">Consigne au signataire <span className="font-normal">(facultatif)</span></label>
                  <textarea id="internal-signature-note" value={internalSignatureNote} onChange={(event) => setInternalSignatureNote(event.target.value)} maxLength={550} rows={2} className="-mt-3 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)]" placeholder="Ex. Vérifier les montants avant validation" />
                  <button disabled={!internalSignerUserId || requestInternalSignature.isPending || internalSigners.isLoading || (signaturePlacement === 'custom' && !signatureAnchor.trim())} onClick={() => requestInternalSignature.mutate({ companyId: companyNumericId, documentId: selectedSignatureDocument.id, signerUserId: Number(internalSignerUserId), note: JSON.stringify({ workflow: 'signature_and_stamp', includeCompanyStamp, placement: signaturePlacement, anchor: signaturePlacement === 'custom' ? signatureAnchor.trim() : null, instruction: internalSignatureNote.trim() || null }) })} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"><ShieldCheck size={16} />Configurer la validation sécurisée</button>
                  <p className="text-xs text-[var(--text-muted)]">La demande sera envoyée dans l’espace du signataire. Son accord sera confirmé dans sa session, puis journalisé avec l’empreinte du PDF.</p>
                  {includeCompanyStamp && <p className="text-xs text-amber-700">Le choix du cachet est enregistré comme consigne de validation. Son apposition visuelle nécessite encore un cachet d’entreprise enregistré et le service d’édition PDF.</p>}
                </div>}
                <div className="mt-5 border-t border-[var(--border-color)] pt-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Demandes à signer par moi</h3>
                  <div className="mt-3 space-y-3">{myInternalSignatures.data?.length ? myInternalSignatures.data.map((request) => {
                    const workflow = parseSignatureWorkflowNote(request.requestNote);
                    return <article key={request.id} className="rounded border border-[var(--border-color)] p-3">
                    <div className="font-medium text-sm text-[var(--text-primary)]">{request.documentTitle}</div><div className="mt-1 text-xs text-[var(--text-muted)]">Demandé le {new Date(request.createdAt).toLocaleString('fr-FR')} · empreinte {request.documentSha256?.slice(0, 16) ?? 'indisponible'}…</div>
                    {workflow && <div className="mt-3 rounded bg-[var(--bg-secondary)]/70 p-3 text-xs text-[var(--text-secondary)]"><div className="font-semibold text-[var(--text-primary)]">Consignes de signature</div><div className="mt-1">Emplacement : {workflow.placement === 'last_page' ? 'zone prévue à la dernière page' : `repère ${workflow.anchor || 'personnalisé'}`}</div><div>{workflow.includeCompanyStamp ? 'Cachet demandé' : 'Sans cachet'}</div>{workflow.instruction && <div className="mt-1">Consigne : {workflow.instruction}</div>}</div>}
                    <button onClick={() => void downloadDocument(request.documentId)} className="mt-3 inline-flex h-8 items-center gap-2 rounded border border-[var(--border-color)] px-3 text-xs font-semibold text-[var(--text-primary)]"><Download size={13} />Ouvrir le PDF</button>
                    <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs text-[var(--text-secondary)]"><input type="checkbox" checked={attestedSignatureIds.has(request.id)} onChange={(event) => setAttestedSignatureIds((current) => { const next = new Set(current); event.target.checked ? next.add(request.id) : next.delete(request.id); return next; })} className="mt-0.5 accent-[var(--accent-primary)]" /><span>Après consultation du PDF, je confirme mon accord sur cette version et comprends que ce visa interne est enregistré sous mon compte.</span></label>
                    <button disabled={!attestedSignatureIds.has(request.id) || signInternalDocument.isPending} onClick={() => signInternalDocument.mutate({ companyId: companyNumericId, requestId: request.id, acknowledged: true })} className="mt-3 inline-flex h-9 items-center gap-2 rounded bg-[var(--accent-primary)] px-3 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"><Check size={14} />Signer et approuver</button>
                    <label htmlFor={`decline-reason-${request.id}`} className="mb-1 mt-3 block text-xs font-medium text-[var(--text-secondary)]">Motif de refus</label><textarea id={`decline-reason-${request.id}`} value={internalDeclineReason} onChange={(event) => setInternalDeclineReason(event.target.value)} maxLength={1000} rows={2} className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)]" placeholder="Expliquez ce qui doit être corrigé (3 caractères minimum)" />
                    <button disabled={internalDeclineReason.trim().length < 3 || declineInternalSignature.isPending} onClick={() => declineInternalSignature.mutate({ companyId: companyNumericId, requestId: request.id, reason: internalDeclineReason })} className="mt-2 h-8 rounded border border-red-500/30 px-3 text-xs font-semibold text-red-600 disabled:cursor-not-allowed disabled:opacity-45">Refuser la demande</button>
                  </article>}) : <div className="rounded border border-dashed border-[var(--border-color)] p-4 text-sm text-[var(--text-muted)]">Aucun document ne vous attend.</div>}</div>
                </div>
                <label htmlFor="signature-name" className="mb-2 mt-4 block text-sm font-semibold text-[var(--text-primary)]">Nom du signataire</label>
                <input id="signature-name" value={signerName} onChange={(event) => setSignerName(event.target.value)} maxLength={100} className="h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]" placeholder="Nom complet" />
                <label htmlFor="signature-email" className="mb-2 mt-4 block text-sm font-semibold text-[var(--text-primary)]">E-mail du signataire</label>
                <input id="signature-email" type="email" value={signerEmail} onChange={(event) => setSignerEmail(event.target.value)} className="h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)]" placeholder="nom@entreprise.com" />
                <label htmlFor="signature-anchor" className="mb-2 mt-4 block text-sm font-semibold text-[var(--text-primary)]">Repère de signature dans le PDF</label>
                <input id="signature-anchor" value={signatureAnchor} onChange={(event) => setSignatureAnchor(event.target.value)} maxLength={80} className="h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 font-mono text-sm text-[var(--text-primary)]" />
                <p className="mt-2 text-xs text-[var(--text-muted)]">Le PDF doit contenir exactement ce texte à l’emplacement voulu. DocuSign le remplace par le champ de signature.</p>
                <button disabled={!capabilities.data?.providerSignature || !signerName.trim() || !signerEmail || !signatureAnchor.trim() || sendDocuSign.isPending} onClick={() => sendDocuSign.mutate({ companyId: companyNumericId, documentId: selectedSignatureDocument.id, signerName, signerEmail, anchorText: signatureAnchor })} className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"><Send size={15} />Envoyer la demande DocuSign</button>
                {!capabilities.data?.providerSignature && <p className="mt-3 flex items-start gap-2 text-xs text-amber-700"><ShieldAlert size={14} className="mt-0.5 shrink-0" />La fonctionnalité s’activera après ajout des clés DocuSign et consentement JWT dans les variables d’environnement serveur.</p>}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Demandes et historique</h3>
                <div className="mt-3 divide-y divide-[var(--border-color)] rounded border border-[var(--border-color)]">{signatures.data?.length ? signatures.data.map((request) => <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div className="min-w-0"><div className="truncate text-sm font-medium text-[var(--text-primary)]">{request.signerEmail}</div><div className="mt-1 text-xs text-[var(--text-muted)]">{request.signatureKind === 'internal_acknowledgement' ? 'Visa interne' : 'DocuSign'} · {request.status} · {new Date(request.createdAt).toLocaleString('fr-FR')}{request.documentSha256 ? ` · SHA-256 ${request.documentSha256.slice(0, 16)}…` : ''}</div></div>{request.providerReference && request.status === 'pending' && <button disabled={refreshDocuSign.isPending || Boolean(request.lastStatusCheckedAt && Date.now() - new Date(request.lastStatusCheckedAt).getTime() < 15 * 60_000)} onClick={() => refreshDocuSign.mutate({ companyId: companyNumericId, requestId: request.id })} className="inline-flex h-8 items-center gap-2 rounded border border-[var(--border-color)] px-3 text-xs font-semibold text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45"><RefreshCw size={13} />Actualiser</button>}</div>) : <div className="p-5 text-sm text-[var(--text-muted)]">Aucune demande de signature pour ce document.</div>}</div>
                <div className="mt-5"><h4 className="text-sm font-semibold text-[var(--text-primary)]">Journal de traçabilité</h4><div className="mt-2 max-h-64 divide-y divide-[var(--border-color)] overflow-y-auto rounded border border-[var(--border-color)]">{signatureEvents.data?.length ? signatureEvents.data.map((event) => <div key={event.id} className="p-3"><div className="text-xs font-semibold text-[var(--text-primary)]">{event.eventType.replaceAll('_', ' ')}</div><time className="mt-1 block text-[11px] text-[var(--text-muted)]">{new Date(event.createdAt).toLocaleString('fr-FR')} · compte {event.actorUserId ?? 'système'}</time>{event.payloadJson && <div className="mt-1 break-all text-[10px] text-[var(--text-muted)]">{(() => { try { const payload = JSON.parse(event.payloadJson) as Record<string, unknown>; return typeof payload.documentSha256 === 'string' ? `SHA-256 ${payload.documentSha256}` : typeof payload.reason === 'string' ? `Motif : ${payload.reason}` : typeof payload.note === 'string' ? `Consigne : ${payload.note}` : ''; } catch { return ''; } })()}</div>}</div>) : <div className="p-4 text-xs text-[var(--text-muted)]">Aucun événement enregistré.</div>}</div></div>
                <p className="mt-3 text-xs text-[var(--text-muted)]">L’actualisation manuelle est limitée à une fois toutes les 15 minutes par enveloppe. La signature reçue doit être conservée et vérifiée selon vos règles juridiques.</p>
              </div>
            </div> : <EmptyState icon={Stamp} title="Aucun PDF finalisé" detail="Ajoutez un PDF, analysez-le et finalisez-le avant de demander une signature." />}
          </>}
        </div>
      </GlassCard>

      {(showDocumentForm || showTemplateForm) && <div role="presentation" className="fixed inset-0 z-[100] flex justify-end bg-slate-950/55" onMouseDown={(event) => { if (event.target === event.currentTarget) { resetDraftForm(); setShowTemplateForm(false); } }}>
        <div role="dialog" aria-modal="true" aria-labelledby="studio-modal-title" className={`form-drawer-enter h-full max-h-screen w-full overflow-y-auto border-l border-[var(--border-color)] bg-[var(--bg-primary)] p-5 shadow-2xl md:p-6 ${showTemplateForm ? 'max-w-6xl' : 'max-w-lg'}`}>
          <div className="flex items-start justify-between gap-4"><div><h2 id="studio-modal-title" className="text-xl font-bold text-[var(--text-primary)]">{showDocumentForm ? editingDraft ? 'Modifier le brouillon' : 'Créer un brouillon' : 'Document Brand Studio'}</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">{showTemplateForm ? 'Personnalisation et aperçu du modèle en direct.' : 'Les données sont liées à l’entreprise active.'}</p></div><button aria-label="Fermer" onClick={() => { resetDraftForm(); setShowTemplateForm(false); }} className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"><X size={19} /></button></div>
          {showDocumentForm ? <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); submitDraftForm(); }}>
            <FormField label="Titre"><input autoFocus required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} placeholder="Ex. Contrat de prestation" /></FormField>
            <FormField label="Type"><input required maxLength={80} value={documentType} onChange={(event) => setDocumentType(event.target.value)} className={fieldClass} placeholder="contrat, facture, procédure…" /></FormField>
            <FormField label="Modèle actif (facultatif)"><select value={draftTemplateId} onChange={(event) => { const value = event.target.value; setDraftTemplateId(value); const template = templates.data?.find((item) => String(item.id) === value); const layout = parseTemplateLayout(template?.layoutJson); if (template) setDocumentType(template.documentType); setDraftBody(typeof layout.content === 'string' ? layout.content : ''); setDraftVisualConfig(parseVisualTemplateConfig(layout.visual)); }} className={fieldClass}><option value="">Aucun modèle</option>{templates.data?.filter((template) => template.status === 'active').map((template) => <option key={template.id} value={template.id}>{template.name} · v{template.currentVersion}</option>)}</select></FormField>
            <FormField label="Classification"><select value={classification} onChange={(event) => setClassification(event.target.value as typeof classification)} className={fieldClass}><option value="internal">Interne</option><option value="public">Public</option><option value="confidential">Confidentiel</option><option value="restricted">Restreint</option></select></FormField>
            <FormField label="Contenu du document (facultatif)"><textarea rows={8} maxLength={20000} value={draftBody} onChange={(event) => setDraftBody(event.target.value)} className="w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-sm text-[var(--text-primary)]" placeholder="Rédigez ou complétez le contenu. Téléchargez-le ensuite en HTML et imprimez-le en PDF pour le téléverser." /></FormField>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={resetDraftForm} className="h-10 rounded px-4 text-sm font-semibold text-[var(--text-secondary)]">Annuler</button><button disabled={createDraft.isPending || updateDraft.isPending || !enabled} className="h-10 rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white disabled:opacity-50">{createDraft.isPending || updateDraft.isPending ? 'Enregistrement…' : editingDraft ? 'Enregistrer les modifications' : 'Créer le brouillon'}</button></div>
          </form> : <form className="mt-5 space-y-4" onSubmit={(event) => { event.preventDefault(); createTemplate.mutate({ companyId: companyNumericId, name: templateName, documentType: templateType, layoutJson: JSON.stringify({ page: 'A4', locale: 'fr-FR', content: newTemplateBody, visual: visualTemplate }) }); }}>
            <div className="grid gap-4 sm:grid-cols-2"><FormField label="Nom du modèle"><input autoFocus required maxLength={180} value={templateName} onChange={(event) => setTemplateName(event.target.value)} className={fieldClass} placeholder="Ex. Facture client" /></FormField>
            <FormField label="Type de document"><select required value={templateType} onChange={(event) => setTemplateType(event.target.value)} className={fieldClass}>{TEMPLATE_DOCUMENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></FormField></div>
          <VisualTemplateEditor config={visualTemplate} onChange={setVisualTemplate} content={newTemplateBody} onContentChange={setNewTemplateBody} companyName={company?.name || 'Votre entreprise'} companyAddress={[company?.city, company?.country].filter(Boolean).join(', ')} companyLogo={company?.logoUrl ?? undefined} documentType={templateType || 'autre'} documentName={templateName || 'Nom du document'} language={language} />
            <p className="rounded bg-[var(--bg-secondary)] p-3 text-xs text-[var(--text-muted)]">Le modèle et sa configuration visuelle seront enregistrés ensemble. Vous pourrez ensuite le modifier, l’activer, l’archiver et le télécharger en HTML ou en PDF.</p>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowTemplateForm(false)} className="h-10 rounded px-4 text-sm font-semibold text-[var(--text-secondary)]">Annuler</button><button disabled={createTemplate.isPending || !enabled || newTemplateBody.trim().length < 3} className="h-10 rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white disabled:opacity-50">{createTemplate.isPending ? 'Création…' : 'Créer le modèle'}</button></div>
          </form>}
        </div>
      </div>}
      {versionHistoryDocumentId && <div role="presentation" className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setVersionHistoryDocumentId(undefined); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="document-version-title" className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded bg-[var(--bg-primary)] p-6 shadow-2xl ring-1 ring-[var(--border-color)]">
          <div className="flex items-start justify-between gap-4"><div><h2 id="document-version-title" className="text-xl font-bold text-[var(--text-primary)]">Historique des fichiers</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Chaque téléversement conserve une version distincte et son empreinte.</p></div><button aria-label="Fermer" onClick={() => setVersionHistoryDocumentId(undefined)} className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"><X size={19} /></button></div>
          {versions.isLoading ? <LoadingState /> : versions.isError ? <ErrorState message={versions.error.message} /> : versions.data?.length ? <div className="mt-5 divide-y divide-[var(--border-color)] rounded border border-[var(--border-color)]">{versions.data.map((version) => {
            let fileName = `Document v${version.version}`;
            try { const snapshot = JSON.parse(version.snapshotJson ?? '{}') as { fileName?: unknown }; if (typeof snapshot.fileName === 'string') fileName = snapshot.fileName; } catch { /* keep fallback */ }
            return <div key={version.id} className="flex flex-wrap items-center justify-between gap-3 p-3"><div className="min-w-0"><div className="text-sm font-semibold text-[var(--text-primary)]">Version {version.version} · {fileName}</div><div className="mt-1 break-all text-xs text-[var(--text-muted)]">{version.mimeType || 'Fichier'} · SHA-256 {version.sha256 || 'indisponible'}</div><time className="mt-1 block text-xs text-[var(--text-muted)]">{new Date(version.createdAt).toLocaleString('fr-FR')}</time></div><button onClick={() => void downloadDocumentVersion(versionHistoryDocumentId, version.id)} className="inline-flex h-9 items-center gap-2 rounded border border-[var(--border-color)] px-3 text-xs font-semibold text-[var(--text-primary)]"><Download size={14} />Télécharger</button></div>;
          })}</div> : <div className="mt-5 rounded border border-dashed border-[var(--border-color)] p-5 text-sm text-[var(--text-muted)]">Aucune version stockée pour ce document.</div>}
        </div>
      </div>}
      {editingTemplate && <div role="presentation" className="fixed inset-0 z-[110] flex justify-end bg-slate-950/55" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditingTemplate(undefined); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="edit-template-title" className="form-drawer-enter h-full max-h-screen w-full max-w-6xl overflow-y-auto border-l border-[var(--border-color)] bg-[var(--bg-primary)] p-5 shadow-2xl md:p-6">
          <div className="flex items-start justify-between gap-4"><div><h2 id="edit-template-title" className="text-xl font-bold text-[var(--text-primary)]">Modifier le modèle</h2><p className="mt-1 text-sm text-[var(--text-secondary)]">Chaque enregistrement crée une nouvelle version et conserve les précédentes.</p></div><button aria-label="Fermer" onClick={() => setEditingTemplate(undefined)} className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"><X size={19} /></button></div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><FormField label="Nom"><input value={editingTemplate.name} onChange={(event) => setEditingTemplate({ ...editingTemplate, name: event.target.value })} maxLength={180} className={fieldClass} /></FormField><FormField label="Type de document"><select value={editingTemplate.documentType} onChange={(event) => setEditingTemplate({ ...editingTemplate, documentType: event.target.value })} className={fieldClass}>{!TEMPLATE_DOCUMENT_TYPES.some((type) => type.value === editingTemplate.documentType) && <option value={editingTemplate.documentType}>{editingTemplate.documentType}</option>}{TEMPLATE_DOCUMENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></FormField></div>
          <VisualTemplateEditor config={visualTemplate} onChange={setVisualTemplate} content={templateBody} onContentChange={setTemplateBody} companyName={company?.name || 'Votre entreprise'} companyAddress={[company?.city, company?.country].filter(Boolean).join(', ')} companyLogo={company?.logoUrl ?? undefined} documentType={editingTemplate.documentType || 'autre'} documentName={editingTemplate.name || 'Nom du document'} language={language} />
          <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={() => downloadEditableTemplate(editingTemplate.name, templateBody, visualTemplate, editingTemplate.documentType, language)} className="inline-flex h-10 items-center gap-2 rounded border border-[var(--border-color)] px-4 text-sm font-semibold text-[var(--text-primary)]"><Download size={15} />Télécharger HTML</button><button type="button" onClick={() => void downloadPdf(editingTemplate.name, templateBody, visualTemplate, editingTemplate.documentType)} className="inline-flex h-10 items-center gap-2 rounded border border-[var(--border-color)] px-4 text-sm font-semibold text-[var(--text-primary)]"><FileText size={15} />Télécharger PDF</button><button type="button" onClick={() => setEditingTemplate(undefined)} className="h-10 rounded px-4 text-sm font-semibold text-[var(--text-secondary)]">Annuler</button><button type="button" disabled={!canManageDocuments || !editingTemplate.name.trim() || !editingTemplate.documentType.trim() || updateTemplate.isPending} onClick={saveTemplateEdit} className="h-10 rounded bg-[var(--accent-primary)] px-4 text-sm font-semibold text-white disabled:opacity-45">Enregistrer une nouvelle version</button></div>
        </div>
      </div>}
    </div>
  );
}

function VisualTemplateEditor({ config, onChange, content, onContentChange, companyName, companyAddress, companyLogo, documentType, documentName, language }: {
  config: VisualTemplateConfig;
  onChange: (config: VisualTemplateConfig) => void;
  content: string;
  onContentChange: (content: string) => void;
  companyName: string;
  companyAddress: string;
  companyLogo?: string;
  documentType: string;
  documentName: string;
  language: 'fr' | 'en' | 'es';
}) {
  const previewLines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).slice(0, 6);
  const headingStyle = config.style === 'corporate' ? 'uppercase tracking-wide' : config.style === 'minimal' ? 'font-normal' : 'font-semibold';
  const layoutKind = getTemplateDocumentLayout(documentType);
  const signatureAlignment = language === 'fr' ? 'right' : 'left';
  const companyHeaderRows = [
    config.headerFields.companyAddress || companyAddress,
    [config.headerFields.companyPhone, config.headerFields.companyEmail].filter(Boolean).join(' · '),
    [config.headerFields.companyRccm && `RCCM ${config.headerFields.companyRccm}`, config.headerFields.companyNiu && `NIU ${config.headerFields.companyNiu}`].filter(Boolean).join(' · '),
    [config.headerFields.companyBank && `Compte bancaire ${config.headerFields.companyBank}`, config.headerFields.companyRib && `RIB ${config.headerFields.companyRib}`].filter(Boolean).join(' · '),
  ].filter(Boolean);
  const headerField = (key: keyof TemplateHeaderFields, label: string) => <label key={key} className="block text-[11px] font-medium text-[var(--text-secondary)]">{label}<input value={config.headerFields[key]} onChange={(event) => onChange({ ...config, headerFields: { ...config.headerFields, [key]: event.target.value } })} className="mt-1 h-8 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]" /></label>;
  const footerField = (key: keyof TemplateFooterFields, label: string) => <label key={key} className="block text-[11px] font-medium text-[var(--text-secondary)]">{label}<input value={config.footerFields[key]} onChange={(event) => onChange({ ...config, footerFields: { ...config.footerFields, [key]: event.target.value } })} className="mt-1 h-8 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 text-xs text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]" /></label>;
  return <section className="overflow-hidden rounded border border-[var(--border-color)] bg-[var(--bg-secondary)]/30">
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-color)] px-4 py-3"><div><h3 className="text-sm font-semibold text-[var(--text-primary)]">Document Brand Studio</h3><p className="mt-0.5 text-xs text-[var(--text-muted)]">Personnalisation et aperçu en direct</p></div><span className="rounded-full bg-[var(--bg-secondary)] px-2.5 py-1 text-[10px] font-medium text-[var(--text-muted)]">Aperçu</span></header>
    <div className="grid gap-4 p-4 xl:grid-cols-[minmax(300px,0.85fr)_minmax(0,1.4fr)]">
      <div className="space-y-4">
        <fieldset><legend className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">Style de document</legend><div className="flex flex-wrap gap-x-4 gap-y-2">{([['corporate', 'Corporate'], ['modern', 'Modern'], ['minimal', 'Minimal']] as const).map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-primary)]"><input type="radio" name="template-visual-style" value={value} checked={config.style === value} onChange={() => onChange({ ...config, style: value })} className="accent-[var(--accent-primary)]" />{label}</label>)}</div></fieldset>
        <fieldset><legend className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">Couleur principale</legend><div className="flex gap-2">{VISUAL_TEMPLATE_COLORS.map((color) => <button key={color} type="button" aria-label={`Choisir la couleur ${color}`} aria-pressed={config.primaryColor === color} onClick={() => onChange({ ...config, primaryColor: color })} className={`grid size-9 place-items-center rounded border-2 bg-white ${config.primaryColor === color ? 'border-[var(--text-primary)]' : 'border-transparent'}`}><span className="size-6 rounded" style={{ backgroundColor: color }} /></button>)}</div></fieldset>
        <div className="flex flex-wrap gap-x-4 gap-y-2">{([['showLogo', 'Logo'], ['showFooter', 'Pied de page'], ['showQr', 'QR de vérification']] as const).map(([key, label]) => <label key={key} className="flex cursor-pointer items-center gap-1.5 text-xs text-[var(--text-primary)]"><input type="checkbox" checked={config[key]} onChange={(event) => onChange({ ...config, [key]: event.target.checked })} className="size-3.5 accent-[var(--accent-primary)]" />{label}</label>)}</div>
        <details open className="rounded border border-[var(--border-color)] p-3"><summary className="cursor-pointer text-xs font-semibold text-[var(--text-primary)]">Champs du papier à en-tête</summary><div className="mt-3 space-y-3"><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Document</p><div className="grid grid-cols-2 gap-2">{headerField('documentNumber', 'Numéro')}{headerField('documentDate', 'Date')}{headerField('clientReference', 'Référence client')}</div></div><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Entreprise émettrice</p><div className="space-y-2"><div className="grid grid-cols-2 gap-2">{headerField('companyName', 'Nom')}</div>{headerField('companyAddress', 'Adresse')}<div className="grid grid-cols-2 gap-2">{headerField('companyPhone', 'Téléphone')}{headerField('companyEmail', 'E-mail')}</div><div className="grid grid-cols-2 gap-2">{headerField('companyRccm', 'RCCM')}{headerField('companyNiu', 'NIU')}</div><div className="grid grid-cols-2 gap-2">{headerField('companyBank', 'Compte bancaire')}{headerField('companyRib', 'RIB')}</div></div></div><div><p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">Client / destinataire</p><div className="grid grid-cols-2 gap-2">{headerField('recipientName', 'Nom')}{headerField('recipientAddress', 'Adresse')}{headerField('recipientPhone', 'Téléphone')}{headerField('recipientEmail', 'E-mail')}{headerField('recipientRccm', 'RCCM')}{headerField('recipientNiu', 'NIU')}</div></div></div></details>
        <details open className="rounded border border-[var(--border-color)] p-3"><summary className="cursor-pointer text-xs font-semibold text-[var(--text-primary)]">Champs du pied de page</summary><div className="mt-3 grid grid-cols-2 gap-2">{footerField('bankDetails', 'Coordonnées bancaires / RIB')}{footerField('capital', 'Capital social')}{footerField('customNote', 'Note et modalités de paiement')}{footerField('legalNotice', 'Mentions légales et fiscales')}</div></details>
        <label htmlFor="visual-template-content" className="block text-xs font-semibold text-[var(--text-secondary)]">Contenu modifiable</label>
        <textarea id="visual-template-content" required minLength={3} maxLength={20000} rows={7} value={content} onChange={(event) => onContentChange(event.target.value)} className="-mt-3 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] p-3 text-xs leading-5 text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]" placeholder="Décrivez les clauses ou le contenu de ce modèle…" />
        <p className="-mt-2 text-[11px] text-[var(--text-muted)]">Utilisez des champs comme {'{{NOM_CLIENT}}'}, {'{{DATE}}'} ou {'{{MONTANT}}'}.</p>
      </div>
      <div className="min-w-0">
        <div className="rounded-lg bg-slate-200/70 p-2 sm:p-3" aria-live="polite" aria-label="Aperçu actualisé en direct">
          <article className={`mx-auto flex min-h-[390px] max-w-[520px] flex-col bg-white p-4 text-slate-800 shadow-sm sm:min-h-[450px] sm:p-5 ${config.style === 'corporate' ? 'rounded-sm' : config.style === 'minimal' ? 'rounded-none' : 'rounded-md'}`}>
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex min-w-0 items-center gap-2">
                {config.showLogo && (companyLogo ? <Image src={companyLogo} alt="Logo entreprise" width={28} height={28} unoptimized className="size-7 shrink-0 rounded object-contain" /> : <span className="grid size-7 shrink-0 place-items-center rounded text-white" style={{ backgroundColor: config.primaryColor }}><Building2 size={15} /></span>)}
                <div className="min-w-0"><div className={`truncate text-[10px] text-slate-800 sm:text-xs ${headingStyle}`}>{config.headerFields.companyName || companyName}</div><div className="mt-0.5 space-y-0.5 text-[8px] leading-3 text-slate-500">{companyHeaderRows.length ? companyHeaderRows.map((line, index) => <div key={`${index}-${line}`} className="break-words">{line}</div>) : <div>Adresse de l’entreprise</div>}</div></div>
              </div>
              <div className="text-right"><div className={`max-w-36 truncate text-[10px] text-slate-800 sm:text-xs ${headingStyle}`}>{documentName}</div><div className="mt-0.5 text-[8px] text-slate-500">{getTemplateDocumentLabel(documentType)} · Aperçu</div><div className="mt-0.5 text-[8px] font-medium text-slate-700">{config.headerFields.documentNumber || '{{NUMERO_DOCUMENT}}'}</div></div>
            </div>
            <div className={`mt-4 grid gap-2 text-[8px] ${layoutKind === 'contract' ? 'grid-cols-2' : 'grid-cols-[1fr_auto]'}`}>
              <div className="rounded border border-slate-100 bg-slate-50 p-2"><div className="mb-1 text-[7px] font-medium uppercase text-slate-500">{layoutKind === 'contract' ? 'Partie émettrice' : 'Client / destinataire'}</div><div className="font-medium text-slate-800">{config.headerFields.recipientName || '{{NOM_CLIENT}}'}</div><div className="text-slate-500">{config.headerFields.recipientAddress || '{{ADRESSE_CLIENT}}'}</div><div className="text-slate-500">{[config.headerFields.recipientPhone, config.headerFields.recipientEmail, config.headerFields.recipientRccm && `RCCM ${config.headerFields.recipientRccm}`, config.headerFields.recipientNiu && `NIU ${config.headerFields.recipientNiu}`].filter(Boolean).join(' · ')}</div></div>
              {layoutKind === 'contract' && <div className="rounded border border-slate-100 p-2"><div className="mb-1 text-[7px] font-medium uppercase text-slate-500">Partie contractante</div><div className="font-medium text-slate-800">{config.headerFields.companyName || companyName}</div><div className="text-slate-500">{config.headerFields.companyAddress || companyAddress}</div></div>}
              <div className="text-right"><div className="mb-1 text-[7px] font-medium uppercase text-slate-500">{layoutKind === 'financial' ? 'Date d’émission' : 'Date'}</div><div className="text-slate-800">{config.headerFields.documentDate || '{{DATE}}'}</div><div className="mt-1 text-slate-500">{config.headerFields.clientReference || '{{REFERENCE_CLIENT}}'}</div></div>
            </div>
            <div className="mt-3 overflow-hidden rounded-sm border border-slate-100">
              <div className="flex justify-between px-2 py-1.5 text-[7px] font-semibold uppercase text-white" style={{ backgroundColor: config.style === 'minimal' ? '#f1f5f9' : config.primaryColor, color: config.style === 'minimal' ? '#334155' : '#ffffff' }}><span>{layoutKind === 'financial' ? 'Désignation' : layoutKind === 'logistics' ? 'Articles / livrables' : layoutKind === 'contract' ? 'Clauses contractuelles' : 'Sections'}</span><span>{layoutKind === 'financial' ? 'Montant' : layoutKind === 'logistics' ? 'Quantité / état' : layoutKind === 'contract' ? 'Référence' : 'Contenu'}</span></div>
              {(previewLines.length ? previewLines : ['Votre texte apparaîtra ici dans le document.']).map((line, index) => <div key={`${index}-${line}`} className={`grid grid-cols-[1fr_auto] gap-2 px-2 py-2 text-[8px] ${index % 2 === 0 ? 'bg-slate-50' : 'bg-white'}`}><span className="line-clamp-2 whitespace-pre-wrap">{line}</span><span className="text-right text-slate-500">{layoutKind === 'financial' ? '{{MONTANT}}' : layoutKind === 'logistics' ? 'À compléter' : layoutKind === 'contract' ? 'Article ' + (index + 1) : ' '}</span></div>)}
            </div>
            {layoutKind === 'financial' && <div className="ml-auto mt-3 w-2/3 rounded bg-slate-100 p-2 text-right"><div className="text-[7px] uppercase text-slate-500">Total TTC</div><div className="text-xs font-semibold" style={{ color: config.primaryColor }}>{'{{MONTANT_TTC}}'}</div></div>}
            {layoutKind === 'logistics' && <div className="mt-3 flex justify-between rounded border border-dashed border-slate-300 p-2 text-[7px] text-slate-500"><span>Réception / livraison : {'{{DATE_LIVRAISON}}'}</span><span>État : À compléter</span></div>}
            <div className="mt-auto pt-4">
              {layoutKind === 'contract' ? <div className={`flex border-t border-slate-200 pt-3 ${signatureAlignment === 'right' ? 'justify-end' : 'justify-start'}`}><div className="grid grid-cols-2 gap-5 text-[7px] text-slate-500"><div><div>Signature du client</div><div className="mt-6 border-b border-slate-300" /></div><div><div>Signature de l’entreprise</div><div className="mt-6 border-b border-slate-300" /></div></div></div> : <div className={`flex items-end border-t border-slate-200 pt-3 ${signatureAlignment === 'right' ? 'justify-between' : 'justify-between flex-row-reverse'}`}><div className={signatureAlignment === 'right' ? 'text-right' : 'text-left'}><div className="text-[7px] font-medium uppercase text-slate-500">{layoutKind === 'logistics' ? 'Réception autorisée' : 'Signature autorisée'}</div><div className={`mt-5 w-24 border-b border-slate-300 ${signatureAlignment === 'right' ? 'ml-auto' : ''}`} /></div>{config.showQr && <div className="flex flex-col items-center text-slate-500"><QrCode size={25} style={{ color: config.primaryColor }} /><span className="text-[7px]">Vérifier</span></div>}</div>}
              {config.showFooter && <div className="mt-3 space-y-1 border-t border-slate-200 pt-2 text-center text-[7px] text-slate-500"><div>{[config.footerFields.bankDetails || config.headerFields.companyBank, config.footerFields.capital].filter(Boolean).join(' · ') || [config.headerFields.companyName || companyName, config.headerFields.companyAddress || companyAddress].filter(Boolean).join(' · ')}</div>{config.footerFields.customNote && <div>{config.footerFields.customNote}</div>}{config.footerFields.legalNotice && <div>{config.footerFields.legalNotice}</div>}</div>}
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>;
}

const fieldClass = 'h-10 w-full rounded border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-primary)]';

function SectionHeading({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start"><div><h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2><p className="mt-1 max-w-3xl text-sm text-[var(--text-secondary)]">{detail}</p></div>{action}</div>;
}

function EmptyState({ icon: Icon, title, detail, action }: { icon: typeof FileText; title: string; detail: string; action?: React.ReactNode }) {
  return <div className="mt-8 flex flex-col items-center rounded border border-dashed border-[var(--border-color)] px-6 py-12 text-center"><div className="grid h-12 w-12 place-items-center rounded-full bg-[var(--bg-secondary)] text-[var(--text-muted)]"><Icon size={21} /></div><h3 className="mt-4 font-semibold text-[var(--text-primary)]">{title}</h3><p className="mt-1 max-w-md text-sm text-[var(--text-secondary)]">{detail}</p>{action}</div>;
}

function LoadingState() { return <div className="mt-6 animate-pulse space-y-3">{[0, 1, 2].map((item) => <div key={item} className="h-14 rounded bg-[var(--bg-secondary)]" />)}</div>; }
function ErrorState({ message }: { message: string }) { return <div role="alert" className="mt-5 rounded border border-red-500/30 bg-red-500/5 p-4 text-sm text-red-700">Impossible de charger ces données : {message}</div>; }
function FormField({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-sm font-semibold text-[var(--text-primary)]">{label}<div className="mt-2">{children}</div></label>; }

function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = { draft: 'bg-slate-500/10 text-slate-600', review: 'bg-amber-500/10 text-amber-700', approved: 'bg-blue-500/10 text-blue-700', finalized: 'bg-emerald-500/10 text-emerald-700', active: 'bg-emerald-500/10 text-emerald-700', archived: 'bg-slate-500/10 text-slate-600' };
  return <span className={`inline-flex rounded px-2 py-1 text-xs font-semibold ${colors[status] ?? 'bg-slate-500/10 text-slate-600'}`}>{statusLabel[status] ?? status}</span>;
}

function ServiceNotice({ title, detail }: { title: string; detail: string }) {
  return <div className="mt-5 flex gap-3 rounded border border-amber-500/30 bg-amber-500/5 p-4"><LockKeyhole size={18} className="mt-0.5 shrink-0 text-amber-700" /><div><div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div><p className="mt-1 text-sm text-[var(--text-secondary)]">{detail}</p></div></div>;
}

function ServiceCard({ icon: Icon, title, ready, detail }: { icon: typeof FileText; title: string; ready: boolean; detail: string }) {
  return <div className="rounded border border-[var(--border-color)] p-4"><div className="flex items-center justify-between"><div className="grid h-9 w-9 place-items-center rounded bg-[var(--bg-secondary)] text-[var(--accent-primary)]"><Icon size={17} /></div><span className={`rounded px-2 py-1 text-xs font-semibold ${ready ? 'bg-emerald-500/10 text-emerald-700' : 'bg-slate-500/10 text-slate-600'}`}>{ready ? 'Configuré' : 'À configurer'}</span></div><div className="mt-4 font-semibold text-[var(--text-primary)]">{title}</div><p className="mt-1 text-sm text-[var(--text-secondary)]">{detail}</p></div>;
}




