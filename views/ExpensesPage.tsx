import { useState, useEffect, useId } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, Receipt, CalendarDays, Tag, Wallet } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import SlideOver from '@/components/common/SlideOver';
import { ErrorNotice, FormFooter } from '@/components/common/FormParts';
import FloatedInput from '@/components/ui/FloatedInput';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify } from '@/lib/db';
import { formatPlatformCurrency, usePlatformFinancialSettings } from '@/hooks/usePlatformFinancialSettings';

export function ExpensesPage() {
  const { currency } = usePlatformFinancialSettings();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [newExpense, setNewExpense] = useState({ description: '', amount: '', category: 'Fournitures', date: new Date().toISOString().split('T')[0], notes: '' });
  const [formError, setFormError] = useState('');
  const formId = useId();

  useEffect(() => {
    setCurrentPageTitle('Notes de Frais');
    setExpensesList(getAll('expenses'));
  }, [setCurrentPageTitle]);

  const expenses = expensesList;

  const filtered = expenses.filter((e) => {
    const matchesSearch = e.description.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatXAF = (amount: number) => formatPlatformCurrency(amount, currency);

  const saveExpense = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newExpense.description.trim() || !newExpense.amount || Number(newExpense.amount) <= 0) {
      setFormError('Renseignez une description et un montant valide.');
      return;
    }
    const expense = { id: `exp-${Date.now()}`, description: newExpense.description.trim(), amount: Number(newExpense.amount), category: newExpense.category, date: newExpense.date, status: 'pending' as const, approvedBy: '', approvedByName: '', receiptUrl: '', submittedBy: 'user-1', submittedByName: 'Martin Essomba', employeeId: 'user-1', employeeName: 'Martin Essomba', companyId: 'comp-1' };
    addAndNotify('expenses', expense);
    setExpensesList((previous) => [expense, ...previous]);
    setNewExpense({ description: '', amount: '', category: 'Fournitures', date: new Date().toISOString().split('T')[0], notes: '' });
    setFormError('');
    setShowForm(false);
    showToast('Dépense enregistrée', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Notes de Frais</h2>
        <button onClick={() => { setNewExpense({ description: '', amount: '', category: 'Fournitures', date: new Date().toISOString().split('T')[0], notes: '' }); setFormError(''); setShowForm(true); }} className="btn-primary h-9"><Plus size={16} /> Nouvelle Dépense</button>
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

      <SlideOver open={showForm} onClose={() => setShowForm(false)} title="Nouvelle dépense" subtitle="Renseignez les informations de la note de frais." footer={<FormFooter form={formId} pending={false} onClose={() => setShowForm(false)} label="Enregistrer" />}>
        <form id={formId} onSubmit={saveExpense} className="space-y-4">
          <ErrorNotice message={formError} />
          <FloatedInput id={`${formId}-description`} name="description" compact label="Description" leftIcon={<Receipt size={16} />} required value={newExpense.description} onChange={(value) => setNewExpense((current) => ({ ...current, description: value }))} />
          <FloatedInput id={`${formId}-amount`} name="amount" type="number" compact label={`Montant (${currency})`} leftIcon={<Wallet size={16} />} min={1} step={1} required value={newExpense.amount} onChange={(value) => setNewExpense((current) => ({ ...current, amount: value }))} />
          <FloatedInput id={`${formId}-category`} name="category" compact label="Catégorie" leftIcon={<Tag size={16} />} value={newExpense.category} onChange={(value) => setNewExpense((current) => ({ ...current, category: value }))} options={['Fournitures', 'Repas', 'Transport', 'Hébergement', 'Logiciel', 'Événementiel', 'Marketing'].map((category) => ({ value: category, label: category }))} />
          <FloatedInput id={`${formId}-date`} name="date" type="date" compact label="Date" leftIcon={<CalendarDays size={16} />} required value={newExpense.date} onChange={(value) => setNewExpense((current) => ({ ...current, date: value }))} />
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Notes<textarea value={newExpense.notes} onChange={(event) => setNewExpense((current) => ({ ...current, notes: event.target.value }))} rows={4} className="mt-1.5 w-full resize-y rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]" placeholder="Notes additionnelles…" /></label>
        </form>
      </SlideOver>
    </div>
  );
}
