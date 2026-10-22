import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { trpc } from '@/providers/trpc';
import { SUBSCRIPTION_FEATURES, isSubscriptionFeatureKey, type SubscriptionFeatureKey } from '@/lib/subscription-features';
import {
  Building2, Users, CreditCard, TrendingUp, Search, Download, RefreshCw,
  CheckCircle, XCircle, Clock
} from 'lucide-react';

type EditablePlan = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  billingCycle: 'monthly' | 'yearly';
  priceXAF: number;
  originalPriceXAF: number | null;
  maxUsers: number | null;
  maxClients: number | null;
  maxInvoices: number | null;
  maxProjects: number | null;
  features: string | null;
  moduleAccess: string | null;
  supportLevel: 'email' | 'priority' | 'dedicated' | null;
  isPopular: boolean | null;
  isEnterprise: boolean | null;
  trialDays: number | null;
  isActive: boolean | null;
};

export function AdminDashboardPage() {
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'subscriptions' | 'companies' | 'plans'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [editingPlan, setEditingPlan] = useState<EditablePlan | null>(null);
  const utils = trpc.useUtils();
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = trpc.admin.stats.useQuery();
  const { data: transactions = [], isLoading: transactionsLoading, isError: transactionsError, refetch: refetchTransactions } = trpc.admin.allTransactions.useQuery();
  const { data: subscriptions = [], isLoading: subscriptionsLoading, isError: subscriptionsError, refetch: refetchSubscriptions } = trpc.admin.allSubscriptions.useQuery();
  const { data: companies = [], isLoading: companiesLoading, isError: companiesError, refetch: refetchCompanies } = trpc.admin.allCompanies.useQuery();
  const { data: revenueByMonth = [], isLoading: revenueLoading, refetch: refetchRevenue } = trpc.admin.revenueByMonth.useQuery();
  const { data: editablePlans = [], isLoading: plansLoading } = trpc.admin.listPlans.useQuery();
  const refreshAll = async () => {
    await Promise.all([refetchStats(), refetchTransactions(), refetchSubscriptions(), refetchCompanies(), refetchRevenue(), utils.admin.listPlans.invalidate()]);
    showToast('Données du serveur actualisées.', 'success');
  };
  const savePlan = trpc.admin.savePlan.useMutation({
    onSuccess: () => {
      showToast('Forfait enregistré.', 'success');
      setEditingPlan(null);
      utils.admin.listPlans.invalidate();
      utils.plan.list.invalidate();
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const setPlanActive = trpc.admin.setPlanActive.useMutation({
    onSuccess: () => {
      utils.admin.listPlans.invalidate();
      utils.plan.list.invalidate();
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const setCompanyStatus = trpc.admin.setCompanyStatus.useMutation({
    onSuccess: () => { showToast('Statut de l’entreprise mis à jour.', 'success'); utils.admin.allCompanies.invalidate(); utils.admin.stats.invalidate(); },
    onError: (error) => showToast(error.message, 'error'),
  });
  const cancelSubscription = trpc.admin.cancelSubscription.useMutation({
    onSuccess: () => { showToast('Abonnement résilié.', 'success'); utils.admin.allSubscriptions.invalidate(); utils.admin.allCompanies.invalidate(); utils.admin.stats.invalidate(); },
    onError: (error) => showToast(error.message, 'error'),
  });
  const reconcileExpirations = trpc.subscription.checkExpired.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.admin.allSubscriptions.invalidate(), utils.admin.allCompanies.invalidate(), utils.admin.stats.invalidate()]);
      showToast('Les abonnements arrivés à échéance ont été vérifiés.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const filteredTransactions = useMemo(() => transactions.filter(tx => {
    const matchesSearch = `${tx.companyName ?? ''} ${tx.planName ?? ''} ${tx.providerTransactionId ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [transactions, searchQuery, statusFilter]);
  const filteredSubscriptions = useMemo(() => subscriptions.filter(sub =>
    `${sub.companyName} ${sub.planName}`.toLowerCase().includes(searchQuery.toLowerCase()) && (statusFilter === 'all' || sub.status === statusFilter)
  ), [subscriptions, searchQuery, statusFilter]);
  const filteredCompanies = useMemo(() => companies.filter(company =>
    `${company.name} ${company.email ?? ''} ${company.country ?? ''}`.toLowerCase().includes(searchQuery.toLowerCase()) && (statusFilter === 'all' || company.status === statusFilter)
  ), [companies, searchQuery, statusFilter]);

  const formatXAF = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`;
  const selectedModuleAccess = (value: string | null) => {
    try {
      const parsed: unknown = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? [...new Set(parsed.filter((key): key is SubscriptionFeatureKey => typeof key === 'string' && isSubscriptionFeatureKey(key)))] : [];
    } catch { return []; }
  };
  const formatDate = (date: Date | string | null | undefined) => date ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(date)) : '—';
  const exportCurrentData = () => {
    const rows = activeTab === 'companies' ? filteredCompanies : activeTab === 'subscriptions' ? filteredSubscriptions : filteredTransactions;
    const columns = activeTab === 'companies'
      ? ['id', 'name', 'email', 'phone', 'country', 'status', 'createdAt']
      : activeTab === 'subscriptions'
        ? ['id', 'companyName', 'planName', 'status', 'billingCycle', 'priceXAF', 'currentPeriodEnd', 'autoRenew']
        : ['id', 'companyName', 'planName', 'type', 'amountXAF', 'paymentMethod', 'status', 'isVerified', 'createdAt', 'providerTransactionId'];
    const csvCell = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const csv = [columns.join(';'), ...rows.map(row => columns.map(column => csvCell((row as Record<string, unknown>)[column])).join(';'))].join('\r\n');
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `idibages-saas-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      completed: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]',
      pending: 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]',
      failed: 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
      refunded: 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]',
      active: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]',
      trial: 'bg-[var(--accent-info)]/10 text-[var(--accent-info)]',
      past_due: 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]',
      cancelled: 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]',
      expired: 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]',
      suspended: 'bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]',
    };
    const labels: Record<string, string> = {
      completed: 'Confirmée', pending: 'En attente', failed: 'Échec', refunded: 'Remboursée',
      active: 'Actif', trial: 'Essai', past_due: 'En retard', cancelled: 'Résilié', expired: 'Expiré', suspended: 'Suspendue',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status] || ''}`}>
        {labels[status] ?? status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Super Admin Dashboard</h1>
            <p className="text-xs text-[var(--text-muted)]">Vue d&apos;ensemble de tous les abonnements et transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={refreshAll} className="btn-ghost h-9 px-3 text-xs gap-1.5" disabled={statsLoading || transactionsLoading || subscriptionsLoading || companiesLoading}>
              <RefreshCw size={14} /> Actualiser
            </button>
            <button onClick={exportCurrentData} className="btn-ghost h-9 px-3 text-xs gap-1.5" disabled={activeTab === 'overview' || activeTab === 'plans'}>
              <Download size={14} /> Exporter
            </button>
            <button onClick={() => reconcileExpirations.mutate()} disabled={reconcileExpirations.isPending} className="btn-ghost h-9 px-3 text-xs gap-1.5">
              <Clock size={14} /> Vérifier les échéances
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[var(--bg-elevated)] w-fit">
          {(['overview', 'transactions', 'subscriptions', 'companies', 'plans'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearchQuery(''); setStatusFilter('all'); }}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'overview' && 'Vue d\'ensemble'}
              {tab === 'transactions' && 'Transactions'}
              {tab === 'subscriptions' && 'Abonnements'}
              {tab === 'companies' && 'Entreprises'}
              {tab === 'plans' && 'Forfaits'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            {statsError && <div className="rounded-lg border border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/5 p-3 text-xs text-[var(--accent-danger)]">Impossible de charger les indicateurs SaaS depuis le serveur.</div>}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              {[
                { label: 'Entreprises', value: statsLoading ? '…' : (stats?.companies ?? 0).toLocaleString('fr-FR'), icon: Building2 },
                { label: 'Abonnements actifs', value: statsLoading ? '…' : (stats?.activeSubscriptions ?? 0).toLocaleString('fr-FR'), icon: Users },
                { label: 'Essais en cours', value: statsLoading ? '…' : (stats?.trialSubscriptions ?? 0).toLocaleString('fr-FR'), icon: Clock },
                { label: 'Revenus vérifiés', value: statsLoading ? '…' : formatXAF(stats?.totalRevenueXAF ?? 0), icon: CreditCard },
                { label: 'MRR estimé', value: statsLoading ? '…' : formatXAF(stats?.mrr ?? 0), icon: TrendingUp },
                { label: 'Paiements en attente', value: statsLoading ? '…' : formatXAF(stats?.pendingRevenueXAF ?? 0), icon: Clock },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <stat.icon size={18} className="text-[var(--accent-primary)]" />
                      <span className="text-[10px] text-[var(--text-muted)]">Données réelles</span>
                    </div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{stat.label}</div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Revenue Chart */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Revenus mensuels vérifiés (FCFA)</h3>
              {revenueLoading ? <p className="py-12 text-center text-xs text-[var(--text-muted)]">Chargement des revenus…</p> : revenueByMonth.length === 0 ? <p className="py-12 text-center text-xs text-[var(--text-muted)]">Aucun paiement vérifié pour cette période.</p> : <div className="flex items-end gap-2 h-48">
                {[...revenueByMonth].reverse().map((m, i) => {
                  const max = Math.max(...revenueByMonth.map(x => Number(x.revenue) || 0), 1);
                  const height = (Number(m.revenue) / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full relative group">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-[var(--accent-primary)] to-[var(--accent-primary-hover)] opacity-80 hover:opacity-100 transition-all"
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated)] px-2 py-1 rounded text-[10px] text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/5">
                          {formatXAF(Number(m.revenue) || 0)} · {Number(m.count)} paiement(s)
                        </div>
                      </div>
                      <span className="text-[9px] text-[var(--text-muted)]">{m.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>}
            </GlassCard>

            {/* Recent Transactions */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Transactions recentes</h3>
                <button onClick={() => setActiveTab('transactions')} className="text-[10px] text-[var(--accent-primary)] hover:underline">Voir tout</button>
              </div>
              <div className="space-y-2">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        tx.status === 'completed' ? 'bg-[var(--accent-success)]/10' : tx.status === 'pending' ? 'bg-[var(--accent-warning)]/10' : 'bg-[var(--accent-danger)]/10'
                      }`}>
                        {tx.status === 'completed' ? <CheckCircle size={14} className="text-[var(--accent-success)]" /> :
                         tx.status === 'pending' ? <Clock size={14} className="text-[var(--accent-warning)]" /> :
                         <XCircle size={14} className="text-[var(--accent-danger)]" />}
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)] font-medium">{tx.companyName ?? `Entreprise #${tx.companyId}`}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{tx.type} — {formatDate(tx.createdAt)}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-[var(--text-primary)]">{formatXAF(tx.amountXAF)}</div>
                      {statusBadge(tx.isVerified ? tx.status : tx.status === 'completed' ? 'pending' : tx.status)}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une entreprise, un forfait ou une référence..."
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Confirmée</option>
                <option value="pending">En attente</option>
                <option value="failed">Échec</option>
                <option value="refunded">Remboursée</option>
              </select>
            </div>

            {transactionsError && <div className="rounded-lg border border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/5 p-3 text-xs text-[var(--accent-danger)]">Impossible de charger les transactions depuis le serveur.</div>}
            <GlassCard className="p-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-[var(--text-muted)] uppercase border-b border-white/5">
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Entreprise</th>
                    <th className="text-left py-2 px-2">Plan</th>
                    <th className="text-left py-2 px-2">Type</th>
                    <th className="text-right py-2 px-2">Montant</th>
                    <th className="text-left py-2 px-2">Methode</th>
                    <th className="text-left py-2 px-2">Référence prestataire</th>
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {!transactionsLoading && filteredTransactions.length === 0 && <tr><td colSpan={9} className="py-8 text-center text-xs text-[var(--text-muted)]">Aucune transaction ne correspond aux filtres.</td></tr>}
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="py-2 px-2 text-[10px] text-[var(--text-muted)]">#{tx.id}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)]">{tx.companyName ?? `Entreprise #${tx.companyId}`}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{tx.planName ?? '—'}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)] capitalize">{tx.type}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)] text-right font-medium">{formatXAF(tx.amountXAF)}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{tx.paymentMethod.replace('_', ' ')}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{tx.providerTransactionId ?? '—'}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{formatDate(tx.createdAt)}</td>
                      <td className="py-2 px-2">{statusBadge(tx.isVerified ? tx.status : tx.status === 'completed' ? 'pending' : tx.status)}{tx.status === 'completed' && <span className="ml-1 text-[9px] text-[var(--text-muted)]">{tx.isVerified ? 'vérifiée' : 'non vérifiée'}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row"><div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" /><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Rechercher une entreprise ou un forfait..." className="h-10 w-full rounded-lg border border-white/5 bg-[var(--bg-elevated)] pl-9 pr-3 text-xs text-[var(--text-primary)]" /></div><select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-white/5 bg-[var(--bg-elevated)] px-3 text-xs text-[var(--text-primary)]"><option value="all">Tous les statuts</option><option value="active">Actif</option><option value="trial">Essai</option><option value="past_due">En retard</option><option value="cancelled">Résilié</option><option value="expired">Expiré</option></select></div>
            {subscriptionsError && <div className="rounded-lg border border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/5 p-3 text-xs text-[var(--accent-danger)]">Impossible de charger les abonnements depuis le serveur.</div>}
            <GlassCard className="p-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-[var(--text-muted)] uppercase border-b border-white/5">
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Entreprise</th>
                    <th className="text-left py-2 px-2">Plan</th>
                    <th className="text-left py-2 px-2">Statut</th>
                    <th className="text-left py-2 px-2">Fin de période</th>
                    <th className="text-left py-2 px-2">Renouvellement auto</th>
                    <th className="text-right py-2 px-2">Tarif</th>
                    <th className="text-right py-2 px-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!subscriptionsLoading && filteredSubscriptions.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-xs text-[var(--text-muted)]">Aucun abonnement ne correspond aux filtres.</td></tr>}
                  {filteredSubscriptions.map(sub => (
                    <tr key={sub.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="py-2 px-2 text-[10px] text-[var(--text-muted)]">#{sub.id}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)]">{sub.companyName}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{sub.planName} · {sub.billingCycle === 'yearly' ? 'annuel' : 'mensuel'}</td>
                      <td className="py-2 px-2">{statusBadge(sub.status)}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{formatDate(sub.currentPeriodEnd)}</td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${sub.autoRenew ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]' : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'}`}>
                          {sub.autoRenew ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)] text-right font-medium">{formatXAF(sub.priceXAF)}</td>
                      <td className="py-2 px-2 text-right">{!['cancelled', 'expired'].includes(sub.status) && <button className="btn-ghost h-7 px-2 text-[10px] text-[var(--accent-danger)]" disabled={cancelSubscription.isPending} onClick={() => {
                        const reason = window.prompt('Motif administratif de résiliation (obligatoire) :');
                        if (reason?.trim()) cancelSubscription.mutate({ id: sub.id, reason: reason.trim() });
                      }}>Résilier</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" /><input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Rechercher une entreprise, un e-mail ou un pays..." className="h-10 w-full rounded-lg border border-white/5 bg-[var(--bg-elevated)] pl-9 pr-3 text-xs text-[var(--text-primary)]" /></div>
              <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)} className="h-10 rounded-lg border border-white/5 bg-[var(--bg-elevated)] px-3 text-xs text-[var(--text-primary)]"><option value="all">Tous les statuts</option><option value="active">Active</option><option value="trial">Essai</option><option value="suspended">Suspendue</option><option value="cancelled">Résiliée</option></select>
            </div>
            {companiesError && <div className="rounded-lg border border-[var(--accent-danger)]/30 bg-[var(--accent-danger)]/5 p-3 text-xs text-[var(--accent-danger)]">Impossible de charger les entreprises depuis le serveur.</div>}
            <GlassCard className="p-4 overflow-x-auto"><table className="w-full min-w-[760px]"><thead><tr className="border-b border-white/5 text-left text-[10px] uppercase text-[var(--text-muted)]"><th className="px-2 py-2">Entreprise</th><th className="px-2 py-2">Pays</th><th className="px-2 py-2">E-mail</th><th className="px-2 py-2">Abonnements</th><th className="px-2 py-2">Créée le</th><th className="px-2 py-2">Statut</th><th className="px-2 py-2 text-right">Gestion</th></tr></thead><tbody>
              {!companiesLoading && filteredCompanies.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-xs text-[var(--text-muted)]">Aucune entreprise ne correspond aux filtres.</td></tr>}
              {filteredCompanies.map(company => <tr key={company.id} className="border-b border-white/5 text-xs last:border-0"><td className="px-2 py-3"><div className="font-medium text-[var(--text-primary)]">{company.name}</div><div className="text-[10px] text-[var(--text-muted)]">{company.slug}</div></td><td className="px-2 py-3 text-[var(--text-secondary)]">{company.country ?? '—'}</td><td className="px-2 py-3 text-[var(--text-secondary)]">{company.email ?? '—'}</td><td className="px-2 py-3 text-[var(--text-secondary)]">{company.subscriptionCount}</td><td className="px-2 py-3 text-[var(--text-secondary)]">{formatDate(company.createdAt)}</td><td className="px-2 py-3">{statusBadge(company.status)}</td><td className="px-2 py-3 text-right"><select aria-label={`Statut de ${company.name}`} value={company.status} disabled={setCompanyStatus.isPending} onChange={event => setCompanyStatus.mutate({ id: company.id, status: event.target.value as typeof company.status })} className="h-8 rounded border border-white/10 bg-black/20 px-2 text-[10px] text-[var(--text-primary)]"><option value="active">Active</option><option value="trial">Essai</option><option value="suspended">Suspendue</option><option value="cancelled">Résiliée</option></select></td></tr>)}
            </tbody></table></GlassCard>
          </div>
        )}

        {activeTab === 'plans' && (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
            <GlassCard className="p-4 overflow-x-auto">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--text-primary)]">Catalogue des abonnements</h2>
                  <p className="text-xs text-[var(--text-muted)]">Prix, quotas et accès sont versionnés par cycle de facturation.</p>
                </div>
                <button
                  onClick={() => setEditingPlan({
                    id: 0, slug: '', name: '', description: '', billingCycle: 'monthly', priceXAF: 0,
                    originalPriceXAF: null, maxUsers: 2, maxClients: 100, maxInvoices: 300, maxProjects: 0,
                    features: '[]', moduleAccess: '[]', supportLevel: 'email', isPopular: false, isEnterprise: false, trialDays: 14, isActive: true,
                  })}
                  className="btn-primary h-9 px-3 text-xs"
                >Nouveau forfait</button>
              </div>
              {plansLoading ? <p className="py-8 text-center text-sm text-[var(--text-muted)]">Chargement…</p> : (
                <table className="w-full min-w-[760px]">
                  <thead><tr className="border-b border-white/10 text-left text-[10px] uppercase text-[var(--text-muted)]">
                    <th className="px-2 py-2">Offre</th><th className="px-2 py-2">Cycle</th><th className="px-2 py-2 text-right">Prix</th>
                    <th className="px-2 py-2">Limites</th><th className="px-2 py-2">État</th><th className="px-2 py-2 text-right">Actions</th>
                  </tr></thead>
                  <tbody>{editablePlans.map((plan) => (
                    <tr key={plan.id} className="border-b border-white/5 text-xs">
                      <td className="px-2 py-3"><div className="font-semibold text-[var(--text-primary)]">{plan.name}</div><div className="text-[10px] text-[var(--text-muted)]">{plan.slug}</div></td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">{plan.billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}</td>
                      <td className="px-2 py-3 text-right font-semibold">{plan.isEnterprise ? 'Sur devis' : formatXAF(plan.priceXAF)}</td>
                      <td className="px-2 py-3 text-[var(--text-secondary)]">{plan.maxUsers === 0 ? 'Illimité' : plan.maxUsers} utilisateurs · {plan.maxClients === 0 ? 'illimité' : plan.maxClients} clients</td>
                      <td className="px-2 py-3">{statusBadge(plan.isActive ? 'active' : 'cancelled')}</td>
                      <td className="px-2 py-3 text-right">
                        <button onClick={() => setEditingPlan({ ...plan, features: plan.features ?? '[]', moduleAccess: plan.moduleAccess ?? '[]' })} className="btn-ghost h-8 px-2 text-xs">Modifier</button>
                        <button onClick={() => setPlanActive.mutate({ id: plan.id, isActive: !plan.isActive })} className="btn-ghost h-8 px-2 text-xs">
                          {plan.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </GlassCard>

            <GlassCard className="p-4">
              <h2 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">{editingPlan?.id ? 'Modifier le forfait' : 'Créer un forfait'}</h2>
              <p className="mb-4 text-xs text-[var(--text-muted)]">Les changements de prix ne modifient pas les abonnements déjà souscrits.</p>
              {!editingPlan ? <p className="py-8 text-center text-xs text-[var(--text-muted)]">Sélectionnez un forfait ou créez-en un.</p> : (
                <form className="space-y-3" onSubmit={(event) => {
                  event.preventDefault();
                  const p = editingPlan;
                  let features: string[] = [];
                  try { const parsed = JSON.parse(p.features || '[]'); features = Array.isArray(parsed) ? parsed : []; } catch { features = (p.features || '').split('\\n').map((value) => value.trim()).filter(Boolean); }
                  savePlan.mutate({
                    ...(p.id > 0 ? { id: p.id } : {}),
                    slug: p.slug, name: p.name, description: p.description, billingCycle: p.billingCycle,
                    priceXAF: Number(p.priceXAF), originalPriceXAF: p.originalPriceXAF == null ? null : Number(p.originalPriceXAF),
                    maxUsers: Number(p.maxUsers ?? 0), maxClients: Number(p.maxClients ?? 0),
                    maxInvoices: Number(p.maxInvoices ?? 0), maxProjects: Number(p.maxProjects ?? 0),
                    features, moduleAccess: selectedModuleAccess(p.moduleAccess), supportLevel: p.supportLevel ?? 'email', isPopular: !!p.isPopular,
                    isEnterprise: !!p.isEnterprise, trialDays: Number(p.trialDays ?? 0), isActive: p.isActive !== false,
                  });
                }}>
                  <div className="grid grid-cols-2 gap-2">
                    <input required value={editingPlan.slug} onChange={e => setEditingPlan({ ...editingPlan, slug: e.target.value })} placeholder="slug-mensuel" className="h-9 rounded border border-white/10 bg-black/20 px-2 text-xs" />
                    <input required value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="Nom" className="h-9 rounded border border-white/10 bg-black/20 px-2 text-xs" />
                  </div>
                  <input value={editingPlan.description ?? ''} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} placeholder="Description" className="h-9 w-full rounded border border-white/10 bg-black/20 px-2 text-xs" />
                  <div className="grid grid-cols-2 gap-2">
                    <select value={editingPlan.billingCycle} onChange={e => setEditingPlan({ ...editingPlan, billingCycle: e.target.value as 'monthly' | 'yearly' })} className="h-9 rounded border border-white/10 bg-black/20 px-2 text-xs"><option value="monthly">Mensuel</option><option value="yearly">Annuel</option></select>
                    <input type="number" min="0" value={editingPlan.priceXAF} onChange={e => setEditingPlan({ ...editingPlan, priceXAF: Number(e.target.value) })} placeholder="Prix FCFA" className="h-9 rounded border border-white/10 bg-black/20 px-2 text-xs" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" min="0" value={editingPlan.maxUsers ?? 0} onChange={e => setEditingPlan({ ...editingPlan, maxUsers: Number(e.target.value) })} placeholder="Utilisateurs (0 = illimité)" className="h-9 rounded border border-white/10 bg-black/20 px-2 text-xs" />
                    <input type="number" min="0" value={editingPlan.maxClients ?? 0} onChange={e => setEditingPlan({ ...editingPlan, maxClients: Number(e.target.value) })} placeholder="Clients" className="h-9 rounded border border-white/10 bg-black/20 px-2 text-xs" />
                    <input type="number" min="0" value={editingPlan.maxInvoices ?? 0} onChange={e => setEditingPlan({ ...editingPlan, maxInvoices: Number(e.target.value) })} placeholder="Documents / mois" className="h-9 rounded border border-white/10 bg-black/20 px-2 text-xs" />
                    <input type="number" min="0" value={editingPlan.maxProjects ?? 0} onChange={e => setEditingPlan({ ...editingPlan, maxProjects: Number(e.target.value) })} placeholder="Projets" className="h-9 rounded border border-white/10 bg-black/20 px-2 text-xs" />
                  </div>
                  <select value={editingPlan.supportLevel ?? 'email'} onChange={e => setEditingPlan({ ...editingPlan, supportLevel: e.target.value as EditablePlan['supportLevel'] })} className="h-9 w-full rounded border border-white/10 bg-black/20 px-2 text-xs"><option value="email">Assistance e-mail</option><option value="priority">Assistance prioritaire</option><option value="dedicated">Support dédié</option></select>
                  <textarea value={editingPlan.features ?? '[]'} onChange={e => setEditingPlan({ ...editingPlan, features: e.target.value })} placeholder="Fonctionnalités (JSON ou une par ligne)" rows={4} className="w-full rounded border border-white/10 bg-black/20 p-2 text-xs" />
                  <fieldset className="rounded-lg border border-white/10 p-3">
                    <legend className="px-1 text-xs font-semibold text-[var(--text-primary)]">Modules autorisés côté serveur</legend>
                    <div className="grid max-h-56 grid-cols-1 gap-2 overflow-y-auto sm:grid-cols-2">
                      {SUBSCRIPTION_FEATURES.map(({ key, label }) => {
                        const checked = selectedModuleAccess(editingPlan.moduleAccess).includes(key);
                        return <label key={key} className="flex items-center gap-2 text-[11px] text-[var(--text-secondary)]"><input type="checkbox" checked={checked} onChange={e => {
                          const next = new Set(selectedModuleAccess(editingPlan.moduleAccess));
                          if (e.target.checked) next.add(key); else next.delete(key);
                          setEditingPlan({ ...editingPlan, moduleAccess: JSON.stringify([...next]) });
                        }} />{label}</label>;
                      })}
                    </div>
                    <p className="mt-2 text-[10px] text-[var(--text-muted)]">Cette liste est vérifiée par l’API à chaque opération métier.</p>
                  </fieldset>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!editingPlan.isPopular} onChange={e => setEditingPlan({ ...editingPlan, isPopular: e.target.checked })} /> Le plus populaire</label>
                  <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!!editingPlan.isEnterprise} onChange={e => setEditingPlan({ ...editingPlan, isEnterprise: e.target.checked, priceXAF: e.target.checked ? 0 : editingPlan.priceXAF })} /> Offre sur devis</label>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setEditingPlan(null)} className="btn-ghost h-9 flex-1 text-xs">Annuler</button>
                    <button disabled={savePlan.isPending} type="submit" className="btn-primary h-9 flex-1 text-xs">{savePlan.isPending ? 'Enregistrement…' : 'Enregistrer'}</button>
                  </div>
                </form>
              )}
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
