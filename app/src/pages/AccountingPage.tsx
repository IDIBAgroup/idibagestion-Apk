import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ChevronDown, Plus, X, BookOpen } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';
import type { ChartAccount, AccountingEntry } from '@/types';

function TreeNode({ account, depth = 0 }: { account: ChartAccount; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = account.children && account.children.length > 0;

  return (
    <div>
      <button
        onClick={() => hasChildren && setExpanded(!expanded)}
        className="flex items-center gap-2 w-full py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors text-left"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          expanded ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />
        ) : (
          <div className="w-3.5" />
        )}
        <span className="text-sm font-medium text-[var(--accent-primary)] w-16 shrink-0">{account.code}</span>
        <span className="text-sm text-[var(--text-primary)]">{account.label}</span>
        <span className="text-[10px] text-[var(--text-muted)] ml-auto">{account.category}</span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {account.children!.map(child => (
              <TreeNode key={child.id} account={child} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AccountingPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'chart' | 'entries'>('chart');
  const [search, setSearch] = useState('');
  const [showEntryForm, setShowEntryForm] = useState(false);

  useEffect(() => { setCurrentPageTitle('Comptabilité SYSCOHADA'); }, [setCurrentPageTitle]);

  const chartAccounts = getAll('chartAccounts') as ChartAccount[];
  const entries = getAll('accountingEntries') as AccountingEntry[];

  const filteredAccounts = chartAccounts.filter(acc => {
    if (!search) return true;
    return acc.code.includes(search) || acc.label.toLowerCase().includes(search.toLowerCase());
  });

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  const formatXAF = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5 w-fit">
        <button
          onClick={() => setActiveTab('chart')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'chart' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
          }`}
        >
          <BookOpen size={14} /> Plan Comptable
        </button>
        <button
          onClick={() => setActiveTab('entries')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
            activeTab === 'entries' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
          }`}
        >
          Écritures Comptables
        </button>
      </div>

      {activeTab === 'chart' && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher par code ou libellé..."
                className="w-full h-9 pl-9 pr-4 glass-input text-sm"
              />
            </div>
          </div>

          <GlassCard>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredAccounts.map(acc => (
                <TreeNode key={acc.id} account={acc} />
              ))}
            </div>
          </GlassCard>
        </>
      )}

      {activeTab === 'entries' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)]">Total Débit:</span>
                <span className="font-semibold text-[var(--text-primary)]">{formatXAF(totalDebit)}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)]">Total Crédit:</span>
                <span className="font-semibold text-[var(--text-primary)]">{formatXAF(totalCredit)}</span>
              </div>
              <div className={`flex items-center gap-2 text-xs px-2 py-0.5 rounded-full ${
                totalDebit === totalCredit ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]'
              }`}>
                {totalDebit === totalCredit ? 'Équilibré ✓' : 'Déséquilibre !'}
              </div>
            </div>
            <button onClick={() => setShowEntryForm(true)} className="btn-primary h-9">
              <Plus size={16} /> Nouvelle Écriture
            </button>
          </div>

          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--divider)]">
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Date</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Pièce</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Journal</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Compte</th>
                    <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Libellé</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Débit</th>
                    <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Crédit</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, i) => (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-2.5 text-xs font-medium text-[var(--text-primary)]">{entry.pieceNumber}</td>
                      <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{entry.journal}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs font-medium text-[var(--accent-primary)]">{entry.accountCode}</span>
                        <span className="text-[10px] text-[var(--text-muted)] ml-1">{entry.accountLabel}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{entry.label}</td>
                      <td className="px-4 py-2.5 text-xs text-right text-[var(--text-primary)]">{entry.debit > 0 ? formatXAF(entry.debit) : '-'}</td>
                      <td className="px-4 py-2.5 text-xs text-right text-[var(--text-primary)]">{entry.credit > 0 ? formatXAF(entry.credit) : '-'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Entry Form Modal */}
          <AnimatePresence>
            {showEntryForm && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowEntryForm(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card z-50 max-h-[85vh] overflow-y-auto"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvelle Écriture</h2>
                      <button onClick={() => setShowEntryForm(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Date</label><input type="date" className="w-full h-9 px-2 glass-input text-sm" /></div>
                        <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Journal</label><select className="w-full h-9 px-2 glass-input text-sm"><option>ACH</option><option>VEN</option><option>BNQ</option><option>OD</option></select></div>
                      </div>
                      <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Libellé</label><input className="w-full h-9 px-2 glass-input text-sm" placeholder="Libellé de l'opération" /></div>
                      <div className="glass-card-compact p-3 space-y-2">
                        <p className="text-xs font-medium text-[var(--text-primary)]">Ligne 1 (Débit)</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input className="h-8 px-2 glass-input text-sm" placeholder="Compte" />
                          <input type="number" className="h-8 px-2 glass-input text-sm" placeholder="Montant débit" />
                        </div>
                      </div>
                      <div className="glass-card-compact p-3 space-y-2">
                        <p className="text-xs font-medium text-[var(--text-primary)]">Ligne 2 (Crédit)</p>
                        <div className="grid grid-cols-2 gap-2">
                          <input className="h-8 px-2 glass-input text-sm" placeholder="Compte" />
                          <input type="number" className="h-8 px-2 glass-input text-sm" placeholder="Montant crédit" />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowEntryForm(false)} className="flex-1 btn-ghost h-9 justify-center">Annuler</button>
                        <button onClick={() => { showToast('Écriture enregistrée', 'success'); setShowEntryForm(false); }} className="flex-1 btn-primary h-9 justify-center">Enregistrer</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
