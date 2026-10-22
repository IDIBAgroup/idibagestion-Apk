import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { trpc } from '@/providers/trpc';
import { useAuth } from '@/hooks/useAuth';
import {
  Users, FileText, DollarSign, TrendingUp, Award, Bell, LogOut,
  Plus, Search, Filter, ChevronRight, CheckCircle, Clock,
  AlertTriangle, X, Star, BarChart3, Phone, Mail, MapPin,
  Building2, Briefcase, Calendar, ArrowUpRight, Download
} from 'lucide-react';

type Tab = 'dashboard' | 'prospects' | 'commissions' | 'performance' | 'documents';

const PIPELINE_STAGES = [
  { key: 'new', label: 'Nouveau prospect', color: 'bg-[var(--accent-info)]' },
  { key: 'to_qualify', label: 'A qualifier', color: 'bg-[var(--accent-warning)]' },
  { key: 'qualified', label: 'Qualifie', color: 'bg-[var(--accent-primary)]' },
  { key: 'appointment', label: 'Rendez-vous', color: 'bg-purple-500' },
  { key: 'proposal', label: 'Proposition', color: 'bg-pink-500' },
  { key: 'negotiation', label: 'Negociation', color: 'bg-[var(--accent-primary)]' },
  { key: 'won', label: 'Gagne', color: 'bg-[var(--accent-success)]' },
  { key: 'lost', label: 'Perdu', color: 'bg-[var(--accent-danger)]' },
];

export function PartnerPortalPage() {
  const { showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showNewProspect, setShowNewProspect] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  const utils = trpc.useUtils();
  const { data: account, isLoading: accountLoading } = trpc.partner.mine.useQuery();
  const { data: stats } = trpc.partner.getPartnerStats.useQuery(
    { id: account?.id ?? 0 }, { enabled: !!account },
  );
  const { data: prospects } = trpc.partner.listProspects.useQuery({}, { enabled: !!account });
  const { data: commissions } = trpc.partner.listCommissions.useQuery(
    { partnerId: account?.id ?? 0 }, { enabled: !!account },
  );
  const { data: notifications } = trpc.partner.listNotifications.useQuery(
    { partnerId: account?.id ?? 0 }, { enabled: !!account },
  );
  const { data: levels } = trpc.partner.listLevels.useQuery();
  const markNotificationRead = trpc.partner.markNotificationRead.useMutation({
    onSuccess: () => utils.partner.listNotifications.invalidate(),
    onError: (error) => showToast(error.message, 'error'),
  });
  const { logout } = useAuth();
  const createProspect = trpc.partner.createProspect.useMutation({
    onSuccess: (result) => {
      if (!result.success && result.duplicate) {
        showToast('Un prospect similaire existe déjà dans votre portefeuille.', 'error');
        return;
      }
      showToast(`Prospect enregistré. Référence : ${result.leadId}`, 'success');
      setShowNewProspect(false);
      utils.partner.listProspects.invalidate();
      utils.partner.getPartnerStats.invalidate();
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  const currentLevel = levels?.find((level) => level.id === account?.levelId);
  const revenueGenerated = stats?.revenueGenerated ?? 0;
  const nextLevel = levels?.find((level) => Number(level.minRevenueXAF ?? 0) > revenueGenerated);
  const nextLevelTarget = Number(nextLevel?.minRevenueXAF ?? 0);
  const progressToNext = nextLevelTarget > 0 ? Math.min((revenueGenerated / nextLevelTarget) * 100, 100) : 100;
  const revenueToNext = Math.max(nextLevelTarget - revenueGenerated, 0);
  const commissionTotal = commissions?.reduce((total, row) => total + Number(row.amount), 0) ?? 0;
  const partner = {
    id: account?.id ?? 0,
    firstName: account?.firstName ?? '',
    lastName: account?.lastName ?? '',
    level: currentLevel ?? { name: 'Niveau non defini' },
    revenueGenerated,
    prospectsCount: stats?.prospects ?? 0,
    opportunitiesCount: stats?.opportunities ?? 0,
    contractsWon: stats?.contractsWon ?? 0,
    commissionAvailable: commissions?.filter((row) => row.status === 'validated').reduce((total, row) => total + Number(row.amount), 0) ?? 0,
    commissionPending: commissions?.filter((row) => row.status === 'pending').reduce((total, row) => total + Number(row.amount), 0) ?? 0,
    commissionPaid: commissions?.filter((row) => row.status === 'paid').reduce((total, row) => total + Number(row.amount), 0) ?? 0,
    commissionTotal,
  };

  if (accountLoading) return <div className="min-h-screen grid place-items-center bg-[var(--bg-primary)]"><span className="text-sm text-[var(--text-secondary)]">Chargement du compte partenaire…</span></div>;

  const formatXAF = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`;

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { key: 'prospects', label: 'Mes prospects', icon: Users },
    { key: 'commissions', label: 'Mes commissions', icon: DollarSign },
    { key: 'performance', label: 'Performance', icon: TrendingUp },
    { key: 'documents', label: 'Documents', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-primary)]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white font-bold text-sm">
              ID
            </div>
            <div>
              <h1 className="text-sm font-bold text-[var(--text-primary)]">IDIBA GROUP</h1>
              <p className="text-[10px] text-[var(--text-muted)]">Business Partners</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowNotification(true)} className="relative p-2 rounded-lg hover:bg-white/5">
              <Bell size={18} className="text-[var(--text-muted)]" />
                  {notifications?.some((notification) => !notification.isRead) && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--accent-danger)]" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/20 flex items-center justify-center">
                <Users size={14} className="text-[var(--accent-primary)]" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-medium text-[var(--text-primary)]">{partner.firstName} {partner.lastName}</p>
                <p className="text-[10px] text-[var(--accent-primary)]">{partner.level.name}</p>
              </div>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]" title="Deconnexion" aria-label="Deconnexion">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-elevated)] overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                activeTab === tab.key ? 'bg-[var(--accent-primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              {/* Welcome */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Bonjour {partner.firstName}</h2>
                  <p className="text-xs text-[var(--text-muted)]">Voici votre activite partenaire</p>
                </div>
                <button onClick={() => setShowNewProspect(true)} className="btn-primary h-9 px-4 text-xs gap-1.5">
                  <Plus size={14} /> Apporter un prospect
                </button>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Prospects', value: partner.prospectsCount, icon: Users, color: 'text-[var(--accent-info)]' },
                  { label: 'Opportunités', value: partner.opportunitiesCount, icon: Briefcase, color: 'text-[var(--accent-primary)]' },
                  { label: 'Contrats', value: partner.contractsWon, icon: CheckCircle, color: 'text-[var(--accent-success)]' },
                  { label: 'CA généré', value: formatXAF(partner.revenueGenerated), icon: TrendingUp, color: 'text-[var(--accent-secondary)]' },
                ].map((kpi, i) => (
                  <GlassCard key={i} className="p-4">
                    <kpi.icon size={18} className={`${kpi.color} mb-2`} />
                    <div className="text-lg font-bold text-[var(--text-primary)]">{kpi.value}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{kpi.label}</div>
                  </GlassCard>
                ))}
              </div>

              {/* Commission Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Disponible', value: partner.commissionAvailable, icon: DollarSign, color: 'text-[var(--accent-success)]' },
                  { label: 'En attente', value: partner.commissionPending, icon: Clock, color: 'text-[var(--accent-warning)]' },
                  { label: 'Déjà payée', value: partner.commissionPaid, icon: CheckCircle, color: 'text-[var(--accent-primary)]' },
                  { label: 'Total généré', value: partner.commissionTotal, icon: Award, color: 'text-[var(--accent-secondary)]' },
                ].map((kpi, i) => (
                  <GlassCard key={i} className="p-4">
                    <kpi.icon size={18} className={`${kpi.color} mb-2`} />
                    <div className="text-lg font-bold text-[var(--text-primary)]">{formatXAF(kpi.value)}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{kpi.label}</div>
                  </GlassCard>
                ))}
              </div>

              {/* Level Progress */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GlassCard className="p-5">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Progression vers {nextLevel?.name ?? 'le niveau suivant'}</h3>
                  <div className="flex justify-between text-xs text-[var(--text-secondary)] mb-2">
                    <span>{formatXAF(partner.revenueGenerated)}</span>
                    <span>{formatXAF(nextLevelTarget)}</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden mb-2">
                    <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent-info)] to-[var(--accent-primary)]" style={{ width: `${Math.min(progressToNext, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)]">{formatXAF(Math.max(revenueToNext, 0))} restants pour atteindre le niveau suivant</p>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'prospects' && (
            <motion.div key="prospects" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Mes prospects</h2>
                <button onClick={() => setShowNewProspect(true)} className="btn-primary h-9 px-4 text-xs gap-1.5">
                  <Plus size={14} /> Nouveau prospect
                </button>
              </div>
              {/* Pipeline Kanban */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PIPELINE_STAGES.slice(0, 4).map(stage => (
                  <GlassCard key={stage.key} className="p-3 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-2 h-2 rounded-full ${stage.color}`} />
                      <span className="text-xs font-medium text-[var(--text-primary)]">{stage.label}</span>
                    </div>
                    <div className="space-y-2">
                      {prospects?.filter((prospect) => prospect.status === stage.key).map((prospect) => (
                        <div key={prospect.id} className="rounded-lg border border-[var(--glass-border)] bg-[var(--bg-card-hover)] p-2 text-xs">
                          <p className="font-medium text-[var(--text-primary)]">{prospect.companyName}</p>
                          <p className="mt-1 text-[10px] text-[var(--text-muted)]">{prospect.leadId}</p>
                        </div>
                      ))}
                      {(!prospects || prospects.filter((prospect) => prospect.status === stage.key).length === 0) && (
                        <div className="p-2 rounded-lg bg-[var(--bg-card-hover)] text-xs text-[var(--text-secondary)] text-center">Aucun prospect</div>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'commissions' && (
            <motion.div key="commissions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Mes commissions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Disponible', value: partner.commissionAvailable, color: 'bg-[var(--accent-success)]/10 text-[var(--accent-success)]' },
                  { label: 'En attente', value: partner.commissionPending, color: 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]' },
                  { label: 'Payée', value: partner.commissionPaid, color: 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' },
                  { label: 'Total', value: partner.commissionTotal, color: 'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]' },
                ].map((c, i) => (
                  <GlassCard key={i} className={`p-4 ${c.color}`}>
                    <div className="text-lg font-bold">{formatXAF(c.value)}</div>
                    <div className="text-[10px] opacity-80">{c.label}</div>
                  </GlassCard>
                ))}
              </div>
              <GlassCard className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Historique</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="text-[var(--text-muted)] border-b border-white/5">
                      <tr>
                        <th className="text-left py-2">Date</th>
                        <th className="text-left py-2">Reference</th>
                        <th className="text-right py-2">Montant</th>
                        <th className="text-left py-2">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="text-[var(--text-secondary)]">
                      {commissions?.map((commission) => (
                        <tr key={commission.id} className="border-b border-[var(--glass-border)]">
                          <td className="py-2">{new Date(commission.createdAt).toLocaleDateString('fr-FR')}</td>
                          <td>{commission.invoiceNumber || 'COM-' + commission.id}</td>
                          <td className="text-right font-medium">{formatXAF(Number(commission.amount))}</td>
                          <td><span className="px-2 py-0.5 rounded-full bg-[var(--bg-card-hover)] text-[var(--text-secondary)] text-[10px]">{commission.status}</span></td>
                        </tr>
                      ))}
                      {(!commissions || commissions.length === 0) && <tr><td colSpan={4} className="py-4 text-center">Aucune commission pour le moment.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === 'performance' && (
            <motion.div key="performance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Mes performances</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Taux de conversion', value: stats?.prospects ? `${((stats.contractsWon / stats.prospects) * 100).toFixed(1)}%` : '?', icon: TrendingUp },
                  { label: 'CA moyen / contrat', value: stats?.contractsWon ? formatXAF(Math.round(revenueGenerated / stats.contractsWon)) : '?', icon: DollarSign },
                  { label: 'Prospects', value: partner.prospectsCount, icon: Users },
                  { label: 'Contrats', value: partner.contractsWon, icon: CheckCircle },
                  { label: 'Commission moyenne', value: commissions?.length ? formatXAF(Math.round(commissionTotal / commissions.length)) : formatXAF(0), icon: Award },
                ].map((stat, i) => (
                  <GlassCard key={i} className="p-4 text-center">
                    <stat.icon size={20} className="text-[var(--accent-primary)] mx-auto mb-2" />
                    <div className="text-lg font-bold text-[var(--text-primary)]">{stat.value}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{stat.label}</div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'documents' && (
            <motion.div key="documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Mes documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
<GlassCard className="p-5 text-sm text-[var(--text-secondary)]">Aucun document partenaire disponible.</GlassCard>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Prospect Modal */}
      {showNewProspect && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="w-full max-w-lg h-full bg-[var(--bg-card)] border-l border-[var(--glass-border)] p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">+ Apporter un prospect</h3>
              <button onClick={() => setShowNewProspect(false)} className="p-1.5 rounded hover:bg-white/5"><X size={16} className="text-[var(--text-muted)]" /></button>
            </div>
            <form className="space-y-3" onSubmit={(event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              const value = (name: string) => String(values.get(name) ?? '').trim();
              const estimatedBudget = Number(value('estimatedBudget'));
              createProspect.mutate({
                partnerId: partner.id,
                companyName: value('companyName'),
                contactName: value('contactName') || undefined,
                contactFunction: value('contactFunction') || undefined,
                phone: value('phone') || undefined,
                email: value('email') || undefined,
                city: value('city') || undefined,
                sector: value('sector') || undefined,
                serviceSearched: value('serviceSearched') || undefined,
                estimatedBudget: estimatedBudget > 0 ? estimatedBudget : undefined,
                description: value('description') || undefined,
              });
            }}>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Nom de l'entreprise *</label>
                <input required className="w-full h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50" name="companyName" placeholder="ABC SARL" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Nom du contact</label>
                  <input className="w-full h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50" name="contactName" placeholder="Jean Dupont" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Fonction</label>
                  <input className="w-full h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50" name="contactFunction" placeholder="DG" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Telephone</label>
                  <input className="w-full h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50" name="phone" placeholder="+237 6XX..." />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Email</label>
                  <input type="email" className="w-full h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50" name="email" placeholder="contact@entreprise.cm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Ville</label>
                  <input className="w-full h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50" name="city" placeholder="Douala" />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-secondary)] mb-1 block">Secteur</label>
                  <input className="w-full h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50" name="sector" placeholder="Agroalimentaire" />
                </div>
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Service recherche</label>
                <input className="w-full h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50" name="serviceSearched" placeholder="Creation de site web" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Budget estimatif (FCFA)</label>
                <input type="number" className="w-full h-10 px-3 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50" name="estimatedBudget" placeholder="500000" />
              </div>
              <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Description du besoin</label>
                <textarea rows={3} className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-white/5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]/50" name="description" placeholder="Decrivez le besoin du client..." />
              </div>
              <button type="submit" disabled={createProspect.isPending} className="w-full btn-primary h-10 text-xs disabled:opacity-50">{createProspect.isPending ? 'En cours...' : 'Enregistrer le prospect'}</button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotification && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end p-4">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-sm glass-card p-4 mt-16">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Notifications</h3>
              <button onClick={() => setShowNotification(false)} className="p-1 rounded hover:bg-white/5"><X size={14} className="text-[var(--text-muted)]" /></button>
            </div>
            <div className="space-y-2">
              {notifications?.map((notification) => (
                <button key={notification.id} onClick={() => !notification.isRead && markNotificationRead.mutate({ id: notification.id })} className="block w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-card-hover)] p-2.5 text-left">
                  <div className="text-xs font-medium text-[var(--text-primary)]">{notification.title}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{notification.message || ''}</div>
                </button>
              ))}
              {(!notifications || notifications.length === 0) && <p className="p-3 text-xs text-[var(--text-muted)]">Aucune notification.</p>}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
