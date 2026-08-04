import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Receipt } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';

export function ExpensesPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => { setCurrentPageTitle('Notes de Frais'); }, [setCurrentPageTitle]);

  const expenses = getAll('expenses');

  const filtered = expenses.filter((e) => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatXAF = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notes de Frais</h2>
        <button className="btn-primary h-9"><Plus size={16} /> Nouvelle Dépense</button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 glass-input text-sm">
          <option value="all">Tous</option><option value="pending">En attente</option><option value="approved">Approuvé</option><option value="rejected">Rejeté</option>
        </select>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Description</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Catégorie</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Employé</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Montant</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((exp, i) => (
                <motion.tr key={exp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Receipt size={14} className="text-[var(--accent-primary)]" />
                      <span className="text-sm text-[var(--text-primary)]">{exp.description}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{exp.category}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{exp.employeeName}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{new Date(exp.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-[var(--text-primary)]">{formatXAF(exp.amount)}</td>
                  <td className="px-4 py-3"><StatusBadge status={exp.status} /></td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
