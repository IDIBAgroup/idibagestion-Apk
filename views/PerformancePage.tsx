import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Award, TrendingUp, Target, Star, X, FileText, DollarSign, ChevronRight, Plus, Users, MessageSquare, BookOpen, BarChart3 } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify } from '@/lib/db';

const RATING_LABELS: Record<string, { label: string; color: string }> = {
  exceptional: { label: 'Exceptionnel', color: '#2DD4A8' },
  exceeds: { label: 'Depasse', color: '#3B82F6' },
  meets: { label: 'Atteint', color: '#8B5CF6' },
  needs_improvement: { label: 'A ameliorer', color: '#F59E0B' },
  unsatisfactory: { label: 'Insatisfaisant', color: '#EF4444' },
};

export function PerformancePage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [showNewReview, setShowNewReview] = useState(false);
  const [showFeedback360, setShowFeedback360] = useState(false);
  const [showPDP, setShowPDP] = useState(false);
  const [activeTab, setActiveTab] = useState<'reviews' | 'feedback' | 'pdp'>('reviews');
  const [newReview, setNewReview] = useState({
    employeeId: '', reviewerName: '', period: 'S1', year: 2024, overallScore: 3, rating: 'meets', bonusPercentage: 0, comments: '',
  });
  const [newFeedback, setNewFeedback] = useState({ reviewId: '', fromName: '', relationship: 'peer', score: 3, comment: '' });
  const [newPDP, setNewPDP] = useState({ employeeId: '', goal: '', deadline: '', resources: '', status: 'active' });

  useEffect(() => { setCurrentPageTitle('Performance & Evaluations'); }, [setCurrentPageTitle]);

  const reviews = getAll('performanceReviews');
  const employees = getAll('employees');
  const feedbacks = getAll('feedback360') as any[];
  const pdps = getAll('personalDevelopmentPlans') as any[];

  const filtered = reviews.filter((r: any) =>
    r.employeeName.toLowerCase().includes(search.toLowerCase())
  );

  const avgScore = filtered.reduce((s: number, r: any) => s + r.overallScore, 0) / (filtered.length || 1);
  const totalBonus = filtered.reduce((s: number, r: any) => s + r.bonusAmount, 0);

  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);

  const handleCreateReview = () => {
    if (!newReview.employeeId || !newReview.reviewerName) return;
    const emp = employees.find((e: any) => e.id === newReview.employeeId);
    if (!emp) return;
    const bonusAmount = Math.round(emp.grossSalary * (newReview.bonusPercentage / 100));
    const review = {
      id: `review-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      reviewerId: 'user-1',
      reviewerName: newReview.reviewerName,
      period: newReview.period,
      year: newReview.year,
      overallScore: newReview.overallScore,
      rating: newReview.rating as 'exceptional' | 'exceeds' | 'meets' | 'needs_improvement' | 'unsatisfactory',
      bonusAmount,
      bonusPercentage: newReview.bonusPercentage,
      comments: newReview.comments,
      employeeComments: '',
      status: 'draft' as const,
      objectives: [
        { description: 'Objectif qualite', weight: 30, score: newReview.overallScore },
        { description: 'Objectif productivite', weight: 40, score: newReview.overallScore },
        { description: 'Objectif collaboration', weight: 30, score: newReview.overallScore },
      ],
      competencies: [
        { name: 'Expertise technique', score: newReview.overallScore },
        { name: 'Communication', score: newReview.overallScore },
        { name: 'Leadership', score: newReview.overallScore },
        { name: 'Innovation', score: newReview.overallScore },
      ],
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    addAndNotify('performanceReviews', review);
    setShowNewReview(false);
    setNewReview({ employeeId: '', reviewerName: '', period: 'S1', year: 2024, overallScore: 3, rating: 'meets', bonusPercentage: 0, comments: '' });
    showToast('Evaluation creee avec succes', 'success');
  };

  const handleCreateFeedback = () => {
    if (!newFeedback.reviewId || !newFeedback.fromName) return;
    const fb = {
      id: `fb-${Date.now()}`,
      reviewId: newFeedback.reviewId,
      fromName: newFeedback.fromName,
      relationship: newFeedback.relationship as 'peer' | 'manager' | 'subordinate' | 'other',
      score: newFeedback.score,
      comment: newFeedback.comment,
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    addAndNotify('feedback360', fb);
    setShowFeedback360(false);
    setNewFeedback({ reviewId: '', fromName: '', relationship: 'peer', score: 3, comment: '' });
    showToast('Feedback 360 ajoute', 'success');
  };

  const handleCreatePDP = () => {
    if (!newPDP.employeeId || !newPDP.goal) return;
    const emp = employees.find((e: any) => e.id === newPDP.employeeId);
    if (!emp) return;
    const pdp = {
      id: `pdp-${Date.now()}`,
      employeeId: emp.id,
      employeeName: emp.fullName,
      goal: newPDP.goal,
      deadline: newPDP.deadline,
      resources: newPDP.resources,
      status: newPDP.status as 'active' | 'completed' | 'cancelled',
      progress: 0,
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    addAndNotify('personalDevelopmentPlans', pdp);
    setShowPDP(false);
    setNewPDP({ employeeId: '', goal: '', deadline: '', resources: '', status: 'active' });
    showToast('Plan de developpement cree', 'success');
  };

  const getReviewFeedback = (reviewId: string) => feedbacks.filter((f: any) => f.reviewId === reviewId);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Performance & Evaluations</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowNewReview(true)} className="btn-primary h-9 text-xs gap-1">
            <Plus size={14} /> Nouvelle evaluation
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard><div className="p-4"><div className="flex items-center gap-2 mb-2"><Award size={16} className="text-[var(--accent-primary)]" /><span className="text-xs text-[var(--text-muted)]">Score moyen S1 2024</span></div><p className="text-2xl font-bold text-[var(--text-primary)]">{avgScore.toFixed(1)} / 5</p></div></GlassCard>
        <GlassCard><div className="p-4"><div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-[var(--accent-primary)]" /><span className="text-xs text-[var(--text-muted)]">Masse primes S1</span></div><p className="text-2xl font-bold text-[var(--accent-primary)]">{formatXAF(totalBonus)}</p></div></GlassCard>
        <GlassCard><div className="p-4"><div className="flex items-center gap-2 mb-2"><Target size={16} className="text-[var(--accent-primary)]" /><span className="text-xs text-[var(--text-muted)]">Evaluations completees</span></div><p className="text-2xl font-bold text-[var(--text-secondary)]">{reviews.length}</p></div></GlassCard>
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {[
          { key: 'reviews', label: 'Evaluations', icon: FileText },
          { key: 'feedback', label: 'Feedback 360', icon: Users },
          { key: 'pdp', label: 'Plans de developpement', icon: BookOpen },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs ${activeTab === tab.key ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-medium' : 'text-[var(--text-muted)]'}`}>
            <tab.icon size={12} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'reviews' && (
        <>
          <div className="flex-1 relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((review: any, i: number) => {
              const rating = RATING_LABELS[review.rating];
              return (
                <motion.div key={review.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedReview(review)}
                  className="glass-card p-4 cursor-pointer glass-card-hover">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white font-bold text-sm">{review.employeeName.charAt(0)}</div>
                      <div><h3 className="text-sm font-semibold text-[var(--text-primary)]">{review.employeeName}</h3><p className="text-[10px] text-[var(--text-muted)]">{review.period} {review.year} — Par {review.reviewerName}</p></div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${rating.color}20`, color: rating.color }}>{rating.label}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} size={14} className={si < Math.round(review.overallScore) ? 'text-[var(--accent-warning)]' : 'text-[var(--bg-elevated)]'} />
                    ))}
                    <span className="text-sm font-bold text-[var(--text-primary)] ml-1">{review.overallScore}</span>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    {review.objectives.map((obj: any, oi: number) => (
                      <div key={oi} className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-secondary)] flex-1">{obj.description}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{obj.weight}%</span>
                        <div className="w-16 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${(obj.score / 5) * 100}%` }} /></div>
                        <span className="text-[10px] text-[var(--text-primary)] w-3">{obj.score}</span>
                      </div>
                    ))}
                  </div>

                  <div className="h-px bg-[var(--divider)] mb-3" />

                  <div className="flex items-center justify-between">
                    <div className="flex gap-3 text-xs">
                      <span className="text-[var(--text-muted)]">Prime: <span className="text-[var(--accent-primary)] font-semibold">{formatXAF(review.bonusAmount)}</span></span>
                      <span className="text-[var(--text-muted)]">{review.bonusPercentage}% du brut</span>
                    </div>
                    <ChevronRight size={14} className="text-[var(--text-muted)]" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowFeedback360(true)} className="btn-primary h-9 text-xs gap-1"><Plus size={14} /> Ajouter un feedback</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {reviews.map((review: any) => {
              const reviewFeedbacks = getReviewFeedback(review.id);
              return (
                <GlassCard key={review.id} className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white font-bold text-xs">{review.employeeName.charAt(0)}</div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{review.employeeName}</h3>
                      <p className="text-[10px] text-[var(--text-muted)]">{reviewFeedbacks.length} retours 360</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {reviewFeedbacks.map((fb: any, i: number) => (
                      <div key={i} className="glass-card-compact p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-[var(--text-primary)]">{fb.fromName}</span>
                          <span className="text-[10px] text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]">{fb.relationship === 'peer' ? 'Collegue' : fb.relationship === 'manager' ? 'Manager' : 'Autre'}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-1">
                          {Array.from({ length: 5 }).map((_, si) => (
                            <Star key={si} size={10} className={si < fb.score ? 'text-[var(--accent-warning)]' : 'text-[var(--bg-elevated)]'} />
                          ))}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{fb.comment}</p>
                      </div>
                    ))}
                    {reviewFeedbacks.length === 0 && (
                      <p className="text-xs text-[var(--text-muted)] italic text-center py-2">Aucun feedback 360 pour cette evaluation</p>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'pdp' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowPDP(true)} className="btn-primary h-9 text-xs gap-1"><Plus size={14} /> Nouveau PDP</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pdps.map((pdp: any, i: number) => (
              <motion.div key={pdp.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent-primary)] flex items-center justify-center text-white font-bold text-xs">{pdp.employeeName?.charAt(0) || '?'}</div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{pdp.employeeName}</h3>
                      <p className="text-[10px] text-[var(--text-muted)]">Echeance: {pdp.deadline ? new Date(pdp.deadline).toLocaleDateString('fr-FR') : 'Non definie'}</p>
                    </div>
                  </div>
                  <StatusBadge status={pdp.status} label={pdp.status === 'completed' ? 'Termine' : 'En cours'} />
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-2">{pdp.goal}</p>
                {pdp.resources && <p className="text-[10px] text-[var(--text-muted)] mb-2">Ressources: {pdp.resources}</p>}
                <div className="w-full h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-[var(--accent-primary)] transition-all" style={{ width: `${pdp.progress || 0}%` }} />
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-1">{pdp.progress || 0}% complete</p>
              </motion.div>
            ))}
            {pdps.length === 0 && (
              <div className="col-span-2 text-center py-8">
                <BookOpen size={32} className="text-[var(--text-muted)] mx-auto mb-2" />
                <p className="text-sm text-[var(--text-muted)]">Aucun plan de developpement</p>
                <button onClick={() => setShowPDP(true)} className="btn-primary h-9 mt-3 text-xs">Creer un PDP</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedReview(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass-card z-50 max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white font-bold text-lg">{selectedReview.employeeName.charAt(0)}</div>
                    <div><h2 className="text-lg font-semibold text-[var(--text-primary)]">{selectedReview.employeeName}</h2><p className="text-xs text-[var(--text-muted)]">{selectedReview.period} {selectedReview.year}</p></div>
                  </div>
                  <button onClick={() => setSelectedReview(null)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  {Array.from({ length: 5 }).map((_, si) => (
                    <Star key={si} size={18} className={si < Math.round(selectedReview.overallScore) ? 'text-[var(--accent-warning)]' : 'text-[var(--bg-elevated)]'} />
                  ))}
                  <span className="text-lg font-bold text-[var(--text-primary)] ml-2">{selectedReview.overallScore} / 5</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${RATING_LABELS[selectedReview.rating].color}20`, color: RATING_LABELS[selectedReview.rating].color }}>{RATING_LABELS[selectedReview.rating].label}</span>
                </div>

                <div className="space-y-4">
                  <div><h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Objectifs</h4>
                    {selectedReview.objectives.map((obj: any, oi: number) => (
                      <div key={oi} className="flex items-center gap-3 py-1.5 border-b border-[var(--divider)] last:border-0">
                        <span className="text-sm text-[var(--text-secondary)] flex-1">{obj.description}</span>
                        <span className="text-xs text-[var(--text-muted)]">{obj.weight}%</span>
                        <div className="w-24 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden"><div className="h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${(obj.score / 5) * 100}%` }} /></div>
                        <span className="text-xs font-medium text-[var(--text-primary)] w-4">{obj.score}</span>
                      </div>
                    ))}
                  </div>

                  <div><h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Competences</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReview.competencies.map((c: any, ci: number) => (
                        <div key={ci} className="p-2 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-between">
                          <span className="text-xs text-[var(--text-secondary)]">{c.name}</span>
                          <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, si) => (<Star key={si} size={8} className={si < c.score ? 'text-[var(--accent-warning)]' : 'text-[var(--bg-card)]'} />))}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-primary-hover)]/5">
                    <div><p className="text-xs text-[var(--text-muted)]">Prime</p><p className="text-lg font-bold text-[var(--accent-primary)]">{formatXAF(selectedReview.bonusAmount)}</p></div>
                    <div><p className="text-xs text-[var(--text-muted)]">% du brut</p><p className="text-lg font-bold text-[var(--text-primary)]">{selectedReview.bonusPercentage}%</p></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[var(--text-muted)]">Commentaire evaluateur</span><p className="text-[var(--text-secondary)] mt-1">{selectedReview.comments}</p></div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[var(--text-muted)]">Commentaire employe</span><p className="text-[var(--text-secondary)] mt-1">{selectedReview.employeeComments}</p></div>
                  </div>

                  {/* 360 Feedback in detail */}
                  <div>
                    <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Feedback 360</h4>
                    {getReviewFeedback(selectedReview.id).map((fb: any, i: number) => (
                      <div key={i} className="glass-card-compact p-2.5 mb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{fb.fromName}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{fb.relationship === 'peer' ? 'Collegue' : fb.relationship === 'manager' ? 'Manager' : 'Autre'}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">{fb.comment}</p>
                      </div>
                    ))}
                    {getReviewFeedback(selectedReview.id).length === 0 && (
                      <p className="text-xs text-[var(--text-muted)] italic">Aucun feedback 360</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Review Modal */}
      <AnimatePresence>
        {showNewReview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowNewReview(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-lg border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 max-h-screen overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvelle Evaluation</h2>
                  <button onClick={() => setShowNewReview(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3">
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Employe</label><select value={newReview.employeeId} onChange={e => setNewReview({ ...newReview, employeeId: e.target.value })} className="w-full h-9 px-3 glass-input text-sm"><option value="">Selectionner...</option>{employees.map((e: any) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Periode</label><select value={newReview.period} onChange={e => setNewReview({ ...newReview, period: e.target.value })} className="w-full h-9 px-3 glass-input text-sm"><option>S1</option><option>S2</option><option>Annuel</option></select></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Annee</label><input type="number" value={newReview.year} onChange={e => setNewReview({ ...newReview, year: Number(e.target.value) })} className="w-full h-9 px-3 glass-input text-sm" /></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Evaluateur</label><input value={newReview.reviewerName} onChange={e => setNewReview({ ...newReview, reviewerName: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="Nom de l evaluateur" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Score global (1-5)</label><input type="number" min={1} max={5} step={0.1} value={newReview.overallScore} onChange={e => setNewReview({ ...newReview, overallScore: Number(e.target.value) })} className="w-full h-9 px-3 glass-input text-sm" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Appreciation</label><select value={newReview.rating} onChange={e => setNewReview({ ...newReview, rating: e.target.value })} className="w-full h-9 px-3 glass-input text-sm">{Object.entries(RATING_LABELS).map(([key, val]) => <option key={key} value={key}>{val.label}</option>)}</select></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Prime (% du brut)</label><input type="number" value={newReview.bonusPercentage} onChange={e => setNewReview({ ...newReview, bonusPercentage: Number(e.target.value) })} className="w-full h-9 px-3 glass-input text-sm" placeholder="ex: 5" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Commentaire</label><textarea value={newReview.comments} onChange={e => setNewReview({ ...newReview, comments: e.target.value })} className="w-full h-20 p-3 glass-input text-sm resize-none" /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowNewReview(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button onClick={handleCreateReview} disabled={!newReview.employeeId || !newReview.reviewerName} className="flex-1 btn-primary h-10 justify-center disabled:opacity-50">Creer l evaluation</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New 360 Feedback Modal */}
      <AnimatePresence>
        {showFeedback360 && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowFeedback360(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Feedback 360</h2>
                  <button onClick={() => setShowFeedback360(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3">
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Evaluation associee</label><select value={newFeedback.reviewId} onChange={e => setNewFeedback({ ...newFeedback, reviewId: e.target.value })} className="w-full h-9 px-3 glass-input text-sm"><option value="">Selectionner...</option>{reviews.map((r: any) => <option key={r.id} value={r.id}>{r.employeeName} — {r.period} {r.year}</option>)}</select></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom</label><input value={newFeedback.fromName} onChange={e => setNewFeedback({ ...newFeedback, fromName: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="Votre nom" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Relation</label><select value={newFeedback.relationship} onChange={e => setNewFeedback({ ...newFeedback, relationship: e.target.value })} className="w-full h-9 px-3 glass-input text-sm"><option value="peer">Collegue</option><option value="manager">Manager</option><option value="subordinate">Subordonne</option><option value="other">Autre</option></select></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Note (1-5)</label><input type="number" min={1} max={5} step={0.5} value={newFeedback.score} onChange={e => setNewFeedback({ ...newFeedback, score: Number(e.target.value) })} className="w-full h-9 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Commentaire</label><textarea value={newFeedback.comment} onChange={e => setNewFeedback({ ...newFeedback, comment: e.target.value })} className="w-full h-20 p-3 glass-input text-sm resize-none" /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowFeedback360(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button onClick={handleCreateFeedback} disabled={!newFeedback.reviewId || !newFeedback.fromName} className="flex-1 btn-primary h-10 justify-center disabled:opacity-50">Soumettre le feedback</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New PDP Modal */}
      <AnimatePresence>
        {showPDP && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowPDP(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Plan de Developpement</h2>
                  <button onClick={() => setShowPDP(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3">
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Employe</label><select value={newPDP.employeeId} onChange={e => setNewPDP({ ...newPDP, employeeId: e.target.value })} className="w-full h-9 px-3 glass-input text-sm"><option value="">Selectionner...</option>{employees.map((e: any) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Objectif</label><input value={newPDP.goal} onChange={e => setNewPDP({ ...newPDP, goal: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="ex: Certification AWS Cloud Practitioner" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Echeance</label><input type="date" value={newPDP.deadline} onChange={e => setNewPDP({ ...newPDP, deadline: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Ressources</label><input value={newPDP.resources} onChange={e => setNewPDP({ ...newPDP, resources: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="ex: Budget formation, mentor" /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowPDP(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button onClick={handleCreatePDP} disabled={!newPDP.employeeId || !newPDP.goal} className="flex-1 btn-primary h-10 justify-center disabled:opacity-50">Creer le PDP</button>
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
