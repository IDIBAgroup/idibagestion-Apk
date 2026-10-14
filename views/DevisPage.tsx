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
import { getAll, addAndNotify, removeAndNotify } from '@/lib/db';
import { formatPlatformCurrency, usePlatformFinancialSettings } from '@/hooks/usePlatformFinancialSettings';

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Brouillon', color: '#6B7280', icon: <FileText size={10} /> },
  sent: { label: 'Envoyé au Client', color: '#3B82F6', icon: <Send size={10} /> },
  accepted: { label: 'Accepté par le Client', color: '#10B981', icon: <CheckCircle size={10} /> },
  counter_proposal: { label: 'Contre-Proposition', color: '#EC4899', icon: <Clock size={10} /> },
  rejected: { label: 'Refusé', color: '#EF4444', icon: <XCircle size={10} /> },
  expired: { label: 'Expiré', color: '#F59E0B', icon: <Clock size={10} /> },
  converted: { label: 'Converti en Facture', color: '#8B5CF6', icon: <ArrowRight size={10} /> },
};

export function DevisPage() {
  const { currency, taxRate } = usePlatformFinancialSettings();
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
  const [refresh, setRefresh] = useState(0);

  // tRPC & Local Data
  const { companyId } = useActiveCompany();
  const { data: registeredClients } = trpc.customer.listByCompany.useQuery(
    { companyId: companyId ?? 0 }, { enabled: !!companyId },
  );
  const { data: registeredProducts } = trpc.product.listByCompany.useQuery(
    { companyId: companyId ?? 0 }, { enabled: !!companyId },
  );

  const DEFAULT_CLIENTS = [
    { id: 1, name: 'Société Générale Cameroun', email: 'compta@sgc.cm', niu: 'M0123456789P', rccm: 'RC/DLA/1998/A/001' },
    { id: 2, name: 'MTN Cameroun S.A.', email: 'billing@mtn.cm', niu: 'M08191244901A', rccm: 'RC/DLA/2000/B/042' },
    { id: 3, name: 'Groupe SABC S.A.', email: 'finances@sabc.cm', niu: 'M0298124901B', rccm: 'RC/DLA/1970/A/008' },
  ];

  const DEFAULT_PRODUCTS = [
    { id: 1, name: 'Développement d\'Application Web ERP', unitPriceHT: 4500000, category: 'Informatique' },
    { id: 2, name: 'Audit Comptable & DSF SYSCOHADA', unitPriceHT: 2500000, category: 'Conseil' },
    { id: 3, name: 'Module Prospection VIBE AI Intégré', unitPriceHT: 1200000, category: 'Logiciel' },
  ];

  const dbClients = getAll('clients') || [];
  const dbProducts = getAll('products') || [];

  const clientList = dbClients.length > 0 
    ? dbClients.map((c: any) => ({ id: c.id, name: c.name, email: c.email, niu: c.ifu || c.niu || 'M08191244901A', rccm: c.rccm || 'RC/DLA/2019/B/1420' }))
    : ((registeredClients && registeredClients.length > 0) ? registeredClients : DEFAULT_CLIENTS);

  const productList = dbProducts.length > 0
    ? dbProducts
    : ((registeredProducts && registeredProducts.length > 0) ? registeredProducts : DEFAULT_PRODUCTS);

  useEffect(() => { setCurrentPageTitle('Gestion des Devis'); }, [setCurrentPageTitle]);

  const quotes = getAll('quotes');
  const formatXAF = (a: number) => formatPlatformCurrency(a, currency);
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
        clientNiu: found.niu || 'M08191244901A',
        clientRccm: found.rccm || 'RC/DLA/2019/B/1420',
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
    const amount = newQuote.items.reduce((s, item) => s + (item.quantity * item.unitPrice), 0);
    const tax = amount * taxRate / 100;
    return { amount, tax, total: amount + tax };
  };

  const handleCreate = () => {
    if (!newQuote.clientName || newQuote.items.length === 0 || !newQuote.items[0].description) {
      showToast('Veuillez remplir le client et au moins une ligne', 'warning');
      return;
    }
    const { amount, tax, total } = calculateTotals();
    const taxMultiplier = 1 + taxRate / 100;
    const quote = {
      id: `q-${Date.now()}`,
      number: `DEV-2026-${String(quotes.length + 102).padStart(4, '0')}`,
      clientName: newQuote.clientName,
      clientEmail: newQuote.clientEmail,
      clientNiu: newQuote.clientNiu || 'M08191244901A',
      clientRccm: newQuote.clientRccm || 'RC/DLA/2019/B/1420',
      date: newQuote.date,
      expiryDate: newQuote.expiryDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      amount,
      tax,
      total,
      status: 'draft',
      companyId: 'comp-1',
      items: newQuote.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        tax: item.quantity * item.unitPrice * taxRate / 100,
        total: item.quantity * item.unitPrice * taxMultiplier,
      })),
      notes: newQuote.notes,
      createdAt: new Date().toISOString(),
    };
    addAndNotify('quotes', quote);
    setShowForm(false);
    setNewQuote({ clientId: '', clientName: '', clientEmail: '', clientNiu: '', clientRccm: '', date: new Date().toISOString().split('T')[0], expiryDate: '', notes: '', items: [{ productId: '', description: '', quantity: 1, unitPrice: 0 }] });
    setRefresh(r => r + 1);
    showToast('Devis créé avec succès avec informations NIU & RCCM', 'success');
  };

  const handleDelete = (id: string) => {
    if (confirm('Supprimer ce devis ?')) {
      removeAndNotify('quotes', id, 'id');
      setRefresh(r => r + 1);
      showToast('Devis supprimé', 'success');
    }
  };

  const handleStatusChange = (id: string, newStatus: string) => {
    const db = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    if (db.quotes) {
      db.quotes = db.quotes.map((q: any) => q.id === id ? { ...q, status: newStatus } : q);
      localStorage.setItem('idibages_db_v3', JSON.stringify(db));
      setRefresh(r => r + 1);
      showToast(`Statut mis à jour : ${statusConfig[newStatus]?.label || newStatus}`, 'success');
    }
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
                return (
                  <tr key={q.id} className="border-b border-[var(--divider)]/50 hover:bg-white/[0.02] transition-colors">
                    <td className="p-3"><span className="text-sm font-medium text-[var(--text-primary)]">{q.number}</span></td>
                    <td className="p-3">
                      <p className="text-[var(--text-primary)] font-bold">{q.clientName}</p>
                      <p className="text-[10px] text-[var(--text-muted)] font-mono">NIU: {q.clientNiu || 'M08191244901A'} • RCCM: {q.clientRccm || 'RC/DLA/2019/B/1420'}</p>
                    </td>
                    <td className="p-3 text-[var(--text-muted)]">{new Date(q.date).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3 text-[var(--text-muted)]">{new Date(q.expiryDate).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3 text-right font-bold text-[var(--text-primary)]">{formatXAF(q.total)}</td>
                    <td className="p-3">
                      <select
                        value={q.status}
                        onChange={e => handleStatusChange(q.id, e.target.value)}
                        className="text-[10px] px-2 py-1 rounded border-0 font-bold cursor-pointer"
                        style={{ backgroundColor: sc.color + '20', color: sc.color }}
                      >
                        {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => setShowDetail(q)} className="p-1.5 rounded hover:bg-white/5 text-[var(--text-muted)]" title="Visualiser"><Eye size={14} /></button>
                        <button onClick={() => handleDelete(q.id)} className="p-1.5 rounded hover:bg-white/5 text-[var(--accent-danger)]" title="Supprimer"><Trash2 size={14} /></button>
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
                        <option key={c.id} value={c.id}>{c.name} ({c.niu || 'M08191244901A'})</option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div><label className="block text-[10px] text-[var(--text-muted)] mb-1">Raison Sociale / Nom</label><input value={newQuote.clientName} onChange={e => setNewQuote({ ...newQuote, clientName: e.target.value })} className="w-full h-9 px-3 glass-input text-xs" placeholder="Nom du client" /></div>
                      <div><label className="block text-[10px] text-[var(--text-muted)] mb-1">Email Client</label><input value={newQuote.clientEmail} onChange={e => setNewQuote({ ...newQuote, clientEmail: e.target.value })} className="w-full h-9 px-3 glass-input text-xs" placeholder="email@client.cm" /></div>
                      <div><label className="block text-[10px] text-[var(--text-muted)] mb-1">NIU (Identifiant Unique)</label><input value={newQuote.clientNiu} onChange={e => setNewQuote({ ...newQuote, clientNiu: e.target.value })} className="w-full h-9 px-3 glass-input text-xs font-mono" placeholder="M08191244901A" /></div>
                      <div><label className="block text-[10px] text-[var(--text-muted)] mb-1">RCCM (Registre Commerce)</label><input value={newQuote.clientRccm} onChange={e => setNewQuote({ ...newQuote, clientRccm: e.target.value })} className="w-full h-9 px-3 glass-input text-xs font-mono" placeholder="RC/DLA/2019/B/1420" /></div>
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
                                  <option key={p.id} value={p.id}>{p.name} ({p.unitPriceHT.toLocaleString('fr-FR')} FCFA)</option>
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
                    <div className="flex justify-between text-[var(--text-secondary)]"><span>TVA ({taxRate}%) :</span><span className="font-mono text-white">{formatXAF(calculateTotals().tax)}</span></div>
                    <div className="pt-2.5 border-t border-white/10 flex justify-between text-sm font-bold text-white"><span>Total TTC :</span><span className="font-mono text-[var(--accent-primary)] text-base">{formatXAF(calculateTotals().total)}</span></div>
                  </div>

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
                      <h2 className="text-xl font-bold text-blue-900 tracking-tight">IDIBA GROUP SARL</h2>
                      <p className="text-xs text-gray-600 font-medium mt-0.5">Ingénierie Logicielle & Conseil de Gestion</p>
                      <p className="text-xs text-gray-600">Douala & Yaoundé, Cameroun • Contact: contact@idibagroup.cm</p>
                      <p className="text-[11px] text-gray-700 font-mono mt-1">
                        <strong>NIU:</strong> M0123456789C • <strong>RCCM:</strong> RC/DLA/2019/M/0847 • <strong>Capital:</strong> 10 000 000 FCFA
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-blue-900 text-white font-bold text-xs px-3 py-1 rounded inline-block tracking-wider uppercase">DEVIS COMMERCIAL</span>
                      <p className="text-xs text-gray-800 font-mono font-bold mt-2">N° {showDetail.number}</p>
                      <p className="text-xs text-gray-600">Date d'émission: {new Date(showDetail.date).toLocaleDateString('fr-FR')}</p>
                      {showDetail.expiryDate && <p className="text-xs text-gray-600">Valide jusqu'au: {new Date(showDetail.expiryDate).toLocaleDateString('fr-FR')}</p>}
                    </div>
                  </div>

                  {/* Client Information */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Émetteur</span>
                      <p className="text-xs font-bold text-gray-900">IDIBA GROUP SARL</p>
                      <p className="text-xs text-gray-600">Département Commercial</p>
                      <p className="text-xs text-gray-600">Cameroun</p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-900 block mb-1">Destinataire (Client)</span>
                      <p className="text-sm font-bold text-gray-900">{showDetail.clientName}</p>
                      <p className="text-xs text-gray-600">{showDetail.clientEmail}</p>
                      <div className="mt-1 pt-1 border-t border-gray-200 text-xs font-mono text-gray-700">
                        <p><strong>NIU Client:</strong> {showDetail.clientNiu || 'M08191244901A'}</p>
                        <p><strong>RCCM Client:</strong> {showDetail.clientRccm || 'RC/DLA/2019/B/1420'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <table className="document-preview-table w-full text-xs border-collapse mt-4">
                    <thead>
                      <tr className="bg-blue-900 text-white text-[11px] uppercase tracking-wider">
                        <th className="text-left p-3 rounded-tl">Réf / Désignation</th>
                        <th className="text-center p-3">Quantité</th>
                        <th className="text-right p-3">P.U. HT (FCFA)</th>
                        <th className="text-right p-3 rounded-tr">Montant HT (FCFA)</th>
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
                        <p>• Offre valable 30 jours à compter de la date d'émission.</p>
                        <p>• Paiement par Virement Bancaire ou Mobile Money (MTN / Orange).</p>
                      </div>
                    </div>
                    <div className="col-span-5">
                      <div className="space-y-1.5 text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between text-gray-700"><span>Montant Total HT :</span><span className="font-mono font-semibold">{formatXAF(showDetail.amount || (showDetail.total / currentTaxMultiplier))}</span></div>
                        <div className="flex justify-between text-gray-700"><span>TVA ({taxRate}%) :</span><span className="font-mono font-semibold">{formatXAF(showDetail.tax || (showDetail.total - (showDetail.total / currentTaxMultiplier)))}</span></div>
                        <div className="flex justify-between font-bold text-sm text-blue-900 pt-2 border-t border-gray-300"><span>NET À PAYER TTC :</span><span className="font-mono">{formatXAF(showDetail.total)}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Legal Notice */}
                <div className="pt-8 border-t border-gray-300 text-center text-[10px] text-gray-500 space-y-1">
                  <p className="font-semibold text-gray-700">IDIBA GROUP SARL — S.A.R.L au capital de 10 000 000 FCFA</p>
                  <p>Siège social: Douala - Cameroun • NIU: M0123456789C • RCCM: RC/DLA/2019/M/0847</p>
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
