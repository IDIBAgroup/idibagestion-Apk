import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, X, Mail, Phone, Calendar, Star,
  ArrowRight, ArrowLeft, Upload, Trash2, Clock,
  CheckCircle, AlertTriangle, Send, Check, UserCheck, FileText, Briefcase
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify, updateAndNotify, removeAndNotify } from '@/lib/db';
import type { Candidate, CandidateStatus, Employee, EmployeeContract } from '@/types';

const PIPELINE_STAGES: { key: CandidateStatus; label: string; color: string }[] = [
  { key: 'new', label: 'Nouveau', color: '#6366f1' },
  { key: 'screening', label: 'Presélection', color: '#8b5cf6' },
  { key: 'interview', label: 'Entretien', color: '#3b82f6' },
  { key: 'technical', label: 'Test Technique', color: '#f59e0b' },
  { key: 'offer', label: 'Offre', color: '#10b981' },
  { key: 'hired', label: 'Embauché', color: '#059669' },
  { key: 'rejected', label: 'Rejeté', color: '#ef4444' },
];

export function RecruitmentPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [showNewCandidate, setShowNewCandidate] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showCvParse, setShowCvParse] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [hiredCandidate, setHiredCandidate] = useState<Candidate | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewTime, setInterviewTime] = useState('');
  const [showScheduleInterview, setShowScheduleInterview] = useState(false);
  const [ratingHover, setRatingHover] = useState(0);
  const [newCand, setNewCand] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    position: '', departmentId: '', source: '',
    salaryExpectation: '', notes: '',
  });

  useEffect(() => { setCurrentPageTitle('Recrutement'); }, [setCurrentPageTitle]);

  const candidates = getAll('candidates') as Candidate[];
  const departments = getAll('departments');

  const filtered = useMemo(() => {
    return candidates.filter(c => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      const m = fullName.includes(search.toLowerCase()) ||
        c.position.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      return m && (sourceFilter === 'all' || c.source === sourceFilter);
    });
  }, [candidates, search, sourceFilter]);

  const stageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach(s => counts[s.key] = candidates.filter(c => c.status === s.key).length);
    return counts;
  }, [candidates]);

  const sources = useMemo(() => Array.from(new Set(candidates.map(c => c.source))), [candidates]);

  const formatXAF = (a: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);

  const handleCreateCandidate = () => {
    if (!newCand.firstName || !newCand.lastName || !newCand.position) return;
    const candidate: Candidate = {
      id: `cand-${Date.now()}`,
      firstName: newCand.firstName,
      lastName: newCand.lastName,
      email: newCand.email,
      phone: newCand.phone,
      position: newCand.position,
      departmentId: newCand.departmentId || 'dept-1',
      status: 'new',
      source: newCand.source || 'Site web',
      notes: newCand.notes,
      rating: 0,
      salaryExpectation: Number(newCand.salaryExpectation) || 0,
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    addAndNotify('candidates', candidate);
    setShowNewCandidate(false);
    setNewCand({ firstName: '', lastName: '', email: '', phone: '', position: '', departmentId: '', source: '', salaryExpectation: '', notes: '' });
    showToast('Candidat ajoute avec succes', 'success');
  };

  const moveStage = (candidate: Candidate, direction: 'next' | 'prev') => {
    const idx = PIPELINE_STAGES.findIndex(s => s.key === candidate.status);
    const newIdx = direction === 'next' ? idx + 1 : idx - 1;
    if (newIdx < 0 || newIdx >= PIPELINE_STAGES.length) return;
    const newStatus = PIPELINE_STAGES[newIdx].key;
    updateAndNotify('candidates', candidate.id, { status: newStatus });
    if (newStatus === 'hired') {
      setHiredCandidate({ ...candidate, status: 'hired' });
      setShowOnboarding(true);
      setOnboardingStep(0);
    }
    showToast(`Candidat deplace vers "${PIPELINE_STAGES[newIdx].label}"`, 'success');
  };

  const handleDelete = (id: string) => {
    removeAndNotify('candidates', id);
    setShowDeleteConfirm(null);
    setSelectedCandidate(null);
    showToast('Candidat supprime', 'info');
  };

  const handleRate = (candidate: Candidate, rating: number) => {
    updateAndNotify('candidates', candidate.id, { rating });
    showToast(`Note attribuee : ${rating}/5`, 'success');
  };

  const handleAddNote = (candidate: Candidate) => {
    if (!noteText.trim()) return;
    const newNotes = candidate.notes ? `${candidate.notes}\n\n[${new Date().toLocaleDateString('fr-FR')}] ${noteText}` : `[${new Date().toLocaleDateString('fr-FR')}] ${noteText}`;
    updateAndNotify('candidates', candidate.id, { notes: newNotes });
    setNoteText('');
    showToast('Note ajoutee', 'success');
  };

  const handleScheduleInterview = (candidate: Candidate) => {
    if (!interviewDate || !interviewTime) return;
    const dateTime = `${interviewDate}T${interviewTime}:00Z`;
    updateAndNotify('candidates', candidate.id, { interviewDate: dateTime });
    setShowScheduleInterview(false);
    setInterviewDate(''); setInterviewTime('');
    showToast('Entretien programme', 'success');
  };

  const handleCvParse = () => {
    setShowCvParse(false);
    showToast('CV analyse avec succes ! Donnees extraites.', 'success');
    setNewCand({
      firstName: 'Alain', lastName: 'Kouam',
      email: 'alain.kouam@email.cm', phone: '+237 699 12 34 56',
      position: 'Developpeur Frontend', departmentId: 'dept-3',
      source: 'LinkedIn', salaryExpectation: '850000',
      notes: 'Competences detectees : React, TypeScript, Node.js, 5 ans experience. Formation : ENSP Yaounde.',
    });
    setShowNewCandidate(true);
  };

  const handleOnboardingComplete = () => {
    if (!hiredCandidate) return;
    const employee: Employee = {
      id: `emp-${Date.now()}`,
      firstName: hiredCandidate.firstName,
      lastName: hiredCandidate.lastName,
      fullName: `${hiredCandidate.firstName} ${hiredCandidate.lastName}`,
      email: hiredCandidate.email,
      phone: hiredCandidate.phone,
      matricule: `IDB-${Math.floor(1000 + Math.random() * 9000)}`,
      cnpsNumber: `CNPS-${Math.floor(100000 + Math.random() * 900000)}`,
      hireDate: new Date().toISOString().split('T')[0],
      birthDate: '1990-01-01',
      gender: 'male',
      address: '',
      city: 'Douala',
      country: 'Cameroun',
      position: hiredCandidate.position,
      departmentId: hiredCandidate.departmentId,
      departmentName: departments.find((d: any) => d.id === hiredCandidate.departmentId)?.name || 'Digital',
      contractType: 'CDI',
      grossSalary: hiredCandidate.salaryExpectation || 500000,
      netSalary: Math.round((hiredCandidate.salaryExpectation || 500000) * 0.75),
      bankName: '',
      bankAccount: '',
      bankCode: '',
      status: 'active',
      photoUrl: '',
      emergencyContact: '',
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    addAndNotify('employees', employee);
    const contract: EmployeeContract = {
      id: `contract-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.fullName,
      type: 'cdi',
      startDate: new Date().toISOString().split('T')[0],
      salary: employee.grossSalary,
      position: employee.position,
      department: employee.departmentName,
      benefits: ['Mutuelle', 'Telephone', 'Transport'],
      status: 'active',
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    addAndNotify('contracts', contract);
    setShowOnboarding(false);
    setHiredCandidate(null);
    showToast('Employe cree avec succes ! Contrat CDI genere.', 'success');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Recrutement</h2>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2.5 py-1">{candidates.length} candidats</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCvParse(true)} className="btn-secondary h-9 text-xs gap-1.5">
            <Upload size={14} /> Parser un CV
          </button>
          <button onClick={() => setShowNewCandidate(true)} className="btn-primary h-9">
            <Plus size={16} /> Nouveau Candidat
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {PIPELINE_STAGES.map(stage => (
          <GlassCard key={stage.key} className="p-2.5 text-center">
            <div className="w-2 h-2 rounded-full mx-auto mb-1.5" style={{ backgroundColor: stage.color }} />
            <p className="text-lg font-bold text-[var(--text-primary)]">{stageCounts[stage.key] || 0}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{stage.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un candidat..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="h-9 px-3 glass-input text-sm">
          <option value="all">Toutes sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3 min-w-[900px]">
          {PIPELINE_STAGES.map(stage => {
            const stageCands = filtered.filter(c => c.status === stage.key);
            return (
              <div key={stage.key} className="flex-1 min-w-[160px]">
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-xs font-medium text-[var(--text-primary)]">{stage.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-1.5 py-0.5 ml-auto">{stageCands.length}</span>
                </div>
                <div className="space-y-2">
                  {stageCands.map((cand, i) => (
                    <motion.div
                      key={cand.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card-compact p-3 cursor-pointer hover:bg-white/[0.02] transition-colors group"
                      onClick={() => setSelectedCandidate(cand)}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white text-[10px] font-bold">
                            {cand.firstName[0]}{cand.lastName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[var(--text-primary)]">{cand.firstName} {cand.lastName}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{cand.position}</p>
                          </div>
                        </div>
                        {cand.rating > 0 && (
                          <div className="flex items-center gap-0.5">
                            <Star size={10} className="text-[var(--accent-warning)] fill-[var(--accent-warning)]" />
                            <span className="text-[10px] text-[var(--text-muted)]">{cand.rating}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] mb-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]">{cand.source}</span>
                        {cand.salaryExpectation > 0 && <span>{formatXAF(cand.salaryExpectation)}</span>}
                      </div>
                      {cand.interviewDate && (
                        <div className="flex items-center gap-1 text-[10px] text-[var(--accent-primary)]">
                          <Clock size={10} />
                          {new Date(cand.interviewDate).toLocaleDateString('fr-FR')} {new Date(cand.interviewDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {stage.key !== 'new' && stage.key !== 'rejected' && stage.key !== 'hired' && (
                          <button onClick={(e) => { e.stopPropagation(); moveStage(cand, 'prev'); }} className="p-1 rounded hover:bg-white/5 text-[var(--text-muted)]" title="Reculer"><ArrowLeft size={12} /></button>
                        )}
                        {stage.key !== 'rejected' && stage.key !== 'hired' && (
                          <button onClick={(e) => { e.stopPropagation(); moveStage(cand, 'next'); }} className="p-1 rounded hover:bg-white/5 text-[var(--text-muted)]" title="Avancer"><ArrowRight size={12} /></button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setSelectedCandidate(cand); setShowScheduleInterview(true); }} className="p-1 rounded hover:bg-white/5 text-[var(--text-muted)]" title="Planifier entretien"><Calendar size={12} /></button>
                        <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(cand.id); }} className="p-1 rounded hover:bg-white/5 text-[var(--accent-danger)]" title="Supprimer"><Trash2 size={12} /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Candidate Modal */}
      <AnimatePresence>
        {showNewCandidate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowNewCandidate(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-lg border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 max-h-screen overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouveau Candidat</h2>
                  <button onClick={() => setShowNewCandidate(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Prenom</label><input value={newCand.firstName} onChange={e => setNewCand({ ...newCand, firstName: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom</label><input value={newCand.lastName} onChange={e => setNewCand({ ...newCand, lastName: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email</label><input type="email" value={newCand.email} onChange={e => setNewCand({ ...newCand, email: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Telephone</label><input value={newCand.phone} onChange={e => setNewCand({ ...newCand, phone: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Poste vise</label><input value={newCand.position} onChange={e => setNewCand({ ...newCand, position: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="ex: Developpeur Full-Stack" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Departement</label><select value={newCand.departmentId} onChange={e => setNewCand({ ...newCand, departmentId: e.target.value })} className="w-full h-9 px-3 glass-input text-sm"><option value="">Selectionner...</option>{departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Source</label><select value={newCand.source} onChange={e => setNewCand({ ...newCand, source: e.target.value })} className="w-full h-9 px-3 glass-input text-sm"><option value="">Selectionner...</option><option>LinkedIn</option><option>BOLOLO</option><option>Reference interne</option><option>Site web</option><option>Indeed</option><option>Autre</option></select></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Pretention salariale</label><input type="number" value={newCand.salaryExpectation} onChange={e => setNewCand({ ...newCand, salaryExpectation: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="XAF" /></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Notes</label><textarea value={newCand.notes} onChange={e => setNewCand({ ...newCand, notes: e.target.value })} className="w-full h-20 p-3 glass-input text-sm resize-none" placeholder="Competences, experience, impressions..." /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowNewCandidate(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button onClick={handleCreateCandidate} disabled={!newCand.firstName || !newCand.lastName || !newCand.position} className="flex-1 btn-primary h-10 justify-center disabled:opacity-50">Ajouter le Candidat</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Candidate Detail Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedCandidate(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl glass-card z-50 max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white font-bold text-lg">{selectedCandidate.firstName[0]}{selectedCandidate.lastName[0]}</div>
                    <div>
                      <h2 className="text-lg font-semibold text-[var(--text-primary)]">{selectedCandidate.firstName} {selectedCandidate.lastName}</h2>
                      <p className="text-xs text-[var(--text-muted)]">{selectedCandidate.position}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCandidate(null)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[10px] text-[var(--text-muted)]">Email</span><p className="text-xs text-[var(--text-primary)] flex items-center gap-1"><Mail size={10} className="text-[var(--accent-primary)]" />{selectedCandidate.email}</p></div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[10px] text-[var(--text-muted)]">Telephone</span><p className="text-xs text-[var(--text-primary)] flex items-center gap-1"><Phone size={10} className="text-[var(--accent-primary)]" />{selectedCandidate.phone}</p></div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[10px] text-[var(--text-muted)]">Source</span><p className="text-xs text-[var(--text-primary)]">{selectedCandidate.source}</p></div>
                    <div className="p-2 rounded-lg bg-[var(--bg-elevated)]"><span className="text-[10px] text-[var(--text-muted)]">Pretention</span><p className="text-xs text-[var(--text-primary)]">{formatXAF(selectedCandidate.salaryExpectation)}</p></div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-[var(--text-secondary)]">Evaluation :</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button key={star} onClick={() => handleRate(selectedCandidate, star)} onMouseEnter={() => setRatingHover(star)} onMouseLeave={() => setRatingHover(0)} className="p-0.5">
                          <Star size={18} className={(ratingHover || selectedCandidate.rating) >= star ? 'text-[var(--accent-warning)] fill-[var(--accent-warning)]' : 'text-[var(--text-muted)]'} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--text-secondary)]">Etape :</span>
                    <div className="flex items-center gap-1">
                      {selectedCandidate.status !== 'new' && selectedCandidate.status !== 'rejected' && selectedCandidate.status !== 'hired' && (
                        <button onClick={() => moveStage(selectedCandidate, 'prev')} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)]"><ArrowLeft size={14} /></button>
                      )}
                      <span className="text-xs px-2 py-1 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium">
                        {PIPELINE_STAGES.find(s => s.key === selectedCandidate.status)?.label}
                      </span>
                      {selectedCandidate.status !== 'rejected' && selectedCandidate.status !== 'hired' && (
                        <button onClick={() => moveStage(selectedCandidate, 'next')} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)]"><ArrowRight size={14} /></button>
                      )}
                    </div>
                  </div>

                  {selectedCandidate.interviewDate && (
                    <div className="glass-card-compact p-3 flex items-center gap-2">
                      <Calendar size={14} className="text-[var(--accent-primary)]" />
                      <span className="text-xs text-[var(--text-primary)]">Entretien programme le {new Date(selectedCandidate.interviewDate).toLocaleDateString('fr-FR')} a {new Date(selectedCandidate.interviewDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}

                  <div>
                    <h4 className="text-xs font-medium text-[var(--text-primary)] mb-2">Notes & Commentaires</h4>
                    <div className="glass-card-compact p-3 max-h-32 overflow-y-auto">
                      {selectedCandidate.notes ? (
                        <p className="text-xs text-[var(--text-secondary)] whitespace-pre-line">{selectedCandidate.notes}</p>
                      ) : (
                        <p className="text-xs text-[var(--text-muted)] italic">Aucune note</p>
                      )}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <input value={noteText} onChange={e => setNoteText(e.target.value)} className="flex-1 h-8 px-3 glass-input text-xs" placeholder="Ajouter une note..." />
                      <button onClick={() => handleAddNote(selectedCandidate)} className="btn-primary h-8 px-3"><Send size={12} /></button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowScheduleInterview(true)} className="btn-secondary h-9 flex-1 justify-center text-xs gap-1"><Calendar size={12} /> Programmer entretien</button>
                    <button onClick={() => setShowDeleteConfirm(selectedCandidate.id)} className="btn-danger h-9 px-3 text-xs"><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Schedule Interview Modal */}
      <AnimatePresence>
        {showScheduleInterview && selectedCandidate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowScheduleInterview(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-sm border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-[60] overflow-y-auto shadow-2xl">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">Programmer un entretien</h3>
                  <button onClick={() => setShowScheduleInterview(false)} className="p-1.5 rounded-lg hover:bg-white/5"><X size={14} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-[var(--text-muted)]">{selectedCandidate.firstName} {selectedCandidate.lastName} — {selectedCandidate.position}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Date</label><input type="date" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className="w-full h-9 px-2 glass-input text-sm" /></div>
                    <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Heure</label><input type="time" value={interviewTime} onChange={e => setInterviewTime(e.target.value)} className="w-full h-9 px-2 glass-input text-sm" /></div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setShowScheduleInterview(false)} className="flex-1 btn-ghost h-9 justify-center text-xs">Annuler</button>
                    <button onClick={() => handleScheduleInterview(selectedCandidate)} disabled={!interviewDate || !interviewTime} className="flex-1 btn-primary h-9 justify-center text-xs disabled:opacity-50">Programmer</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CV Parse Modal */}
      <AnimatePresence>
        {showCvParse && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCvParse(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-md border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Parser un CV</h2>
                  <button onClick={() => setShowCvParse(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="border-2 border-dashed border-[var(--glass-border)] rounded-xl p-8 text-center hover:border-[var(--accent-primary)]/50 transition-colors cursor-pointer">
                  <Upload size={32} className="text-[var(--accent-primary)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--text-primary)] mb-1">Glissez-deposez un CV ici</p>
                  <p className="text-xs text-[var(--text-muted)] mb-3">PDF, DOCX, ou TXT (max 5 Mo)</p>
                  <span className="text-[10px] text-[var(--text-muted)]">L IA extraira automatiquement : nom, contact, competences, experience, formation</span>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><CheckCircle size={12} className="text-[var(--accent-primary)]" /> Extraction des informations personnelles</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><CheckCircle size={12} className="text-[var(--accent-primary)]" /> Detection des competences techniques</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><CheckCircle size={12} className="text-[var(--accent-primary)]" /> Analyse de l experience professionnelle</div>
                  <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"><CheckCircle size={12} className="text-[var(--accent-primary)]" /> Score de matching avec le poste</div>
                </div>
                <button onClick={handleCvParse} className="w-full btn-primary h-10 mt-4 justify-center">Analyser le CV (simulation)</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirm */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setShowDeleteConfirm(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm glass-card z-[60] p-5">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle size={20} className="text-[var(--accent-danger)]" />
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Confirmer la suppression</h3>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mb-4">Cette action est irreversible. Le candidat sera definitivement supprime.</p>
              <div className="flex gap-2">
                <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 btn-ghost h-9 justify-center text-xs">Annuler</button>
                <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 btn-danger h-9 justify-center text-xs">Supprimer</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Onboarding Modal */}
      <AnimatePresence>
        {showOnboarding && hiredCandidate && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowOnboarding(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="fixed right-0 top-0 bottom-0 w-full max-w-lg border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 max-h-screen overflow-y-auto shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Onboarding Digital — {hiredCandidate.firstName} {hiredCandidate.lastName}</h2>
                  <button onClick={() => setShowOnboarding(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>

                <div className="flex items-center gap-2 mb-6">
                  {['Profil', 'Contrat', 'Documents', 'Finalisation'].map((step, i) => (
                    <div key={step} className="flex items-center gap-2 flex-1">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i <= onboardingStep ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>{i + 1}</div>
                      <span className={`text-[10px] ${i <= onboardingStep ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>{step}</span>
                      {i < 3 && <div className={`flex-1 h-0.5 ${i < onboardingStep ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-elevated)]'}`} />}
                    </div>
                  ))}
                </div>

                {onboardingStep === 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">Verification du profil</h3>
                    <div className="glass-card-compact p-3 space-y-2">
                      <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Nom</span><span className="text-[var(--text-primary)]">{hiredCandidate.firstName} {hiredCandidate.lastName}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Email</span><span className="text-[var(--text-primary)]">{hiredCandidate.email}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Poste</span><span className="text-[var(--text-primary)]">{hiredCandidate.position}</span></div>
                      <div className="flex justify-between text-xs"><span className="text-[var(--text-muted)]">Salaire negocie</span><span className="text-[var(--text-primary)]">{formatXAF(hiredCandidate.salaryExpectation)}</span></div>
                    </div>
                    <button onClick={() => setOnboardingStep(1)} className="w-full btn-primary h-10 justify-center">Continuer vers le contrat</button>
                  </div>
                )}

                {onboardingStep === 1 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">Contrat CDI</h3>
                    <div className="glass-card-compact p-3 space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Type</span><span className="text-[var(--text-primary)]">CDI</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Date debut</span><span className="text-[var(--text-primary)]">{new Date().toLocaleDateString('fr-FR')}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Salaire brut</span><span className="text-[var(--text-primary)]">{formatXAF(hiredCandidate.salaryExpectation || 500000)}</span></div>
                      <div className="flex justify-between"><span className="text-[var(--text-muted)]">Avantages</span><span className="text-[var(--text-primary)]">Mutuelle, Telephone, Transport</span></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setOnboardingStep(0)} className="flex-1 btn-ghost h-10 justify-center text-xs">Retour</button>
                      <button onClick={() => setOnboardingStep(2)} className="flex-1 btn-primary h-10 justify-center text-xs">Generer le contrat</button>
                    </div>
                  </div>
                )}

                {onboardingStep === 2 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">Documents requis</h3>
                    <div className="space-y-2">
                      {[
                        { label: 'Carte nationale d identite', done: true },
                        { label: 'Diplome le plus eleve', done: true },
                        { label: 'Certificat de naissance', done: false },
                        { label: 'Casier judiciaire', done: false },
                        { label: 'Certificat de residence', done: false },
                      ].map((doc, i) => (
                        <div key={i} className="flex items-center justify-between glass-card-compact p-2">
                          <span className="text-xs text-[var(--text-primary)]">{doc.label}</span>
                          {doc.done ? <CheckCircle size={14} className="text-[var(--accent-primary)]" /> : <div className="w-4 h-4 rounded border border-[var(--glass-border)]" />}
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setOnboardingStep(1)} className="flex-1 btn-ghost h-10 justify-center text-xs">Retour</button>
                      <button onClick={() => setOnboardingStep(3)} className="flex-1 btn-primary h-10 justify-center text-xs">Continuer</button>
                    </div>
                  </div>
                )}

                {onboardingStep === 3 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-[var(--text-primary)]">Finalisation</h3>
                    <div className="glass-card-compact p-4 text-center">
                      <UserCheck size={32} className="text-[var(--accent-primary)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-primary)]">L employe sera cree avec un contrat CDI</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Matricule, CNPS et fiche salariale generes automatiquement</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setOnboardingStep(2)} className="flex-1 btn-ghost h-10 justify-center text-xs">Retour</button>
                      <button onClick={handleOnboardingComplete} className="flex-1 btn-primary h-10 justify-center text-xs">Finaliser l embauche</button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
