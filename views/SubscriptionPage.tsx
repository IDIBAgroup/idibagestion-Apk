import { useState } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { trpc } from '@/providers/trpc';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import {
  CreditCard, Calendar, RefreshCw, ArrowUpRight, ArrowDownRight,
  CheckCircle, AlertTriangle, Clock, Shield, Zap, ChevronRight,
  X, Loader2, Phone, Building2, Check, Download, FileText, Printer
} from 'lucide-react';

export function SubscriptionPage() {
  const { showToast } = useUIStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'mobile_money' | 'card' | 'bank_transfer'>('mobile_money');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<any>(null);

  const utils = trpc.useUtils();
  const { companyId, isLoading: companyLoading } = useActiveCompany();
  const { data: paymentStatus } = trpc.payment.status.useQuery();
  const paymentsAvailable = paymentStatus?.available === true;

  // Queries
  const { data: usageData, isLoading: usageLoading } = trpc.subscription.getUsage.useQuery(
    { companyId: companyId ?? 0 }, { enabled: !!companyId },
  );
  const { data: subscriptions } = trpc.subscription.listByCompany.useQuery(
    { companyId: companyId ?? 0 }, { enabled: !!companyId },
  );
  const { data: dbPlans } = trpc.plan.list.useQuery();
  const { data: transactions } = trpc.transaction.listByCompany.useQuery(
    { companyId: companyId ?? 0 }, { enabled: !!companyId },
  );
  const subsLoading = companyLoading || usageLoading;

  // Mutations
  const cancelMutation = trpc.subscription.cancel.useMutation({
    onSuccess: () => {
      showToast('Abonnement annulé avec succès', 'success');
      setShowCancelModal(false);
      utils.subscription.listByCompany.invalidate();
      utils.subscription.getUsage.invalidate();
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const reactivateMutation = trpc.subscription.reactivate.useMutation({
    onSuccess: () => {
      showToast('Abonnement réactivé avec succès', 'success');
      utils.subscription.listByCompany.invalidate();
      utils.subscription.getUsage.invalidate();
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const changePlanMutation = trpc.subscription.changePlan.useMutation({
    onSuccess: () => {
      showToast('Abonnement mis a jour.', 'success');
      setShowUpgradeModal(false);
      setSelectedPlanId(null);
      utils.subscription.listByCompany.invalidate();
      utils.subscription.getUsage.invalidate();
      utils.transaction.listByCompany.invalidate();
    },
    onError: (err) => showToast(err.message, 'error'),
  });

  const allPlans = dbPlans ?? [];
  const currentSub = subscriptions?.[0] || usageData?.subscription;
  const currentPlan = allPlans.find((p) => p.id === currentSub?.planId) || usageData?.plan;
  const plans = allPlans.filter((plan) => plan.billingCycle === billingCycle);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  const formatXAF = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`;

  const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
    active: { label: 'Actif', color: 'text-[var(--accent-success)]', icon: CheckCircle },
    trial: { label: "Période d'essai (14 jours)", color: 'text-[var(--accent-info)]', icon: Clock },
    past_due: { label: 'Paiement en retard', color: 'text-[var(--accent-warning)]', icon: AlertTriangle },
    cancelled: { label: 'Annulé (Période en cours)', color: 'text-[var(--text-muted)]', icon: X },
    expired: { label: 'Expiré', color: 'text-[var(--accent-danger)]', icon: AlertTriangle },
  };

  const handleExecuteChangePlan = () => {
    if (!selectedPlanId || !companyId) return;
    changePlanMutation.mutate({
      companyId,
      newPlanId: selectedPlanId,
      billingCycle,
      paymentMethod,
      paymentPhone,
    });
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">Mon Plan & Abonnement SaaS</h1>
        <p className="text-xs text-[var(--text-muted)]">
          Gérez votre forfait d'entreprise, vos limites d'utilisation et vos moyens de paiement.
        </p>
      </div>

      {!companyLoading && !companyId && (
        <GlassCard className="p-6">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">Aucune entreprise configurée</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">Créez un espace entreprise pour consulter et gérer son abonnement.</p>
          <a href="/register" className="btn-primary mt-4">Créer mon entreprise</a>
        </GlassCard>
      )}

      {companyId && paymentStatus && !paymentsAvailable && (
        <div role="status" className="rounded-xl border border-amber-700/15 bg-amber-600/8 px-4 py-3 text-sm text-amber-900">
          Le paiement en ligne n'est pas configure. Les paiements et changements de forfait restent indisponibles jusqu'a la selection d'un prestataire.
        </div>
      )}

      {!companyId ? null : subsLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={36} className="text-[var(--accent-primary)] animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Current Plan Overview Card */}
          <GlassCard className="p-6 border-[var(--accent-primary)]/20 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center shadow-md shadow-[var(--accent-primary)]/20">
                  <Shield size={28} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">
                      {currentPlan?.name || 'Aucun abonnement actif'}
                    </h2>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]">
                      {currentSub ? 'FORFAIT ACTUEL' : 'AUCUN ABONNEMENT'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {(() => {
                      const cfg = currentSub ? statusConfig[currentSub.status] : undefined;
                      if (!cfg) return null;
                      const Icon = cfg.icon;
                      return (
                        <span className={`flex items-center gap-1.5 text-xs font-semibold ${cfg.color}`}>
                          <Icon size={15} /> {cfg.label}
                        </span>
                      );
                    })()}
                    <span className="text-xs text-[var(--text-muted)]">
                      • {currentSub?.billingCycle === 'yearly' ? 'Facturation annuelle (2 mois offerts)' : 'Facturation mensuelle'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {currentSub?.status === 'cancelled' ? (
                  <button
                    onClick={() => currentSub && reactivateMutation.mutate({ id: currentSub.id })}
                    disabled={reactivateMutation.isPending || !paymentsAvailable}
                    className="btn-primary h-10 px-5 text-xs font-bold gap-2"
                  >
                    <RefreshCw size={14} /> Réactiver l'abonnement
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setSelectedPlanId(currentPlan?.id ?? plans[0]?.id ?? null);
                        setShowUpgradeModal(true);
                      }}
                      disabled={!paymentsAvailable || plans.length === 0}
                      className="btn-primary h-10 px-5 text-xs font-bold gap-2 shadow-md shadow-[var(--accent-primary)]/20"
                    >
                      <ArrowUpRight size={15} /> Changer de Forfait
                    </button>
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="h-10 px-4 text-xs font-medium rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
                    >
                      Annuler
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Sub Meta Info Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Prochain Paiement</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">{formatDate(currentSub?.nextPaymentAt)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Fin de Période</p>
                <p className="text-sm font-bold text-[var(--text-primary)]">{formatDate(currentSub?.currentPeriodEnd)}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Renouvellement Auto</p>
                <p className="text-sm font-bold text-emerald-400">{currentSub?.autoRenew ? 'Oui' : 'Non'}</p>
              </div>
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold mb-1">Montant du Tarif</p>
                <p className="text-sm font-bold text-[var(--accent-primary)]">
                  {currentSub || currentPlan ? `${formatXAF(currentSub?.priceXAF ?? currentPlan?.priceXAF ?? 0)} / ${currentSub?.billingCycle === 'yearly' ? 'an' : 'mois'}` : 'Aucun forfait'}
                </p>
              </div>
            </div>
          </GlassCard>

          {/* QUOTAS & USAGE PROGRESS METRICS */}
          {currentPlan && (
          <div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <Zap size={16} className="text-[var(--accent-warning)]" />
              Consommation des Quotas & Limites du Forfait
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Utilisateurs Actifs', current: usageData?.usage?.users ?? 1, max: currentPlan.maxUsers ?? 1, unit: 'comptes' },
                { label: 'Portefeuille Clients', current: usageData?.usage?.clients ?? 0, max: currentPlan.maxClients ?? 1, unit: 'clients' },
                { label: 'Factures de ce Mois', current: usageData?.usage?.invoicesThisMonth ?? 0, max: currentPlan.maxInvoices ?? 1, unit: 'factures' },
                { label: 'Projets en Cours', current: usageData?.usage?.projects ?? 0, max: currentPlan.maxProjects ?? 1, unit: 'projets' },
              ].map((metric, i) => {
                const pct = Math.min(100, Math.round((metric.current / Math.max(1, metric.max)) * 100));
                return (
                  <GlassCard key={i} className="p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center text-xs font-semibold mb-1">
                        <span className="text-[var(--text-secondary)]">{metric.label}</span>
                        <span className="text-[var(--text-primary)] font-mono">{pct}%</span>
                      </div>
                      <div className="text-lg font-bold text-white mb-2">
                        {metric.current} <span className="text-xs text-[var(--text-muted)] font-normal">/ {metric.max === 10000 ? 'Illimité' : metric.max}</span>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          pct > 90 ? 'bg-red-500' : pct > 75 ? 'bg-amber-500' : 'bg-[var(--accent-primary)]'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          </div>
          )}

          {/* PAYMENT HISTORY & INVOICES */}
          <GlassCard className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <FileText size={16} className="text-[var(--accent-primary)]" />
                Historique des Transactions & Reçus
              </h3>
              <span className="text-xs text-[var(--text-muted)] font-mono">Devise : XAF (FCFA)</span>
            </div>

            {transactions && transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                        <CreditCard size={16} />
                      </div>
                      <div>
                        <div className="text-xs text-[var(--text-primary)] font-bold">{tx.description || `Paiement ${tx.type}`}</div>
                        <div className="text-[10px] text-[var(--text-muted)]">
                          {formatDate(tx.createdAt)} • Réf : {tx.providerTransactionId || `REF-${tx.id}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="text-xs font-bold text-white font-mono">{formatXAF(tx.amountXAF)}</div>
                        <StatusBadge status={tx.status === 'completed' && tx.isVerified ? 'completed' : 'pending'} label={tx.status === 'completed' && tx.isVerified ? 'Confirme' : tx.status === 'completed' ? 'A verifier' : tx.status} />
                      </div>
                      <button
                        onClick={() => setSelectedReceiptTx(tx)}
                        disabled={tx.status !== 'completed' || !tx.isVerified}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-[var(--text-secondary)] hover:text-white transition-all flex items-center gap-1 text-xs"
                        title="Visualiser et imprimer le reçu A4"
                      >
                        <FileText size={15} /> Reçu A4
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-[var(--glass-border)] bg-[var(--bg-card-hover)] p-4 text-sm text-[var(--text-secondary)]">Aucune transaction pour le moment.</p>
            )}
          </GlassCard>
        </div>
      )}

      {/* PLAN UPGRADE & PAYMENT MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-2xl h-full bg-[var(--bg-card)] p-6 border-l border-[var(--glass-border)] shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
              <div>
                <h3 className="text-base font-bold text-white">Sélectionner votre nouveau Forfait SaaS</h3>
                <p className="text-xs text-[var(--text-muted)]">Surclassement instantané avec réajustement de vos quotas.</p>
              </div>
              <button onClick={() => setShowUpgradeModal(false)} className="p-1.5 rounded hover:bg-white/10 text-[var(--text-muted)]">
                <X size={18} />
              </button>
            </div>

            {/* BILLING CYCLE SELECTOR */}
            <div className="flex justify-center mb-6">
              <div className="inline-flex p-1 rounded-xl bg-white/5 border border-white/10">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${billingCycle === 'monthly' ? 'bg-[var(--accent-primary)] text-white shadow' : 'text-[var(--text-muted)]'}`}
                >
                  Mensuel
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${billingCycle === 'yearly' ? 'bg-[var(--accent-primary)] text-white shadow' : 'text-[var(--text-muted)]'}`}
                >
                  Annuel
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">2 mois offerts</span>
                </button>
              </div>
            </div>

            {/* PLANS LIST */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
              {plans.map((plan) => {
                const price = plan.priceXAF;
                const isSelected = selectedPlanId === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 shadow-lg'
                        : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-white">{plan.name}</span>
                        {isSelected && <CheckCircle size={16} className="text-[var(--accent-primary)]" />}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] mb-3 leading-tight">{plan.description}</p>
                    </div>
                    <div>
                      <div className="text-lg font-black text-white font-mono">{price.toLocaleString('fr-FR')} FCFA</div>
                      <div className="text-[10px] text-[var(--text-muted)]">/ {billingCycle === 'yearly' ? 'an' : 'mois'}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!paymentsAvailable && (
              <div role="status" className="mb-5 rounded-xl border border-amber-700/15 bg-amber-600/8 p-4 text-sm text-amber-900">
                Le paiement en ligne n’est pas encore configuré. Les changements de forfait resteront désactivés jusqu’à la connexion et à la validation serveur d’un prestataire.
              </div>
            )}

            {/* PAYMENT METHOD SELECTION */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 mb-6">
              <div className="text-xs font-bold text-white">Mode de Règlement (Zone CEMAC)</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'mobile_money', label: 'MTN / Orange Money', icon: Phone },
                  { id: 'card', label: 'Carte Visa / Mastercard', icon: CreditCard },
                  { id: 'bank_transfer', label: 'Virement Bancaire', icon: Building2 },
                ].map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id as any)}
                    className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      paymentMethod === pm.id
                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/20 text-white'
                        : 'border-white/5 bg-black/20 text-[var(--text-muted)] hover:text-white'
                    }`}
                  >
                    <pm.icon size={15} />
                    <span className="text-[11px]">{pm.label}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'mobile_money' && (
                <div>
                  <label className="text-[11px] text-[var(--text-secondary)] block mb-1">Numéro Mobile Money (Cameroun / CEMAC) :</label>
                  <input
                    type="text"
                    value={paymentPhone}
                    onChange={(e) => setPaymentPhone(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[var(--accent-primary)]"
                    placeholder="+237 6XX XX XX XX"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowUpgradeModal(false)} className="flex-1 btn-ghost h-11 text-xs">
                Annuler
              </button>
              <button
                onClick={handleExecuteChangePlan}
                disabled={changePlanMutation.isPending || !selectedPlanId || !paymentsAvailable}
                className="flex-1 btn-primary h-11 text-xs font-bold gap-2"
              >
                {changePlanMutation.isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Traitement du règlement...
                  </>
                ) : (
                  <>
                    <Check size={16} /> {paymentsAvailable ? 'Continuer au paiement' : 'Paiement indisponible'}                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md glass-card p-6 border-white/20 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <h3 className="text-base font-bold text-white">Confirmer l'Annulation ?</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-6 leading-relaxed">
              Votre accès à l'ensemble des modules d'IDIBAGES ERP restera actif jusqu'au {formatDate(currentSub?.currentPeriodEnd)}. À l'échéance, vos accès seront restreints au mode lecture.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 btn-ghost h-10 text-xs">
                Conserver mon Forfait
              </button>
              <button
                onClick={() => currentSub && cancelMutation.mutate({ id: currentSub.id })}
                disabled={cancelMutation.isPending}
                className="flex-1 h-10 rounded-xl text-xs font-bold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                {cancelMutation.isPending ? 'Annulation...' : 'Confirmer l\'annulation'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* RECEIPT A4 MODAL */}
      {selectedReceiptTx && (
        <div className="a4-preview-overlay">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full flex flex-col items-center gap-4 my-auto">
            
            {/* Floating Toolbar */}
            <div className="no-print flex items-center justify-between w-full max-w-[210mm] glass-card px-4 py-2.5 shadow-xl border-white/20">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white bg-purple-600/30 border border-purple-500/30 px-2.5 py-1 rounded-md">Reçu SaaS Format A4</span>
                <span className="text-xs text-[var(--text-muted)] font-mono">REÇU-{selectedReceiptTx.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="btn-primary h-8 px-3 text-xs gap-1.5 font-bold shadow-lg">
                  <Printer size={14} /> Imprimer / PDF (A4)
                </button>
                <button onClick={() => setSelectedReceiptTx(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-white">
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable A4 Sheet */}
            <div className="a4-sheet printable-document subscription-document shadow-2xl text-black">
              <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-gray-300 pb-5">
                  <div>
                    <h2 className="text-xl font-bold text-blue-900 tracking-tight">IDIBA GROUP SARL</h2>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">Éditeur de la plateforme SaaS IDIBAGES ERP</p>
                    <p className="text-xs text-gray-600">Douala & Yaoundé, Cameroun • Support: support@idibagroup.cm</p>
                    <p className="text-[11px] text-gray-700 font-mono mt-1">
                      <strong>NIU:</strong> M0123456789C • <strong>RCCM:</strong> RC/DLA/2019/M/0847
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-purple-900 text-white font-bold text-xs px-3 py-1 rounded inline-block tracking-wider uppercase">REÇU DE PAIEMENT ABONNEMENT</span>
                    <p className="text-xs text-gray-800 font-mono font-bold mt-2">REÇU N° REÇU-{selectedReceiptTx.id}</p>
                    <p className="text-xs text-gray-600">Date de transaction: {formatDate(selectedReceiptTx.createdAt)}</p>
                  </div>
                </div>

                {/* Subscriber Box */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-gray-500 block mb-1">Fournisseur du Service</span>
                    <p className="text-xs font-bold text-gray-900">IDIBA GROUP SARL</p>
                    <p className="text-xs text-gray-600">Service Abonnements & Licences Cloud</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-purple-900 block mb-1">Abonné / Client</span>
                    <p className="text-sm font-bold text-gray-900">Entreprise Abonnée IDIBAGES</p>
                    <p className="text-xs text-gray-600 font-mono">Réf Trans.: {selectedReceiptTx.providerTransactionId || `PAY-${selectedReceiptTx.id}`}</p>
                  </div>
                </div>

                {/* Details Table */}
                <table className="document-preview-table w-full text-xs border-collapse mt-4">
                  <thead>
                    <tr className="bg-purple-900 text-white text-[11px] uppercase tracking-wider">
                      <th className="text-left p-3 rounded-tl">Description du Service Souscrit</th>
                      <th className="text-center p-3">Mode de Paiement</th>
                      <th className="text-right p-3 rounded-tr">Montant Réglé (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white border-b border-gray-100">
                      <td className="p-3 font-medium text-gray-800">
                        {selectedReceiptTx.description || 'Abonnement Mensuel Plateforme ERP IDIBAGES'}
                      </td>
                      <td className="text-center p-3 font-mono uppercase text-gray-700">
                        {selectedReceiptTx.paymentMethod || 'MOBILE MONEY'}
                      </td>
                      <td className="text-right p-3 font-mono font-bold text-gray-900 text-sm">
                        {formatXAF(selectedReceiptTx.amountXAF)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Payment Confirmation */}
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-emerald-900 block">Paiement Confirmé avec Succès</span>
                    <span className="text-emerald-700 text-[11px]">La licence SaaS est active et immédiatement utilisable sur tous vos postes.</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-emerald-900">{formatXAF(selectedReceiptTx.amountXAF)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Legal Notice */}
              <div className="pt-8 border-t border-gray-300 text-center text-[10px] text-gray-500 space-y-1">
                <p className="font-semibold text-gray-700">IDIBA GROUP SARL — Éditeur de Logiciels de Gestion ERP</p>
                <p>Douala - Cameroun • NIU: M0123456789C • RCCM: RC/DLA/2019/M/0847</p>
                <p className="italic">Reçu d'abonnement généré automatiquement - Format A4 Conforme</p>
              </div>
            </div>

          </motion.div>
        </div>
      )}
    </div>
  );
}
