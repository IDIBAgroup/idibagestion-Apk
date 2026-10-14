import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronRight, ChevronDown, Plus, X, BookOpen,
  BarChart3, FileText, TrendingUp, TrendingDown, Download, Calendar
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify } from '@/lib/db';
import type { ChartAccount, AccountingEntry, FinancialReport, Invoice } from '@/types';
import { filterOhadaChart, getOhadaChart, OHADA_POSTING_ACCOUNTS } from '@/data/ohada-chart';

function TreeNode({ account, depth = 0 }: { account: ChartAccount; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = account.children && account.children.length > 0;
  return (
    <div>
      <button onClick={() => hasChildren && setExpanded(!expanded)} className="flex items-center gap-2 w-full py-1.5 px-2 rounded-lg hover:bg-white/[0.02] transition-colors text-left" style={{ paddingLeft: `${depth * 16 + 8}px` }}>
        {hasChildren ? (expanded ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />) : <div className="w-3.5" />}
        <span className="text-sm font-medium text-[var(--accent-primary)] w-16 shrink-0">{account.code}</span>
        <span className="text-sm text-[var(--text-primary)]">{account.label}</span>
        <span className="text-[10px] text-[var(--text-muted)] ml-auto">{account.category}</span>
      </button>
      <AnimatePresence initial={false}>
        {expanded && hasChildren && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            {account.children!.map(child => <TreeNode key={child.id} account={child} depth={depth + 1} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AccountingPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'chart' | 'entries' | 'reports'>('chart');
  const [search, setSearch] = useState('');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [reportType, setReportType] = useState<'income_statement' | 'balance_sheet' | 'cash_flow'>('income_statement');
  const [reportPeriod, setReportPeriod] = useState('2024');

  // New entry form state
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    pieceNumber: `PC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    journal: 'VEN',
    label: '',
    debitAccountCode: '4111',
    creditAccountCode: '7061',
    amount: 500000,
  });

  useEffect(() => { setCurrentPageTitle('Comptabilité SYSCOHADA'); }, [setCurrentPageTitle]);

  const chartAccounts = getOhadaChart(getAll('chartAccounts') as ChartAccount[]);
  const entries = getAll('accountingEntries') as AccountingEntry[];
  const invoices = getAll('invoices') as Invoice[];
  const reports = (getAll('financialReports') as FinancialReport[]) || [];

  const filteredAccounts = filterOhadaChart(chartAccounts, search);

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  const formatXAF = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount);

  // Financial report calculations
  const reportData = useMemo(() => {
    const revenue = entries.filter(e => e.accountCode.startsWith('7')).reduce((s, e) => s + e.credit - e.debit, 0);
    const expenses = entries.filter(e => e.accountCode.startsWith('6')).reduce((s, e) => s + e.debit - e.credit, 0);
    const assets = entries.filter(e => e.accountCode.startsWith('2') || e.accountCode.startsWith('3') || e.accountCode.startsWith('4') || e.accountCode.startsWith('5')).reduce((s, e) => s + e.debit - e.credit, 0);
    const liabilities = entries.filter(e => e.accountCode.startsWith('1')).reduce((s, e) => s + e.credit - e.debit, 0);
    const cashIn = entries.filter(e => e.accountCode.startsWith('7') || (e.accountCode.startsWith('4') && e.credit > 0)).reduce((s, e) => s + e.credit, 0);
    const cashOut = entries.filter(e => e.accountCode.startsWith('6') || (e.accountCode.startsWith('4') && e.debit > 0)).reduce((s, e) => s + e.debit, 0);
    return { revenue, expenses, netIncome: revenue - expenses, assets, liabilities, equity: assets - liabilities, cashIn, cashOut, netCash: cashIn - cashOut };
  }, [entries]);

  const handleGenerateReport = () => {
    const report: FinancialReport = {
      id: `report-${Date.now()}`,
      type: reportType,
      period: reportPeriod,
      startDate: `${reportPeriod}-01-01`,
      endDate: `${reportPeriod}-12-31`,
      data: reportData as unknown as Record<string, number>,
      generatedAt: new Date().toISOString(),
      generatedBy: 'user-1',
      companyId: 'comp-1',
    };
    addAndNotify('financialReports', report);
    showToast('Rapport généré avec succès', 'success');
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5 w-fit">
        <button onClick={() => setActiveTab('chart')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'chart' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
          <BookOpen size={14} /> Plan Comptable
        </button>
        <button onClick={() => setActiveTab('entries')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'entries' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
          Écritures Comptables
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'reports' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
          <BarChart3 size={14} /> Rapports Financiers
        </button>
      </div>

      {activeTab === 'chart' && (
        <>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher par code ou libellé..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
            </div>
          </div>
          <GlassCard>
            <div className="p-4 max-h-[600px] overflow-y-auto">
              {filteredAccounts.map(acc => <TreeNode key={acc.id} account={acc} />)}
            </div>
          </GlassCard>
        </>
      )}

      {activeTab === 'entries' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <div className="flex items-center gap-2 text-xs"><span className="text-[var(--text-muted)]">Total Débit:</span><span className="font-semibold text-[var(--text-primary)]">{formatXAF(totalDebit)}</span></div>
              <div className="flex items-center gap-2 text-xs"><span className="text-[var(--text-muted)]">Total Crédit:</span><span className="font-semibold text-[var(--text-primary)]">{formatXAF(totalCredit)}</span></div>
              <div className={`flex items-center gap-2 text-xs px-2 py-0.5 rounded-full ${totalDebit === totalCredit ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]'}`}>
                {totalDebit === totalCredit ? 'Équilibré ✓' : 'Déséquilibre !'}
              </div>
            </div>
            <button onClick={() => setShowEntryForm(true)} className="btn-primary h-9"><Plus size={16} /> Nouvelle Écriture</button>
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
                    <motion.tr key={entry.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-4 py-2.5 text-xs font-medium text-[var(--text-primary)]">{entry.pieceNumber}</td>
                      <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{entry.journal}</td>
                      <td className="px-4 py-2.5"><span className="text-xs font-medium text-[var(--accent-primary)]">{entry.accountCode}</span><span className="text-[10px] text-[var(--text-muted)] ml-1">{entry.accountLabel}</span></td>
                      <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{entry.label}</td>
                      <td className="px-4 py-2.5 text-xs text-right text-[var(--text-primary)]">{entry.debit > 0 ? formatXAF(entry.debit) : '-'}</td>
                      <td className="px-4 py-2.5 text-xs text-right text-[var(--text-primary)]">{entry.credit > 0 ? formatXAF(entry.credit) : '-'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-4">
          {/* Report Generator */}
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-[var(--accent-primary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">Générer un rapport</span>
              </div>
              <select value={reportType} onChange={(e) => setReportType(e.target.value as any)} className="h-9 px-3 glass-input text-sm">
                <option value="income_statement">État de Résultat</option>
                <option value="balance_sheet">Bilan</option>
                <option value="cash_flow">Flux de Trésorerie</option>
              </select>
              <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)} className="h-9 px-3 glass-input text-sm">
                <option value="2024">2024</option>
                <option value="2023">2023</option>
              </select>
              <button onClick={handleGenerateReport} className="btn-primary h-9"><BarChart3 size={14} /> Générer</button>
            </div>
          </GlassCard>

          {/* Report Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Income Statement */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-[var(--accent-primary)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">État de Résultat</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Chiffre d'affaires (Classe 7)</span><span className="text-[var(--accent-primary)] font-medium">{formatXAF(reportData.revenue)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Charges d'exploitation (Classe 6)</span><span className="text-[var(--accent-danger)] font-medium">{formatXAF(reportData.expenses)}</span></div>
                <div className="h-px bg-[var(--divider)]" />
                <div className="flex justify-between"><span className="font-semibold text-[var(--text-primary)]">Résultat Net</span><span className={`font-bold text-lg ${reportData.netIncome >= 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-danger)]'}`}>{formatXAF(reportData.netIncome)}</span></div>
                <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${Math.min(100, Math.max(0, (reportData.revenue / (reportData.revenue + reportData.expenses || 1)) * 100))}%` }} />
                </div>
              </div>
            </GlassCard>

            {/* Balance Sheet */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingDown size={18} className="text-[var(--accent-secondary)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Bilan</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Actif Total</span><span className="text-[var(--accent-primary)] font-medium">{formatXAF(reportData.assets)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Passif Total</span><span className="text-[var(--accent-danger)] font-medium">{formatXAF(reportData.liabilities)}</span></div>
                <div className="h-px bg-[var(--divider)]" />
                <div className="flex justify-between"><span className="font-semibold text-[var(--text-primary)]">Capitaux Propres</span><span className={`font-bold text-lg ${reportData.equity >= 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-danger)]'}`}>{formatXAF(reportData.equity)}</span></div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="glass-card-compact p-2 text-center">
                    <p className="text-xs text-[var(--text-muted)]">Actif / Passif</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{reportData.liabilities > 0 ? (reportData.assets / reportData.liabilities).toFixed(2) : 'N/A'}</p>
                  </div>
                  <div className="glass-card-compact p-2 text-center">
                    <p className="text-xs text-[var(--text-muted)]">Rentabilité</p>
                    <p className="text-sm font-bold text-[var(--text-primary)]">{reportData.revenue > 0 ? ((reportData.netIncome / reportData.revenue) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Cash Flow */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-[var(--accent-warning)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Flux de Trésorerie</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Entrées de trésorerie</span><span className="text-[var(--accent-primary)] font-medium">{formatXAF(reportData.cashIn)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-[var(--text-secondary)]">Sorties de trésorerie</span><span className="text-[var(--accent-danger)] font-medium">{formatXAF(reportData.cashOut)}</span></div>
                <div className="h-px bg-[var(--divider)]" />
                <div className="flex justify-between"><span className="font-semibold text-[var(--text-primary)]">Flux Net</span><span className={`font-bold text-lg ${reportData.netCash >= 0 ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-danger)]'}`}>{formatXAF(reportData.netCash)}</span></div>
              </div>
            </GlassCard>

            {/* KPIs */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={18} className="text-[var(--accent-info)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Indicateurs Clés</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="glass-card-compact p-3">
                  <p className="text-xs text-[var(--text-muted)]">Marge brute</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{reportData.revenue > 0 ? ((reportData.netIncome / reportData.revenue) * 100).toFixed(1) : 0}%</p>
                </div>
                <div className="glass-card-compact p-3">
                  <p className="text-xs text-[var(--text-muted)]">Ratio endettement</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{reportData.equity > 0 ? (reportData.liabilities / reportData.equity).toFixed(2) : 'N/A'}</p>
                </div>
                <div className="glass-card-compact p-3">
                  <p className="text-xs text-[var(--text-muted)]">Factures en retard</p>
                  <p className="text-lg font-bold text-[var(--accent-danger)]">{invoices.filter(i => i.status === 'overdue').length}</p>
                </div>
                <div className="glass-card-compact p-3">
                  <p className="text-xs text-[var(--text-muted)]">Chiffre facturé</p>
                  <p className="text-lg font-bold text-[var(--accent-primary)]">{formatXAF(invoices.filter(i => i.status !== 'draft').reduce((s, i) => s + i.total, 0))}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Generated Reports History */}
          {reports.length > 0 && (
            <GlassCard>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Rapports générés</h3>
                <div className="space-y-2">
                  {reports.map(report => (
                    <div key={report.id} className="flex items-center justify-between glass-card-compact p-3">
                      <div className="flex items-center gap-3">
                        <FileText size={14} className="text-[var(--accent-primary)]" />
                        <div>
                          <p className="text-sm text-[var(--text-primary)]">
                            {report.type === 'income_statement' ? 'État de Résultat' : report.type === 'balance_sheet' ? 'Bilan' : 'Flux de Trésorerie'}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">{report.period} — Généré le {new Date(report.generatedAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <button className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                        <Download size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Entry Form Modal */}
      <AnimatePresence>
        {showEntryForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowEntryForm(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--glass-border)] z-50 max-h-screen overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvelle Écriture Comptable OHADA</h2>
                  <button onClick={() => setShowEntryForm(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Date d'opération</label>
                      <input type="date" value={entryForm.date} onChange={e => setEntryForm({ ...entryForm, date: e.target.value })} className="w-full h-9 px-2 glass-input text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Code Journal</label>
                      <select value={entryForm.journal} onChange={e => setEntryForm({ ...entryForm, journal: e.target.value })} className="w-full h-9 px-2 glass-input text-xs">
                        <option value="VEN">VEN (Ventes)</option>
                        <option value="ACH">ACH (Achats)</option>
                        <option value="BNQ">BNQ (Banque)</option>
                        <option value="CAI">CAI (Caisse)</option>
                        <option value="OD">OD (Opérations Diverses)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">N° Pièce Justificative & Libellé</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input value={entryForm.pieceNumber} onChange={e => setEntryForm({ ...entryForm, pieceNumber: e.target.value })} className="h-9 px-2 glass-input text-xs font-mono" placeholder="N° Pièce" />
                      <input value={entryForm.label} onChange={e => setEntryForm({ ...entryForm, label: e.target.value })} className="col-span-2 h-9 px-2 glass-input text-xs" placeholder="Ex: Facture Vente Client SGC" />
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <p className="text-xs font-bold text-[var(--accent-primary)]">Ligne 1 — Débit</p>
                    <select
                      value={entryForm.debitAccountCode}
                      onChange={e => setEntryForm({ ...entryForm, debitAccountCode: e.target.value })}
                      className="w-full h-9 px-2 glass-input text-xs"
                    >
                      {OHADA_POSTING_ACCOUNTS.map(a => (
                        <option key={a.code} value={a.code}>{a.code} — {a.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
                    <p className="text-xs font-bold text-[var(--accent-secondary)]">Ligne 2 — Crédit</p>
                    <select
                      value={entryForm.creditAccountCode}
                      onChange={e => setEntryForm({ ...entryForm, creditAccountCode: e.target.value })}
                      className="w-full h-9 px-2 glass-input text-xs"
                    >
                      {OHADA_POSTING_ACCOUNTS.map(a => (
                        <option key={a.code} value={a.code}>{a.code} — {a.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Montant Équilibré (FCFA) *</label>
                    <input
                      type="number"
                      value={entryForm.amount}
                      onChange={e => setEntryForm({ ...entryForm, amount: Number(e.target.value) })}
                      className="w-full h-9 px-3 glass-input text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowEntryForm(false)} className="flex-1 btn-ghost h-9 text-xs justify-center">Annuler</button>
                    <button
                      onClick={() => {
                        if (!entryForm.label.trim() || entryForm.amount <= 0) {
                          showToast('Veuillez renseigner le libellé et le montant', 'warning');
                          return;
                        }
                        const debitAcc = OHADA_POSTING_ACCOUNTS.find(a => a.code === entryForm.debitAccountCode);
                        const creditAcc = OHADA_POSTING_ACCOUNTS.find(a => a.code === entryForm.creditAccountCode);

                        const entry1: AccountingEntry = {
                          id: `entry-${Date.now()}-1`,
                          date: entryForm.date,
                          pieceNumber: entryForm.pieceNumber,
                          journal: entryForm.journal,
                          accountCode: entryForm.debitAccountCode,
                          accountLabel: debitAcc?.label.split('(')[0].trim() || 'Compte Débit',
                          label: entryForm.label,
                          debit: entryForm.amount,
                          credit: 0,
                          companyId: 'comp-1',
                        };

                        const entry2: AccountingEntry = {
                          id: `entry-${Date.now()}-2`,
                          date: entryForm.date,
                          pieceNumber: entryForm.pieceNumber,
                          journal: entryForm.journal,
                          accountCode: entryForm.creditAccountCode,
                          accountLabel: creditAcc?.label.split('(')[0].trim() || 'Compte Crédit',
                          label: entryForm.label,
                          debit: 0,
                          credit: entryForm.amount,
                          companyId: 'comp-1',
                        };

                        addAndNotify('accountingEntries', entry1);
                        addAndNotify('accountingEntries', entry2);
                        setShowEntryForm(false);
                        showToast(`Écriture équilibrée de ${entryForm.amount.toLocaleString('fr-FR')} FCFA enregistrée !`, 'success');
                      }}
                      className="flex-1 btn-primary h-9 text-xs font-bold justify-center"
                    >
                      Enregistrer l'écriture
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
