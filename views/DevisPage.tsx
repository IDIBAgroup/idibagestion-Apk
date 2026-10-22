import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Search, Plus, X, Eye, Trash2, Copy, Send, CheckCircle,
  Clock, AlertTriangle, XCircle, ArrowRight, Calendar, User, Mail,
  Printer, Building2
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { trpc } from '@/providers/trpc';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { formatPlatformCurrency, usePlatformFinancialSettings } from '@/hooks/usePlatformFinancialSettings';
import { getOhadaCountry } from '@/lib/ohada/countries';
import type { Quote } from '@/types';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Brouillon', color: '#6B7280', icon: <FileText size={10} /> },
  sent: { label: 'Envoyé au Client', color: '#3B82F6', icon: <Send size={10} /> },
  accepted: { label: 'Accepté par le Client', color: '#10B981', icon: <CheckCircle size={10} /> },
  counter_proposal: { label: 'Contre-Proposition', color: '#EC4899', icon: <Clock size={10} /> },
  rejected: { label: 'Refusé', color: '#EF4444', icon: <XCircle size={10} /> },
  expired: { label: 'Expiré', color: '#F59E0B', icon: <Clock size={10} /> },
  converted: { label: 'Converti en Facture', color: '#8B5CF6', icon: <ArrowRight size={10} /> },
};
const quoteStatusTransitions: Record<string, string[]> = {
  draft: ['sent', 'rejected', 'expired'], sent: ['accepted', 'rejected', 'expired', 'counter_proposal'],
  counter_proposal: ['accepted', 'rejected'],
};

export function DevisPage() {
  const { currency, taxRate, taxConfigured, countryCode } = usePlatformFinancialSettings();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [newQuote, setNewQuote] = useState({
    clientId: '',
    clientName: '',
    clientEmail: '',
    clientNiu: '',
    clientRccm: '',
    date: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
    items: [{ productId: '', description: '', quantity: 1, unitPrice: 0 }],
  });
  // tRPC & Local Data
  const { companyId, company } = useActiveCompany();
  const companyJurisdiction = getOhadaCountry(countryCode);
  const utils = trpc.useUtils();
  const quotesQuery = trpc.salesDocument.list.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const invalidateQuotes = () => utils.salesDocument.list.invalidate({ companyId: companyId ?? 0 });
  const saveQuote = trpc.salesDocument.save.useMutation({
    onSuccess: async () => {
      await invalidateQuotes();
      setShowForm(false);
      setNewQuote({ clientId: '', clientName: '', clientEmail: '', clientNiu: '', clientRccm: '', date: new Date().toISOString().split('T')[0], expiryDate: '', notes: '', items: [{ productId: '', description: '', quantity: 1, unitPrice: 0 }] });
      showToast('Devis enregistré.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const setQuoteStatus = trpc.salesDocument.setStatus.useMutation({
    onSuccess: async () => { await invalidateQuotes(); showToast('Statut du devis mis à jour.', 'success'); },
    onError: (error) => showToast(error.message, 'error'),
  });
  const deleteQuote = trpc.salesDocument.delete.useMutation({
    onSuccess: async () => { await invalidateQuotes(); showToast('Devis supprimé.', 'success'); },
    onError: (error) => showToast(error.message, 'error'),
  });
  const convertQuote = trpc.salesDocument.convertQuoteToInvoice.useMutation({
    onSuccess: async (invoice) => {
      await invalidateQuotes();
      showToast(`Facture ${invoice.number} créée en brouillon.`, 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const { data: registeredClients } = trpc.customer.listByCompany.useQuery(
    { companyId: companyId ?? 0 }, { enabled: !!companyId },
  );
  const { data: registeredProducts } = trpc.product.listByCompany.useQuery(
    { companyId: companyId ?? 0 }, { enabled: !!companyId },
  );

  const dbClients = registeredClients ?? [];
  const dbProducts = registeredProducts ?? [];

  const clientList = dbClients;
  const productList = dbProducts;

  useEffect(() => { setCurrentPageTitle('Gestion des Devis'); }, [setCurrentPageTitle]);

  const quotes = ((quotesQuery.data ?? []).filter((document) => document.kind === 'quote')) as unknown as Quote[];
  const formatXAF = (a: number) => formatPlatformCurrency(a, currency);
  const formatDate = (value: string) => new Intl.DateTimeFormat(companyJurisdiction?.locale ?? 'fr-FR').format(new Date(`${value}T00:00:00`));
  const currentTaxMultiplier = 1 + taxRate / 100;

  const filtered = quotes.filter((q: any) => {
    const matchesSearch = !search || q.clientName.toLowerCase().includes(search.toLowerCase()) || q.number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSelectClient = (clientIdStr: string) => {
    const found = clientList.find(c => String(c.id) === clientIdStr);
    if (found) {
      setNewQuote({
        ...newQuote,
        clientId: String(found.id),
        clientName: found.name,
        clientEmail: found.email || '',
        clientNiu: found.niu || '',
        clientRccm: found.rccm || '',
      });
    }
  };

  const handleSelectProduct = (idx: number, productIdStr: string) => {
    const found = productList.find(p => String(p.id) === productIdStr);
    if (found) {
      const updated = newQuote.items.map((item, i) => i === idx ? {
        ...item,
        productId: String(found.id),
        description: found.name,
        unitPrice: found.unitPriceHT,
      } : item);
      setNewQuote({ ...newQuote, items: updated });
    }
  };

  const addItem = () => setNewQuote({ ...newQuote, items: [...newQuote.items, { productId: '', description: '', quantity: 1, unitPrice: 0 }] });
  const removeItem = (idx: number) => setNewQuote({ ...newQuote, items: newQuote.items.filter((_, i) => i !== idx) });
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = newQuote.items.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    setNewQuote({ ...newQuote, items: updated });
  };

  const calculateTotals = () => {
    const amount = newQuote.items.reduce((s, item) => s + Math.round(item.quantity * item.unitPrice), 0);
    const tax = newQuote.items.reduce((s, item) => s + Math.round(Math.round(item.quantity * item.unitPrice) * taxRate / 100), 0);
    return { amount, tax, total: amount + tax };
  };

  const handleCreate = () => {
    if (!companyId) {
      showToast('Sélectionnez une entreprise active avant de créer un devis.', 'warning');
      return;
    }
    if (!newQuote.clientName.trim() || !newQuote.items.some((item) => item.description.trim() && Number(item.quantity) > 0)) {
      showToast('Veuillez renseigner le client et au moins une ligne valide.', 'warning');
      return;
    }
    const defaultExpiry = new Date(`${newQuote.date}T00:00:00.000Z`);
    defaultExpiry.setUTCDate(defaultExpiry.getUTCDate() + 30);
    saveQuote.mutate({
      companyId, kind: 'quote', clientId: newQuote.clientId || undefined,
      clientName: newQuote.clientName.trim(), clientEmail: newQuote.clientEmail.trim(),
      clientNiu: newQuote.clientNiu.trim() || undefined, clientRccm: newQuote.clientRccm.trim() || undefined,
      date: newQuote.date,
      expiryDate: newQuote.expiryDate || defaultExpiry.toISOString().split('T')[0],
      items: newQuote.items.filter((item) => item.description.trim() && Number(item.quantity) > 0).map((item) => ({ productId: item.productId || undefined, description: item.description.trim(), quantity: Number(item.quantity), unitPrice: Number(item.unitPrice) })),
      notes: newQuote.notes.trim() || undefined,
    });
  };

  const handleDelete = (id: string) => {
    if (companyId && confirm('Supprimer ce devis ?')) deleteQuote.mutate({ companyId, id, kind: 'quote' });
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    if (companyId) setQuoteStatus.mutate({ companyId, id, kind: 'quote', status: newStatus });
  };
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Gestion des Devis Commercialisés</h2>
          <p className="text-xs text-[var(--text-muted)]">{filtered.length} devis · Intégré avec le catalogue produits et portefeuille clients (NIU/RCCM)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary h-9 gap-1.5"><Plus size={16} /> Nouveau Devis</button>
      </div>

      {quotesQuery.isError && <div role="alert" className="flex items-center justify-between gap-3 rounded border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600"><span>Impossible de charger les devis.</span><button type="button" onClick={() => quotesQuery.refetch()} className="underline">Réessayer</button></div>}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher devis..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
        <label className="sr-only" htmlFor="quote-status-filter">Filtrer les devis par statut</label>
        <select id="quote-status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-10 min-w-[190px] px-3 glass-input text-sm">
          <option value="all">Tous ({quotes.length})</option>
          {Object.entries(statusConfig).map(([key, value]) => <option key={key} value={key}>{value.label} ({quotes.filter((quote: any) => quote.status === key).length})</option>)}
        </select>
      </div>

      {/* Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--divider)] text-[10px] text-[var(--text-muted)] uppercase">
                <th className="text-left p-3">N° Devis</th>
                <th className="text-left p-3">Client & Infos Fiscale</th>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Validité</th>
                <th className="text-right p-3">Montant TTC</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q: any) => {
                const sc = statusConfig[q.status] || statusConfig.draft;
                const allowedStatuses = [q.status, ...(quoteStatusTransitions[q.status] ?? [])];
                return (
                  <tr key={q.id} className="border-b border-[var(--divider)]/50 hover:bg-white/[0.02] transition-colors">
                    <td className="p-3"><span className="text-sm font-medium text-[var(--text-primary)]">{q.number}</span></td>
                    <td className="p-3">
                      <p className="text-[var(--text-primary)] font-bold">{q.clientName}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">NIU: {q.clientNiu || '—'} • RCCM: {q.clientRccm || '—'}</p>
                    </td>
                    <td className="p-3 text-[var(--text-muted)]">{formatDate(q.date)}</td>
                    <td className="p-3 text-[var(--text-muted)]">{q.expiryDate ? formatDate(q.expiryDate) : '—'}</td>
                    <td className="p-3 text-right font-bold text-[var(--text-primary)]">{formatXAF(q.total)}</td>
                    <td className="p-3">
                      <select
                        value={q.status}
                        disabled={setQuoteStatus.isPending}
                        onChange={e => handleStatusChange(q.id, e.target.value)}
                        className="text-[10px] px-2 py-1 rounded border-0 font-bold cursor-pointer"
                        style={{ backgroundColor: sc.color + '20', color: sc.color }}
                      >
                        {Object.entries(statusConfig).filter(([key]) => allowedStatuses.includes(key)).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setShowDetail(q)} className="p-1.5 rounded hover:bg-white/5 text-[var(--text-muted)]" title="Visualiser"><Eye size={14} /></button>
                        {q.status === 'accepted' && <button disabled={convertQuote.isPending} onClick={() => companyId && convertQuote.mutate({ companyId, quoteId: q.id })} className="p-1.5 rounded hover:bg-white/5 text-[var(--accent-primary)] disabled:opacity-40" title="Créer une facture brouillon à partir de ce devis"><FileText size={14} /></button>}
                        <button disabled={deleteQuote.isPending || !['draft', 'rejected', 'expired'].includes(q.status)} onClick={() => handleDelete(q.id)} className="p-1.5 rounded hover:bg-white/5 text-[var(--accent-danger)] disabled:cursor-not-allowed disabled:opacity-30" title="Supprimer"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* New Quote Drawer (Sliding from Right) */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-[var(--bg-card)] border-l border-[var(--glass-border)] z-50 overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <FileText size={20} className="text-[var(--accent-primary)]" /> Établir un Nouveau Devis Automatisé
                  </h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/5">
                    <X size={18} className="text-[var(--text-muted)]" />
                  </button>
                </div>
                <div className="space-y-5">

                  {/* SELECT CLIENT FROM PORTFOLIO */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Building2 size={15} className="text-[var(--accent-primary)]" />
                      Sélectionner dans le Portefeuille Client
                    </div>
                    <select
                      value={newQuote.clientId}
                      onChange={(e) => handleSelectClient(e.target.value)}
                      className="w-full h-10 px-3 glass-input text-xs font-medium"
                    >
                      <option value="">-- Sélectionner un client enregistré --</option>
                      {clientList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.niu || '—'})</option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div><label className="block text-[10px] text-[var(--text-muted)] mb-1">Raison Sociale / Nom</label><input value={newQuote.clientName} onChange={e => setNewQuote({ ...newQuote, clientName: e.target.value })} className="w-full h-9 px-3 glass-input text-xs" placeholder="Nom du client" /></div>
                      <div><label className="block text-[10px] text-[var(--text-muted)] mb-1">Email Client</label><input value={newQuote.clientEmail} onChange={e => setNewQuote({ ...newQuote, clientEmail: e.target.value })} className="w-full h-9 px-3 glass-input text-xs" placeholder="client@example.com" /></div>
                      <div><label className="block text-[10px] text-[var(--text-muted)] mb-1">{companyJurisdiction?.taxIdLabel ?? 'Identifiant fiscal'}</label><input value={newQuote.clientNiu} onChange={e => setNewQuote({ ...newQuote, clientNiu: e.target.value })} className="w-full h-9 px-3 glass-input text-xs font-mono" placeholder="Identifiant fiscal du client" /></div>
                      <div><label className="block text-[10px] text-[var(--text-muted)] mb-1">{companyJurisdiction?.commercialRegisterLabel ?? 'Registre commercial'}</label><input value={newQuote.clientRccm} onChange={e => setNewQuote({ ...newQuote, clientRccm: e.target.value })} className="w-full h-9 px-3 glass-input text-xs font-mono" placeholder="Registre commercial du client" /></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Date d'Émission</label><input type="date" value={newQuote.date} onChange={e => setNewQuote({ ...newQuote, date: e.target.value })} className="w-full h-10 px-3 glass-input text-xs" /></div>
                    <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Date d'Expiration</label><input type="date" value={newQuote.expiryDate} onChange={e => setNewQuote({ ...newQuote, expiryDate: e.target.value })} className="w-full h-10 px-3 glass-input text-xs" /></div>
                  </div>

                  {/* SELECT ARTICLES FROM CATALOG */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-white">Articles & Services du Catalogue</label>
                      <button onClick={addItem} className="text-[11px] text-[var(--accent-primary)] hover:underline flex items-center gap-1 font-semibold"><Plus size={13} /> Ajouter une ligne</button>
                    </div>
                    <div className="space-y-3">
                      {newQuote.items.map((item, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
                          <div className="grid grid-cols-12 gap-2">
                            <div className="col-span-6">
                              <select
                                value={item.productId}
                                onChange={(e) => handleSelectProduct(idx, e.target.value)}
                                className="w-full h-9 px-2 glass-input text-xs"
                              >
                                <option value="">-- Sélectionner produit/article --</option>
                                {productList.map((p) => (
                          <option key={p.id} value={p.id}>{p.name} ({formatXAF(p.unitPriceHT)})</option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-6">
                              <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="w-full h-9 px-2 glass-input text-xs" placeholder="Désignation de la prestation" />
                            </div>
                          </div>

                          <div className="grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-4"><input type="number" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full h-9 px-2 glass-input text-xs text-center" placeholder="Quantité" min={1} /></div>
                            <div className="col-span-6"><input type="number" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} className="w-full h-9 px-2 glass-input text-xs text-right font-mono" placeholder="Prix Unitaire HT" /></div>
                            <div className="col-span-2 text-right">
                              <button onClick={() => removeItem(idx)} className="p-2 rounded-lg hover:bg-white/10 text-red-400" title="Supprimer la ligne"><X size={15} /></button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-1.5 text-xs">
                    <div className="flex justify-between text-[var(--text-secondary)]"><span>Total HT :</span><span className="font-mono text-white">{formatXAF(calculateTotals().amount)}</span></div>
                    <div className="flex justify-between text-[var(--text-secondary)]"><span>{taxConfigured ? `TVA (${taxRate}%) :` : 'TVA non configurée :'}</span><span className="font-mono text-white">{formatXAF(calculateTotals().tax)}</span></div>
                    <div className="pt-2.5 border-t border-white/10 flex justify-between text-sm font-bold text-white"><span>Total TTC :</span><span className="font-mono text-[var(--accent-primary)] text-base">{formatXAF(calculateTotals().total)}</span></div>
                  </div>
                  {!taxConfigured && <p className="mt-2 rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">Aucune règle de TVA en vigueur n’est configurée pour le pays et la date de ce devis. Le calcul est effectué sans TVA. <a href="/settings" className="underline underline-offset-2">Configurer la fiscalité</a>.</p>}

                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1.5">Notes & Conditions Particulières</label><textarea value={newQuote.notes} onChange={e => setNewQuote({ ...newQuote, notes: e.target.value })} className="w-full h-20 px-3 py-2 glass-input text-xs resize-none" placeholder="Modalités de paiement, acompte exigé..." /></div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowForm(false)} className="flex-1 btn-ghost h-11 text-xs justify-center">Annuler</button>
                    <button onClick={handleCreate} className="flex-1 btn-primary h-11 text-xs font-bold gap-2 justify-center shadow-lg"><FileText size={15} /> Créer le devis</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Detail Modal & Printable Document (A4 Centered) */}
      <AnimatePresence>
        {showDetail && (
          <div className="a4-preview-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full flex flex-col items-center gap-4 my-auto">
              
              {/* Floating Action Controls */}
              <div className="no-print flex items-center justify-between w-full max-w-[210mm] glass-card px-4 py-2.5 shadow-xl border-white/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white bg-blue-600/30 border border-blue-500/30 px-2.5 py-1 rounded-md">Format A4 Standard</span>
                  <span className="text-xs text-[var(--text-muted)] font-mono">{showDetail.number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => window.print()} className="btn-primary h-8 px-3 text-xs gap-1.5 font-bold shadow-lg">
                    <Printer size={14} /> Imprimer / PDF (A4)
                  </button>
                  <button onClick={() => setShowDetail(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white">
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Printable A4 Sheet */}
              <div className="a4-sheet printable-document quote-document shadow-2xl">
                <div className="space-y-6">
                  {/* Company Header */}
                  <div className="flex justify-between items-start border-b border-gray-300 pb-5">
                    <div>
                       <h2 className="text-xl font-bold text-blue-900 tracking-tight">{company?.name || 'Entreprise'}</h2>
                       <p className="text-xs text-gray-600 font-medium mt-0.5">{company?.address || ''}</p>
                       <p className="text-xs text-gray-600">{[company?.city, company?.country, company?.email].filter(Boolean).join(' · ')}</p>
                      <p className="text-[11px] text-gray-700 font-mono mt-1">
                         <strong>{companyJurisdiction?.taxIdLabel ?? 'Identifiant fiscal'}:</strong> {company?.niu || company?.taxId || '—'} • <strong>{companyJurisdiction?.commercialRegisterLabel ?? 'Registre commercial'}:</strong> {company?.rccm || '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-900 text-white font-bold text-xs px-3 py-1 rounded inline-block tracking-wider uppercase">DEVIS COMMERCIAL</span>
                      <p className="text-xs text-gray-800 font-mono font-bold mt-2">N° {showDetail.number}</p>
                      <p className="text-xs text-gray-600">Date d'émission: {formatDate(showDetail.date)}</p>
                      {showDetail.expiryDate && <p className="text-xs text-gray-600">Valide jusqu'au: {formatDate(showDetail.expiryDate)}</p>}
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Émetteur</span>
                       <p className="text-xs font-bold text-gray-900">{company?.name || 'Entreprise'}</p>
                       <p className="text-xs text-gray-600">{company?.address || ''}</p>
                       <p className="text-xs text-gray-600">{company?.country || companyJurisdiction?.name || ''}</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-900 block mb-1">Destinataire (Client)</span>
                      <p className="text-sm font-bold text-gray-900">{showDetail.clientName}</p>
                      <p className="text-xs text-gray-600">{showDetail.clientEmail}</p>
                      <div className="mt-1 pt-1 border-t border-gray-200 text-xs font-mono text-gray-700">
                         <p><strong>{companyJurisdiction?.taxIdLabel ?? 'Identifiant fiscal'} client:</strong> {showDetail.clientNiu || '—'}</p>
                         <p><strong>{companyJurisdiction?.commercialRegisterLabel ?? 'Registre commercial'} client:</strong> {showDetail.clientRccm || '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="document-preview-table w-full text-xs border-collapse mt-4">
                    <thead>
                      <tr className="bg-blue-900 text-white text-[11px] uppercase tracking-wider">
                        <th className="text-left p-3 rounded-tl">Réf / Désignation</th>
                        <th className="text-center p-3">Quantité</th>
                        <th className="text-right p-3">P.U. HT ({currency})</th>
                        <th className="text-right p-3 rounded-tr">Montant HT ({currency})</th>
                      </tr>
                    </thead>
                    <tbody>
                      {showDetail.items.map((item: any, i: number) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white border-b border-gray-100' : 'bg-gray-50/50 border-b border-gray-100'}>
                          <td className="p-3 font-medium text-gray-800">{item.description}</td>
                          <td className="text-center p-3 font-mono">{item.quantity}</td>
                          <td className="text-right p-3 font-mono">{formatXAF(item.unitPrice)}</td>
                          <td className="text-right p-3 font-mono font-bold text-gray-900">{formatXAF(item.quantity * item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals & Notes */}
                  <div className="grid grid-cols-12 gap-4 pt-4 border-t border-gray-200">
                    <div className="col-span-7 space-y-2">
                      {showDetail.notes && (
                        <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs">
                          <p className="font-bold text-gray-700 mb-1">Notes & Modalités :</p>
                          <p className="text-gray-600 whitespace-pre-line">{showDetail.notes}</p>
                        </div>
                      )}
                      <div className="text-[10px] text-gray-500 space-y-0.5">
                        <p>• Offre valable jusqu'au {showDetail.expiryDate ? formatDate(showDetail.expiryDate) : '—'}.</p>
                        <p>• Paiement par Virement Bancaire ou Mobile Money (MTN / Orange).</p>
                      </div>
                    </div>
                    <div className="col-span-5">
                      <div className="space-y-1.5 text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between text-gray-700"><span>Montant Total HT :</span><span className="font-mono font-semibold">{formatXAF(showDetail.amount || (showDetail.total / currentTaxMultiplier))}</span></div>
                        <div className="flex justify-between text-gray-700"><span>{taxConfigured ? `TVA (${taxRate}%) :` : 'TVA non configurée :'}</span><span className="font-mono font-semibold">{formatXAF(showDetail.tax || (showDetail.total - (showDetail.total / currentTaxMultiplier)))}</span></div>
                        <div className="flex justify-between font-bold text-sm text-blue-900 pt-2 border-t border-gray-300"><span>NET À PAYER TTC :</span><span className="font-mono">{formatXAF(showDetail.total)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Legal Notice */}
                <div className="pt-8 border-t border-gray-300 text-center text-[10px] text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700">{company?.name || 'Entreprise'}</p>
                  <p>{[company?.address, company?.city, company?.country].filter(Boolean).join(' · ')} · {companyJurisdiction?.taxIdLabel ?? 'Identifiant fiscal'}: {company?.niu || company?.taxId || '—'} · {companyJurisdiction?.commercialRegisterLabel ?? 'Registre commercial'}: {company?.rccm || '—'}</p>
                  <p className="italic">Document généré automatiquement par IDIBAGES ERP - Format A4 Conforme DGI/SYSCOHADA</p>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
