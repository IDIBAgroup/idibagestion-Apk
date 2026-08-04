import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Check, X } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';

const modules = ['Projets', 'Finance', 'RH', 'Marketing', 'Admin', 'Support'];
const actions = ['Lire', 'Créer', 'Modifier', 'Supprimer', 'Exporter'];

const permissionMatrix: Record<string, Record<string, boolean>> = {
  Administrateur: {},
  Manager: {},
  Comptable: {},
  Employé: {},
  Lecteur: {},
};

// Fill all true for admin
modules.forEach(m => actions.forEach(a => { permissionMatrix['Administrateur'][`${m}.${a}`] = true; }));
// Manager
modules.forEach(m => actions.forEach(a => { permissionMatrix['Manager'][`${m}.${a}`] = ['Lire', 'Créer', 'Modifier'].includes(a); }));
// Comptable
['Finance', 'RH'].forEach(m => actions.forEach(a => { permissionMatrix['Comptable'][`${m}.${a}`] = true; }));
// Employee
['Projets', 'Support', 'Marketing'].forEach(m => actions.forEach(a => { permissionMatrix['Employé'][`${m}.${a}`] = ['Lire', 'Créer', 'Modifier'].includes(a); }));
// Viewer
modules.forEach(m => actions.forEach(a => { permissionMatrix['Lecteur'][`${m}.${a}`] = a === 'Lire'; }));

export function RolesPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [selectedRole, setSelectedRole] = useState('Administrateur');

  useEffect(() => { setCurrentPageTitle('Rôles & Permissions'); }, [setCurrentPageTitle]);

  const roles = getAll('roles');
  const currentPerms = permissionMatrix[selectedRole] || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.name)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedRole === role.name
                ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--glass-border)]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Shield size={14} />
              {role.name}
              {role.isSystem && <Lock size={10} className="text-[var(--text-muted)]" />}
            </span>
          </button>
        ))}
      </div>

      <GlassCard>
        <div className="p-4">
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {roles.find((r) => r.name === selectedRole)?.description}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--divider)]">
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-2">Module</th>
                  {actions.map(a => (
                    <th key={a} className="text-center text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-3 py-2">{a}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map((mod) => (
                  <motion.tr
                    key={mod}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-[var(--divider)] last:border-0"
                  >
                    <td className="px-3 py-2.5 text-sm font-medium text-[var(--text-primary)]">{mod}</td>
                    {actions.map((act) => {
                      const hasPerm = currentPerms[`${mod}.${act}`] || false;
                      return (
                        <td key={act} className="px-3 py-2.5 text-center">
                          <div className={`inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                            hasPerm
                              ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                          }`}>
                            {hasPerm ? <Check size={14} /> : <X size={14} />}
                          </div>
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
