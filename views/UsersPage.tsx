import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Mail, Shield, Trash2, Eye, Edit3, X, UserCheck, CheckCircle2, Clock, Building2, Save, UserX } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify, updateAndNotify, removeAndNotify } from '@/lib/db';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { trpc } from '@/providers/trpc';

import type { UserStatus } from '@/types';

export function UsersPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { company } = useActiveCompany();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'manager' | 'member'>('member');
  const [companyInviteLink, setCompanyInviteLink] = useState('');

  const companyAccessRole = trpc.company.accessRole.useQuery(
    { companyId: company?.id ?? 0 },
    { enabled: !!company?.id },
  );
  const canManageCompanyAccess = ['owner', 'admin', 'platform_admin'].includes(companyAccessRole.data ?? '');
  const canAssignCompanyAdmin = companyAccessRole.data === 'owner' || companyAccessRole.data === 'platform_admin';
  const selectedInviteRole = inviteRole === 'admin' && !canAssignCompanyAdmin ? 'member' : inviteRole;
  const companyMembers = trpc.company.listMembers.useQuery(
    { companyId: company?.id ?? 0 },
    { enabled: canManageCompanyAccess && !!company?.id },
  );
  const createCompanyInvite = trpc.company.createInvite.useMutation({
    onSuccess: ({ invitePath }) => {
      setCompanyInviteLink(window.location.origin + invitePath);
      showToast('Lien d’invitation créé. Transmettez-le directement au collaborateur.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });
  const revokeCompanyAccess = trpc.company.revokeAccess.useMutation({
    onSuccess: () => {
      void companyMembers.refetch();
      showToast('Accès entreprise révoqué.', 'success');
    },
    onError: (error) => showToast(error.message, 'error'),
  });

  // Modals state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Form states
  const [userForm, setUserForm] = useState<{ displayName: string; email: string; roleId: string; departmentId: string; status: UserStatus }>({
    displayName: '',
    email: '',
    roleId: '',
    departmentId: '',
    status: 'active',
  });

  const loadData = () => {
    setUsers(getAll('users'));
    setRoles(getAll('roles'));
    setDepartments(getAll('departments'));
  };

  useEffect(() => {
    setCurrentPageTitle('Gestion des Utilisateurs & Comptes');
    loadData();
  }, [setCurrentPageTitle]);

  const handleCreateUser = () => {
    if (!userForm.displayName.trim() || !userForm.email.trim()) {
      showToast('Le nom et l\'adresse email sont requis', 'warning');
      return;
    }

    const role = roles.find(r => r.id === userForm.roleId) || roles[0];
    const dept = departments.find(d => d.id === userForm.departmentId);

    const newUser = {
      uid: `user-${Date.now()}`,
      displayName: userForm.displayName.trim(),
      email: userForm.email.trim(),
      roleId: role?.id || 'role-4',
      roleName: role?.name || 'Employé',
      departmentId: dept?.id || '',
      companyId: 'comp-1',
      status: userForm.status,
      permissions: role?.permissions || ['Projets.Lire'],
      createdAt: new Date().toISOString(),
    };

    addAndNotify('users', newUser);
    setShowInviteModal(false);
    setUserForm({ displayName: '', email: '', roleId: '', departmentId: '', status: 'active' });
    loadData();
    showToast('Compte utilisateur créé avec succès', 'success');
  };

  const handleUpdateUser = () => {
    if (!selectedUser || !userForm.displayName.trim()) return;
    const role = roles.find(r => r.id === userForm.roleId);
    const dept = departments.find(d => d.id === userForm.departmentId);

    updateAndNotify('users', selectedUser.uid, {
      displayName: userForm.displayName.trim(),
      email: userForm.email.trim(),
      roleId: role?.id || selectedUser.roleId,
      roleName: role?.name || selectedUser.roleName,
      departmentId: dept?.id || '',
      status: userForm.status,
      permissions: role?.permissions || selectedUser.permissions,
    });

    setShowEditModal(false);
    loadData();
    if (selectedUser) {
      setSelectedUser({
        ...selectedUser,
        displayName: userForm.displayName.trim(),
        email: userForm.email.trim(),
        roleName: role?.name || selectedUser.roleName,
        status: userForm.status,
      });
    }
    showToast('Fiche utilisateur mise à jour', 'success');
  };

  const handleDeleteUser = (uid: string) => {
    const target = users.find(u => u.uid === uid);
    if (target?.roleName === 'Administrateur' && users.filter(u => u.roleName === 'Administrateur').length <= 1) {
      showToast('Impossible de supprimer le dernier Administrateur principal', 'warning');
      return;
    }

    if (confirm(`Voulez-vous vraiment supprimer le compte de ${target?.displayName} ?`)) {
      removeAndNotify('users', uid);
      if (selectedUser?.uid === uid) {
        setShowDetailModal(false);
        setSelectedUser(null);
      }
      loadData();
      showToast('Utilisateur supprimé définitivement', 'success');
    }
  };

  const filtered = users.filter((u) =>
    (u.displayName || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.roleName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {company && canManageCompanyAccess && (
        <GlassCard className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Accès à {company.name}</h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Les invitations sont à usage unique et expirent après sept jours.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Rôle de la personne invitée"
                value={selectedInviteRole}
                onChange={(event) => setInviteRole(event.target.value as typeof inviteRole)}
                className="h-9 rounded-lg border border-[var(--glass-border)] bg-[var(--bg-primary)] px-3 text-xs text-[var(--text-primary)]"
              >
                <option value="member">Membre</option>
                <option value="manager">Manager</option>
                {(companyAccessRole.data === 'owner' || companyAccessRole.data === 'platform_admin') && (
                  <option value="admin">Administrateur</option>
                )}
              </select>
              <button
                type="button"
                className="btn-primary h-9 px-3 text-xs"
                disabled={createCompanyInvite.isPending}
                onClick={() => {
                  setCompanyInviteLink('');
                  createCompanyInvite.mutate({ companyId: company.id, role: selectedInviteRole });
                }}
              >
                {createCompanyInvite.isPending ? 'Création…' : 'Créer une invitation'}
              </button>
            </div>
          </div>

          {companyInviteLink && (
            <label className="mt-4 block text-xs text-[var(--text-secondary)]">
              Lien privé — copiez-le et transmettez-le au collaborateur
              <input
                className="mt-1 w-full rounded-lg border border-[var(--glass-border)] bg-[var(--bg-primary)] px-3 py-2 text-xs text-[var(--text-primary)]"
                readOnly
                value={companyInviteLink}
                onFocus={(event) => event.currentTarget.select()}
              />
            </label>
          )}

          <div className="mt-4 divide-y divide-[var(--divider)]">
            {(companyMembers.data ?? []).map((member) => (
              <div key={member.userId} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-[var(--text-primary)]">
                    {member.name || member.email || ('Utilisateur ' + member.userId)}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)]">
                    {member.email || 'Adresse e-mail non fournie'} · {member.role} · {member.status}
                  </p>
                </div>
                {member.role !== 'owner' && member.status === 'active' && (
                  <button
                    type="button"
                    className="btn-ghost h-8 px-2 text-xs text-[var(--accent-danger)]"
                    disabled={revokeCompanyAccess.isPending}
                    onClick={() => {
                      if (confirm('Révoquer l’accès de cette personne à l’entreprise ?')) {
                        revokeCompanyAccess.mutate({ companyId: company.id, userId: member.userId });
                      }
                    }}
                  >
                    Révoquer
                  </button>
                )}
              </div>
            ))}
            {companyMembers.isLoading && <p className="py-3 text-xs text-[var(--text-muted)]">Chargement des accès…</p>}
            {companyMembers.error && (
              <p role="alert" className="py-3 text-xs text-[var(--accent-danger)]">{companyMembers.error.message}</p>
            )}
          </div>
        </GlassCard>
      )}

      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] max-w-md relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, email ou rôle..."
            className="w-full h-9 pl-9 pr-4 glass-input text-xs"
          />
        </div>
        <button
          onClick={() => {
            setUserForm({ displayName: '', email: '', roleId: roles[0]?.id || '', departmentId: '', status: 'active' });
            setShowInviteModal(true);
          }}
          className="btn-primary h-9 font-bold text-xs gap-1.5"
        >
          <Plus size={16} /> Inviter un Utilisateur
        </button>
      </div>

      {/* Users table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--divider)] text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                <th className="text-left px-4 py-3">Utilisateur</th>
                <th className="text-left px-4 py-3">Rôle / Accès</th>
                <th className="text-left px-4 py-3">Département</th>
                <th className="text-center px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3">Date de création</th>
                <th className="text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => {
                const role = roles.find((r) => r.id === u.roleId);
                const dept = departments.find((d) => d.id === u.departmentId);
                return (
                  <tr key={u.uid} className="border-b border-[var(--divider)]/50 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white font-semibold text-xs border border-white/20">
                          {(u.displayName || '?').charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-[var(--text-primary)]">{u.displayName}</p>
                          <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Mail size={10} /> {u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-[var(--text-primary)] font-medium">
                        <Shield size={10} className="text-[var(--accent-primary)]" />
                        {role?.name || u.roleName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{dept?.name || 'Non assigné'}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={u.status || 'active'} />
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] font-mono text-[10px]">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => { setSelectedUser(u); setShowDetailModal(true); }}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
                          title="Détails du compte"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(u);
                            setUserForm({
                              displayName: u.displayName,
                              email: u.email,
                              roleId: u.roleId || '',
                              departmentId: u.departmentId || '',
                              status: u.status || 'active',
                            });
                            setShowEditModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-white"
                          title="Modifier"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.uid)}
                          className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-[var(--accent-danger)]"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* USER DETAIL MODAL */}
      <AnimatePresence>
        {showDetailModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass-card p-6 w-full max-w-lg space-y-5 border-white/20 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white text-lg font-bold border-2 border-white/20">
                    {(selectedUser.displayName || '?').charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{selectedUser.displayName}</h3>
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Mail size={12} /> {selectedUser.email}</p>
                  </div>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-1 rounded hover:bg-white/10 text-white"><X size={18} /></button>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Rôle Défini</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Shield size={12} className="text-[var(--accent-primary)]" />
                    {selectedUser.roleName}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Département</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Building2 size={12} className="text-[var(--accent-secondary)]" />
                    {departments.find(d => d.id === selectedUser.departmentId)?.name || 'Non rattaché'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Statut Compte</span>
                  <StatusBadge status={selectedUser.status || 'active'} />
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase block mb-1">Inscrit Le</span>
                  <span className="font-mono text-white/90">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </span>
                </div>
              </div>

              {/* User Permissions summary */}
              <div>
                <p className="text-[10px] text-[var(--text-muted)] uppercase mb-2">Permissions d'Accès Attribuées</p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 rounded-xl bg-white/5 border border-white/10">
                  {(selectedUser.permissions || ['Projets.Lire']).map((p: string) => (
                    <span key={p} className="text-[9px] bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 px-2 py-0.5 rounded-full font-mono">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <button
                  onClick={() => handleDeleteUser(selectedUser.uid)}
                  className="btn-ghost text-xs text-[var(--accent-danger)] hover:bg-red-500/10 gap-1"
                >
                  <Trash2 size={14} /> Supprimer cet utilisateur
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setUserForm({
                      displayName: selectedUser.displayName,
                      email: selectedUser.email,
                      roleId: selectedUser.roleId || '',
                      departmentId: selectedUser.departmentId || '',
                      status: selectedUser.status || 'active',
                    });
                    setShowEditModal(true);
                  }}
                  className="btn-primary h-8 text-xs font-bold gap-1.5"
                >
                  <Edit3 size={14} /> Modifier le profil
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* INVITE / CREATE USER MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full w-full max-w-md space-y-4 overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--bg-card)] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <UserCheck size={16} className="text-[var(--accent-primary)]" /> Inviter un Nouvel Utilisateur
                </h3>
                <button onClick={() => setShowInviteModal(false)} className="p-1 rounded hover:bg-white/10 text-white"><X size={18} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Nom complet *</label>
                  <input
                    value={userForm.displayName}
                    onChange={e => setUserForm({ ...userForm, displayName: e.target.value })}
                    className="w-full h-9 px-3 glass-input text-xs"
                    placeholder="Ex: Jean-Marc Ndombe"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Adresse Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full h-9 px-3 glass-input text-xs"
                    placeholder="ex: jm.ndombe@idibagroup.cm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Rôle d'Accès</label>
                    <select
                      value={userForm.roleId}
                      onChange={e => setUserForm({ ...userForm, roleId: e.target.value })}
                      className="w-full h-9 px-3 glass-input text-xs"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Département</label>
                    <select
                      value={userForm.departmentId}
                      onChange={e => setUserForm({ ...userForm, departmentId: e.target.value })}
                      className="w-full h-9 px-3 glass-input text-xs"
                    >
                      <option value="">Sélectionner...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowInviteModal(false)} className="btn-ghost h-9 text-xs">Annuler</button>
                <button onClick={handleCreateUser} className="btn-primary h-9 text-xs font-bold gap-1.5"><Save size={14} /> Créer le Compte</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full w-full max-w-md space-y-4 overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--bg-card)] p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 size={16} className="text-[var(--accent-primary)]" /> Modifier l'Utilisateur
                </h3>
                <button onClick={() => setShowEditModal(false)} className="p-1 rounded hover:bg-white/10 text-white"><X size={18} /></button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Nom complet *</label>
                  <input
                    value={userForm.displayName}
                    onChange={e => setUserForm({ ...userForm, displayName: e.target.value })}
                    className="w-full h-9 px-3 glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Adresse Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full h-9 px-3 glass-input text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Rôle d'Accès</label>
                    <select
                      value={userForm.roleId}
                      onChange={e => setUserForm({ ...userForm, roleId: e.target.value })}
                      className="w-full h-9 px-3 glass-input text-xs"
                    >
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Statut du Compte</label>
                    <select
                      value={userForm.status}
                      onChange={e => setUserForm({ ...userForm, status: e.target.value as UserStatus })}
                      className="w-full h-9 px-3 glass-input text-xs"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                      <option value="pending">En attente</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowEditModal(false)} className="btn-ghost h-9 text-xs">Annuler</button>
                <button onClick={handleUpdateUser} className="btn-primary h-9 text-xs font-bold gap-1.5"><Save size={14} /> Enregistrer</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
