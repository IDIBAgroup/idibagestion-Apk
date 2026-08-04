import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Mail, Shield } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';

export function UsersPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [search, setSearch] = useState('');

  useEffect(() => { setCurrentPageTitle('Gestion des Utilisateurs'); }, [setCurrentPageTitle]);

  const users = getAll('users');
  const roles = getAll('roles');
  const departments = getAll('departments');

  const filtered = users.filter((u) =>
    u.displayName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur..."
            className="w-full h-9 pl-9 pr-4 glass-input text-sm"
          />
        </div>
        <button className="btn-primary h-9"><Plus size={16} /> Inviter</button>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Utilisateur</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Rôle</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Département</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Date de création</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => {
                const role = roles.find((r) => r.id === user.roleId);
                const dept = departments.find((d) => d.id === user.departmentId);
                return (
                  <motion.tr
                    key={user.uid}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-semibold text-sm">
                          {user.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{user.displayName}</p>
                          <p className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Mail size={10} /> {user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <Shield size={12} className="text-[var(--accent-secondary)]" />
                        {role?.name || user.roleName}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{dept?.name || '-'}</td>
                    <td className="px-4 py-3"><StatusBadge status={user.status} /></td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
