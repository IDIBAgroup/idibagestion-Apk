import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, LayoutGrid, List, CalendarDays } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { useNavigate } from 'react-router-dom';
import { getAll, addAndNotify } from '@/lib/db';
import { useEffect } from 'react';

type ViewMode = 'kanban' | 'list' | 'gantt';

const statusColumns = [
  { key: 'todo', label: 'À Faire', color: '#4A5568' },
  { key: 'in_progress', label: 'En Cours', color: '#3B82F6' },
  { key: 'review', label: 'En Révision', color: '#F59E0B' },
  { key: 'completed', label: 'Terminé', color: '#2DD4A8' },
];

export function ProjectsPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    budget: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    setCurrentPageTitle('Gestion de Projets');
  }, [setCurrentPageTitle]);

  const projects = getAll('projects');
  const tasks = getAll('tasks');

  const handleCreateProject = () => {
    const project = {
      id: `proj-${Date.now()}`,
      name: newProject.name,
      description: newProject.description,
      status: 'todo' as const,
      companyId: 'comp-1',
      budget: Number(newProject.budget) || 0,
      spent: 0,
      progress: 0,
      startDate: newProject.startDate,
      endDate: newProject.endDate,
      members: [],
      createdAt: new Date().toISOString(),
    };
    addAndNotify('projects', project);
    setShowNewProject(false);
    setNewProject({ name: '', description: '', budget: '', startDate: '', endDate: '' });
    showToast('Projet créé avec succès', 'success');
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const projectTasks = (projectId: string) => tasks.filter(t => t.projectId === projectId);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un projet..."
            className="w-full h-9 pl-9 pr-4 glass-input text-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 glass-input text-sm text-[var(--text-secondary)]"
        >
          <option value="all">Tous les statuts</option>
          <option value="todo">À Faire</option>
          <option value="in_progress">En Cours</option>
          <option value="review">En Révision</option>
          <option value="completed">Terminé</option>
        </select>

        <div className="flex bg-[var(--bg-elevated)] rounded-lg p-0.5">
          {([
            { mode: 'kanban' as ViewMode, icon: <LayoutGrid size={16} /> },
            { mode: 'list' as ViewMode, icon: <List size={16} /> },
            { mode: 'gantt' as ViewMode, icon: <CalendarDays size={16} /> },
          ]).map(({ mode, icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === mode ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowNewProject(true)}
          className="btn-primary h-9"
        >
          <Plus size={16} /> Nouveau Projet
        </button>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {statusColumns.map((col) => {
            const colProjects = filteredProjects.filter(p => p.status === col.key);
            return (
              <div key={col.key} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-medium text-[var(--text-primary)]">{col.label}</span>
                  <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2 py-0.5">
                    {colProjects.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colProjects.map((project, i) => {
                    const pts = projectTasks(project.id);
                    const completedTasks = pts.filter(t => t.status === 'done').length;
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="glass-card-compact p-4 cursor-pointer glass-card-hover"
                      >
                        <h4 className="text-sm font-medium text-[var(--text-primary)] mb-2">{project.name}</h4>
                        <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">{project.description}</p>

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {pts.length} tâche{pts.length !== 1 ? 's' : ''}
                          </span>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {completedTasks}/{pts.length}
                          </span>
                        </div>

                        <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden mb-3">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${project.progress}%` }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: col.color }}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-1.5">
                            {project.members.slice(0, 3).map((m, mi) => (
                              <div
                                key={m}
                                className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-[9px] text-white font-medium border-2 border-[var(--bg-primary)]"
                              >
                                {['M', 'S', 'J', 'A', 'G', 'K', 'I', 'P'][mi] || 'U'}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {project.budget > 0 ? `${Math.round((project.spent / project.budget) * 100)}% budget` : 'N/A'}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--divider)]">
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Projet</th>
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Budget</th>
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Progression</th>
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Équipe</th>
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Échéance</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[var(--text-primary)]">{project.name}</p>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1">{project.description}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[var(--text-primary)]">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(project.budget)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--accent-primary)] rounded-full"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)]">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex -space-x-1.5">
                        {project.members.slice(0, 3).map((m, mi) => (
                          <div
                            key={m}
                            className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-[9px] text-white font-medium border-2 border-[var(--bg-primary)]"
                          >
                            {['M', 'S', 'J', 'A', 'G', 'K', 'I', 'P'][mi] || 'U'}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-muted)]">
                      {new Date(project.endDate).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* New Project Modal */}
      <AnimatePresence>
        {showNewProject && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowNewProject(false)}
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
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouveau Projet</h2>
                  <button
                    onClick={() => setShowNewProject(false)}
                    className="p-2 rounded-lg hover:bg-white/5"
                  >
                    <X size={18} className="text-[var(--text-muted)]" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom du projet</label>
                    <input
                      type="text"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                      className="w-full h-10 px-3 glass-input text-sm"
                      placeholder="Ex: Déploiement Fibre Yaoundé"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Description</label>
                    <textarea
                      value={newProject.description}
                      onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                      className="w-full h-20 p-3 glass-input text-sm resize-none"
                      placeholder="Description du projet..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Budget (XAF)</label>
                    <input
                      type="number"
                      value={newProject.budget}
                      onChange={(e) => setNewProject({ ...newProject, budget: e.target.value })}
                      className="w-full h-10 px-3 glass-input text-sm"
                      placeholder="45000000"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Date de début</label>
                      <input
                        type="date"
                        value={newProject.startDate}
                        onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                        className="w-full h-10 px-3 glass-input text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-[var(--text-secondary)] mb-1.5">Date de fin</label>
                      <input
                        type="date"
                        value={newProject.endDate}
                        onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                        className="w-full h-10 px-3 glass-input text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowNewProject(false)}
                      className="flex-1 btn-ghost h-10 justify-center"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleCreateProject}
                      disabled={!newProject.name || !newProject.startDate || !newProject.endDate}
                      className="flex-1 btn-primary h-10 justify-center disabled:opacity-50"
                    >
                      Créer le Projet
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Gantt View */}
      {viewMode === 'gantt' && (
        <GlassCard>
          <div className="p-4">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Month header */}
                <div className="flex border-b border-[var(--divider)] pb-2 mb-2">
                  <div className="w-48 shrink-0" />
                  {['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'].map((m) => (
                    <div key={m} className="flex-1 text-center text-[10px] text-[var(--text-muted)]">{m}</div>
                  ))}
                </div>
                {/* Projects */}
                {filteredProjects.map((project) => {
                  const start = new Date(project.startDate).getMonth();
                  const end = new Date(project.endDate).getMonth();
                  const duration = Math.max(1, end - start + 1);
                  return (
                    <div key={project.id} className="flex items-center py-2 border-b border-[var(--divider)] last:border-0">
                      <div className="w-48 shrink-0 pr-4">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{project.name}</p>
                      </div>
                      <div className="flex-1 flex relative h-5">
                        <div
                          className="absolute h-4 rounded-md"
                          style={{
                            left: `${(start / 12) * 100}%`,
                            width: `${(duration / 12) * 100}%`,
                            backgroundColor: project.status === 'completed' ? '#2DD4A8' :
                              project.status === 'in_progress' ? '#3B82F6' :
                              project.status === 'review' ? '#F59E0B' : '#4A5568',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
