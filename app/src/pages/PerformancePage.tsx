import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Award, TrendingUp, Target, Star, X, FileText, DollarSign, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';

const RATING_LABELS: Record<string, { label: string; color: string }> = {
  exceptional: { label: 'Exceptionnel', color: '#2DD4A8' },
  exceeds: { label: 'Dépassé', color: '#3B82F6' },
  meets: { label: 'Atteint', color: '#8B5CF6' },
  needs_improvement: { label: 'À améliorer', color: '#F59E0B' },
  unsatisfactory: { label: 'Insatisfaisant', color: '#EF4444' },
};

export function PerformancePage() {
  const { setCurrentPageTitle } = useUIStore();
  const [search, setSearch] = useState('');
  const [selectedReview, setSelectedReview] = useState<any>(null);

  useEffect(() => { setCurrentPageTitle('Performance & Évaluations'); }, [setCurrentPageTitle]);

  const reviews = getAll('performanceReviews');

  const filtered = reviews.filter((r: any) =>
    r.employeeName.toLowerCase().includes(search.toLowerCase())
  );

  const avgScore = filtered.reduce((s: number, r: any) => s + r.overallScore, 0) / (filtered.length || 1);
  const totalBonus = filtered.reduce((s: number, r: any) => s + r.bonusAmount, 0);

  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Évaluations & Primes</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard><div className="p-4"><div className="flex items-center gap-2 mb-2"><Award size={16} className="text-[var(--accent-primary)]" /><span className="text-xs text-[var(--text-muted)]">Score moyen S1 2024</span></div><p className="text-2xl font-bold text-[var(--text-primary)]">{avgScore.toFixed(1)} / 5</p></div></GlassCard>
        <GlassCard><div className="p-4"><div className="flex items-center gap-2 mb-2"><DollarSign size={16} className="text-[var(--accent-primary)]" /><span className="text-xs text-[var(--text-muted)]">Masse primes S1</span></div><p className="text-2xl font-bold text-[var(--accent-primary)]">{formatXAF(totalBonus)}</p></div></GlassCard>
        <GlassCard><div className="p-4"><div className="flex items-center gap-2 mb-2"><Target size={16} className="text-[var(--accent-primary)]" /><span className="text-xs text-[var(--text-muted)]">Évaluations complétées</span></div><p className="text-2xl font-bold text-[var(--text-secondary)]">{reviews.length}</p></div></GlassCard>
      </div>

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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-sm">{review.employeeName.charAt(0)}</div>
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

      {/* Detail Modal - centered */}
      <AnimatePresence>
        {selectedReview && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedReview(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass-card z-50 max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-lg">{selectedReview.employeeName.charAt(0)}</div>
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

                  <div><h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">Compétences</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReview.competencies.map((c: any, ci: number) => (
                        <div key={ci} className="p-2 rounded-lg bg-[var(--bg-elevated)] flex items-center justify-between">
                          <span className="text-xs text-[var(--text-secondary)]">{c.name}</span>
                          <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, si) => (<Star key={si} size={8} className={si < c.score ? 'text-[var(--accent-warning)]' : 'text-[var(--bg-card)]'} />))}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-gradient-to-r from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/5">
                    <div><p className="text-xs text-[var(--text-muted)]">Prime</p><p className="text-lg font-bold text-[var(--accent-primary)]">{formatXAF(selectedReview.bonusAmount)}</p></div>
                    <div><p className="text-xs text-[var(--text-muted)]">% du brut</p><p className="text-lg font-bold text-[var(--text-primary)]">{selectedReview.bonusPercentage}%</p></div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[var(--text-muted)]">Commentaire évaluateur</span><p className="text-[var(--text-secondary)] mt-1">{selectedReview.comments}</p></div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[var(--text-muted)]">Commentaire employé</span><p className="text-[var(--text-secondary)] mt-1">{selectedReview.employeeComments}</p></div>
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
