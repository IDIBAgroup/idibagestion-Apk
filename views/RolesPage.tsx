import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Check, X, Plus, Trash2, Edit3, Save, AlertCircle } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify, updateAndNotify, removeAndNotify } from '@/lib/db';

const defaultModules = ['Projets', 'Commercial', 'Comptabilité', 'Immobilisations', 'RH & Paie', 'Admin', 'Support', 'Chat'];
const defaultActions = ['Lire', 'Créer', 'Modifier', 'Supprimer', 'Valider'];

export function RolesPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  useEffect(() => {
    setCurrentPageTitle('Rôles & Matrice des Permissions');
    const loadedRoles = getAll('roles');
    setRoles(loadedRoles);
    if (loadedRoles.length > 0) setSelectedRole(loadedRoles[0]);
  }, [setCurrentPageTitle]);

  const refreshRoles = () => {
    const loaded = getAll('roles');
    setRoles(loaded);
    if (selectedRole) {
      const updated = loaded.find(r => r.id === selectedRole.id);
      if (updated) setSelectedRole(updated);
      else if (loaded.length > 0) setSelectedRole(loaded[0]);
    }
  };

  const handleTogglePermission = (mod: string, act: string) => {
    if (!selectedRole) return;
    if (selectedRole.isSystem && selectedRole.name === 'Administrateur') {
      showToast('Le rôle Administrateur conserve toutes les permissions système', 'warning');
      return;
    }

    const permKey = `${mod}.${act}`;
    const currentPerms: string[] = selectedRole.permissions || [];
    let updatedPerms: string[];

    if (currentPerms.includes(permKey)) {
      updatedPerms = currentPerms.filter(p => p !== permKey);
    } else {
      updatedPerms = [...currentPerms, permKey];
    }

    updateAndNotify('roles', selectedRole.id, { permissions: updatedPerms });
    setSelectedRole({ ...selectedRole, permissions: updatedPerms });
    refreshRoles();
    showToast(`Permission '${permKey}' mise à jour`, 'success');
  };

  const handleCreateRole = () => {
    if (!roleForm.name.trim()) {
      showToast('Le nom du rôle est requis', 'warning');
      return;
    }
    const newRole = {
      id: `role-${Date.now()}`,
      name: roleForm.name.trim(),
      description: roleForm.description.trim() || 'Rôle personnalisé',
      isSystem: false,
      permissions: ['Projets.Lire', 'Chat.Lire'],
      companyId: 'comp-1',
    };
    addAndNotify('roles', newRole);
    setShowCreateModal(false);
    setRoleForm({ name: '', description: '' });
    refreshRoles();
    setSelectedRole(newRole);
    showToast('Nouveau rôle créé avec succès', 'success');
  };

  const handleUpdateRoleDetails = () => {
    if (!selectedRole || !roleForm.name.trim()) return;
    updateAndNotify('roles', selectedRole.id, {
      name: roleForm.name.trim(),
      description: roleForm.description.trim(),
    });
    setShowEditModal(false);
    refreshRoles();
    showToast('Rôle mis à jour', 'success');
  };

  const handleDeleteRole = (roleId: string) => {
    const r = roles.find(x => x.id === roleId);
    if (r?.isSystem) {
      showToast('Impossible de supprimer un rôle système', 'warning');
      return;
    }
    if (confirm(`Voulez-vous vraiment supprimer le rôle "${r?.name}" ?`)) {
      removeAndNotify('roles', roleId);
      refreshRoles();
      showToast('Rôle supprimé', 'success');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Rôles & Droits d'Accès</h2>
          <p className="text-xs text-[var(--text-muted)]">Définissez la matrice des permissions par rôle pour tous les utilisateurs</p>
        </div>
        <button onClick={() => { setRoleForm({ name: '', description: '' }); setShowCreateModal(true); }} className="btn-primary h-9 font-bold text-xs gap-1.5">
          <Plus size={15} /> Nouveau Rôle
        </button>
      </div>

      {/* Roles Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
              selectedRole?.id === role.id
                ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--glass-border)] hover:bg-white/5'
            }`}
          >
            <Shield size={14} className={selectedRole?.id === role.id ? 'text-[var(--accent-primary)]' : ''} />
            <span>{role.name}</span>
            {role.isSystem && <Lock size={11} className="text-[var(--text-muted)]" />}
          </button>
        ))}
      </div>

      {/* Selected Role Matrix */}
      {selectedRole && (
        <GlassCard>
          <div className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-4 border-b border-[var(--divider)]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--text-primary)]">{selectedRole.name}</h3>
                  {selectedRole.isSystem ? (
                    <span className="text-[10px] bg-white/10 text-[var(--text-muted)] px-2 py-0.5 rounded-full font-mono">Système</span>
                  ) : (
                    <span className="text-[10px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-0.5 rounded-full font-mono">Personnalisé</span>
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{selectedRole.description}</p>
              </div>

              <div className="flex items-center gap-2">
                {!selectedRole.isSystem && (
                  <>
                    <button
                      onClick={() => { setRoleForm({ name: selectedRole.name, description: selectedRole.description || '' }); setShowEditModal(true); }}
                      className="btn-secondary h-8 text-xs gap-1.5 px-3"
                    >
                      <Edit3 size={12} /> Modifier l'intitulé
                    </button>
                    <button
                      onClick={() => handleDeleteRole(selectedRole.id)}
                      className="btn-ghost h-8 text-xs text-[var(--accent-danger)] hover:bg-red-500/10 gap-1 px-3"
                    >
                      <Trash2 size={12} /> Supprimer
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--divider)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Module Métier</th>
                    {defaultActions.map(a => (
                      <th key={a} className="text-center px-4 py-3">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {defaultModules.map((mod) => (
                    <tr key={mod} className="border-b border-[var(--divider)]/50 hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3 font-semibold text-[var(--text-primary)]">{mod}</td>
                      {defaultActions.map((act) => {
                        const permKey = `${mod}.${act}`;
                        const isAllowed = selectedRole.name === 'Administrateur' || (selectedRole.permissions || []).includes(permKey) || (selectedRole.permissions || []).includes('*');

                        return (
                          <td key={act} className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleTogglePermission(mod, act)}
                              className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-all ${
                                isAllowed
                                  ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 hover:scale-105'
                                  : 'bg-white/5 text-[var(--text-muted)] border border-white/10 hover:bg-white/10'
                              }`}
                              title={`Cliquer pour ${isAllowed ? 'désactiver' : 'activer'} ${permKey}`}
                            >
                              {isAllowed ? <Check size={16} /> : <X size={14} />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </GlassCard>
      )}

      {/* CREATE ROLE MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full w-full max-w-md space-y-4 overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--bg-card)] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield size={16} className="text-[var(--accent-primary)]" /> Nouveau Rôle Personnalisé
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-1 rounded hover:bg-white/10 text-white"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Nom du Rôle *</label>
                  <input value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} className="w-full h-9 px-3 glass-input text-xs" placeholder="Ex: Chef de Projet Senior" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Description</label>
                  <textarea value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} className="w-full h-20 p-2.5 glass-input text-xs resize-none" placeholder="Rôle et responsabilités au sein de la plateforme..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="btn-ghost h-9 text-xs">Annuler</button>
                <button onClick={handleCreateRole} className="btn-primary h-9 text-xs font-bold gap-1.5"><Save size={14} /> Créer le Rôle</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT ROLE MODAL */}
      <AnimatePresence>
        {showEditModal && selectedRole && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full w-full max-w-md space-y-4 overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--bg-card)] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 size={16} className="text-[var(--accent-primary)]" /> Modifier le Rôle
                </h3>
                <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-white/10 text-white"><X size={18} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Nom du Rôle *</label>
                  <input value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} className="w-full h-9 px-3 glass-input text-xs" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Description</label>
                  <textarea value={roleForm.description} onChange={e => setRoleForm({ ...roleForm, description: e.target.value })} className="w-full h-20 p-2.5 glass-input text-xs resize-none" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowEditModal(false)} className="btn-ghost h-9 text-xs">Annuler</button>
                <button onClick={handleUpdateRoleDetails} className="btn-primary h-9 text-xs font-bold gap-1.5"><Save size={14} /> Enregistrer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
