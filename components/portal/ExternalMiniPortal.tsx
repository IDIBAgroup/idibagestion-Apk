'use client';

import { useMemo, useState } from 'react';
import { Building2, Check, ChevronDown, FileText, LockKeyhole, LogOut, MessageSquareText } from 'lucide-react';
import type { PortalUser } from '@/types';
import { getAll, addAndNotify, updateAndNotify } from '@/lib/db';
import { getPortalContracts, getPortalInvoices, getPortalProjects, logPortalActivity } from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';

type Props = {
  user: PortalUser;
  onLogout: () => void;
};

type SharedDocument = {
  id: string;
  number?: string;
  title: string;
  kind: string;
  status: string;
  amount?: number;
  issueDate?: string;
  dueDate?: string;
  source: 'quote' | 'portal';
};

const normalize = (value?: string) => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLocaleLowerCase('fr');

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function formatMoney(value?: number) {
  return `${(value || 0).toLocaleString('fr-FR')} FCFA`;
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    sent: 'À valider', accepted: 'Validé', counter_proposal: 'Modification demandée', rejected: 'Refusé',
    paid: 'Payée', delivered: 'Terminé', in_progress: 'En cours', active: 'Actif', pending: 'En attente',
  };
  return labels[status] || 'Partagé';
}

export function ExternalMiniPortal({ user, onLogout }: Props) {
  const { showToast } = useUIStore();
  const [refreshKey, setRefreshKey] = useState(0);
  const [requestText, setRequestText] = useState('');
  const [requestDocument, setRequestDocument] = useState<SharedDocument | null>(null);

  const documents = useMemo<SharedDocument[]>(() => {
    if (user.portalType === 'client') {
      const email = normalize(user.email);
      const companyNames = new Set([normalize(user.companyName), normalize(user.linkedInternalName)].filter(Boolean));
      const quotes = (getAll('quotes') as any[]).filter((quote) =>
        normalize(quote.clientEmail) === email || companyNames.has(normalize(quote.clientName))
      ).map((quote) => ({
        id: quote.id,
        number: quote.number,
        title: quote.title || quote.object || quote.items?.[0]?.description || 'Devis de prestation',
        kind: 'Devis',
        status: quote.status || 'sent',
        amount: quote.total ?? quote.amount,
        issueDate: quote.date || quote.createdAt,
        dueDate: quote.expiryDate,
        source: 'quote' as const,
      }));
      return quotes.sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
    }

    const projects = getPortalProjects(user.id).map((project) => ({
      id: project.id,
      title: project.title,
      kind: 'Bon de commande',
      status: project.status,
      amount: project.budget,
      issueDate: project.startDate || project.createdAt,
      dueDate: project.endDate,
      source: 'portal' as const,
    }));
    const invoices = getPortalInvoices(user.id).map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      title: 'Facture fournisseur',
      kind: 'Facture',
      status: invoice.status,
      amount: invoice.total,
      issueDate: invoice.createdAt,
      dueDate: invoice.dueDate,
      source: 'portal' as const,
    }));
    const contracts = getPortalContracts(user.id).map((contract) => ({
      id: contract.id,
      title: contract.title,
      kind: 'Contrat',
      status: contract.status,
      amount: contract.value,
      issueDate: contract.startDate,
      dueDate: contract.endDate,
      source: 'portal' as const,
    }));
    return [...projects, ...invoices, ...contracts].sort((a, b) => (b.issueDate || '').localeCompare(a.issueDate || ''));
  }, [user, refreshKey]);

  const acceptQuote = (document: SharedDocument) => {
    updateAndNotify('quotes', document.id, { status: 'accepted' });
    logPortalActivity(user.id, 'client', 'comment', `Devis ${document.number || document.title} validé depuis le mini-portail`);
    setRefreshKey((key) => key + 1);
    showToast('Devis validé. Votre entreprise a bien reçu votre réponse.', 'success');
  };

  const acknowledgeOrder = (document: SharedDocument) => {
    updateAndNotify('portalProjects', document.id, { status: 'in_progress', updatedAt: new Date().toISOString() });
    logPortalActivity(user.id, 'vendor', 'comment', `Commande ${document.title} prise en charge`);
    setRefreshKey((key) => key + 1);
    showToast('La prise en charge de la commande a été confirmée.', 'success');
  };

  const submitChangeRequest = () => {
    if (!requestDocument || !requestText.trim()) return;
    const now = new Date().toISOString();
    addAndNotify('portalTickets', {
      id: `pticket-${Date.now()}`,
      portalUserId: user.id,
      portalUserName: `${user.displayName} (${user.companyName})`,
      portalType: user.portalType,
      subject: `Demande de modification — ${requestDocument.number || requestDocument.title}`,
      description: requestText.trim(),
      status: 'open',
      priority: 'medium',
      responses: [],
      relatedDocumentId: requestDocument.id,
      companyId: user.companyId,
      createdAt: now,
      updatedAt: now,
    });
    if (requestDocument.source === 'quote') {
      updateAndNotify('quotes', requestDocument.id, { status: 'counter_proposal', counterNote: requestText.trim() });
      logPortalActivity(user.id, 'client', 'comment', `Modification demandée pour le devis ${requestDocument.number || requestDocument.title}`);
    }
    setRequestDocument(null);
    setRequestText('');
    setRefreshKey((key) => key + 1);
    showToast('Votre demande a été transmise à l’entreprise.', 'success');
  };

  return (
    <main className="min-h-screen bg-[#f6f8f7] px-4 py-8 text-[#10212c] sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-3xl">
        <header className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-[#e0e6e3] bg-white p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#073c60] text-white"><Building2 size={20} /></div>
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold">{user.companyName}</h1>
              <p className="text-sm text-[#64737c]">Portail documentaire sécurisé</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-[#eff2f3] px-3 py-1 text-xs font-medium text-[#44525a]">Invité</span>
            <button onClick={onLogout} aria-label="Se déconnecter" title="Se déconnecter" className="rounded-lg p-2 text-[#64737c] transition hover:bg-[#f1f4f2] hover:text-[#10212c]"><LogOut size={17} /></button>
          </div>
        </header>

        <section aria-labelledby="shared-documents-title">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="shared-documents-title" className="text-xl font-semibold">Documents partagés</h2>
              <p className="mt-1 text-sm text-[#64737c]">Consultez les documents qui vous sont destinés.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs text-[#64737c]">{documents.length} document{documents.length > 1 ? 's' : ''}</span>
          </div>

          {documents.length ? <div className="space-y-3">{documents.map((document) => {
            const isQuote = document.source === 'quote';
            const canAccept = isQuote && document.status !== 'accepted' && document.status !== 'rejected';
            return <article key={`${document.source}-${document.id}`} className="rounded-xl border border-[#dce3e0] bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 border-b border-[#edf0ee] pb-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#073c60] text-white"><FileText size={16} /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-[#65737b]">{document.kind}{document.number ? ` N° ${document.number}` : ''}</p>
                    <h3 className="mt-1 text-base font-semibold">{document.title}</h3>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${document.status === 'accepted' || document.status === 'paid' || document.status === 'delivered' ? 'bg-[#e8f5ef] text-[#1e7654]' : 'bg-[#fff0e8] text-[#b34d1c]'}`}>{getStatusLabel(document.status)}</span>
              </div>
              {document.amount !== undefined && <div className="flex items-center justify-between gap-3 px-1 py-4">
                <span className="text-sm text-[#65737b]">Montant TTC</span>
                <strong className="text-lg font-semibold tabular-nums">{formatMoney(document.amount)}</strong>
              </div>}
              <dl className="space-y-2 border-t border-[#edf0ee] px-1 py-4 text-sm">
                <div className="flex items-center justify-between gap-4"><dt className="text-[#65737b]">Date d’émission</dt><dd>{formatDate(document.issueDate)}</dd></div>
                {document.dueDate && <div className="flex items-center justify-between gap-4"><dt className="text-[#65737b]">Échéance / validité</dt><dd>{formatDate(document.dueDate)}</dd></div>}
              </dl>
              <div className="grid gap-2 sm:grid-cols-2">
                {canAccept && <button onClick={() => acceptQuote(document)} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#111] px-4 text-sm font-semibold text-white transition hover:bg-[#2c3438]"><Check size={16} />Valider le devis</button>}
                {user.portalType === 'vendor' && document.kind === 'Bon de commande' && document.status === 'pending' && <button onClick={() => acknowledgeOrder(document)} className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#111] px-4 text-sm font-semibold text-white transition hover:bg-[#2c3438]"><Check size={16} />Confirmer la commande</button>}
                <button onClick={() => setRequestDocument(document)} className={`flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#d6ddda] px-4 text-sm font-semibold text-[#536169] transition hover:bg-[#f7f9f8] ${canAccept || (user.portalType === 'vendor' && document.kind === 'Bon de commande' && document.status === 'pending') ? '' : 'sm:col-span-2'}`}><MessageSquareText size={15} />Demander une modification</button>
              </div>
            </article>;
          })}</div> : <div className="rounded-xl border border-dashed border-[#d6ddda] bg-white px-5 py-12 text-center">
            <FileText size={25} className="mx-auto text-[#829097]" />
            <h3 className="mt-3 font-semibold">Aucun document partagé</h3>
            <p className="mx-auto mt-1 max-w-sm text-sm text-[#64737c]">Les documents qui vous seront adressés apparaîtront ici.</p>
          </div>}
        </section>

        <footer className="mt-5 flex items-center justify-center gap-2 text-sm text-[#64737c]"><LockKeyhole size={13} />Accès limité aux documents partagés</footer>
      </div>

      {requestDocument && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setRequestDocument(null); setRequestText(''); } }}>
        <section role="dialog" aria-modal="true" aria-labelledby="change-request-title" className="w-full max-w-lg rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-xl sm:p-6">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h2 id="change-request-title" className="text-lg font-semibold">Demander une modification</h2><p className="mt-1 text-sm text-[#64737c]">{requestDocument.number || requestDocument.title}</p></div><button onClick={() => { setRequestDocument(null); setRequestText(''); }} className="rounded-lg p-2 text-[#64737c] hover:bg-[#f1f4f2]" aria-label="Fermer"><ChevronDown size={18} /></button></div>
          <label htmlFor="portal-change-request" className="mb-2 block text-sm font-medium">Décrivez la modification souhaitée</label>
          <textarea id="portal-change-request" autoFocus rows={4} value={requestText} onChange={(event) => setRequestText(event.target.value)} className="w-full resize-y rounded-lg border border-[#d6ddda] p-3 text-sm outline-none focus:border-[#1f7a63]" placeholder="Précisez les éléments à modifier…" />
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => { setRequestDocument(null); setRequestText(''); }} className="min-h-10 rounded-full border border-[#d6ddda] px-5 text-sm font-medium text-[#536169]">Annuler</button><button disabled={!requestText.trim()} onClick={submitChangeRequest} className="min-h-10 rounded-full bg-[#111] px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Envoyer la demande</button></div>
        </section>
      </div>}
    </main>
  );
}
