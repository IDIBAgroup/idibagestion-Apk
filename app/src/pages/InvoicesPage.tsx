import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, Download, Eye, Send, Trash2, X,
  FileText, ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';
import { useEffect } from 'react';
import type { Invoice } from '@/types';

export function InvoicesPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => { setCurrentPageTitle('Facturation Client'); }, [setCurrentPageTitle]);

  const invoices = getAll('invoices') as Invoice[];

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch = inv.number.toLowerCase().includes(search.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const formatXAF = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount);

  const statusCounts = {
    all: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    pending: invoices.filter(i => i.status === 'pending').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    draft: invoices.filter(i => i.status === 'draft').length,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Facturation Client</h2>
            <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2.5 py-1">
              {invoices.length} factures
            </span>
          </div>
        </div>
        <button onClick={() => setShowDrawer(true)} className="btn-primary h-9">
          <Plus size={16} /> Nouvelle Facture
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par n° ou client..."
            className="w-full h-9 pl-9 pr-4 glass-input text-sm"
          />
        </div>
        <div className="flex gap-1">
          {([
            { key: 'all', label: `Tous (${statusCounts.all})` },
            { key: 'paid', label: `Payées (${statusCounts.paid})` },
            { key: 'pending', label: `En attente (${statusCounts.pending})` },
            { key: 'overdue', label: `En retard (${statusCounts.overdue})` },
            { key: 'draft', label: `Brouillons (${statusCounts.draft})` },
          ]).map(s => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                statusFilter === s.key
                  ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-medium'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="btn-secondary h-9">
          <Download size={14} /> Export
        </button>
      </div>

      {/* Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">N° Facture</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Client</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Échéance</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Montant TTC</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv, i) => (
                <motion.tr
                  key={inv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-[var(--accent-primary)]" />
                      <span className="text-sm font-medium text-[var(--text-primary)]">{inv.number}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-[var(--text-primary)]">{inv.clientName}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{inv.clientEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {new Date(inv.date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">
                    {new Date(inv.dueDate).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)] text-right">
                    {formatXAF(inv.total)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={inv.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Voir"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => showToast('Facture envoyée par email', 'success')}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors"
                        title="Envoyer"
                      >
                        <Send size={14} />
                      </button>
                      <button
                        onClick={() => showToast('Téléchargement PDF...', 'info')}
                        className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-secondary)] transition-colors"
                        title="PDF"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* New Invoice Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowDrawer(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--glass-border)] z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvelle Facture</h2>
                  <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-white/5">
                    <X size={18} className="text-[var(--text-muted)]" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Client</label>
                    <select className="w-full h-10 px-3 glass-input text-sm">
                      <option>Société Générale Cameroun</option>
                      <option>MTN Cameroun</option>
                      <option>Ecobank Cameroun</option>
                      <option>Orange Cameroun</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Date</label>
                      <input type="date" className="w-full h-10 px-3 glass-input text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Échéance</label>
                      <input type="date" className="w-full h-10 px-3 glass-input text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Lignes de facture</label>
                    <div className="space-y-2">
                      {[{ desc: 'Services connectivité', qty: 1, price: 12500000 }].map((line, i) => (
                        <div key={i} className="glass-card-compact p-3 space-y-2">
                          <input defaultValue={line.desc} className="w-full h-8 px-2 glass-input text-sm" placeholder="Description" />
                          <div className="grid grid-cols-3 gap-2">
                            <input type="number" defaultValue={line.qty} className="h-8 px-2 glass-input text-sm" placeholder="Qté" />
                            <input type="number" defaultValue={line.price} className="h-8 px-2 glass-input text-sm" placeholder="Prix unitaire" />
                            <div className="h-8 flex items-center px-2 text-sm text-[var(--text-primary)]">
                              {formatXAF(line.qty * line.price)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button className="w-full py-2 text-xs text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 rounded-lg transition-colors">
                        + Ajouter une ligne
                      </button>
                    </div>
                  </div>

                  <div className="glass-card-compact p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Sous-total</span>
                      <span className="text-[var(--text-primary)]">{formatXAF(12500000)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">TVA (20%)</span>
                      <span className="text-[var(--text-primary)]">{formatXAF(2500000)}</span>
                    </div>
                    <div className="h-px bg-[var(--divider)]" />
                    <div className="flex justify-between">
                      <span className="font-semibold text-[var(--text-primary)]">Total TTC</span>
                      <span className="font-bold text-lg text-[var(--accent-primary)]">{formatXAF(15000000)}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Notes</label>
                    <textarea className="w-full h-20 p-3 glass-input text-sm resize-none" placeholder="Conditions de paiement, commentaires..." />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowDrawer(false)} className="flex-1 btn-ghost h-10 justify-center">
                      Annuler
                    </button>
                    <button onClick={() => { showToast('Brouillon enregistré', 'success'); setShowDrawer(false); }} className="flex-1 btn-secondary h-10 justify-center">
                      Enregistrer
                    </button>
                    <button onClick={() => { showToast('Facture émise avec succès', 'success'); setShowDrawer(false); }} className="flex-1 btn-primary h-10 justify-center">
                      Émettre
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* View Invoice Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setSelectedInvoice(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">{selectedInvoice.number}</h2>
                  <button onClick={() => setSelectedInvoice(null)} className="p-2 rounded-lg hover:bg-white/5">
                    <X size={18} className="text-[var(--text-muted)]" />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Client</span>
                    <span className="text-[var(--text-primary)]">{selectedInvoice.clientName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Date</span>
                    <span className="text-[var(--text-primary)]">{new Date(selectedInvoice.date).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Échéance</span>
                    <span className="text-[var(--text-primary)]">{new Date(selectedInvoice.dueDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Statut</span>
                    <StatusBadge status={selectedInvoice.status} />
                  </div>
                  <div className="h-px bg-[var(--divider)]" />
                  {selectedInvoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">{item.description}</span>
                      <span className="text-[var(--text-primary)] font-medium">{formatXAF(item.total)}</span>
                    </div>
                  ))}
                  <div className="h-px bg-[var(--divider)]" />
                  <div className="flex justify-between">
                    <span className="font-semibold text-[var(--text-primary)]">Total TTC</span>
                    <span className="font-bold text-lg text-[var(--accent-primary)]">{formatXAF(selectedInvoice.total)}</span>
                  </div>
                  {selectedInvoice.notes && (
                    <p className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] p-2 rounded-lg">{selectedInvoice.notes}</p>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
