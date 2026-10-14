import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { trpc } from '@/providers/trpc';
import {
  Users, DollarSign, TrendingUp, Briefcase, Search, Filter,
  ChevronRight, ArrowUpRight, ArrowDownRight, CheckCircle,
  XCircle, Clock, Award, Star, BarChart3, Download, Plus
} from 'lucide-react';

const MOCK_STATS = {
  activePartners: 125,
  totalProspects: 348,
  activeOpportunities: 86,
  totalRevenueXAF: 24850000,
  dueCommissionsXAF: 1875000,
  paidCommissionsXAF: 4250000,
};

const REVENUE_BY_MONTH = [
  { month: '2026-01', revenue: 2100000, commissions: 180000 },
  { month: '2026-02', revenue: 2350000, commissions: 210000 },
  { month: '2026-03', revenue: 2800000, commissions: 245000 },
  { month: '2026-04', revenue: 3100000, commissions: 280000 },
  { month: '2026-05', revenue: 3500000, commissions: 320000 },
  { month: '2026-06', revenue: 3900000, commissions: 355000 },
  { month: '2026-07', revenue: 4200000, commissions: 390000 },
  { month: '2026-08', revenue: 2880000, commissions: 220000 },
];

const TOP_PARTNERS = [
  { name: 'Jean Dupont', level: 'Business Partner', prospects: 18, contracts: 5, revenue: 3250000, commission: 406250, conversion: '38.9%' },
  { name: 'Marie Kouam', level: 'Premium Partner', prospects: 24, contracts: 8, revenue: 5200000, commission: 780000, conversion: '45.2%' },
  { name: 'Paul Nkono', level: 'Partner', prospects: 12, contracts: 3, revenue: 1800000, commission: 180000, conversion: '33.3%' },
  { name: 'Sarah Abena', level: 'Business Partner', prospects: 15, contracts: 4, revenue: 2400000, commission: 300000, conversion: '40.0%' },
  { name: 'Franck Biya', level: 'Apporteur', prospects: 8, contracts: 2, revenue: 950000, commission: 71250, conversion: '28.6%' },
];

export function AdminPartnersPage() {
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'partners' | 'pipeline' | 'commissions'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const partnerAccounts = trpc.partner.listPartners.useQuery(undefined, {
    enabled: activeTab === 'partners',
  });
  const createAccountInvite = trpc.partner.createAccountInvite.useMutation({
    onSuccess: ({ invitePath }) => {
      setInviteLink(window.location.origin + invitePath);
      showToast('Lien d’association créé. Copiez-le et transmettez-le au partenaire.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const formatXAF = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`;

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]',
      suspended: 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]',
      pending: 'bg-[var(--accent-info)]/10 text-[var(--accent-info)]',
      inactive: 'bg-[var(--text-muted)]/10 text-[var(--text-muted)]',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${styles[status] || ''}`}>{status}</span>;
  };

  const levelBadge = (level: string) => {
    const colors: Record<string, string> = {
      'Apporteur': 'bg-gray-500/10 text-gray-400',
      'Partner': 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]',
      'Business Partner': 'bg-purple-500/10 text-purple-400',
      'Premium Partner': 'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]',
    };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[level] || ''}`}>{level}</span>;
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">IDIBA GROUP Business Partners</h1>
            <p className="text-xs text-[var(--text-muted)]">Gestion des apporteurs d'affaires et partenaires commerciaux</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => showToast('Export en cours...', 'info')} className="btn-ghost h-9 px-3 text-xs gap-1.5">
              <Download size={14} /> Exporter
            </button>
            <button onClick={() => showToast('Formulaire de creation...', 'info')} className="btn-primary h-9 px-4 text-xs gap-1.5">
              <Plus size={14} /> Nouveau partenaire
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-xl bg-[var(--bg-elevated)] w-fit">
          {(['overview', 'partners', 'pipeline', 'commissions'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab === 'overview' && "Vue d'ensemble"}
              {tab === 'partners' && 'Partenaires'}
              {tab === 'pipeline' && 'Pipeline'}
              {tab === 'commissions' && 'Commissions'}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Partenaires actifs', value: MOCK_STATS.activePartners, icon: Users, change: '+12', up: true },
                { label: 'Prospects apportes', value: MOCK_STATS.totalProspects, icon: Briefcase, change: '+28', up: true },
                { label: 'Opportunites', value: MOCK_STATS.activeOpportunities, icon: TrendingUp, change: '+5', up: true },
                { label: 'CA genere', value: formatXAF(MOCK_STATS.totalRevenueXAF), icon: BarChart3, change: '+18%', up: true },
                { label: 'Commissions dues', value: formatXAF(MOCK_STATS.dueCommissionsXAF), icon: DollarSign, change: '-3%', up: false },
                { label: 'Commissions payees', value: formatXAF(MOCK_STATS.paidCommissionsXAF), icon: CheckCircle, change: '+8%', up: true },
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
                    <div className="text-sm font-bold text-[var(--text-primary)]">{stat.value}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{stat.label}</div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>

            {/* Revenue Chart */}
            <GlassCard className="p-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Evolution du CA genere par les partenaires</h3>
              <div className="flex items-end gap-2 h-48">
                {REVENUE_BY_MONTH.map((m, i) => {
                  const max = Math.max(...REVENUE_BY_MONTH.map(x => x.revenue));
                  const height = (m.revenue / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full relative group">
                        <div className="w-full rounded-t bg-gradient-to-t from-[var(--accent-primary)] to-[var(--accent-primary-hover)] opacity-80 hover:opacity-100 transition-all" style={{ height: `${height}%` }} />
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

            {/* Top Partners */}
            <GlassCard className="p-4 overflow-x-auto">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Top 5 des partenaires</h3>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-[var(--text-muted)] uppercase border-b border-white/5">
                    <th className="text-left py-2 px-2">Partenaire</th>
                    <th className="text-left py-2 px-2">Niveau</th>
                    <th className="text-right py-2 px-2">Prospects</th>
                    <th className="text-right py-2 px-2">Contrats</th>
                    <th className="text-right py-2 px-2">CA genere</th>
                    <th className="text-right py-2 px-2">Commission</th>
                    <th className="text-right py-2 px-2">Conversion</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_PARTNERS.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)] font-medium">{p.name}</td>
                      <td className="py-2 px-2">{levelBadge(p.level)}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)] text-right">{p.prospects}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)] text-right">{p.contracts}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)] text-right font-medium">{formatXAF(p.revenue)}</td>
                      <td className="py-2 px-2 text-xs text-[var(--accent-primary)] text-right font-medium">{formatXAF(p.commission)}</td>
                      <td className="py-2 px-2 text-xs text-[var(--accent-success)] text-right">{p.conversion}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}

        {activeTab === 'partners' && (
          <div className="space-y-4">
            <GlassCard className="p-4">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Accès au portail partenaire</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Créez un lien temporaire à transmettre directement au partenaire. Le lien expire après 7 jours et ne peut servir qu’une fois.
              </p>
              <div className="mt-4 space-y-2">
                {(partnerAccounts.data ?? [])
                  .filter((partner) => !partner.userId && partner.status === 'active')
                  .map((partner) => (
                    <div key={partner.id} className="flex flex-col gap-2 rounded-lg border border-[var(--glass-border)] p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)]">
                          {partner.firstName} {partner.lastName}
                        </div>
                        <div className="text-xs text-[var(--text-muted)]">{partner.email}</div>
                      </div>
                      <button
                        type="button"
                        className="btn-ghost h-9 px-3 text-xs"
                        disabled={createAccountInvite.isPending}
                        onClick={() => {
                          setInviteLink('');
                          createAccountInvite.mutate({ partnerId: partner.id });
                        }}
                      >
                        Créer le lien
                      </button>
                    </div>
                  ))}
                {!partnerAccounts.isLoading && (partnerAccounts.data ?? []).filter((partner) => !partner.userId && partner.status === 'active').length === 0 && (
                  <p className="text-xs text-[var(--text-muted)]">Aucun partenaire actif n’attend d’association.</p>
                )}
                {partnerAccounts.error && (
                  <p role="alert" className="text-xs text-[var(--accent-danger)]">{partnerAccounts.error.message}</p>
                )}
              </div>
              {inviteLink && (
                <label className="mt-4 block text-xs text-[var(--text-secondary)]">
                  Lien d’invitation — visible uniquement dans cette session
                  <input
                    className="mt-1 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)]"
                    readOnly
                    value={inviteLink}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                </label>
              )}
            </GlassCard>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un partenaire..."
                  className="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50"
                />
              </div>
              <select className="h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50">
                <option value="">Tous les niveaux</option>
                <option value="apporteur">Apporteur</option>
                <option value="partner">Partner</option>
                <option value="business">Business Partner</option>
                <option value="premium">Premium Partner</option>
              </select>
              <select className="h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50">
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="suspended">Suspendu</option>
                <option value="pending">En attente</option>
              </select>
            </div>

            <GlassCard className="p-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-[var(--text-muted)] uppercase border-b border-white/5">
                    <th className="text-left py-2 px-2">Code</th>
                    <th className="text-left py-2 px-2">Nom</th>
                    <th className="text-left py-2 px-2">Niveau</th>
                    <th className="text-right py-2 px-2">Prospects</th>
                    <th className="text-right py-2 px-2">Opportunites</th>
                    <th className="text-right py-2 px-2">CA genere</th>
                    <th className="text-right py-2 px-2">Commission</th>
                    <th className="text-left py-2 px-2">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_PARTNERS.map((p, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                      <td className="py-2 px-2 text-[10px] text-[var(--text-muted)]">PTN-{1000 + i}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)] font-medium">{p.name}</td>
                      <td className="py-2 px-2">{levelBadge(p.level)}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)] text-right">{p.prospects}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-secondary)] text-right">{Math.round(p.prospects * 0.4)}</td>
                      <td className="py-2 px-2 text-xs text-[var(--text-primary)] text-right font-medium">{formatXAF(p.revenue)}</td>
                      <td className="py-2 px-2 text-xs text-[var(--accent-primary)] text-right font-medium">{formatXAF(p.commission)}</td>
                      <td className="py-2 px-2">{statusBadge('active')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Pipeline commercial</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Nouveau prospect', count: 42, color: 'bg-[var(--accent-info)]' },
                { label: 'A qualifier', count: 18, color: 'bg-[var(--accent-warning)]' },
                { label: 'Qualifie', count: 24, color: 'bg-[var(--accent-primary)]' },
                { label: 'Rendez-vous', count: 15, color: 'bg-purple-500' },
                { label: 'Proposition', count: 12, color: 'bg-pink-500' },
                { label: 'Negociation', count: 8, color: 'bg-[var(--accent-primary)]' },
                { label: 'Gagne', count: 23, color: 'bg-[var(--accent-success)]' },
                { label: 'Perdu', count: 9, color: 'bg-[var(--accent-danger)]' },
              ].map((stage, i) => (
                <GlassCard key={i} className="p-3 min-h-[180px]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                      <span className="text-xs font-medium text-[var(--text-primary)]">{stage.label}</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{stage.count}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 rounded-lg bg-white/[0.02] cursor-pointer hover:bg-white/[0.04]">
                      <div className="text-xs text-[var(--text-primary)] font-medium">ABC SARL</div>
                      <div className="text-[10px] text-[var(--text-muted)]">Site web + Branding</div>
                      <div className="text-[10px] text-[var(--accent-primary)] mt-1">1 500 000 FCFA</div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Gestion des commissions</h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Commissions en attente', value: formatXAF(1250000), color: 'text-[var(--accent-warning)]' },
                { label: 'Commissions validees', value: formatXAF(1875000), color: 'text-[var(--accent-primary)]' },
                { label: 'Commissions payees', value: formatXAF(4250000), color: 'text-[var(--accent-success)]' },
              ].map((c, i) => (
                <GlassCard key={i} className="p-4 text-center">
                  <div className={`text-lg font-bold ${c.color}`}>{c.value}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{c.label}</div>
                </GlassCard>
              ))}
            </div>

            <GlassCard className="p-4 overflow-x-auto">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Paiements a effectuer</h3>
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] text-[var(--text-muted)] uppercase border-b border-white/5">
                    <th className="text-left py-2 px-2">Partenaire</th>
                    <th className="text-right py-2 px-2">Commission due</th>
                    <th className="text-right py-2 px-2">Validee</th>
                    <th className="text-right py-2 px-2">Payee</th>
                    <th className="text-right py-2 px-2">Solde</th>
                    <th className="text-left py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {TOP_PARTNERS.slice(0, 3).map((p, i) => {
                    const due = p.commission;
                    const validated = Math.round(due * 0.8);
                    const paid = Math.round(due * 0.6);
                    const balance = validated - paid;
                    return (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                        <td className="py-2 px-2 text-xs text-[var(--text-primary)] font-medium">{p.name}</td>
                        <td className="py-2 px-2 text-xs text-[var(--text-primary)] text-right">{formatXAF(due)}</td>
                        <td className="py-2 px-2 text-xs text-[var(--accent-primary)] text-right">{formatXAF(validated)}</td>
                        <td className="py-2 px-2 text-xs text-[var(--accent-success)] text-right">{formatXAF(paid)}</td>
                        <td className="py-2 px-2 text-xs text-[var(--accent-warning)] text-right font-medium">{formatXAF(balance)}</td>
                        <td className="py-2 px-2">
                          <div className="flex gap-1">
                            <button onClick={() => showToast('Commission validee', 'success')} className="px-2 py-1 rounded text-[10px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20">Valider</button>
                            <button onClick={() => showToast('Paiement en cours...', 'info')} className="px-2 py-1 rounded text-[10px] bg-[var(--accent-success)]/10 text-[var(--accent-success)] hover:bg-[var(--accent-success)]/20">Payer</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}
