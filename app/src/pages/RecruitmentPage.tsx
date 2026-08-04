import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Star, Calendar, DollarSign, FileText, ChevronRight, Briefcase, UserCheck, Phone, Mail } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';

const PIPELINE_STAGES = [
  { key: 'new', label: 'Nouveau', color: '#4A5568' },
  { key: 'screening', label: 'Présélection', color: '#3B82F6' },
  { key: 'interview', label: 'Entretien', color: '#8B5CF6' },
  { key: 'technical', label: 'Test Tech.', color: '#F59E0B' },
  { key: 'offer', label: 'Offre', color: '#2DD4A8' },
  { key: 'hired', label: 'Embauché', color: '#10B981' },
  { key: 'rejected', label: 'Refusé', color: '#EF4444' },
];

export function RecruitmentPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => { setCurrentPageTitle('Recrutement'); }, [setCurrentPageTitle]);

  const candidates = getAll('candidates');
  const departments = getAll('departments');

  const filtered = candidates.filter((c: any) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.position.toLowerCase().includes(search.toLowerCase())
  );

  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Pipeline de Recrutement</h2>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2.5 py-1">{candidates.length} candidats</span>
        </div>
        <button onClick={() => setShowDrawer(true)} className="btn-primary h-9"><Plus size={16} /> Candidat</button>
      </div>

      <div className="flex-1 relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un candidat..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
      </div>

      {/* Pipeline Kanban */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        {PIPELINE_STAGES.map(stage => {
          const stageCands = filtered.filter((c: any) => c.status === stage.key);
          return (
            <div key={stage.key} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="text-xs font-medium text-[var(--text-primary)]">{stage.label}</span>
                <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-1.5 py-0.5 ml-auto">{stageCands.length}</span>
              </div>
              <div className="space-y-2">
                {stageCands.map((c: any, i: number) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    className="glass-card-compact p-3 cursor-pointer hover:border-[var(--glass-border-hover)] transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-[10px] font-bold">{c.firstName[0]}{c.lastName[0]}</div>
                      <div className="flex-1 min-w-0"><p className="text-xs font-medium text-[var(--text-primary)] truncate">{c.firstName} {c.lastName}</p></div>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mb-1.5 truncate">{c.position}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star key={si} size={8} className={si < c.rating ? 'text-[var(--accent-warning)]' : 'text-[var(--bg-elevated)]'} />
                        ))}
                      </div>
                      <span className="text-[10px] text-[var(--text-secondary)]">{formatXAF(c.salaryExpectation)}</span>
                    </div>
                    {c.interviewDate && (
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[var(--accent-primary)]">
                        <Calendar size={8} /> {new Date(c.interviewDate).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    <div className="flex gap-1 mt-2">
                      {['screening', 'interview', 'technical', 'offer', 'hired', 'rejected'].filter(s => s !== c.status).slice(0, 2).map(ns => (
                        <button key={ns} onClick={() => showToast(`Statut mis à jour : ${PIPELINE_STAGES.find(s => s.key === ns)?.label}`, 'success')}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors">
                          {PIPELINE_STAGES.find(s => s.key === ns)?.label?.slice(0, 8)}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Candidate Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDrawer(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-card)] border-l border-[var(--glass-border)] z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouveau Candidat</h2>
                  <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Prénom</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Téléphone</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Poste visé</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Département</label><select className="w-full h-10 px-3 glass-input text-sm">{departments.map((d: any) => <option key={d.id}>{d.name}</option>)}</select></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Source</label><select className="w-full h-10 px-3 glass-input text-sm"><option>LinkedIn</option><option>Site web</option><option>Référence interne</option><option>BOLOLO</option><option>Autre</option></select></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Prétention salariale (XAF)</label><input type="number" className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Notes</label><textarea className="w-full h-20 p-3 glass-input text-sm resize-none" /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowDrawer(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button onClick={() => { showToast('Candidat ajouté', 'success'); setShowDrawer(false); }} className="flex-1 btn-primary h-10 justify-center">Ajouter</button>
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
