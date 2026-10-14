import { useEffect } from 'react';
import { ArrowUpRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { StatCard } from '@/components/dashboard/StatCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { useNavigate } from '@/lib/navigation';
import { getAll } from '@/lib/db';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const cashFlowData = [
  { month: 'Jan', income: 42000000, expense: 31000000 },
  { month: 'Fév', income: 38000000, expense: 28000000 },
  { month: 'Mar', income: 51000000, expense: 35000000 },
  { month: 'Avr', income: 44000000, expense: 33000000 },
  { month: 'Mai', income: 56000000, expense: 38000000 },
  { month: 'Juin', income: 49000000, expense: 36000000 },
  { month: 'Juil', income: 62000000, expense: 41000000 },
  { month: 'Août', income: 55000000, expense: 39000000 },
];

const expenseCategories = [
  { name: 'Salaires', value: 55, color: 'var(--chart-orange)' },
  { name: 'Fournitures', value: 15, color: 'var(--chart-blue)' },
  { name: 'Services', value: 12, color: 'var(--chart-purple)' },
  { name: 'Logistique', value: 10, color: 'var(--chart-green)' },
  { name: 'Autres', value: 8, color: 'var(--chart-amber)' },
];

export function DashboardPage() {
  const { setCurrentPageTitle } = useUIStore();
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentPageTitle('Tableau de Bord');
  }, [setCurrentPageTitle]);

  const invoices = getAll('invoices');
  const projects = getAll('projects');
  const users = getAll('users');
  const tasks = getAll('tasks');

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
  const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.total, 0);
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;
  const activeUsers = users.filter(u => u.status === 'active').length;
  const overdueTasks = tasks.filter(t => t.status !== 'done' && new Date(t.dueDate) < new Date());

  const recentTransactions = [...invoices]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const dueTasks = tasks
    .filter(t => t.status !== 'done')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const formatXAF = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const compact = (n: number) =>
    new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
  const avgProgress = projects.length
    ? Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)
    : 0;
  const lastTwo = cashFlowData.slice(-2);
  const revenueTrend = lastTwo.length === 2 ? ((lastTwo[1].income - lastTwo[0].income) / lastTwo[0].income) * 100 : undefined;
  const statusCounts = (['todo', 'in_progress', 'review', 'completed'] as const)
    .map((st) => ({ label: st, value: projects.filter((p) => p.status === st).length }));
  const june = cashFlowData[5];

  const CARD_GRID =
    'grid grid-cols-1 divide-y divide-[var(--divider)] border-b border-[var(--divider)] md:grid-cols-2 md:divide-x md:divide-y-0 xl:grid-cols-4';

  return (
    <div className="-m-6 min-h-full bg-[var(--bg-card)]">
      {/* KPI cards */}
      <div className={CARD_GRID}>
        <div className="p-5">
          <StatCard
            title="Chiffre d’affaires"
            value={`${compact(totalRevenue)} FCFA`}
            metaLabel="Factures payées"
            href="/finance/invoices"
            trendValue={revenueTrend}
            bars={cashFlowData.slice(-6).map((d) => ({ label: d.month, value: d.income }))}
            color="success"
          />
        </div>
        <div className="p-5">
          <StatCard
            title="Projets actifs"
            value={String(activeProjects)}
            metaLabel={`Progression moyenne ${avgProgress}%`}
            href="/projects"
            bars={statusCounts.map((c, i) => ({
              label: ({ todo: 'À faire', in_progress: 'En cours', review: 'Revue', completed: 'Terminés' } as Record<string, string>)[c.label] ?? c.label,
              value: c.value,
              color: (['muted', 'blue', 'warning', 'success'] as const)[i],
            }))}
          />
        </div>
        <div className="p-5">
          <StatCard
            title="Factures en attente"
            value={`${compact(pendingAmount)} FCFA`}
            metaLabel={`${pendingInvoices.length} facture${pendingInvoices.length > 1 ? 's' : ''} à encaisser`}
            href="/finance/invoices"
            lineSeries={[15, 22, 18, 28, 24, 32]}
            color="primary"
          />
        </div>
        <div className="p-5">
          <StatCard
            title="Employés actifs"
            value={String(activeUsers)}
            metaLabel="Comptes actifs"
            href="/hr/employees"
            lineSeries={[28, 30, 32, 31, 33, 35]}
            color="purple"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid divide-y divide-[var(--divider)] border-b border-[var(--divider)] lg:grid-cols-5 lg:divide-x lg:divide-y-0">
        <div className="min-w-0 lg:col-span-3">
          <ChartCard
            title="Flux de trésorerie"
            subtitle={`Recettes et dépenses · 8 derniers mois · net ${compact(june.income - june.expense)} XAF en juin`}
            total={compact(cashFlowData.reduce((s, d) => s + d.income - d.expense, 0)) + ' XAF'}
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    {[['income', 'var(--chart-green)'], ['expense', 'var(--chart-orange)']].map(([id, color]) => (
                      <linearGradient key={id} id={`cash-${id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid vertical={false} stroke="var(--divider)" />
                  <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                  <Tooltip
                    cursor={{ stroke: 'var(--glass-border-hover)', strokeDasharray: '4 4' }}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border-hover)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: 12 }}
                    formatter={(value: number) => formatXAF(value)}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Recettes"
                    stroke="var(--chart-green)"
                    strokeWidth={3}
                    fill="url(#cash-income)"
                    dot={{ r: 4, fill: 'var(--bg-card)', stroke: 'var(--chart-green)', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'var(--chart-green)', stroke: 'var(--bg-card)', strokeWidth: 2 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Dépenses"
                    stroke="var(--chart-orange)"
                    strokeWidth={3}
                    fill="url(#cash-expense)"
                    dot={{ r: 4, fill: 'var(--bg-card)', stroke: 'var(--chart-orange)', strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: 'var(--chart-orange)', stroke: 'var(--bg-card)', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
        <div className="min-w-0 lg:col-span-2">
          <ChartCard title="Dépenses par catégorie" subtitle="Répartition du mois en cours">
            <div className="flex h-80 flex-col items-center justify-center gap-6 sm:flex-row">
              <div className="h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {expenseCategories.map((entry, i) => (
                        <pattern key={i} id={`expense-hatch-${i}`} patternUnits="userSpaceOnUse" width="5" height="5" patternTransform="rotate(-45)">
                          <rect width="5" height="5" fill={entry.color} />
                          <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.6" />
                        </pattern>
                      ))}
                    </defs>
                    <Pie data={expenseCategories} cx="50%" cy="50%" innerRadius={48} outerRadius={80} paddingAngle={2} dataKey="value" stroke="var(--bg-card)" strokeWidth={2}>
                      {expenseCategories.map((_, i) => (
                        <Cell key={i} fill={`url(#expense-hatch-${i})`} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="w-full max-w-[220px] divide-y divide-[var(--divider)] text-sm">
                {expenseCategories.map((cat) => (
                  <li key={cat.name} className="flex items-center gap-2.5 py-2">
                    <span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: cat.color }} />
                    <span className="flex-1 text-[var(--text-secondary)]">{cat.name}</span>
                    <span className="font-medium text-[var(--text-primary)]">{cat.value}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </ChartCard>
        </div>
      </div>

      {/* Lists */}
      <div className="grid divide-y divide-[var(--divider)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <ChartCard
          title="Transactions récentes"
          subtitle="Dernières factures émises"
          action={
            <button onClick={() => navigate('/finance/invoices')} className="flex items-center gap-1 text-xs text-[var(--accent-primary)]">
              Voir tout <ArrowUpRight size={12} />
            </button>
          }
        >
          <ul className="-my-1 divide-y divide-[var(--divider)]">
            {recentTransactions.map((inv) => (
              <li key={inv.id}>
                <button onClick={() => navigate('/finance/invoices')} className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[var(--bg-primary)]">
                  <span className={inv.status === 'paid' ? 'text-[var(--accent-success)]' : inv.status === 'overdue' ? 'text-[var(--accent-danger)]' : 'text-[var(--accent-warning)]'}>
                    {inv.status === 'paid' ? <CheckCircle2 size={18} /> : inv.status === 'overdue' ? <AlertCircle size={18} /> : <Clock size={18} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-[var(--text-primary)]">{inv.clientName}</span>
                    <span className="block text-[11px] text-[var(--text-muted)]">{inv.number}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-medium tabular-nums text-[var(--text-primary)]">{formatXAF(inv.total)}</span>
                    <StatusBadge status={inv.status} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="Échéances"
          subtitle={overdueTasks.length > 0 ? `${overdueTasks.length} tâche${overdueTasks.length > 1 ? 's' : ''} en retard` : 'Prochaines tâches à livrer'}
          action={
            <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-xs text-[var(--accent-primary)]">
              Voir tout <ArrowUpRight size={12} />
            </button>
          }
        >
          <ul className="-my-1 divide-y divide-[var(--divider)]">
            {dueTasks.map((task) => {
              const isOverdue = new Date(task.dueDate) < new Date();
              const completed = task.subtasks.filter((st) => st.completed).length;
              const total = task.subtasks.length;
              return (
                <li key={task.id}>
                  <button onClick={() => navigate(`/projects/${task.projectId}`)} className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-[var(--bg-primary)]">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${isOverdue ? 'border-[var(--accent-danger)]' : 'border-[var(--glass-border-hover)]'}`} />
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm ${isOverdue ? 'text-[var(--accent-danger)]' : 'text-[var(--text-primary)]'}`}>{task.title}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
                        {format(new Date(task.dueDate), 'dd MMM', { locale: fr })}
                        {total > 0 && <span>{completed}/{total}</span>}
                      </span>
                      {total > 0 && (
                        <span className="mt-1 block h-0.5 overflow-hidden bg-[var(--divider)]">
                          <span className="block h-full bg-[var(--accent-primary)]" style={{ width: `${(completed / total) * 100}%` }} />
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ChartCard>
      </div>
    </div>
  );
}
