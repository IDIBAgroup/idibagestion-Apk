import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, Circle, Calendar, User,
  Flag, ChevronDown, ChevronRight, FileText,
  Activity, Settings, Plus, X,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll, getById, addAndNotify } from '@/lib/db';
import type { Project, Task } from '@/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

type Tab = 'tasks' | 'overview' | 'activity' | 'settings';

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    assignedTo: string;
    priority: 'high' | 'medium' | 'low';
    dueDate: string;
  }>({
    title: '',
    description: '',
    assignedTo: '',
    priority: 'medium',
    dueDate: '',
  });

  const users = getAll('users');

  const project = getById('projects', id || '') as Project | undefined;
  const allTasks = getAll('tasks') as Task[];
  const projectTasks = allTasks.filter(t => t.projectId === id);

  useEffect(() => {
    if (project) {
      setCurrentPageTitle(project.name);
    }
  }, [project, setCurrentPageTitle]);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-[var(--text-muted)]">Projet non trouvé</p>
      </div>
    );
  }

  const burndownData = [
    { day: 'J1', remaining: projectTasks.length * 10, ideal: projectTasks.length * 10 },
    { day: 'J5', remaining: projectTasks.length * 8, ideal: projectTasks.length * 8.3 },
    { day: 'J10', remaining: projectTasks.length * 6, ideal: projectTasks.length * 6.7 },
    { day: 'J15', remaining: projectTasks.length * 5, ideal: projectTasks.length * 5 },
    { day: 'J20', remaining: projectTasks.length * 3, ideal: projectTasks.length * 3.3 },
    { day: 'J25', remaining: projectTasks.length * 2, ideal: projectTasks.length * 1.7 },
    { day: 'J30', remaining: projectTasks.filter(t => t.status !== 'done').length * 10, ideal: 0 },
  ];

  const handleCreateTask = () => {
    if (!newTask.title || !newTask.dueDate) return;
    const task: Task = {
      id: `task-${Date.now()}`,
      projectId: id || '',
      title: newTask.title,
      description: newTask.description,
      assignedTo: newTask.assignedTo || users[0]?.uid || '',
      assignedToName: users.find((u) => u.uid === newTask.assignedTo)?.displayName || users[0]?.displayName || 'Non assigné',
      assignedToAvatar: undefined,
      status: 'todo',
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      subtasks: [],
      createdAt: new Date().toISOString(),
    };
    addAndNotify('tasks', task);
    setShowNewTask(false);
    setNewTask({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
    showToast('Tâche créée avec succès', 'success');
  };

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const formatXAF = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount);

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'tasks', label: 'Tâches', icon: <CheckCircle2 size={16} /> },
    { key: 'overview', label: 'Vue d\'ensemble', icon: <FileText size={16} /> },
    { key: 'activity', label: 'Activité', icon: <Activity size={16} /> },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-3"
        >
          <ArrowLeft size={16} /> Retour aux projets
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{project.name}</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{project.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            <button className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)]">
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Meta info */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-[var(--text-secondary)]">
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(project.startDate).toLocaleDateString('fr-FR')} → {new Date(project.endDate).toLocaleDateString('fr-FR')}
          </span>
          <span>Budget: {formatXAF(project.budget)}</span>
          <span>Consommé: {formatXAF(project.spent)} ({Math.round((project.spent / project.budget) * 100)}%)</span>
          <div className="flex items-center gap-1">
            <User size={12} />
            <div className="flex -space-x-1">
              {project.members.slice(0, 3).map((m, i) => (
                <div key={m} className="w-5 h-5 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-[8px] text-white border border-[var(--bg-primary)]">
                  {['M', 'S', 'J', 'A', 'G', 'K', 'I'][i]}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[var(--text-muted)]">Progression</span>
            <span className="text-[var(--text-primary)] font-medium">{project.progress}%</span>
          </div>
          <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.progress}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === tab.key
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'tasks' && (
        <div className="space-y-2">
          <div className="flex justify-end mb-2">
            <button onClick={() => setShowNewTask(true)} className="btn-primary h-8 text-xs">
              <Plus size={14} /> Nouvelle Tâche
            </button>
          </div>
          {projectTasks.length === 0 && (
            <div className="text-center py-8 text-sm text-[var(--text-muted)]">
              Aucune tâche pour ce projet. Créez votre première tâche !
            </div>
          )}
          {projectTasks.map((task, i) => {
            const isExpanded = expandedTasks.has(task.id);
            const completedSubtasks = task.subtasks.filter(s => s.completed).length;
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-compact overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleTaskExpand(task.id)}
                >
                  <button onClick={(e) => { e.stopPropagation(); }} className="shrink-0">
                    {task.status === 'done' ? (
                      <CheckCircle2 size={18} className="text-[var(--accent-primary)]" />
                    ) : (
                      <Circle size={18} className="text-[var(--glass-border)]" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.status === 'done' ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[var(--text-muted)]">{task.assignedToName}</span>
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {task.subtasks.length > 0 && (
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {completedSubtasks}/{task.subtasks.length}
                      </span>
                    )}
                    {isExpanded ? <ChevronDown size={14} className="text-[var(--text-muted)]" /> : <ChevronRight size={14} className="text-[var(--text-muted)]" />}
                  </div>
                </div>

                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="px-3 pb-3 pl-11"
                  >
                    <p className="text-xs text-[var(--text-secondary)] mb-2">{task.description}</p>
                    {task.subtasks.length > 0 && (
                      <div className="space-y-1">
                        {task.subtasks.map((sub, si) => (
                          <div key={si} className="flex items-center gap-2">
                            {sub.completed ? (
                              <CheckCircle2 size={12} className="text-[var(--accent-primary)]" />
                            ) : (
                              <Circle size={12} className="text-[var(--glass-border)]" />
                            )}
                            <span className={`text-xs ${sub.completed ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><Calendar size={10} /> Échéance: {new Date(task.dueDate).toLocaleDateString('fr-FR')}</span>
                      <span className="flex items-center gap-1"><Flag size={10} /> {task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'} priorité</span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GlassCard>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Description</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{project.description}</p>

              <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-6 mb-3">Objectifs</h3>
              <div className="space-y-2">
                {[
                  'Livraison dans les délais contractuels',
                  'Respect du budget alloué',
                  'Qualité conforme aux spécifications',
                ].map((obj, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-[var(--accent-primary)]" />
                    <span className="text-sm text-[var(--text-secondary)]">{obj}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Burndown Chart</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={burndownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: '#8A96A8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#8A96A8', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#141D28', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="remaining" stroke="#3B82F6" fill="rgba(59,130,246,0.1)" strokeWidth={2} name="Réel" />
                  <Area type="monotone" dataKey="ideal" stroke="#2DD4A8" fill="transparent" strokeWidth={2} strokeDasharray="5 5" name="Idéal" />
                </AreaChart>
              </ResponsiveContainer>

              <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-3">Répartition du Budget</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Consommé</span>
                  <span className="text-[var(--text-primary)] font-medium">{formatXAF(project.spent)} ({Math.round((project.spent / project.budget) * 100)}%)</span>
                </div>
                <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent-primary)] rounded-full"
                    style={{ width: `${(project.spent / project.budget) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-secondary)]">Restant</span>
                  <span className="text-[var(--text-primary)] font-medium">{formatXAF(project.budget - project.spent)}</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {activeTab === 'activity' && (
        <GlassCard>
          <div className="p-4 space-y-4">
            {[
              { user: 'Martin Essomba', action: 'a créé le projet', time: '15 Jan 2024', color: '#2DD4A8' },
              { user: 'Sarah Nkolo', action: 'a ajouté la tâche', detail: 'Étude de terrain PK12-PK25', time: '20 Jan 2024', color: '#3B82F6' },
              { user: 'Ingrid Biya', action: 'a terminé la tâche', detail: 'Étude de terrain PK12-PK25', time: '28 Fév 2024', color: '#2DD4A8' },
              { user: 'Amélie Fouda', action: 'a mis à jour le budget', time: '1 Mar 2024', color: '#F59E0B' },
              { user: 'Koffi Mensah', action: 'a démarré la tâche', detail: 'Pose câbles PK1-PK12', time: '10 Mar 2024', color: '#8B5CF6' },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs text-white font-medium shrink-0" style={{ backgroundColor: activity.color }}>
                  {activity.user.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-[var(--text-primary)]">
                    <span className="font-medium">{activity.user}</span> {activity.action}
                    {activity.detail && <span className="text-[var(--text-secondary)]"> : {activity.detail}</span>}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* New Task Modal */}
      <AnimatePresence>
        {showNewTask && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowNewTask(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card z-50 max-h-[85vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvelle Tâche</h2>
                  <button onClick={() => setShowNewTask(false)} className="p-2 rounded-lg hover:bg-white/5">
                    <X size={18} className="text-[var(--text-muted)]" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Titre</label>
                    <input
                      type="text"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      className="w-full h-10 px-3 glass-input text-sm"
                      placeholder="Titre de la tâche"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Description</label>
                    <textarea
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      className="w-full h-20 p-3 glass-input text-sm resize-none"
                      placeholder="Description..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Assigné à</label>
                      <select
                        value={newTask.assignedTo}
                        onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                        className="w-full h-10 px-3 glass-input text-sm"
                      >
                        <option value="">Sélectionner...</option>
                        {users.map((u) => (
                          <option key={u.uid} value={u.uid}>{u.displayName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Priorité</label>
                      <select
                        value={newTask.priority}
                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'high' | 'medium' | 'low' })}
                        className="w-full h-10 px-3 glass-input text-sm"
                      >
                        <option value="high">Haute</option>
                        <option value="medium">Moyenne</option>
                        <option value="low">Basse</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Date d&apos;échéance</label>
                    <input
                      type="date"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      className="w-full h-10 px-3 glass-input text-sm"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowNewTask(false)} className="flex-1 btn-ghost h-10 justify-center">
                      Annuler
                    </button>
                    <button
                      onClick={handleCreateTask}
                      disabled={!newTask.title || !newTask.dueDate}
                      className="flex-1 btn-primary h-10 justify-center disabled:opacity-50"
                    >
                      Créer la Tâche
                    </button>
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
