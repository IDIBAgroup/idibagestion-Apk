import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Calendar, User, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';

const LEAVE_TYPES: Record<string, { label: string; color: string }> = {
  annual: { label: 'Congé annuel', color: '#2DD4A8' },
  sick: { label: 'Maladie', color: '#EF4444' },
  maternity: { label: 'Maternité', color: '#F59E0B' },
  paternity: { label: 'Paternité', color: '#3B82F6' },
  unpaid: { label: 'Sans solde', color: '#4A5568' },
  training: { label: 'Formation', color: '#8B5CF6' },
};

export function LeavesPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDrawer, setShowDrawer] = useState(false);

  useEffect(() => { setCurrentPageTitle('Gestion des Congés'); }, [setCurrentPageTitle]);

  const leaves = getAll('leaves');
  const employees = getAll('employees');

  const filtered = leaves.filter((l: any) => {
    const m = l.employeeName.toLowerCase().includes(search.toLowerCase());
    return m && (statusFilter === 'all' || l.status === statusFilter);
  });

  const stats = {
    approved: leaves.filter((l: any) => l.status === 'approved').reduce((s: number, l: any) => s + l.days, 0),
    pending: leaves.filter((l: any) => l.status === 'pending').reduce((s: number, l: any) => s + l.days, 0),
    totalRequests: leaves.length,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Congés & Absences</h2>
        <button onClick={() => setShowDrawer(true)} className="btn-primary h-9"><Plus size={16} /> Demande</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase">Jours approuvés (2024)</p><p className="text-2xl font-bold text-[var(--accent-primary)]">{stats.approved}</p></div></GlassCard>
        <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase">En attente</p><p className="text-2xl font-bold text-[var(--accent-warning)]">{stats.pending} jours</p></div></GlassCard>
        <GlassCard><div className="p-3"><p className="text-[10px] text-[var(--text-muted)] uppercase">Demandes totales</p><p className="text-2xl font-bold text-[var(--accent-secondary)]">{stats.totalRequests}</p></div></GlassCard>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs rounded-lg ${statusFilter === s ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>
            {s === 'all' ? 'Tous' : s === 'pending' ? 'En attente' : s === 'approved' ? 'Approuvé' : 'Refusé'}
          </button>
        ))}
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Employé</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Type</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Période</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Jours</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Motif</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-center text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l: any, i: number) => (
                <motion.tr key={l.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-[10px] font-bold">{l.employeeName.charAt(0)}</div><span className="text-sm text-[var(--text-primary)]">{l.employeeName}</span></div></td>
                  <td className="px-4 py-3"><span className="flex items-center gap-1 text-xs"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: LEAVE_TYPES[l.type]?.color }} />{LEAVE_TYPES[l.type]?.label}</span></td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{new Date(l.startDate).toLocaleDateString('fr-FR')} → {new Date(l.endDate).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[var(--text-primary)]">{l.days}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)] max-w-[150px] truncate">{l.reason}</td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-1">
                      {l.status === 'pending' && (
                        <>
                          <button onClick={() => showToast('Congé approuvé', 'success')} className="p-1 rounded hover:bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"><CheckCircle2 size={14} /></button>
                          <button onClick={() => showToast('Congé refusé', 'error')} className="p-1 rounded hover:bg-[var(--accent-danger)]/10 text-[var(--accent-danger)]"><XCircle size={14} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* New Leave Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDrawer(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-card)] border-l border-[var(--glass-border)] z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6"><h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvelle Demande</h2><button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button></div>
                <div className="space-y-4">
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Employé</label><select className="w-full h-10 px-3 glass-input text-sm">{employees.map((e: any) => <option key={e.id} value={e.id}>{e.fullName}</option>)}</select></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Type</label><select className="w-full h-10 px-3 glass-input text-sm">{Object.entries(LEAVE_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Du</label><input type="date" className="w-full h-10 px-3 glass-input text-sm" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Au</label><input type="date" className="w-full h-10 px-3 glass-input text-sm" /></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Motif</label><textarea className="w-full h-20 p-3 glass-input text-sm resize-none" /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowDrawer(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button onClick={() => { showToast('Demande soumise', 'success'); setShowDrawer(false); }} className="flex-1 btn-primary h-10 justify-center">Soumettre</button>
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
