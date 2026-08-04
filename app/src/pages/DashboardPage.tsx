import { useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, FolderKanban, Receipt,
  Users, ArrowUpRight, ArrowDownRight, Wallet, Clock,
  CheckCircle2, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { useNavigate } from 'react-router-dom';
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
  { name: 'Salaires', value: 55, color: '#2DD4A8' },
  { name: 'Fournitures', value: 15, color: '#3B82F6' },
  { name: 'Services', value: 12, color: '#8B5CF6' },
  { name: 'Logistique', value: 10, color: '#F59E0B' },
  { name: 'Autres', value: 8, color: '#4A5568' },
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

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassCard delay={0}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10">
                <Wallet size={20} className="text-[var(--accent-primary)]" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)]">
                <TrendingUp size={12} /> +12%
              </span>
            </div>
            <p className="kpi-value">{formatXAF(totalRevenue)}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Chiffre d&apos;affaires</p>
            <div className="mt-3 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowData.slice(-6)}>
                  <Area type="monotone" dataKey="income" stroke="#2DD4A8" fill="rgba(45,212,168,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.05}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-[var(--accent-secondary)]/10">
                <FolderKanban size={20} className="text-[var(--accent-secondary)]" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-secondary)]">
                <ArrowUpRight size={12} /> {activeProjects}
              </span>
            </div>
            <p className="kpi-value">{activeProjects}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Projets actifs</p>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                <span>Progression moyenne</span>
                <span>{Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length)}%</span>
              </div>
              <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${projects.reduce((s, p) => s + p.progress, 0) / projects.length}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.1}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-[var(--accent-warning)]/10">
                <Receipt size={20} className="text-[var(--accent-warning)]" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-warning)]">
                <ArrowDownRight size={12} /> {pendingInvoices.length}
              </span>
            </div>
            <p className="kpi-value">{formatXAF(pendingAmount)}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Factures en attente</p>
            <div className="mt-3 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:15},{v:22},{v:18},{v:28},{v:24},{v:32}]}>
                  <Area type="monotone" dataKey="v" stroke="#F59E0B" fill="rgba(245,158,11,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.15}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-[var(--accent-purple)]/10">
                <Users size={20} className="text-[var(--accent-purple)]" />
              </div>
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-purple)]">
                <TrendingUp size={12} /> +2
              </span>
            </div>
            <p className="kpi-value">{activeUsers}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Employés actifs</p>
            <div className="mt-3 h-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:28},{v:30},{v:32},{v:31},{v:33},{v:35}]}>
                  <Area type="monotone" dataKey="v" stroke="#8B5CF6" fill="rgba(139,92,246,0.1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cash Flow Chart */}
        <GlassCard delay={0.2} className="lg:col-span-2">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Flux de Trésorerie</h3>
              <div className="flex gap-1">
                {['Mois', 'Trimestre', 'Année'].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      period === 'Mois'
                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={cashFlowData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#8A96A8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8A96A8', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip
                  contentStyle={{
                    background: '#141D28',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                    color: '#F0F2F5',
                    fontSize: 12,
                  }}
                  formatter={(value: number) => formatXAF(value)}
                />
                <Bar dataKey="income" fill="#2DD4A8" radius={[4, 4, 0, 0]} name="Recettes" />
                <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Dépenses" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Quick Overview Card */}
        <GlassCard delay={0.25}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Aperçu Financier</h3>
              <button className="text-xs text-[var(--accent-primary)] flex items-center gap-1">
                Voir tout <ArrowUpRight size={12} />
              </button>
            </div>

            <div className="glass-card-compact p-4 mb-4 bg-gradient-to-br from-[var(--accent-primary)]/10 to-[var(--accent-secondary)]/5">
              <p className="text-xs text-[var(--text-secondary)] mb-1">Solde Total</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{formatXAF(totalRevenue)}</p>
              <p className="text-xs text-[var(--accent-primary)] mt-1">+22% vs mois dernier</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Revenus (Juin)</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{formatXAF(49000000)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">Dépenses (Juin)</span>
                <span className="text-sm font-semibold text-[var(--text-primary)]">{formatXAF(36000000)}</span>
              </div>
              <div className="h-px bg-[var(--divider)]" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--text-primary)]">Net</span>
                <span className="text-sm font-bold text-[var(--accent-primary)]">{formatXAF(13000000)}</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Expense Donut */}
        <GlassCard delay={0.3}>
          <div className="p-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Dépenses par Catégorie</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie
                    data={expenseCategories}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={55}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {expenseCategories.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {expenseCategories.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-xs text-[var(--text-secondary)] flex-1">{cat.name}</span>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Income Card */}
        <GlassCard delay={0.35}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">Revenus cette semaine</h3>
              <span className="status-badge status-badge-success">+12%</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{formatXAF(2240000)}</p>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:30},{v:45},{v:35},{v:55},{v:48},{v:62},{v:58}]}>
                  <Area type="monotone" dataKey="v" stroke="#2DD4A8" fill="rgba(45,212,168,0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>

        {/* Expense Card */}
        <GlassCard delay={0.4}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">Dépenses cette semaine</h3>
              <span className="status-badge status-badge-warning">+9%</span>
            </div>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{formatXAF(1750000)}</p>
            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={[{v:25},{v:30},{v:28},{v:35},{v:32},{v:38},{v:36}]}>
                  <Area type="monotone" dataKey="v" stroke="#F59E0B" fill="rgba(245,158,11,0.15)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Transactions */}
        <GlassCard delay={0.45}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Transactions Récentes</h3>
              <button
                onClick={() => navigate('/finance/invoices')}
                className="text-xs text-[var(--accent-primary)] flex items-center gap-1"
              >
                Voir tout <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {recentTransactions.map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => navigate('/finance/invoices')}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <div className={`p-1.5 rounded-lg ${
                    inv.status === 'paid' ? 'bg-[var(--accent-primary)]/10' :
                    inv.status === 'overdue' ? 'bg-[var(--accent-danger)]/10' :
                    'bg-[var(--accent-warning)]/10'
                  }`}>
                    {inv.status === 'paid' ? (
                      <CheckCircle2 size={16} className="text-[var(--accent-primary)]" />
                    ) : inv.status === 'overdue' ? (
                      <AlertCircle size={16} className="text-[var(--accent-danger)]" />
                    ) : (
                      <Clock size={16} className="text-[var(--accent-warning)]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{inv.clientName}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{inv.number}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      inv.status === 'paid' ? 'text-[var(--accent-primary)]' :
                      inv.status === 'overdue' ? 'text-[var(--accent-danger)]' :
                      'text-[var(--text-primary)]'
                    }`}>{formatXAF(inv.total)}</p>
                    <StatusBadge status={inv.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Due Tasks */}
        <GlassCard delay={0.5}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                Échéances {overdueTasks.length > 0 && <span className="text-[var(--accent-danger)]">({overdueTasks.length} en retard)</span>}
              </h3>
              <button
                onClick={() => navigate('/projects')}
                className="text-xs text-[var(--accent-primary)] flex items-center gap-1"
              >
                Voir tout <ArrowUpRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {dueTasks.map((task) => {
                const isOverdue = new Date(task.dueDate) < new Date();
                const completed = task.subtasks.filter(s => s.completed).length;
                const total = task.subtasks.length;
                return (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors cursor-pointer"
                    onClick={() => navigate(`/projects/${task.projectId}`)}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      task.status === 'done'
                        ? 'bg-[var(--accent-primary)] border-[var(--accent-primary)]'
                        : isOverdue
                          ? 'border-[var(--accent-danger)]'
                          : 'border-[var(--glass-border)]'
                    }`}>
                      {task.status === 'done' && <CheckCircle2 size={12} className="text-[#0B0F14]" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm truncate ${isOverdue ? 'text-[var(--accent-danger)]' : 'text-[var(--text-primary)]'}`}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {format(new Date(task.dueDate), 'dd MMM', { locale: fr })}
                        </span>
                        {total > 0 && (
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {completed}/{total}
                          </span>
                        )}
                      </div>
                      {total > 0 && (
                        <div className="mt-1 h-0.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent-primary)] rounded-full"
                            style={{ width: `${(completed / total) * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
