import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Mail, Phone, Calendar, CreditCard, Building2, MapPin, FileText } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';

export function HrEmployeesPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  useEffect(() => { setCurrentPageTitle('Gestion des Employés'); }, [setCurrentPageTitle]);

  const employees = getAll('employees');
  const departments = getAll('departments');
  const leaves = getAll('leaves');

  const filtered = employees.filter((e: any) => {
    const m = e.fullName.toLowerCase().includes(search.toLowerCase()) || e.matricule.toLowerCase().includes(search.toLowerCase());
    return m && (deptFilter === 'all' || e.departmentId === deptFilter);
  });

  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Employés</h2>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2.5 py-1">{employees.length}</span>
        </div>
        <button onClick={() => setShowDrawer(true)} className="btn-primary h-9"><Plus size={16} /> Nouvel Employé</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom ou matricule..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="h-9 px-3 glass-input text-sm">
          <option value="all">Tous départements</option>
          {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Employé</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Matricule</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Poste</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Département</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Contrat</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Salaire brut</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp: any, i: number) => (
                <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => setSelectedEmployee(emp)}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-xs font-bold">{emp.firstName.charAt(0)}{emp.lastName.charAt(0)}</div>
                      <div><p className="text-sm font-medium text-[var(--text-primary)]">{emp.fullName}</p><p className="text-[10px] text-[var(--text-muted)]">{emp.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono text-[var(--text-secondary)]">{emp.matricule}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-primary)]">{emp.position}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{emp.departmentName}</td>
                  <td className="px-4 py-3"><span className="text-[10px] px-2 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-secondary)]">{emp.contractType}</span></td>
                  <td className="px-4 py-3 text-xs text-right font-medium text-[var(--text-primary)]">{formatXAF(emp.grossSalary)}</td>
                  <td className="px-4 py-3"><StatusBadge status={emp.status} /></td>
                  <td className="px-4 py-3 text-right"><button onClick={(e) => { e.stopPropagation(); setSelectedEmployee(emp); }} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)]"><FileText size={14} /></button></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Employee Detail - Centered Modal (short) */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedEmployee(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card z-50 max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-lg">{selectedEmployee.firstName.charAt(0)}{selectedEmployee.lastName.charAt(0)}</div>
                    <div><h2 className="text-lg font-semibold text-[var(--text-primary)]">{selectedEmployee.fullName}</h2><p className="text-xs text-[var(--text-muted)]">{selectedEmployee.position}</p></div>
                  </div>
                  <button onClick={() => setSelectedEmployee(null)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[10px] text-[var(--text-muted)]">Matricule</span><p className="text-sm text-[var(--text-primary)] font-medium">{selectedEmployee.matricule}</p></div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[10px] text-[var(--text-muted)]">CNPS</span><p className="text-sm text-[var(--text-primary)] font-medium">{selectedEmployee.cnpsNumber}</p></div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[10px] text-[var(--text-muted)]">Embauche</span><p className="text-sm text-[var(--text-primary)]">{new Date(selectedEmployee.hireDate).toLocaleDateString('fr-FR')}</p></div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[10px] text-[var(--text-muted)]">Contrat</span><p className="text-sm text-[var(--text-primary)]">{selectedEmployee.contractType}</p></div>
                  </div>
                  <div className="h-px bg-[var(--divider)]" />
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2"><Mail size={12} className="text-[var(--accent-primary)]" /><span className="text-[var(--text-secondary)]">{selectedEmployee.email}</span></div>
                    <div className="flex items-center gap-2"><Phone size={12} className="text-[var(--accent-primary)]" /><span className="text-[var(--text-secondary)]">{selectedEmployee.phone}</span></div>
                    <div className="flex items-center gap-2"><MapPin size={12} className="text-[var(--accent-primary)]" /><span className="text-[var(--text-secondary)]">{selectedEmployee.address}</span></div>
                    <div className="flex items-center gap-2"><Calendar size={12} className="text-[var(--accent-primary)]" /><span className="text-[var(--text-secondary)]">Né(e) {new Date(selectedEmployee.birthDate).toLocaleDateString('fr-FR')}</span></div>
                    <div className="flex items-center gap-2"><CreditCard size={12} className="text-[var(--accent-primary)]" /><span className="text-[var(--text-secondary)]">{selectedEmployee.bankName} - {selectedEmployee.bankAccount?.slice(-4)}</span></div>
                    <div className="flex items-center gap-2"><Building2 size={12} className="text-[var(--accent-primary)]" /><span className="text-[var(--text-secondary)]">{selectedEmployee.departmentName}</span></div>
                  </div>
                  <div className="h-px bg-[var(--divider)]" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10"><span className="text-[10px] text-[var(--text-muted)]">Salaire brut</span><p className="text-sm font-bold text-[var(--accent-primary)]">{formatXAF(selectedEmployee.grossSalary)}</p></div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[10px] text-[var(--text-muted)]">Salaire net</span><p className="text-sm font-bold text-[var(--text-primary)]">{formatXAF(selectedEmployee.netSalary)}</p></div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>Urgence: {selectedEmployee.emergencyContact}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Employee Drawer - Right sidebar (long form) */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDrawer(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-[var(--bg-card)] border-l border-[var(--glass-border)] z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvel Employé</h2>
                  <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Prénom</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email</label><input type="email" className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Téléphone</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Date naissance</label><input type="date" className="w-full h-10 px-3 glass-input text-sm" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Date embauche</label><input type="date" className="w-full h-10 px-3 glass-input text-sm" /></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Poste</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Département</label><select className="w-full h-10 px-3 glass-input text-sm">{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Type contrat</label><select className="w-full h-10 px-3 glass-input text-sm"><option>CDI</option><option>CDD</option><option>STAGE</option><option>CONSULTANT</option></select></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Salaire brut (XAF)</label><input type="number" className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">N° CNPS</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Adresse</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Banque</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Compte bancaire</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Contact d'urgence</label><input className="w-full h-10 px-3 glass-input text-sm" /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowDrawer(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button onClick={() => { showToast('Employé créé', 'success'); setShowDrawer(false); }} className="flex-1 btn-primary h-10 justify-center">Créer</button>
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
