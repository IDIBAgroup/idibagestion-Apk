'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowDownToLine, ArrowLeft, Check, Eye, FileText, PackageCheck,
  Plus, Printer, Search, ShoppingCart, Trash2, X,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useCollection } from '@/components/clients/shared';
import { useUIStore } from '@/stores/uiStore';
import { useBrandingStore } from '@/stores/brandingStore';
import { translate } from '@/lib/i18n';
import { formatPlatformCurrency, usePlatformFinancialSettings } from '@/hooks/usePlatformFinancialSettings';
import { trpc } from '@/providers/trpc';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import type { Client, DeliveryNote, DeliveryNoteStatus, SalesOrder, SalesOrderStatus } from '@/types';

type DocumentKind = 'orders' | 'deliveries';
type DraftLine = { productId: string; description: string; quantity: number; unitPrice: number };
type DocumentForm = {
  clientId: string;
  clientName: string;
  clientEmail: string;
  date: string;
  deliveryDate: string;
  deliveryAddress: string;
  notes: string;
  orderId: string;
  carrier: string;
  trackingNumber: string;
  items: DraftLine[];
};

const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (): DocumentForm => ({
  clientId: '', clientName: '', clientEmail: '', date: today(), deliveryDate: '', deliveryAddress: '',
  notes: '', orderId: '', carrier: '', trackingNumber: '',
  items: [{ productId: '', description: '', quantity: 1, unitPrice: 0 }],
});

const orderStatuses: Record<SalesOrderStatus, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: '#64748b' },
  confirmed: { label: 'Confirmée', color: '#2563eb' },
  in_progress: { label: 'En préparation', color: '#7c3aed' },
  partially_delivered: { label: 'Partiellement livrée', color: '#d97706' },
  delivered: { label: 'Livrée', color: '#15803d' },
  cancelled: { label: 'Annulée', color: '#dc2626' },
};

const deliveryStatuses: Record<DeliveryNoteStatus, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: '#64748b' },
  prepared: { label: 'Préparé', color: '#7c3aed' },
  shipped: { label: 'Expédié', color: '#2563eb' },
  delivered: { label: 'Livré', color: '#15803d' },
  cancelled: { label: 'Annulé', color: '#dc2626' },
};

export function PurchaseOrdersPage() {
  return <CommercialDocumentsPage kind="orders" />;
}

export function DeliveryNotesPage() {
  return <CommercialDocumentsPage kind="deliveries" />;
}

function CommercialDocumentsPage({ kind }: { kind: DocumentKind }) {
  const router = useRouter();
  const { currency, taxRate, taxConfigured } = usePlatformFinancialSettings();
  const { companyId } = useActiveCompany();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const utils = trpc.useUtils();
  const language = useBrandingStore((state) => state.language);
  const t = (text: string) => translate(text, language);
  const salesDocumentsQuery = trpc.salesDocument.list.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const refreshSalesDocuments = () => utils.salesDocument.list.invalidate({ companyId: companyId ?? 0 });
  const saveSalesDocument = trpc.salesDocument.save.useMutation({
    onSuccess: async (_document, variables) => {
      await refreshSalesDocuments();
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
      showToast(variables.id ? t('Document mis à jour.') : variables.kind === 'order' ? t('Bon de commande créé.') : t('Bon de livraison créé.'), 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const setSalesDocumentStatus = trpc.salesDocument.setStatus.useMutation({
    onSuccess: async () => { await refreshSalesDocuments(); showToast(t('Statut mis à jour.'), 'success'); },
    onError: (error) => showToast(error.message, 'error'),
  });
  const deleteSalesDocument = trpc.salesDocument.delete.useMutation({
    onSuccess: async () => { await refreshSalesDocuments(); setDetail(null); showToast(t('Document supprimé.'), 'success'); },
    onError: (error) => showToast(error.message, 'error'),
  });
  const serverDocuments = salesDocumentsQuery.data ?? [];
  const orders = serverDocuments.filter((doc) => doc.kind === 'order') as unknown as SalesOrder[];
  const deliveries = serverDocuments.filter((doc) => doc.kind === 'delivery') as unknown as DeliveryNote[];
  const clients = useCollection('clients') as Client[];
  const products = useCollection('products') as Array<{ id: string | number; name: string; unitPriceHT?: number; unitPrice?: number; unit?: string }>;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DocumentForm>(emptyForm);
  const [detail, setDetail] = useState<SalesOrder | DeliveryNote | null>(null);

  const isOrder = kind === 'orders';
  const title = isOrder ? 'Bons de commande' : 'Bons de livraison';
  const collection = isOrder ? orders : deliveries;
  const statuses = isOrder ? orderStatuses : deliveryStatuses;
  const documents = useMemo(() => collection.filter((doc) => {
    const matchesSearch = `${doc.number} ${doc.clientName} ${'orderNumber' in doc ? doc.orderNumber || '' : ''}`.toLocaleLowerCase('fr').includes(search.toLocaleLowerCase('fr'));
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [collection, search, statusFilter]);

  useEffect(() => { setCurrentPageTitle(title); }, [setCurrentPageTitle, title]);

  useEffect(() => {
    if (kind !== 'deliveries') return;
    const timer = window.setTimeout(() => {
      const orderId = localStorage.getItem('idibages_pending_delivery_order');
      if (!orderId) return;
      localStorage.removeItem('idibages_pending_delivery_order');
      const order = orders.find((entry) => entry.id === orderId);
      if (!order) return;
      setForm({
        ...emptyForm(), clientId: order.clientId || '', clientName: order.clientName,
        clientEmail: order.clientEmail || '', date: today(), deliveryDate: order.expectedDeliveryDate || '',
        deliveryAddress: order.deliveryAddress || '', orderId: order.id, notes: order.notes || '',
        items: order.items.map((item) => ({ productId: item.productId || '', description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })),
      });
      setEditingId(null);
      setShowForm(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [kind, orders]);

  const formatMoney = (value: number) => formatPlatformCurrency(value, currency);
  const totalAmount = form.items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0), 0);
  const totalTax = totalAmount * taxRate / 100;

  const beginCreate = () => { setEditingId(null); setForm(emptyForm()); setShowForm(true); };
  const beginEdit = (doc: SalesOrder | DeliveryNote) => {
    setEditingId(doc.id);
    setForm({
      ...emptyForm(), clientId: doc.clientId || '', clientName: doc.clientName, clientEmail: doc.clientEmail || '',
      date: doc.date, deliveryDate: isOrder ? (doc as SalesOrder).expectedDeliveryDate || '' : (doc as DeliveryNote).deliveryDate || '',
      deliveryAddress: doc.deliveryAddress || '', notes: doc.notes || '',
      orderId: 'orderId' in doc ? doc.orderId || '' : '',
      carrier: 'carrier' in doc ? doc.carrier || '' : '',
      trackingNumber: 'trackingNumber' in doc ? doc.trackingNumber || '' : '',
      items: doc.items.map((item) => ({ productId: item.productId || '', description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })),
    });
    setShowForm(true);
    setDetail(null);
  };

  const chooseClient = (clientId: string) => {
    const client = clients.find((row) => row.id === clientId);
    setForm((current) => ({
      ...current, clientId, clientName: client?.name || '',
      clientEmail: client?.contactEmail || client?.email || '',
      deliveryAddress: client ? [client.address, client.city, client.country].filter(Boolean).join(', ') : current.deliveryAddress,
    }));
  };

  const chooseOrder = (orderId: string) => {
    const order = orders.find((row) => row.id === orderId);
    if (!order) { setForm((current) => ({ ...current, orderId: '' })); return; }
    setForm((current) => ({
      ...current, orderId: order.id, clientId: order.clientId || '', clientName: order.clientName,
      clientEmail: order.clientEmail || '', deliveryAddress: order.deliveryAddress || current.deliveryAddress,
      items: order.items.map((item) => ({ productId: item.productId || '', description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })),
    }));
  };

  const updateLine = (index: number, patch: Partial<DraftLine>) => setForm((current) => ({
    ...current, items: current.items.map((line, i) => i === index ? { ...line, ...patch } : line),
  }));

  const saveDocument = () => {
    const lines = form.items.filter((line) => line.description.trim() && Number(line.quantity) > 0);
    if (!companyId) {
      showToast(t('Sélectionnez une entreprise active avant d’enregistrer le document.'), 'warning');
      return;
    }
    if (!form.clientName.trim() || lines.length === 0) {
      showToast(t('Indiquez un client et au moins une ligne valide.'), 'warning');
      return;
    }
    saveSalesDocument.mutate({
      companyId,
      kind: isOrder ? 'order' : 'delivery',
      ...(editingId ? { id: editingId } : {}),
      ...(form.clientId ? { clientId: form.clientId } : {}),
      clientName: form.clientName.trim(), clientEmail: form.clientEmail.trim(), date: form.date,
      ...(isOrder && form.deliveryDate ? { expectedDeliveryDate: form.deliveryDate } : {}),
      ...(!isOrder && form.deliveryDate ? { deliveryDate: form.deliveryDate } : {}),
      ...(form.deliveryAddress.trim() ? { deliveryAddress: form.deliveryAddress.trim() } : {}),
      ...(!isOrder && form.orderId ? { orderId: form.orderId } : {}),
      ...(!isOrder && form.carrier.trim() ? { carrier: form.carrier.trim() } : {}),
      ...(!isOrder && form.trackingNumber.trim() ? { trackingNumber: form.trackingNumber.trim() } : {}),
      items: lines.map((line) => ({ ...line, quantity: Number(line.quantity) || 0, unitPrice: Number(line.unitPrice) || 0 })),
      ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    });
  };

  const updateStatus = (doc: SalesOrder | DeliveryNote, nextStatus: string) => {
    if (!companyId) return;
    setSalesDocumentStatus.mutate({ companyId, id: doc.id, kind: isOrder ? 'order' : 'delivery', status: nextStatus });
  };

  const deleteDocument = (doc: SalesOrder | DeliveryNote) => {
    if (!companyId || !window.confirm(`${t('Supprimer le document')} ${doc.number} ?`)) return;
    deleteSalesDocument.mutate({ companyId, id: doc.id, kind: isOrder ? 'order' : 'delivery' });
  };

  const createDeliveryFromOrder = (order: SalesOrder) => {
    localStorage.setItem('idibages_pending_delivery_order', order.id);
    router.push('/commercial/delivery-notes');
  };

  const exportCsv = () => {
    const rows = isOrder ? orders : deliveries;
    const header = isOrder ? ['Numéro', 'Client', 'Date', 'Livraison prévue', 'Statut', 'Total'] : ['Numéro', 'Commande', 'Client', 'Date', 'Livraison', 'Statut'];
    const values = rows.map((doc) => isOrder
      ? [(doc as SalesOrder).number, doc.clientName, doc.date, (doc as SalesOrder).expectedDeliveryDate || '', statuses[doc.status as keyof typeof statuses].label, String((doc as SalesOrder).total)]
      : [(doc as DeliveryNote).number, (doc as DeliveryNote).orderNumber || '', doc.clientName, doc.date, (doc as DeliveryNote).deliveryDate || '', statuses[doc.status as keyof typeof statuses].label]);
    const csv = [header, ...values].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${isOrder ? 'bons-de-commande' : 'bons-de-livraison'}.csv`; anchor.click(); URL.revokeObjectURL(url);
    showToast(t('Export CSV téléchargé.'), 'success');
  };

  const statusCounts = Object.keys(statuses).map((status) => ({
    status, label: statuses[status as keyof typeof statuses].label,
    count: collection.filter((doc) => doc.status === status).length,
  }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">{t(title)}</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {isOrder ? t('Créez et suivez les commandes de vos clients.') : t('Préparez les expéditions et suivez les livraisons liées aux commandes.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className="btn-secondary h-9 gap-2"><ArrowDownToLine size={15} /> CSV</button>
          <button type="button" onClick={beginCreate} className="btn-primary h-9 gap-2"><Plus size={16} /> {t(isOrder ? 'Nouveau bon de commande' : 'Nouveau bon de livraison')}</button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('Rechercher par numéro ou client')} className="glass-input h-10 w-full pl-9 pr-3 text-sm" />
        </div>
        <label className="sr-only" htmlFor="commercial-document-status-filter">{t('Filtrer par statut')}</label>
        <select id="commercial-document-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="glass-input h-10 min-w-[190px] px-3 text-sm">
          <option value="all">{t('Tous')} ({collection.length})</option>
          {statusCounts.map((entry) => <option key={entry.status} value={entry.status}>{t(entry.label)} ({entry.count})</option>)}
        </select>
      </div>

      <GlassCard hover={false}>
        {salesDocumentsQuery.isLoading ? (
          <div className="flex min-h-56 items-center justify-center text-sm text-[var(--text-muted)]">{t('Chargement des documents…')}</div>
        ) : salesDocumentsQuery.isError ? (
          <div role="alert" className="flex min-h-56 flex-col items-center justify-center px-5 text-center"><p className="font-semibold text-[var(--accent-danger)]">{t('Impossible de charger les documents.')}</p><button type="button" onClick={() => salesDocumentsQuery.refetch()} className="btn-secondary mt-3 h-9 px-4">{t('Réessayer')}</button></div>
        ) : documents.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-5 text-center">
            {isOrder ? <ShoppingCart size={28} className="mb-3 text-[var(--accent-primary)]" /> : <PackageCheck size={28} className="mb-3 text-[var(--accent-primary)]" />}
            <p className="font-semibold text-[var(--text-primary)]">{t(search || statusFilter !== 'all' ? 'Aucun document ne correspond à votre recherche.' : 'Aucun document pour le moment.')}</p>
            <p className="mt-1 max-w-md text-sm text-[var(--text-muted)]">{t(isOrder ? 'Créez un bon de commande pour démarrer le suivi commercial.' : 'Créez un bon de livraison ou générez-le depuis une commande confirmée.')}</p>
            {!search && statusFilter === 'all' && <button type="button" onClick={beginCreate} className="btn-primary mt-4 h-9 gap-2"><Plus size={15} /> {t('Créer un document')}</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead><tr className="border-b border-[var(--divider)] text-left text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-4 py-3">{t('Numéro')}</th><th className="px-4 py-3">{t(isOrder ? 'Client' : 'Client / commande')}</th><th className="px-4 py-3">{t('Date')}</th><th className="px-4 py-3">{t(isOrder ? 'Livraison prévue' : 'Date de livraison')}</th><th className="px-4 py-3 text-right">{isOrder ? t('Total TTC') : t('Lignes')}</th><th className="px-4 py-3">{t('Statut')}</th><th className="px-4 py-3 text-right">{t('Actions')}</th>
              </tr></thead>
              <tbody>{documents.map((doc) => {
                const status = statuses[doc.status as keyof typeof statuses];
                const note = doc as DeliveryNote;
                const allowedStatusOptions = isOrder
                  ? (doc.status === 'draft' ? ['draft', 'confirmed', 'cancelled'] : doc.status === 'confirmed' ? ['confirmed', 'cancelled'] : [doc.status])
                  : (doc.status === 'draft' ? ['draft', 'prepared', 'cancelled'] : doc.status === 'prepared' ? ['prepared', 'shipped', 'cancelled'] : doc.status === 'shipped' ? ['shipped', 'delivered', 'cancelled'] : [doc.status]);
                return <tr key={doc.id} className="border-b border-[var(--divider)]/60 last:border-0 hover:bg-[var(--bg-elevated)]/40">
                  <td className="px-4 py-3"><span className="text-sm font-medium text-[var(--text-primary)]">{doc.number}</span></td>
                  <td className="px-4 py-3"><p className="font-medium text-[var(--text-primary)]">{doc.clientName}</p>{!isOrder && note.orderNumber && <p className="text-xs text-[var(--text-muted)]">{t('Commande')} {note.orderNumber}</p>}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{new Date(`${doc.date}T00:00:00`).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{((doc as SalesOrder).expectedDeliveryDate || note.deliveryDate) ? new Date(`${((doc as SalesOrder).expectedDeliveryDate || note.deliveryDate)}T00:00:00`).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-[var(--text-primary)]">{isOrder ? formatMoney((doc as SalesOrder).total) : `${doc.items.length} ${t('ligne(s)')}`}</td>
                  <td className="px-4 py-3"><select aria-label={`${t('Statut')} ${doc.number}`} value={doc.status} disabled={setSalesDocumentStatus.isPending} onChange={(event) => updateStatus(doc, event.target.value)} className="max-w-[180px] rounded border-0 px-2 py-1 text-xs font-semibold disabled:opacity-60" style={{ color: status.color, backgroundColor: `${status.color}20` }}>
                    {Object.entries(statuses).filter(([value]) => allowedStatusOptions.includes(value)).map(([value, entry]) => <option key={value} value={value}>{t(entry.label)}</option>)}
                  </select></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <button type="button" title={t('Voir')} onClick={() => setDetail(doc)} className="rounded p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"><Eye size={15} /></button>
                    {isOrder && <button type="button" title={t('Créer un bon de livraison')} onClick={() => createDeliveryFromOrder(doc as SalesOrder)} disabled={doc.status === 'cancelled' || doc.status === 'delivered'} className="rounded p-2 text-[var(--accent-primary)] hover:bg-[var(--bg-elevated)] disabled:opacity-40"><PackageCheck size={15} /></button>}
                    <button type="button" title={t('Modifier')} disabled={doc.status !== 'draft'} onClick={() => beginEdit(doc)} className="rounded p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-30"><FileText size={15} /></button>
                    <button type="button" title={t('Supprimer')} disabled={doc.status !== 'draft' && doc.status !== 'cancelled'} onClick={() => deleteDocument(doc)} className="rounded p-2 text-[var(--accent-danger)] hover:bg-[var(--bg-elevated)] disabled:cursor-not-allowed disabled:opacity-30"><Trash2 size={15} /></button>
                  </div></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <AnimatePresence>
        {showForm && <div className="fixed inset-0 z-[80] flex justify-end bg-black/50 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
          <motion.section initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full max-h-screen w-full max-w-xl overflow-y-auto rounded-l border-l border-[var(--glass-border)] bg-[var(--bg-card)] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--divider)] bg-[var(--bg-card)] px-5 py-4">
              <div><h2 className="font-semibold text-[var(--text-primary)]">{t(editingId ? 'Modifier le document' : isOrder ? 'Nouveau bon de commande' : 'Nouveau bon de livraison')}</h2><p className="mt-0.5 text-xs text-[var(--text-muted)]">{t('Les champs marqués sont nécessaires pour enregistrer le document.')}</p></div>
              <button type="button" aria-label={t('Fermer')} onClick={() => setShowForm(false)} className="rounded p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]"><X size={18} /></button>
            </div>
            <div className="space-y-5 p-5">
              {!isOrder && <label className="block"><span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{t('Commande associée')}</span><select value={form.orderId} onChange={(event) => chooseOrder(event.target.value)} className="glass-input h-10 w-full px-3 text-sm"><option value="">{t('Aucune commande')}</option>{orders.filter((order) => order.status !== 'cancelled').map((order) => <option key={order.id} value={order.id}>{order.number} · {order.clientName}</option>)}</select></label>}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block"><span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{t('Client enregistré')}</span><select value={form.clientId} onChange={(event) => chooseClient(event.target.value)} className="glass-input h-10 w-full px-3 text-sm"><option value="">{t('Sélectionner un client')}</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
                <label className="block"><span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{t('Nom du client')} *</span><input value={form.clientName} onChange={(event) => setForm({ ...form, clientName: event.target.value })} required className="glass-input h-10 w-full px-3 text-sm" placeholder={t('Raison sociale')} /></label>
                <label className="block"><span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{t('E-mail')}</span><input type="email" value={form.clientEmail} onChange={(event) => setForm({ ...form, clientEmail: event.target.value })} className="glass-input h-10 w-full px-3 text-sm" placeholder="contact@client.cm" /></label>
                <label className="block"><span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{t('Date du document')}</span><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} className="glass-input h-10 w-full px-3 text-sm" /></label>
                <label className="block"><span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{t(isOrder ? 'Date de livraison prévue' : 'Date prévue de livraison')}</span><input type="date" value={form.deliveryDate} onChange={(event) => setForm({ ...form, deliveryDate: event.target.value })} className="glass-input h-10 w-full px-3 text-sm" /></label>
                <label className="block sm:col-span-2"><span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{t('Adresse de livraison')}</span><input value={form.deliveryAddress} onChange={(event) => setForm({ ...form, deliveryAddress: event.target.value })} className="glass-input h-10 w-full px-3 text-sm" placeholder={t('Adresse, ville, pays')} /></label>
                {!isOrder && <><label className="block"><span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{t('Transporteur')}</span><input value={form.carrier} onChange={(event) => setForm({ ...form, carrier: event.target.value })} className="glass-input h-10 w-full px-3 text-sm" /></label><label className="block"><span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{t('Référence de suivi')}</span><input value={form.trackingNumber} onChange={(event) => setForm({ ...form, trackingNumber: event.target.value })} className="glass-input h-10 w-full px-3 text-sm" /></label></>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold text-[var(--text-primary)]">{t('Articles et quantités')}</h3><button type="button" onClick={() => setForm({ ...form, items: [...form.items, { productId: '', description: '', quantity: 1, unitPrice: 0 }] })} className="btn-secondary h-8 gap-1.5 text-xs"><Plus size={13} /> {t('Ajouter une ligne')}</button></div>
                <div className="space-y-2">
                  {form.items.map((line, index) => <div key={index} className="grid grid-cols-12 gap-2 rounded border border-[var(--divider)] p-3">
                    <select aria-label={t('Article du catalogue')} value={line.productId} onChange={(event) => { const product = products.find((row) => String(row.id) === event.target.value); updateLine(index, { productId: event.target.value, description: product?.name || line.description, unitPrice: Number(product?.unitPriceHT ?? product?.unitPrice ?? line.unitPrice) }); }} className="glass-input col-span-12 h-9 px-2 text-xs sm:col-span-5"><option value="">{t('Choisir un article')}</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select>
                    <input aria-label={t('Désignation')} value={line.description} onChange={(event) => updateLine(index, { description: event.target.value })} className="glass-input col-span-12 h-9 px-2 text-xs sm:col-span-3" placeholder={t('Désignation')} />
                    <input aria-label={t('Quantité')} type="number" min="0.01" step="any" value={line.quantity} onChange={(event) => updateLine(index, { quantity: Number(event.target.value) })} className="glass-input col-span-4 h-9 px-2 text-xs sm:col-span-1" />
                    {isOrder && <input aria-label={t('Prix unitaire HT')} type="number" min="0" value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: Number(event.target.value) })} className="glass-input col-span-6 h-9 px-2 text-xs sm:col-span-2" />}
                    <button type="button" aria-label={t('Supprimer la ligne')} disabled={form.items.length === 1} onClick={() => setForm({ ...form, items: form.items.filter((_, i) => i !== index) })} className="col-span-2 flex items-center justify-center rounded text-[var(--accent-danger)] disabled:opacity-30 sm:col-span-1"><X size={15} /></button>
                  </div>)}
                </div>
                {isOrder && <div className="mt-3 ml-auto max-w-xs space-y-1 rounded bg-[var(--bg-elevated)] p-3 text-sm"><div className="flex justify-between"><span>{t('Total HT')}</span><span>{formatMoney(totalAmount)}</span></div><div className="flex justify-between text-[var(--text-muted)]"><span>{taxConfigured ? `${t('TVA')} (${taxRate}%)` : t('TVA non configurée')}</span><span>{formatMoney(totalTax)}</span></div><div className="flex justify-between border-t border-[var(--divider)] pt-2 font-bold"><span>{t('Total TTC')}</span><span className="text-[var(--accent-primary)]">{formatMoney(totalAmount + totalTax)}</span></div>{!taxConfigured && <p className="pt-1 text-xs text-amber-600">{t('Le total est calculé sans TVA. Configurez une règle fiscale valide dans Paramètres.')}</p>}</div>}
              </div>
              <label className="block"><span className="mb-1 block text-xs font-medium text-[var(--text-secondary)]">{t('Notes et instructions')}</span><textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} className="glass-input w-full resize-y px-3 py-2 text-sm" /></label>
              <div className="flex justify-end gap-2 border-t border-[var(--divider)] pt-4"><button type="button" disabled={saveSalesDocument.isPending} onClick={() => setShowForm(false)} className="btn-secondary h-9 px-4">{t('Annuler')}</button><button type="button" disabled={saveSalesDocument.isPending} onClick={saveDocument} className="btn-primary h-9 gap-2 px-4 disabled:opacity-60"><Check size={15} /> {t(saveSalesDocument.isPending ? 'Enregistrement…' : 'Enregistrer le document')}</button></div>
            </div>
          </motion.section>
        </div>}
      </AnimatePresence>

      <AnimatePresence>
        {detail && <div className="a4-preview-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="my-auto flex w-full flex-col items-center gap-3">
            <div className="no-print flex w-full max-w-[210mm] items-center justify-between rounded border border-[var(--divider)] bg-[var(--bg-card)] px-3 py-2 shadow-lg">
              <button type="button" onClick={() => setDetail(null)} className="btn-ghost h-8 gap-1.5 text-xs"><ArrowLeft size={14} /> {t('Retour à la liste')}</button>
              <div className="flex gap-2"><button type="button" onClick={() => beginEdit(detail)} className="btn-secondary h-8 text-xs">{t('Modifier')}</button><button type="button" onClick={() => window.print()} className="btn-primary h-8 gap-1.5 text-xs"><Printer size={14} /> {t('Imprimer / PDF')}</button></div>
            </div>
            <article className={`a4-sheet printable-document ${isOrder ? 'quote-document' : 'invoice-document'} shadow-2xl`}>
              <header className="mb-7 flex items-start justify-between border-b border-gray-300 pb-5">
                <div><h2 className="text-xl font-bold text-slate-900">IDIBA GROUP</h2><p className="mt-1 text-xs text-slate-500">{t('Gestion commerciale')}</p><p className="text-xs text-slate-500">{t('Cameroun')}</p></div>
                <div className="text-right"><div className="document-banner inline-block px-3 py-1 text-xs font-bold uppercase">{t(isOrder ? 'Bon de commande' : 'Bon de livraison')}</div><p className="text-xs text-gray-800 font-mono font-bold mt-2">{detail.number}</p><p className="text-xs text-slate-500">{t('Date')}: {new Date(`${detail.date}T00:00:00`).toLocaleDateString('fr-FR')}</p>{'deliveryDate' in detail && detail.deliveryDate && <p className="text-xs text-slate-500">{t('Livraison')}: {new Date(`${detail.deliveryDate}T00:00:00`).toLocaleDateString('fr-FR')}</p>}</div>
              </header>
              <section className="mb-6 grid grid-cols-2 gap-4 rounded border border-slate-200 bg-slate-50 p-4 text-xs"><div><p className="mb-1 font-bold uppercase text-slate-500">{t('Émetteur')}</p><p className="font-semibold text-slate-900">IDIBA GROUP</p></div><div><p className="mb-1 font-bold uppercase text-slate-500">{t('Destinataire')}</p><p className="font-semibold text-slate-900">{detail.clientName}</p><p className="text-slate-600">{detail.clientEmail}</p><p className="text-slate-600">{detail.deliveryAddress}</p>{'orderNumber' in detail && detail.orderNumber && <p className="mt-1 text-slate-600">{t('Commande')} {detail.orderNumber}</p>}</div></section>
              <table className="document-preview-table w-full border-collapse text-xs"><thead><tr className="document-banner"><th className="p-2 text-left">{t('Désignation')}</th><th className="p-2 text-right">{t('Quantité')}</th>{isOrder && <><th className="p-2 text-right">{t('Prix unitaire')}</th><th className="p-2 text-right">{t('Total HT')}</th></>}</tr></thead><tbody>{detail.items.map((item, index) => <tr key={index} className="border-b border-slate-200"><td className="p-2 text-slate-800">{item.description}</td><td className="p-2 text-right text-slate-800">{item.quantity}</td>{isOrder && <><td className="p-2 text-right text-slate-800">{formatMoney(item.unitPrice)}</td><td className="p-2 text-right text-slate-800">{formatMoney(item.quantity * item.unitPrice)}</td></>}</tr>)}</tbody></table>
              {isOrder && <div className="ml-auto mt-5 w-64 space-y-1 text-xs"><div className="flex justify-between"><span>{t('Total HT')}</span><span>{formatMoney((detail as SalesOrder).amount)}</span></div><div className="flex justify-between"><span>{t('TVA')}</span><span>{formatMoney((detail as SalesOrder).tax)}</span></div><div className="document-total flex justify-between border-t border-slate-300 pt-2 text-sm font-bold"><span>{t('Total TTC')}</span><span>{formatMoney((detail as SalesOrder).total)}</span></div></div>}
              {!isOrder && <div className="mt-6 grid grid-cols-2 gap-8 text-xs text-slate-600"><p>{t('Remis par')}<br /><br /><br />________________________</p><p>{t('Reçu par le client')}<br /><br /><br />________________________</p></div>}
              {detail.notes && <p className="mt-6 whitespace-pre-line border-t border-slate-200 pt-3 text-xs text-slate-600">{detail.notes}</p>}
              <footer className="mt-8 border-t border-slate-200 pt-3 text-center text-[10px] text-slate-500">{t('Document généré par IDIBAGES')}</footer>
            </article>
          </motion.div>
        </div>}
      </AnimatePresence>
    </div>
  );
}
