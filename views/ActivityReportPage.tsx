import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Plus, Search, X, Calendar, Save, Send,
  ChevronDown, CheckCircle, Clock, AlertTriangle, User,
  Building2, FileText, Eye, Edit3, RotateCcw, Filter,
  ThumbsUp, MessageSquare, TrendingUp, Target, Users,
  ArrowRight, Check, XCircle, Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify, updateAndNotify } from '@/lib/db';

const reportTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  daily: { label: 'Journalier', icon: <Clock size={14} />, color: '#3B82F6', bg: 'bg-blue-500/10' },
  weekly: { label: 'Hebdomadaire', icon: <Calendar size={14} />, color: '#8B5CF6', bg: 'bg-purple-500/10' },
  monthly: { label: 'Mensuel', icon: <TrendingUp size={14} />, color: '#F59E0B', bg: 'bg-amber-500/10' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: '#6B7280' },
  submitted: { label: 'Soumis au Resp.', color: '#3B82F6' },
  reviewed_by_hod: { label: 'Revu par Resp.', color: '#8B5CF6' },
  reviewed_by_gm: { label: 'Revu par DG', color: '#EC4899' },
  approved: { label: 'Approuvé', color: '#10B981' },
  rejected: { label: 'Rejeté', color: '#EF4444' },
};

const statusFlow = ['draft', 'submitted', 'reviewed_by_hod', 'reviewed_by_gm', 'approved'];

export function ActivityReportPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'write' | 'sent' | 'received' | 'approved'>('write');
  const [showForm, setShowForm] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  // Form state
  const [form, setForm] = useState({
    title: '', type: 'daily' as string, content: '',
    achievements: [''], challenges: [''], nextSteps: [''],
    employeeId: '', departmentId: '',
  });

  useEffect(() => {
    setCurrentPageTitle('Rapports d\'Activités');
    setReports(getAll('activityReports') || []);
    setEmployees(getAll('employees') || []);
    setDepartments(getAll('departments') || []);
    setUsers(getAll('users') || []);
  }, [setCurrentPageTitle]);

  const addItem = (arr: string[]) => [...arr, ''];
  const removeItem = (arr: string[], i: number) => arr.filter((_, idx) => idx !== i);
  const updateItem = (arr: string[], i: number, v: string) => arr.map((x, idx) => idx === i ? v : x);

  const handleSubmit = (isDraft: boolean) => {
    if (!form.title || !form.content || !form.employeeId) { showToast('Titre, contenu et employe requis', 'warning'); return; }
    const emp = employees.find((e: any) => e.id === form.employeeId);
    const dept = departments.find((d: any) => d.id === (form.departmentId || emp?.departmentId));
    // Find HOD (department manager)
    const hod = users.find((u: any) => u.roleName?.toLowerCase().includes('responsable') || u.roleName?.toLowerCase().includes('hod'));

    const report: any = {
      id: `rep-${Date.now()}`,
      title: form.title,
      type: form.type,
      periodLabel: form.type === 'daily' ? new Date().toLocaleDateString('fr-FR') : form.type === 'weekly' ? `S${getWeekNumber(new Date())}-${new Date().getFullYear()}` : new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
      employeeId: form.employeeId,
      employeeName: emp?.fullName || 'Inconnu',
      departmentId: dept?.id || '',
      departmentName: dept?.name || '',
      content: form.content,
      achievements: form.achievements.filter(Boolean),
      challenges: form.challenges.filter(Boolean),
      nextSteps: form.nextSteps.filter(Boolean),
      status: isDraft ? 'draft' : 'submitted',
      submittedTo: isDraft ? undefined : (hod?.uid || ''),
      submittedToName: isDraft ? undefined : (hod?.displayName || 'Responsable'),
      submittedAt: isDraft ? undefined : new Date().toISOString(),
      companyId: 'comp-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    stored.activityReports = [...(stored.activityReports || []), report];
    localStorage.setItem('idibages_db_v3', JSON.stringify(stored));
    setReports(prev => [...prev, report]);
    setShowForm(false);
    resetForm();
    showToast(isDraft ? 'Brouillon sauvegarde' : 'Rapport soumis au responsable', 'success');
  };

  const resetForm = () => {
    setForm({ title: '', type: 'daily', content: '', achievements: [''], challenges: [''], nextSteps: [''], employeeId: '', departmentId: '' });
  };

  const handleStatusAction = (report: any, action: 'submit' | 'review_hod' | 'submit_gm' | 'review_gm' | 'approve' | 'reject') => {
    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    const reps = stored.activityReports || [];
    const idx = reps.findIndex((r: any) => r.id === report.id);
    if (idx === -1) return;

    const updates: any = { updatedAt: new Date().toISOString() };
    const currentUser = { uid: 'current-user', displayName: 'Utilisateur Actuel' }; // In real app, from auth

    switch (action) {
      case 'submit':
        updates.status = 'submitted';
        updates.submittedAt = new Date().toISOString();
        break;
      case 'review_hod':
        updates.status = 'reviewed_by_hod';
        updates.reviewedBy = currentUser.uid;
        updates.reviewedByName = currentUser.displayName;
        updates.reviewedAt = new Date().toISOString();
        updates.reviewComment = reviewComment;
        break;
      case 'submit_gm':
        updates.status = 'reviewed_by_gm';
        break;
      case 'review_gm':
        updates.status = 'reviewed_by_gm';
        updates.approvedBy = currentUser.uid;
        updates.approvedByName = currentUser.displayName;
        updates.approvedAt = new Date().toISOString();
        break;
      case 'approve':
        updates.status = 'approved';
        updates.approvedBy = currentUser.uid;
        updates.approvedByName = currentUser.displayName;
        updates.approvedAt = new Date().toISOString();
        break;
      case 'reject':
        updates.status = 'rejected';
        updates.reviewComment = reviewComment;
        break;
    }

    reps[idx] = { ...reps[idx], ...updates };
    stored.activityReports = reps;
    localStorage.setItem('idibages_db_v3', JSON.stringify(stored));
    setReports(reps);
    setShowDetail(false);
    setReviewComment('');
    showToast('Statut mis a jour', 'success');
  };

  const filteredReports = reports.filter((r: any) => {
    if (filterType !== 'all' && r.type !== filterType) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (searchTerm && !r.title?.toLowerCase().includes(searchTerm.toLowerCase()) && !r.employeeName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const getWeekNumber = (d: Date) => {
    const oneJan = new Date(d.getFullYear(), 0, 1);
    const numDays = Math.floor((d.getTime() - oneJan.getTime()) / 86400000);
    return Math.ceil((numDays + oneJan.getDay() + 1) / 7);
  };

  const renderFlowStep = (report: any) => {
    const flow = [
      { key: 'draft', label: 'Brouillon', icon: <FileText size={12} /> },
      { key: 'submitted', label: 'Soumis', icon: <Send size={12} /> },
      { key: 'reviewed_by_hod', label: 'Resp. Dept', icon: <Users size={12} /> },
      { key: 'reviewed_by_gm', label: 'Manager G.', icon: <Target size={12} /> },
      { key: 'approved', label: 'Approuvé', icon: <CheckCircle size={12} /> },
    ];
    const currentIdx = statusFlow.indexOf(report.status === 'rejected' ? 'draft' : report.status);

    return (
      <div className="flex items-center gap-1 mt-3">
        {flow.map((step, i) => {
          const isActive = i <= currentIdx;
          const isCurrent = i === currentIdx && report.status !== 'rejected';
          return (
            <div key={step.key} className="flex items-center gap-1">
              <StatusBadge status={step.key} label={step.label} variant={isCurrent ? 'success' : isActive ? 'info' : 'neutral'} />
              {i < flow.length - 1 && <ArrowRight size={10} className="text-[var(--text-muted)]" />}
            </div>
          );
        })}
        {report.status === 'rejected' && <StatusBadge status="rejected" className="ml-2" />}
      </div>
    );
  };

  const tabs = [
    { key: 'write', label: 'Rediger', icon: <Edit3 size={14} /> },
    { key: 'sent', label: 'Mes rapports', icon: <Send size={14} /> },
    { key: 'received', label: 'A valider', icon: <ClipboardList size={14} /> },
    { key: 'approved', label: 'Approuvés', icon: <CheckCircle size={14} /> },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Rapports d'Activités</h2>
          <p className="text-xs text-[var(--text-muted)]">Redaction et workflow hierarchique (Employe → Responsable → DG)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary h-9 gap-1.5"><Plus size={14} /> Nouveau rapport</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Journaliers', value: reports.filter((r: any) => r.type === 'daily').length, icon: <Clock size={16} />, c: '#3B82F6' },
          { label: 'Hebdomadaires', value: reports.filter((r: any) => r.type === 'weekly').length, icon: <Calendar size={16} />, c: '#8B5CF6' },
          { label: 'Mensuels', value: reports.filter((r: any) => r.type === 'monthly').length, icon: <TrendingUp size={16} />, c: '#F59E0B' },
          { label: 'Approuvés', value: reports.filter((r: any) => r.status === 'approved').length, icon: <CheckCircle size={16} />, c: '#10B981' },
        ].map((s, i) => (
          <GlassCard key={s.label} delay={i * 0.05}><div className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.c + '20', color: s.c }}>{s.icon}</div>
            <div><p className="text-base font-bold text-[var(--text-primary)]">{s.value}</p><p className="text-[10px] text-[var(--text-muted)]">{s.label}</p></div>
          </div></GlassCard>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${activeTab === t.key ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>{t.icon} {t.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 max-w-xs relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
        <select value={filterType} onChange={(e: any) => setFilterType(e.target.value)} className="h-9 px-3 glass-input text-xs">
          <option value="all">Tous types</option><option value="daily">Journalier</option><option value="weekly">Hebdomadaire</option><option value="monthly">Mensuel</option>
        </select>
        <select value={filterStatus} onChange={(e: any) => setFilterStatus(e.target.value)} className="h-9 px-3 glass-input text-xs">
          <option value="all">Tous statuts</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* WRITE TAB — Form */}
      {activeTab === 'write' && (
        <GlassCard><div className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Edit3 size={14} className="text-[var(--accent-primary)]" /> Rediger un rapport</h3>
          <div className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Titre</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="Titre du rapport..." /></div>
              <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Type</label>
                <div className="flex gap-2">
                  {Object.entries(reportTypeLabels).map(([k, v]) => (
                    <button key={k} onClick={() => setForm({ ...form, type: k })} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${form.type === k ? 'text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`} style={form.type === k ? { backgroundColor: v.color } : {}}>
                      {v.icon} {v.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Employe</label>
                <select value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full h-9 px-3 glass-input text-sm">
                  <option value="">Selectionner...</option>
                  {employees.map((e: any) => <option key={e.id} value={e.id}>{e.fullName} — {e.position}</option>)}
                </select>
              </div>
              <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Departement</label>
                <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })} className="w-full h-9 px-3 glass-input text-sm">
                  <option value="">Auto (de l'employe)</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Contenu detaille</label>
              <textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="w-full h-32 px-3 py-2 glass-input text-sm resize-none" placeholder="Decrivez les activites realisees..." />
            </div>

            {/* Achievements */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Realisations</label>
              {form.achievements.map((a, i) => (
                <div key={i} className="flex gap-2 mb-1.5">
                  <input value={a} onChange={e => setForm({ ...form, achievements: updateItem(form.achievements, i, e.target.value) })} className="flex-1 h-8 px-3 glass-input text-xs" placeholder={`Realisation ${i + 1}...`} />
                  {form.achievements.length > 1 && <button onClick={() => setForm({ ...form, achievements: removeItem(form.achievements, i) })} className="p-1 text-[var(--accent-danger)]"><X size={12} /></button>}
                </div>
              ))}
              <button onClick={() => setForm({ ...form, achievements: addItem(form.achievements) })} className="text-[10px] text-[var(--accent-primary)] hover:underline">+ Ajouter une realisation</button>
            </div>

            {/* Challenges */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Difficultes rencontrees</label>
              {form.challenges.map((c, i) => (
                <div key={i} className="flex gap-2 mb-1.5">
                  <input value={c} onChange={e => setForm({ ...form, challenges: updateItem(form.challenges, i, e.target.value) })} className="flex-1 h-8 px-3 glass-input text-xs" placeholder={`Difficulte ${i + 1}...`} />
                  {form.challenges.length > 1 && <button onClick={() => setForm({ ...form, challenges: removeItem(form.challenges, i) })} className="p-1 text-[var(--accent-danger)]"><X size={12} /></button>}
                </div>
              ))}
              <button onClick={() => setForm({ ...form, challenges: addItem(form.challenges) })} className="text-[10px] text-[var(--accent-primary)] hover:underline">+ Ajouter une difficulte</button>
            </div>

            {/* Next Steps */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Prochaines etapes</label>
              {form.nextSteps.map((s, i) => (
                <div key={i} className="flex gap-2 mb-1.5">
                  <input value={s} onChange={e => setForm({ ...form, nextSteps: updateItem(form.nextSteps, i, e.target.value) })} className="flex-1 h-8 px-3 glass-input text-xs" placeholder={`Etape ${i + 1}...`} />
                  {form.nextSteps.length > 1 && <button onClick={() => setForm({ ...form, nextSteps: removeItem(form.nextSteps, i) })} className="p-1 text-[var(--accent-danger)]"><X size={12} /></button>}
                </div>
              ))}
              <button onClick={() => setForm({ ...form, nextSteps: addItem(form.nextSteps) })} className="text-[10px] text-[var(--accent-primary)] hover:underline">+ Ajouter une etape</button>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => handleSubmit(true)} className="btn-secondary h-9 gap-1.5"><Save size={14} /> Sauvegarder brouillon</button>
              <button onClick={() => handleSubmit(false)} className="btn-primary h-9 gap-1.5"><Send size={14} /> Soumettre au responsable</button>
            </div>
          </div>
        </div></GlassCard>
      )}

      {/* LIST TABS */}
      {activeTab !== 'write' && (
        <div className="space-y-3">
          {filteredReports.length === 0 ? (
            <GlassCard><div className="p-8 text-center text-[var(--text-muted)]">
              <ClipboardList size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-xs">Aucun rapport trouve</p>
            </div></GlassCard>
          ) : filteredReports.map((r: any, i: number) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <GlassCard hover={false}><div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${reportTypeLabels[r.type]?.bg || ''}`} style={{ color: reportTypeLabels[r.type]?.color }}>
                      {reportTypeLabels[r.type]?.icon} {reportTypeLabels[r.type]?.label}
                    </span>
                    <StatusBadge status={r.status} label={statusLabels[r.status]?.label ?? r.status} />
                    <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-1"><Calendar size={10} /> {r.periodLabel}</span>
                  </div>
                  <button onClick={() => { setSelectedReport(r); setShowDetail(true); }} className="text-[10px] text-[var(--accent-secondary)] hover:underline flex items-center gap-1"><Eye size={10} /> Voir</button>
                </div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{r.title}</h4>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-2">{r.content}</p>
                <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><User size={10} /> {r.employeeName}</span>
                  <span className="flex items-center gap-1"><Building2 size={10} /> {r.departmentName}</span>
                  {r.submittedToName && <span className="flex items-center gap-1"><Send size={10} /> Soumis a: {r.submittedToName}</span>}
                </div>
                {renderFlowStep(r)}
              </div></GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} className="glass-card w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium`} style={{ backgroundColor: reportTypeLabels[selectedReport.type]?.color + '20', color: reportTypeLabels[selectedReport.type]?.color }}>
                        {reportTypeLabels[selectedReport.type]?.label}
                      </span>
                      <StatusBadge status={selectedReport.status} label={statusLabels[selectedReport.status]?.label ?? selectedReport.status} />
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{selectedReport.title}</h3>
                    <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1 mt-0.5"><Calendar size={10} /> {selectedReport.periodLabel} · <User size={10} /> {selectedReport.employeeName} · <Building2 size={10} /> {selectedReport.departmentName}</p>
                  </div>
                  <button onClick={() => setShowDetail(false)} className="p-1 rounded hover:bg-white/5"><X size={16} /></button>
                </div>

                {renderFlowStep(selectedReport)}

                <div className="mt-4 space-y-4">
                  <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--glass-border)]">
                    <h4 className="text-xs font-medium text-[var(--text-primary)] mb-2">Contenu</h4>
                    <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line">{selectedReport.content}</p>
                  </div>

                  {selectedReport.achievements?.length > 0 && (
                    <div><h4 className="text-xs font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1"><CheckCircle size={12} className="text-[var(--accent-primary)]" /> Realisations</h4>
                      <div className="space-y-1">{selectedReport.achievements.map((a: string, i: number) => <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"><Check size={10} className="text-[var(--accent-primary)] mt-0.5 shrink-0" /> {a}</div>)}</div>
                    </div>
                  )}
                  {selectedReport.challenges?.length > 0 && (
                    <div><h4 className="text-xs font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1"><AlertTriangle size={12} className="text-[var(--accent-warning)]" /> Difficultes</h4>
                      <div className="space-y-1">{selectedReport.challenges.map((c: string, i: number) => <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"><ChevronDown size={10} className="text-[var(--accent-warning)] mt-0.5 shrink-0" /> {c}</div>)}</div>
                    </div>
                  )}
                  {selectedReport.nextSteps?.length > 0 && (
                    <div><h4 className="text-xs font-medium text-[var(--text-primary)] mb-2 flex items-center gap-1"><Target size={12} className="text-[var(--accent-secondary)]" /> Prochaines etapes</h4>
                      <div className="space-y-1">{selectedReport.nextSteps.map((s: string, i: number) => <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]"><ArrowRight size={10} className="text-[var(--accent-secondary)] mt-0.5 shrink-0" /> {s}</div>)}</div>
                    </div>
                  )}

                  {selectedReport.reviewComment && (
                    <div className="p-3 rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10">
                      <h4 className="text-[10px] font-medium text-[var(--accent-primary)] mb-1 flex items-center gap-1"><MessageSquare size={10} /> Commentaire de validation</h4>
                      <p className="text-xs text-[var(--text-secondary)]">{selectedReport.reviewComment}</p>
                      {selectedReport.reviewedByName && <p className="text-[9px] text-[var(--text-muted)] mt-1">Par {selectedReport.reviewedByName} le {selectedReport.reviewedAt ? new Date(selectedReport.reviewedAt).toLocaleDateString('fr-FR') : ''}</p>}
                    </div>
                  )}
                </div>

                {/* Action buttons based on status */}
                <div className="mt-4 pt-4 border-t border-[var(--divider)]">
                  {selectedReport.status === 'submitted' && (
                    <div className="space-y-2">
                      <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="w-full h-16 px-3 py-2 glass-input text-xs resize-none" placeholder="Commentaire de validation (optionnel)..." />
                      <div className="flex gap-2">
                        <button onClick={() => handleStatusAction(selectedReport, 'review_hod')} className="btn-primary h-8 text-xs gap-1"><Check size={12} /> Valider & transmettre au DG</button>
                        <button onClick={() => handleStatusAction(selectedReport, 'reject')} className="btn-danger h-8 text-xs gap-1"><XCircle size={12} /> Rejeter</button>
                      </div>
                    </div>
                  )}
                  {selectedReport.status === 'reviewed_by_hod' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusAction(selectedReport, 'review_gm')} className="btn-primary h-8 text-xs gap-1"><Check size={12} /> Approuver definitivement</button>
                      <button onClick={() => handleStatusAction(selectedReport, 'reject')} className="btn-danger h-8 text-xs gap-1"><XCircle size={12} /> Rejeter</button>
                    </div>
                  )}
                  {selectedReport.status === 'draft' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatusAction(selectedReport, 'submit')} className="btn-primary h-8 text-xs gap-1"><Send size={12} /> Soumettre au responsable</button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
