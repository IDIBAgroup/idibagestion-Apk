import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, UserCheck, Plus, X, Trash2, Eye, Mail, Phone, Users, Briefcase } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify, removeAndNotify } from '@/lib/db';

export function DepartmentsPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [newDept, setNewDept] = useState({ name: '', managerId: '' });

  useEffect(() => { setCurrentPageTitle('Departements'); }, [setCurrentPageTitle]);

  const departments = getAll('departments');
  const users = getAll('users');
  const employees = getAll('employees');

  const handleCreate = () => {
    if (!newDept.name) return;
    const dept = {
      id: `dept-${Date.now()}`,
      name: newDept.name,
      managerId: newDept.managerId || '',
      companyId: 'comp-1',
      employeeCount: 0,
    };
    addAndNotify('departments', dept);
    setShowDrawer(false);
    setNewDept({ name: '', managerId: '' });
    showToast('Departement cree avec succes', 'success');
  };

  const handleDelete = (deptId: string) => {
    if (confirm('Supprimer ce departement ?')) {
      removeAndNotify('departments', deptId);
      if (selectedDept?.id === deptId) setSelectedDept(null);
      showToast('Departement supprime', 'success');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Departements</h2>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2.5 py-1">{departments.length}</span>
        </div>
        <button onClick={() => setShowDrawer(true)} className="btn-primary h-9"><Plus size={16} /> Nouveau</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dept: any, i: number) => {
          const manager = users.find((u: any) => u.uid === dept.managerId);
          const deptEmployees = employees.filter((e: any) => e.departmentId === dept.id);
          const deptUsers = users.filter((u: any) => u.departmentId === dept.id);
          return (
            <GlassCard key={dept.id} delay={i * 0.05}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                      <Building2 size={20} className="text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{dept.name}</h3>
                      <p className="text-[10px] text-[var(--text-muted)]">{deptEmployees.length} employe{deptEmployees.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => setSelectedDept({ ...dept, manager, deptEmployees, deptUsers })} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-primary)]"><Eye size={14} /></button>
                    <button onClick={() => handleDelete(dept.id)} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-danger)]"><Trash2 size={14} /></button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <UserCheck size={12} className="text-[var(--accent-secondary)]" />
                    <span className="text-[var(--text-secondary)]">Responsable:</span>
                    <span className="text-[var(--text-primary)] font-medium">{manager?.displayName || 'Non assigne'}</span>
                  </div>

                  <div className="h-px bg-[var(--divider)] my-2" />

                  <div className="flex -space-x-2">
                    {deptUsers.slice(0, 5).map((emp: any, ei: number) => (
                      <div key={emp.uid} className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-[10px] text-white font-medium border-2 border-[var(--bg-primary)]" title={emp.displayName}>
                        {emp.displayName.charAt(0)}
                      </div>
                    ))}
                    {deptUsers.length > 5 && (
                      <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[10px] text-[var(--text-muted)] border-2 border-[var(--bg-primary)]">
                        +{deptUsers.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Detail Modal - centered */}
      <AnimatePresence>
        {selectedDept && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedDept(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card z-50 max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center">
                      <Building2 size={24} className="text-[var(--accent-primary)]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{selectedDept.name}</h2>
                      <p className="text-xs text-[var(--text-muted)]">ID: {selectedDept.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleDelete(selectedDept.id)} className="p-2 rounded-lg hover:bg-white/5 text-[var(--accent-danger)]"><Trash2 size={16} /></button>
                    <button onClick={() => setSelectedDept(null)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                  </div>
                </div>

                {/* Manager */}
                {selectedDept.manager && (
                  <div className="glass-card-compact p-3 mb-4">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase mb-2">Responsable</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-sm">{selectedDept.manager.displayName.charAt(0)}</div>
                      <div>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{selectedDept.manager.displayName}</p>
                        <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Mail size={10} /> {selectedDept.manager.email}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Employees list */}
                <div>
                  <p className="text-[10px] text-[var(--text-muted)] uppercase mb-2 flex items-center gap-1"><Users size={10} /> {selectedDept.deptEmployees?.length || 0} employe(s)</p>
                  <div className="space-y-2">
                    {selectedDept.deptEmployees?.map((emp: any) => (
                      <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-elevated)]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-xs font-bold">{emp.firstName.charAt(0)}{emp.lastName.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[var(--text-primary)]">{emp.fullName}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{emp.position}</p>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">{emp.contractType}</span>
                      </div>
                    ))}
                    {(!selectedDept.deptEmployees || selectedDept.deptEmployees.length === 0) && (
                      <p className="text-xs text-[var(--text-muted)] text-center py-4">Aucun employe dans ce departement</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Department Drawer - right sidebar */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDrawer(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-card)] border-l border-[var(--glass-border)] z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouveau Departement</h2>
                  <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom du departement</label>
                    <input value={newDept.name} onChange={(e) => setNewDept({ ...newDept, name: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="Ex: Ingenierie Reseau" />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Responsable</label>
                    <select value={newDept.managerId} onChange={(e) => setNewDept({ ...newDept, managerId: e.target.value })} className="w-full h-10 px-3 glass-input text-sm">
                      <option value="">Selectionner un responsable...</option>
                      {users.map((u: any) => <option key={u.uid} value={u.uid}>{u.displayName}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowDrawer(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button onClick={handleCreate} disabled={!newDept.name} className="flex-1 btn-primary h-10 justify-center disabled:opacity-50">Creer</button>
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
