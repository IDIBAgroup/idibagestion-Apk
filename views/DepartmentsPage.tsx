'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Edit3, Eye, Plus, Trash2, UserCheck, UserPlus, Users, X } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { trpc } from '@/providers/trpc';
import { useUIStore } from '@/stores/uiStore';

type Person = { id: number; name: string; email: string | null; role: string };
type Department = {
  id: number;
  companyId: number;
  name: string;
  managerId: number | null;
  managerName: string | null;
  managerEmail: string | null;
  members: Person[];
  createdAt: Date;
  updatedAt: Date;
};

export function DepartmentsPage() {
  const { companyId } = useActiveCompany();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const utils = trpc.useUtils();
  const directoryQuery = trpc.department.directory.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [managerId, setManagerId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState('');

  const departments = directoryQuery.data?.departments as Department[] | undefined;
  const people = directoryQuery.data?.people ?? [];
  const selectedDepartment = departments?.find(({ id }) => id === selectedDepartmentId) ?? null;
  const availablePeople = useMemo(() => people.filter((person) => !selectedDepartment?.members.some((member) => member.id === person.id)), [people, selectedDepartment]);

  useEffect(() => { setCurrentPageTitle('Départements & Organisation'); }, [setCurrentPageTitle]);

  const refreshDirectory = async () => {
    if (companyId) await utils.department.directory.invalidate({ companyId });
  };
  const createDepartment = trpc.department.create.useMutation({
    onSuccess: async () => { await refreshDirectory(); setDrawerOpen(false); showToast('Département créé.', 'success'); },
    onError: (error) => showToast(error.message, 'error'),
  });
  const updateDepartment = trpc.department.update.useMutation({
    onSuccess: async () => { await refreshDirectory(); setDrawerOpen(false); setEditingDepartment(null); showToast('Département mis à jour.', 'success'); },
    onError: (error) => showToast(error.message, 'error'),
  });
  const assignPerson = trpc.department.assign.useMutation({
    onSuccess: async () => { await refreshDirectory(); setSelectedPersonId(''); showToast('Membre affecté au département.', 'success'); },
    onError: (error) => showToast(error.message, 'error'),
  });
  const unassignPerson = trpc.department.unassign.useMutation({
    onSuccess: async () => { await refreshDirectory(); showToast('Membre retiré du département.', 'success'); },
    onError: (error) => showToast(error.message, 'error'),
  });
  const deleteDepartment = trpc.department.delete.useMutation({
    onSuccess: async () => { await refreshDirectory(); setSelectedDepartmentId(null); showToast('Département supprimé.', 'success'); },
    onError: (error) => showToast(error.message, 'error'),
  });

  const openCreate = () => {
    setEditingDepartment(null);
    setDepartmentName('');
    setManagerId('');
    setDrawerOpen(true);
  };
  const openEdit = (department: Department) => {
    setEditingDepartment(department);
    setDepartmentName(department.name);
    setManagerId(department.managerId == null ? '' : String(department.managerId));
    setDrawerOpen(true);
  };
  const saveDepartment = (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyId) return;
    const normalizedName = departmentName.trim();
    if (editingDepartment) {
      updateDepartment.mutate({ companyId, departmentId: editingDepartment.id, name: normalizedName, managerId: managerId ? Number(managerId) : null });
    } else {
      createDepartment.mutate({ companyId, name: normalizedName, managerId: managerId ? Number(managerId) : null });
    }
  };
  const removeDepartment = (department: Department) => {
    if (!companyId || !window.confirm(`Supprimer le département « ${department.name} » ?`)) return;
    deleteDepartment.mutate({ companyId, departmentId: department.id });
  };

  if (!companyId) return <div className="rounded border border-[var(--divider)] p-6 text-sm text-[var(--text-muted)]">Sélectionnez une entreprise pour afficher ses départements.</div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Départements</h2>
          <span className="rounded-full bg-[var(--bg-elevated)] px-2.5 py-1 text-xs text-[var(--text-muted)]">{departments?.length ?? 0}</span>
        </div>
        <button type="button" onClick={openCreate} className="btn-primary h-9"><Plus size={16} /> Nouveau</button>
      </div>

      {directoryQuery.isError ? (
        <div className="rounded border border-[var(--divider)] p-8 text-center text-sm text-[var(--text-muted)]">
          <p>{directoryQuery.error.message}</p>
          <button type="button" onClick={() => directoryQuery.refetch()} className="mt-3 text-[var(--accent-primary)]">Réessayer</button>
        </div>
      ) : directoryQuery.isLoading ? (
        <div className="rounded border border-[var(--divider)] p-8 text-center text-sm text-[var(--text-muted)]">Chargement des départements…</div>
      ) : departments?.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {departments.map((department, index) => (
            <GlassCard key={department.id} delay={index * 0.04}>
              <div className="p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[var(--accent-primary)]/10"><Building2 size={20} className="text-[var(--accent-primary)]" /></div>
                    <div className="min-w-0"><h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">{department.name}</h3><p className="text-[10px] text-[var(--text-muted)]">{department.members.length} membre{department.members.length === 1 ? '' : 's'}</p></div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button type="button" onClick={() => openEdit(department)} className="rounded p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--accent-primary)]" title="Modifier le département"><Edit3 size={14} /></button>
                    <button type="button" onClick={() => setSelectedDepartmentId(department.id)} className="rounded p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--accent-primary)]" title="Voir les détails"><Eye size={14} /></button>
                    <button type="button" disabled={deleteDepartment.isPending} onClick={() => removeDepartment(department)} className="rounded p-1.5 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--accent-danger)]" title="Supprimer"><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs"><UserCheck size={12} className="text-[var(--accent-secondary)]" /><span className="text-[var(--text-secondary)]">Responsable :</span><span className="truncate font-medium text-[var(--text-primary)]">{department.managerName || 'Non assigné'}</span></div>
                <div className="my-3 h-px bg-[var(--divider)]" />
                <div className="flex -space-x-2">
                  {department.members.slice(0, 5).map((person) => <div key={person.id} title={person.name} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg-primary)] bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] text-[10px] font-medium text-white">{person.name.charAt(0).toLocaleUpperCase()}</div>)}
                  {department.members.length > 5 && <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[var(--bg-primary)] bg-[var(--bg-elevated)] text-[10px] text-[var(--text-muted)]">+{department.members.length - 5}</div>}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="rounded border border-dashed border-[var(--divider)] p-10 text-center"><Building2 className="mx-auto mb-3 text-[var(--text-muted)]" size={28} /><p className="text-sm font-medium text-[var(--text-primary)]">Aucun département configuré</p><p className="mt-1 text-xs text-[var(--text-muted)]">Créez vos départements et rattachez les membres de l’entreprise.</p></div>
      )}

      <AnimatePresence>
        {selectedDepartment && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/50" onClick={() => setSelectedDepartmentId(null)} />
            <motion.section initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--bg-card)] p-6 shadow-2xl" aria-label={`Département ${selectedDepartment.name}`}>
              <div className="mb-5 flex items-start justify-between border-b border-[var(--divider)] pb-4">
                <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded bg-[var(--accent-primary)]/10"><Building2 className="text-[var(--accent-primary)]" size={22} /></div><div><h2 className="text-lg font-semibold text-[var(--text-primary)]">{selectedDepartment.name}</h2><p className="text-xs text-[var(--text-muted)]">{selectedDepartment.members.length} membre{selectedDepartment.members.length === 1 ? '' : 's'}</p></div></div>
                <div className="flex gap-1"><button type="button" onClick={() => openEdit(selectedDepartment)} className="rounded p-2 text-[var(--text-muted)] hover:bg-white/5" aria-label="Modifier"><Edit3 size={16} /></button><button type="button" onClick={() => removeDepartment(selectedDepartment)} className="rounded p-2 text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--accent-danger)]" aria-label="Supprimer"><Trash2 size={16} /></button><button type="button" onClick={() => setSelectedDepartmentId(null)} className="rounded p-2 text-[var(--text-muted)] hover:bg-white/5" aria-label="Fermer"><X size={18} /></button></div>
              </div>
              <div className="mb-5 rounded border border-[var(--divider)] p-3"><p className="mb-1 text-[10px] uppercase text-[var(--text-muted)]">Responsable du département</p><p className="text-sm font-medium text-[var(--text-primary)]">{selectedDepartment.managerName || 'Aucun responsable assigné'}</p>{selectedDepartment.managerEmail && <p className="text-xs text-[var(--text-muted)]">{selectedDepartment.managerEmail}</p>}</div>
              <div className="mb-3 flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]"><Users size={15} /> Membres</h3><div className="flex min-w-0 gap-2"><select aria-label="Choisir un membre" value={selectedPersonId} onChange={(event) => setSelectedPersonId(event.target.value)} className="glass-input h-8 min-w-0 text-xs"><option value="">Choisir un membre…</option>{availablePeople.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><button type="button" disabled={!selectedPersonId || assignPerson.isPending} onClick={() => companyId && selectedPersonId && assignPerson.mutate({ companyId, departmentId: selectedDepartment.id, userId: Number(selectedPersonId) })} className="btn-primary h-8 shrink-0 px-2 text-xs"><UserPlus size={13} /> Ajouter</button></div></div>
              <div className="space-y-2">
                {selectedDepartment.members.map((person) => <div key={person.id} className="flex items-center gap-3 rounded border border-[var(--divider)] p-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent-primary)]/10 text-sm font-semibold text-[var(--accent-primary)]">{person.name.charAt(0).toLocaleUpperCase()}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-[var(--text-primary)]">{person.name}</p><p className="truncate text-xs text-[var(--text-muted)]">{person.email || person.role}</p></div><button type="button" disabled={unassignPerson.isPending} onClick={() => companyId && unassignPerson.mutate({ companyId, departmentId: selectedDepartment.id, userId: person.id })} className="rounded p-2 text-xs text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--accent-danger)]" aria-label={`Retirer ${person.name}`}><X size={15} /></button></div>)}
                {!selectedDepartment.members.length && <p className="rounded border border-dashed border-[var(--divider)] py-8 text-center text-xs text-[var(--text-muted)]">Aucun membre affecté.</p>}
              </div>
            </motion.section>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] bg-black/50" onClick={() => setDrawerOpen(false)} />
            <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} className="fixed inset-y-0 right-0 z-[60] w-full max-w-md overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--bg-card)] p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between border-b border-[var(--divider)] pb-4"><h2 className="text-base font-semibold text-[var(--text-primary)]">{editingDepartment ? 'Modifier le département' : 'Nouveau département'}</h2><button type="button" onClick={() => setDrawerOpen(false)} className="rounded p-2 text-[var(--text-muted)] hover:bg-white/5" aria-label="Fermer"><X size={18} /></button></div>
              <form onSubmit={saveDepartment} className="space-y-4">
                <div><label htmlFor="department-name" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Nom du département *</label><input id="department-name" value={departmentName} onChange={(event) => setDepartmentName(event.target.value)} maxLength={120} required minLength={2} autoFocus className="glass-input h-10 w-full px-3 text-sm" placeholder="Ex. Comptabilité" /></div>
                <div><label htmlFor="department-manager" className="mb-1.5 block text-xs font-medium text-[var(--text-secondary)]">Responsable</label><select id="department-manager" value={managerId} onChange={(event) => setManagerId(event.target.value)} className="glass-input h-10 w-full px-3 text-sm"><option value="">Aucun responsable</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name} — {person.role}</option>)}</select><p className="mt-1 text-[11px] text-[var(--text-muted)]">Seuls les membres actifs de l’entreprise sont proposés.</p></div>
                <div className="flex justify-end gap-2 border-t border-[var(--divider)] pt-4"><button type="button" onClick={() => setDrawerOpen(false)} className="btn-ghost h-9">Annuler</button><button type="submit" disabled={!departmentName.trim() || createDepartment.isPending || updateDepartment.isPending} className="btn-primary h-9">{createDepartment.isPending || updateDepartment.isPending ? 'Enregistrement…' : editingDepartment ? 'Enregistrer' : 'Créer'}</button></div>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
