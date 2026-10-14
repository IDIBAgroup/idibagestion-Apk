import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import {
  Building2, Users, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight,
  Search, Filter, Calendar, Download, RefreshCw, CheckCircle, XCircle, Clock
} from 'lucide-react';

// Donnees simulees pour le dashboard admin
const MOCK_STATS = {
  companies: 128,
  activeSubscriptions: 94,
  totalRevenueXAF: 28750000,
  pendingRevenueXAF: 1350000,
  mrr: 4230000,
  churnRate: 3.2,
};

const MOCK_TRANSACTIONS = [
  { id: 1, company: 'TechAfrique SARL', plan: 'Croissance', type: 'renewal', amount: 49900, status: 'completed', method: 'mobile_money', date: '2026-08-10' },
  { id: 2, company: 'Sogea-Satom CM', plan: 'Business+', type: 'subscription', amount: 149000, status: 'completed', method: 'bank_transfer', date: '2026-08-09' },
  { id: 3, company: 'Douala Logistics', plan: 'Essentiel', type: 'renewal', amount: 14900, status: 'pending', method: 'mobile_money', date: '2026-08-08' },
  { id: 4, company: 'Yaounde Digital', plan: 'Croissance', type: 'upgrade', amount: 49900, status: 'completed', method: 'card', date: '2026-08-07' },
  { id: 5, company: 'Bafoussan Agro', plan: 'Essentiel', type: 'subscription', amount: 14900, status: 'completed', method: 'mobile_money', date: '2026-08-06' },
  { id: 6, company: 'Sodepal CM', plan: 'Croissance', type: 'renewal', amount: 49900, status: 'failed', method: 'card', date: '2026-08-05' },
  { id: 7, company: 'Cameroun Construction', plan: 'Business+', type: 'renewal', amount: 149000, status: 'completed', method: 'bank_transfer', date: '2026-08-04' },
  { id: 8, company: 'Limbe Fresh', plan: 'Essentiel', type: 'renewal', amount: 14900, status: 'completed', method: 'mobile_money', date: '2026-08-03' },
];

const MOCK_SUBSCRIPTIONS = [
  { id: 1, company: 'TechAfrique SARL', plan: 'Croissance', status: 'active', periodEnd: '2026-09-10', autoRenew: true, mrr: 49900 },
  { id: 2, company: 'Sogea-Satom CM', plan: 'Business+', status: 'active', periodEnd: '2027-08-09', autoRenew: true, mrr: 149000 },
  { id: 3, company: 'Douala Logistics', plan: 'Essentiel', status: 'past_due', periodEnd: '2026-08-15', autoRenew: false, mrr: 14900 },
  { id: 4, company: 'Yaounde Digital', plan: 'Croissance', status: 'trial', periodEnd: '2026-08-20', autoRenew: true, mrr: 49900 },
  { id: 5, company: 'Bafoussan Agro', plan: 'Essentiel', status: 'active', periodEnd: '2026-09-06', autoRenew: true, mrr: 14900 },
];

const REVENUE_BY_MONTH = [
  { month: '2026-01', revenue: 1850000, count: 42 },
  { month: '2026-02', revenue: 2100000, count: 48 },
  { month: '2026-03', revenue: 2350000, count: 53 },
  { month: '2026-04', revenue: 2600000, count: 58 },
  { month: '2026-05', revenue: 3100000, count: 67 },
  { month: '2026-06', revenue: 3450000, count: 74 },
  { month: '2026-07', revenue: 3900000, count: 82 },
  { month: '2026-08', revenue: 4230000, count: 94 },
];

export function AdminDashboardPage() {
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'subscriptions'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredTransactions = MOCK_TRANSACTIONS.filter(tx => {
    const matchesSearch = tx.company.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatXAF = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`;

  const statusBadge = (status: string) => {
    return <StatusBadge status={status} />;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Super Admin Dashboard</h1>
            <p className="text-xs text-[var(--text-muted)]">Vue d'ensemble de tous les abonnements et transactions</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast('Donnees actualisees', 'success')} className="btn-ghost h-9 px-3 text-xs gap-1.5">
              <RefreshCw size={14} /> Actualiser
            </button>
            <button onClick={() => showToast('Export CSV en cours...', 'info')} className="btn-ghost h-9 px-3 text-xs gap-1.5">
              <Download size={14} /> Exporter
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[var(--bg-elevated)] w-fit">
          {(['overview', 'transactions', 'subscriptions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'overview' && 'Vue d\'ensemble'}
              {tab === 'transactions' && 'Transactions'}
              {tab === 'subscriptions' && 'Abonnements'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Entreprises', value: MOCK_STATS.companies, icon: Building2, change: '+12%', up: true },
                { label: 'Abonnements actifs', value: MOCK_STATS.activeSubscriptions, icon: Users, change: '+8%', up: true },
                { label: 'Revenus totaux', value: formatXAF(MOCK_STATS.totalRevenueXAF), icon: CreditCard, change: '+23%', up: true },
                { label: 'MRR', value: formatXAF(MOCK_STATS.mrr), icon: TrendingUp, change: '+5%', up: true },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <GlassCard className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <stat.icon size={18} className="text-[var(--accent-primary)]" />
                      <div className={`flex items-center gap-0.5 text-[10px] font-medium ${stat.up ? 'text-[var(--accent-success)]' : 'text-[var(--accent-danger)]'}`}>
                        {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {stat.change}
                      </div>
                    </div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{stat.label}</div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Revenue Chart */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Revenus mensuels (FCFA)</h3>
              <div className="flex items-end gap-2 h-48">
                {REVENUE_BY_MONTH.map((m, i) => {
                  const max = Math.max(...REVENUE_BY_MONTH.map(x => x.revenue));
                  const height = (m.revenue / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full relative group">
                        <div
                          className="w-full rounded-t bg-gradient-to-t from-[var(--accent-primary)] to-[var(--accent-primary-hover)] opacity-80 hover:opacity-100 transition-all"
                          style={{ height: `${height}%` }}
                        />
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[var(--bg-elevated)] px-2 py-1 rounded text-[10px] text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/5">
                          {formatXAF(m.revenue)}
                        </div>
                      </div>
                      <span className="text-[9px] text-[var(--text-muted)]">{m.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Recent Transactions */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Transactions recentes</h3>
                <button onClick={() => setActiveTab('transactions')} className="text-[10px] text-[var(--accent-primary)] hover:underline">Voir tout</button>
              </div>
              <div className="space-y-2">
                {MOCK_TRANSACTIONS.slice(0, 5).map(tx => (
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
                        <div className="text-xs text-[var(--text-primary)] font-medium">{tx.company}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">{tx.type} — {tx.date}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-medium text-[var(--text-primary)]">{formatXAF(tx.amount)}</div>
                      {statusBadge(tx.status)}
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
                  placeholder="Rechercher une entreprise..."
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
              >
                <option value="all">Tous les statuts</option>
                <option value="completed">Complete</option>
                <option value="pending">En attente</option>
                <option value="failed">Echec</option>
                <option value="refunded">Rembourse</option>
              </select>
            </div>

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
                    <th className="text-left py-2 px-2">Date</th>
                    <th className="text-left py-2 px-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="py-2 px-2 text-[10px] text-[var(--text-muted)]">#{tx.id}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)]">{tx.company}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{tx.plan}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)] capitalize">{tx.type}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)] text-right font-medium">{formatXAF(tx.amount)}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{tx.method}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{tx.date}</td>
                      <td className="py-2 px-2">{statusBadge(tx.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}

        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            <GlassCard className="p-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-[var(--text-muted)] uppercase border-b border-white/5">
                    <th className="text-left py-2 px-2">ID</th>
                    <th className="text-left py-2 px-2">Entreprise</th>
                    <th className="text-left py-2 px-2">Plan</th>
                    <th className="text-left py-2 px-2">Statut</th>
                    <th className="text-left py-2 px-2">Fin periode</th>
                    <th className="text-left py-2 px-2">Renouvellement auto</th>
                    <th className="text-right py-2 px-2">MRR</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_SUBSCRIPTIONS.map(sub => (
                    <tr key={sub.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="py-2 px-2 text-[10px] text-[var(--text-muted)]">#{sub.id}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)]">{sub.company}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{sub.plan}</td>
                      <td className="py-2 px-2">{statusBadge(sub.status)}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)]">{sub.periodEnd}</td>
                      <td className="py-2 px-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${sub.autoRenew ? 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]' : 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]'}`}>
                          {sub.autoRenew ? 'Oui' : 'Non'}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)] text-right font-medium">{formatXAF(sub.mrr)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
