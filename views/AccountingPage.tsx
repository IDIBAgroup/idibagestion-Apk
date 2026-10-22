import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronRight, ChevronDown, Plus, X, BookOpen,
  BarChart3, FileText, TrendingUp, TrendingDown, Download, Calendar
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import type { ChartAccount, AccountingEntry, FinancialReport } from '@/types';
import { filterOhadaChart, getOhadaChart, OHADA_POSTING_ACCOUNTS } from '@/data/ohada-chart';
import { OHADA_CURRENCY_CODES } from '@/lib/ohada/countries';
import { usePlatformFinancialSettings } from '@/hooks/usePlatformFinancialSettings';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { trpc } from '@/providers/trpc';
import { summarizeAccountingEntries } from '@/lib/accounting/journal';

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
  const { currency } = usePlatformFinancialSettings();
  const { companyId } = useActiveCompany();
  const utils = trpc.useUtils();
  const entriesQuery = trpc.accounting.journal.list.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const reportsQuery = trpc.accounting.report.list.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const periodsQuery = trpc.accounting.period.list.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const salesDocumentsQuery = trpc.salesDocument.list.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const [activeTab, setActiveTab] = useState<'chart' | 'entries' | 'ledger' | 'trialBalance' | 'reports'>('chart');
  const [search, setSearch] = useState('');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const [reportType, setReportType] = useState<'income_statement' | 'balance_sheet' | 'cash_flow'>('income_statement');
  const [reportPeriod, setReportPeriod] = useState(String(new Date().getFullYear()));
  const [transactionCurrency, setTransactionCurrency] = useState(currency);
  const [exchangeRate, setExchangeRate] = useState('1');
  const [ledgerAccountCode, setLedgerAccountCode] = useState('4111');
  const [ledgerCursor, setLedgerCursor] = useState<{ date: string; entryId: string; lineNumber: number } | null>(null);
  const trialBalanceQuery = trpc.accounting.trialBalance.list.useQuery(
    { companyId: companyId ?? 0, fiscalYear: Number(reportPeriod) },
    { enabled: Boolean(companyId) && activeTab === 'trialBalance' },
  );
  const ledgerQuery = trpc.accounting.ledger.list.useQuery(
    { companyId: companyId ?? 0, accountCode: ledgerAccountCode, fiscalYear: Number(reportPeriod), cursor: ledgerCursor ?? undefined },
    { enabled: Boolean(companyId) && activeTab === 'ledger' },
  );

  // New entry form state
  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().split('T')[0],
    pieceNumber: `PC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    journal: 'VEN',
    label: '',
    analyticCode: '',
    debitAccountCode: '4111',
    creditAccountCode: '706',
    amount: 500000,
  });

  useEffect(() => { setCurrentPageTitle('Comptabilité SYSCOHADA'); }, [setCurrentPageTitle]);
  useEffect(() => { setLedgerCursor(null); }, [ledgerAccountCode, reportPeriod]);

  const chartAccounts = getOhadaChart();
  const entries = (entriesQuery.data ?? []) as AccountingEntry[];
  const invoices = (salesDocumentsQuery.data ?? []).filter((document) => document.kind === 'invoice');
  const reports = (reportsQuery.data ?? []) as FinancialReport[];
  const fiscalPeriods = periodsQuery.data?.periods ?? [];
  const selectedFiscalPeriod = fiscalPeriods.find((period) => period.fiscalYear === Number(reportPeriod));
  const selectedPeriodStatus = selectedFiscalPeriod?.status ?? 'open';

  const filteredAccounts = filterOhadaChart(chartAccounts, search);

  const totalDebit = entries.reduce((s, e) => s + e.debit, 0);
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0);

  const formatXAF = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);

  // Financial report calculations
  const reportData = useMemo(() => summarizeAccountingEntries(entries), [entries]);
  const generateReport = trpc.accounting.report.generate.useMutation({
    onSuccess: async () => {
      if (companyId) await utils.accounting.report.list.invalidate({ companyId });
      showToast('Rapport enregistré dans l’entreprise.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const closeFiscalPeriod = trpc.accounting.period.close.useMutation({
    onSuccess: async () => {
      if (companyId) await utils.accounting.period.list.invalidate({ companyId });
      showToast('Exercice clôturé. Les nouvelles écritures sur cette période sont bloquées.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const reopenFiscalPeriod = trpc.accounting.period.reopen.useMutation({
    onSuccess: async () => {
      if (companyId) await utils.accounting.period.list.invalidate({ companyId });
      showToast('Exercice réouvert.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const postEntry = trpc.accounting.journal.postEntry.useMutation({
    onSuccess: async (posted) => {
      if (companyId) await utils.accounting.journal.list.invalidate({ companyId });
      setEntryForm((current) => ({ ...current, date: new Date().toISOString().slice(0, 10), pieceNumber: `PC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, label: '', amount: 0 }));
      setShowEntryForm(false);
      showToast(`Écriture équilibrée de ${posted[0]?.debit.toLocaleString('fr-FR')} ${currency} enregistrée.`, 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const handleGenerateReport = () => {
    if (companyId) generateReport.mutate({ companyId, type: reportType, fiscalYear: Number(reportPeriod) });
  };

  const downloadReport = (report: FinancialReport) => {
    const rows = [['Indicator', 'Amount', currency], ...Object.entries(report.data).map(([key, value]) => [key, String(value), currency])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport-${report.type}-${report.period}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportEntriesCsv = () => {
    const rows = [['Date', 'Journal', 'Pièce', 'Compte', 'Libellé', 'Axe analytique', 'Montant opération', 'Devise opération', 'Taux conversion', 'Devise de base', 'Débit base', 'Crédit base'], ...entries.map((entry) => [entry.date, entry.journal, entry.pieceNumber, entry.accountCode, entry.label, entry.analyticCode || '', String(entry.transactionAmount ?? ''), entry.transactionCurrency || '', String(entry.exchangeRate ?? ''), entry.baseCurrency || currency, String(entry.debit), String(entry.credit)])];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(';')).join('\r\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' }));
    link.download = `ecritures-comptables-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
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
        <button onClick={() => setActiveTab('ledger')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'ledger' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
          <BookOpen size={14} /> Grand livre
        </button>
        <button onClick={() => setActiveTab('trialBalance')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'trialBalance' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
          <FileText size={14} /> Balance générale
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
            <div className="flex gap-2"><button onClick={exportEntriesCsv} className="btn-secondary h-9"><Download size={14} /> Exporter CSV</button><button onClick={() => setShowEntryForm(true)} className="btn-primary h-9"><Plus size={16} /> Nouvelle Écriture</button></div>
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
                {Array.from({ length: 7 }, (_, index) => new Date().getFullYear() - index).map((year) => <option key={year} value={year}>{year}</option>)}
              </select>
              <button onClick={handleGenerateReport} disabled={generateReport.isPending} className="btn-primary h-9 disabled:opacity-50"><BarChart3 size={14} /> {generateReport.isPending ? 'Génération…' : 'Générer'}</button>
              <span className={`rounded px-2.5 py-1 text-xs ${selectedPeriodStatus === 'closed' ? 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]' : 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]'}`}>
                Exercice {selectedFiscalPeriod?.label ?? reportPeriod} · {selectedPeriodStatus === 'closed' ? 'Clôturé' : 'Ouvert'}
              </span>
              {periodsQuery.data?.canClose && selectedPeriodStatus === 'open' && <button type="button" onClick={() => companyId && closeFiscalPeriod.mutate({ companyId, fiscalYear: Number(reportPeriod) })} disabled={closeFiscalPeriod.isPending} className="btn-secondary h-9 disabled:opacity-50">{closeFiscalPeriod.isPending ? 'Clôture…' : 'Clôturer l’exercice'}</button>}
              {periodsQuery.data?.canReopen && selectedPeriodStatus === 'closed' && <button type="button" onClick={() => companyId && reopenFiscalPeriod.mutate({ companyId, fiscalYear: Number(reportPeriod) })} disabled={reopenFiscalPeriod.isPending} className="btn-secondary h-9 disabled:opacity-50">{reopenFiscalPeriod.isPending ? 'Réouverture…' : 'Réouvrir l’exercice'}</button>}
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
                      <button onClick={() => downloadReport(report)} aria-label={`Télécharger le rapport ${report.period}`} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors">
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

      {activeTab === 'ledger' && (
        <GlassCard>
          <div className="space-y-4 p-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Grand livre par compte</h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Solde d’ouverture, mouvements et solde progressif pour l’exercice sélectionné.</p>
              </div>
              <label className="w-full max-w-xs text-xs text-[var(--text-secondary)]">
                Compte SYSCOHADA
                <select value={ledgerAccountCode} onChange={(event) => { setLedgerAccountCode(event.target.value); setLedgerCursor(null); }} className="mt-1 h-9 w-full px-2 glass-input text-sm">
                  {OHADA_POSTING_ACCOUNTS.map((account) => <option key={account.code} value={account.code}>{account.code} — {account.label}</option>)}
                </select>
              </label>
            </div>
            {ledgerQuery.isLoading ? <p className="py-8 text-center text-sm text-[var(--text-muted)]">Chargement du grand livre…</p> : ledgerQuery.error ? <p role="alert" className="py-8 text-center text-sm text-[var(--accent-danger)]">{ledgerQuery.error.message}</p> : ledgerQuery.data && (
              <>
                <div className="flex flex-wrap justify-between gap-2 rounded-lg bg-[var(--bg-elevated)] px-3 py-2 text-xs">
                  <span className="text-[var(--text-secondary)]">{ledgerQuery.data.accountCode} · {ledgerQuery.data.accountLabel} · {ledgerQuery.data.period}</span>
                  <span className="font-medium text-[var(--text-primary)]">Solde d’ouverture : {formatXAF(ledgerQuery.data.openingBalance)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px] text-left text-xs">
                    <thead className="border-b border-[var(--divider)] text-[var(--text-muted)]"><tr>{['Date', 'Journal', 'Pièce', 'Libellé', 'Débit', 'Crédit', 'Solde'].map((label) => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}</tr></thead>
                    <tbody className="divide-y divide-[var(--divider)]">
                      {ledgerQuery.data.entries.map((entry) => <tr key={`${entry.entryId}-${entry.lineNumber}`} className="text-[var(--text-primary)]">
                        <td className="px-3 py-2 whitespace-nowrap">{entry.date}</td><td className="px-3 py-2">{entry.journal}</td><td className="px-3 py-2 font-mono">{entry.pieceNumber}</td><td className="px-3 py-2">{entry.label}</td>
                        <td className="px-3 py-2 text-right">{entry.debit ? formatXAF(entry.debit) : '—'}</td><td className="px-3 py-2 text-right">{entry.credit ? formatXAF(entry.credit) : '—'}</td><td className="px-3 py-2 text-right font-semibold">{formatXAF(entry.balance)}</td>
                      </tr>)}
                      {!ledgerQuery.data.entries.length && <tr><td colSpan={7} className="px-3 py-8 text-center text-[var(--text-muted)]">Aucun mouvement sur ce compte pour cet exercice.</td></tr>}
                    </tbody>
                  </table>
                </div>
                {ledgerQuery.data.nextCursor && <div className="flex justify-end"><button type="button" onClick={() => setLedgerCursor(ledgerQuery.data!.nextCursor)} disabled={ledgerQuery.isFetching} className="btn-secondary h-9 px-3 text-xs disabled:opacity-50">{ledgerQuery.isFetching ? 'Chargement…' : 'Page suivante'}</button></div>}
              </>
            )}
          </div>
        </GlassCard>
      )}

      {activeTab === 'trialBalance' && (
        <GlassCard>
          <div className="space-y-4 p-4">
            <div><h2 className="text-sm font-semibold text-[var(--text-primary)]">Balance générale</h2><p className="mt-1 text-xs text-[var(--text-muted)]">Soldes d’ouverture, mouvements de l’exercice et soldes de clôture par compte.</p></div>
            {trialBalanceQuery.isLoading ? <p className="py-8 text-center text-sm text-[var(--text-muted)]">Calcul de la balance…</p> : trialBalanceQuery.error ? <p role="alert" className="py-8 text-center text-sm text-[var(--accent-danger)]">{trialBalanceQuery.error.message}</p> : trialBalanceQuery.data && (
              <>
                <div className="text-xs text-[var(--text-secondary)]">Exercice {trialBalanceQuery.data.period} · du {trialBalanceQuery.data.startDate} au {trialBalanceQuery.data.endDate}</div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1000px] text-left text-xs">
                    <thead className="border-b border-[var(--divider)] text-[var(--text-muted)]"><tr>{['Compte', 'Libellé', 'Ouverture débit', 'Ouverture crédit', 'Mouvements débit', 'Mouvements crédit', 'Solde débiteur', 'Solde créditeur'].map((label) => <th key={label} className="px-3 py-2 font-medium">{label}</th>)}</tr></thead>
                    <tbody className="divide-y divide-[var(--divider)]">
                      {trialBalanceQuery.data.rows.map((row) => <tr key={row.accountCode} className="text-[var(--text-primary)]">
                        <td className="px-3 py-2 font-mono font-medium">{row.accountCode}</td><td className="px-3 py-2">{row.accountLabel}</td>
                        <td className="px-3 py-2 text-right">{row.openingDebit ? formatXAF(row.openingDebit) : '—'}</td><td className="px-3 py-2 text-right">{row.openingCredit ? formatXAF(row.openingCredit) : '—'}</td>
                        <td className="px-3 py-2 text-right">{row.debit ? formatXAF(row.debit) : '—'}</td><td className="px-3 py-2 text-right">{row.credit ? formatXAF(row.credit) : '—'}</td>
                        <td className="px-3 py-2 text-right font-medium">{row.closingDebit ? formatXAF(row.closingDebit) : '—'}</td><td className="px-3 py-2 text-right font-medium">{row.closingCredit ? formatXAF(row.closingCredit) : '—'}</td>
                      </tr>)}
                      {!trialBalanceQuery.data.rows.length && <tr><td colSpan={8} className="px-3 py-8 text-center text-[var(--text-muted)]">Aucune écriture comptabilisée pour cet exercice.</td></tr>}
                    </tbody>
                    <tfoot className="border-t border-[var(--divider)] bg-[var(--bg-elevated)] font-semibold text-[var(--text-primary)]"><tr>
                      <td colSpan={2} className="px-3 py-2">Totaux</td>
                      <td className="px-3 py-2 text-right">{formatXAF(trialBalanceQuery.data.totals.openingDebit)}</td><td className="px-3 py-2 text-right">{formatXAF(trialBalanceQuery.data.totals.openingCredit)}</td>
                      <td className="px-3 py-2 text-right">{formatXAF(trialBalanceQuery.data.totals.debit)}</td><td className="px-3 py-2 text-right">{formatXAF(trialBalanceQuery.data.totals.credit)}</td>
                      <td className="px-3 py-2 text-right">{formatXAF(trialBalanceQuery.data.totals.closingDebit)}</td><td className="px-3 py-2 text-right">{formatXAF(trialBalanceQuery.data.totals.closingCredit)}</td>
                    </tr></tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        </GlassCard>
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

                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Axe analytique / centre de coût</label>
                    <input value={entryForm.analyticCode} onChange={e => setEntryForm({ ...entryForm, analyticCode: e.target.value })} className="w-full h-9 px-3 glass-input text-xs" placeholder="Ex. Administration, Projet A, Vente" />
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
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Montant de l’opération *</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select value={transactionCurrency} onChange={e => { setTransactionCurrency(e.target.value); if (e.target.value === currency) setExchangeRate('1'); }} className="h-9 px-2 glass-input text-xs" aria-label="Devise de l’opération">
                        {[...new Set([currency, ...OHADA_CURRENCY_CODES, 'EUR', 'USD'])].map(code => <option key={code} value={code}>{code}</option>)}
                      </select>
                      <input type="number" min="0.000001" step="0.000001" value={transactionCurrency === currency ? 1 : exchangeRate} disabled={transactionCurrency === currency} onChange={e => setExchangeRate(e.target.value)} className="h-9 px-2 glass-input text-xs" aria-label={`Taux ${transactionCurrency} vers ${currency}`} title={`Taux de conversion vers ${currency}`} />
                      <input type="number" min="0.01" step="0.01" value={entryForm.amount} onChange={e => setEntryForm({ ...entryForm, amount: Number(e.target.value) })} className="h-9 px-3 glass-input text-xs font-mono font-bold" aria-label={`Montant en ${transactionCurrency}`} />
                    </div>
                    <p className="mt-1 text-[10px] text-[var(--text-muted)]">Taux saisi manuellement · comptabilisation : {(entryForm.amount * (transactionCurrency === currency ? 1 : Number(exchangeRate) || 0)).toLocaleString('fr-FR')} {currency}</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowEntryForm(false)} className="flex-1 btn-ghost h-9 text-xs justify-center">Annuler</button>
                    <button
                      onClick={() => {
                        const rate = transactionCurrency === currency ? 1 : Number(exchangeRate);
                        if (!companyId) { showToast('Sélectionnez une entreprise avant de comptabiliser une écriture.', 'warning'); return; }
                        if (!entryForm.label.trim() || !entryForm.pieceNumber.trim() || entryForm.amount <= 0 || !Number.isFinite(rate) || rate <= 0) {
                          showToast('Renseignez la pièce, le libellé, le montant et un taux valides.', 'warning');
                          return;
                        }
                        postEntry.mutate({
                          companyId, date: entryForm.date, pieceNumber: entryForm.pieceNumber.trim(),
                          journal: entryForm.journal as 'VEN' | 'ACH' | 'BNQ' | 'CAI' | 'OD',
                          label: entryForm.label.trim(), analyticCode: entryForm.analyticCode.trim() || undefined,
                          debitAccountCode: entryForm.debitAccountCode, creditAccountCode: entryForm.creditAccountCode,
                          amount: entryForm.amount, transactionCurrency, exchangeRate: rate,
                        });
                      }}
                      disabled={postEntry.isPending}
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
