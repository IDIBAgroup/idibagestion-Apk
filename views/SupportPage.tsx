import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle, Search, Plus, Clock, User, MessageCircle, X, Send,
  CheckCircle, AlertTriangle, Filter, Tag, Calendar, ArrowRight,
  BookOpen, ChevronDown, ChevronUp, Wrench, FileQuestion, Lightbulb,
  Trash2, Edit3, Save, RotateCcw, Eye, Star, ThumbsUp, ThumbsDown,
  Headphones, Mail, MessageSquare, CheckSquare, Archive, Zap,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';
import type { Ticket } from '@/types';

const priorityColors: Record<string, string> = {
  critical: '#EF4444', high: '#F59E0B', medium: '#3B82F6', low: '#6B7280',
};

const categoryLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  bug: { label: 'Bug', icon: <AlertTriangle size={12} />, color: '#EF4444' },
  feature: { label: 'Fonctionnalite', icon: <Lightbulb size={12} />, color: '#F59E0B' },
  incident: { label: 'Incident', icon: <Zap size={12} />, color: '#EC4899' },
  question: { label: 'Question', icon: <FileQuestion size={12} />, color: '#3B82F6' },
  access: { label: 'Acces', icon: <User size={12} />, color: '#8B5CF6' },
  other: { label: 'Autre', icon: <Tag size={12} />, color: '#6B7280' },
};

const faqItems = [
  { q: 'Comment creer un nouveau projet ?', a: 'Rendez-vous dans le module Projets, cliquez sur "Nouveau Projet", remplissez le formulaire avec le client, le budget et les dates. Le projet sera automatiquement assigne a l\'equipe concernee.', category: 'Projets', helpful: 12 },
  { q: 'Comment soumettre une note de frais ?', a: 'Dans le module Depenses, cliquez sur "Nouvelle Depense", saisissez le montant, la categorie et joignez le justificatif. La note sera envoyee au responsable pour validation.', category: 'Finances', helpful: 8 },
  { q: 'Qui approuve les rapports d\'activites ?', a: 'La chaine hierarchique est : Employe → Responsable de departement → Manager General. Chaque niveau peut valider ou rejeter avec un commentaire.', category: 'RH', helpful: 15 },
  { q: 'Comment utiliser le generateur IA de messages ?', a: 'Dans Vibe Prospecting > Messages IA, selectionnez un prospect, choisissez le canal (Email/LinkedIn/WhatsApp), le ton et les signaux d\'achat. L\'IA genere un message personnalise que vous pouvez modifier avant envoi.', category: 'Vibe Prospecting', helpful: 23 },
  { q: 'Comment exporter une facture en PDF ?', a: 'Dans le module Factures, ouvrez la facture souhaitee et cliquez sur l\'icone PDF. Le document est genere avec le papier en-tete IDIBA Group integre.', category: 'Finances', helpful: 18 },
  { q: 'Comment ajouter un document a la bibliothèque ?', a: 'Rendez-vous dans Ressources > Bibliotheque, cliquez sur "Ajouter un document", selectionnez la categorie (reglement, procedure, manuel...) et deposez votre fichier.', category: 'Ressources', helpful: 6 },
];

export function SupportPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [activeView, setActiveView] = useState<'tickets' | 'faq' | 'stats'>('tickets');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // New ticket form
  const [newTicketForm, setNewTicketForm] = useState({
    subject: '', category: 'bug' as string, priority: 'medium' as string,
    description: '', requesterName: '', requesterEmail: '',
  });

  useEffect(() => {
    setCurrentPageTitle('Centre de Support');
    setTickets(getAll('tickets') as Ticket[]);
    setUsers(getAll('users') || []);
  }, [setCurrentPageTitle]);

  const refreshTickets = () => {
    setTickets(getAll('tickets') as Ticket[]);
  };

  const filtered = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase()) ||
                          t.description?.toLowerCase().includes(search.toLowerCase()) ||
                          t.requesterName?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => ['new', 'open', 'in_progress'].includes(t.status)).length,
    waiting: tickets.filter(t => t.status === 'waiting').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    critical: tickets.filter(t => t.priority === 'critical').length,
    avgRésolution: tickets.filter(t => t.status === 'resolved').length > 0 ? '2.3j' : '—',
  };

  const handleCreateTicket = () => {
    if (!newTicketForm.subject || !newTicketForm.description) {
      showToast('Sujet et description requis', 'warning'); return;
    }
    const newTicket: any = {
      id: `ticket-${Date.now()}`,
      subject: newTicketForm.subject,
      description: newTicketForm.description,
      category: newTicketForm.category,
      priority: newTicketForm.priority,
      status: 'new',
      requesterName: newTicketForm.requesterName || 'Anonyme',
      requesterEmail: newTicketForm.requesterEmail || '',
      assignedTo: '',
      assignedToName: '',
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    stored.tickets = [...(stored.tickets || []), newTicket];
    localStorage.setItem('idibages_db_v3', JSON.stringify(stored));
    refreshTickets();
    setShowNewTicket(false);
    setNewTicketForm({ subject: '', category: 'bug', priority: 'medium', description: '', requesterName: '', requesterEmail: '' });
    showToast('Ticket cree avec succes', 'success');
  };

  const handleAddComment = () => {
    if (!replyText.trim() || !selectedTicket) return;
    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    const reps = stored.tickets || [];
    const idx = reps.findIndex((t: any) => t.id === selectedTicket.id);
    if (idx === -1) return;

    const comment = {
      id: `comment-${Date.now()}`,
      ticketId: selectedTicket.id,
      authorId: 'current-user',
      authorName: 'Utilisateur Actuel',
      content: replyText.trim(),
      isInternal: false,
      createdAt: new Date().toISOString(),
    };

    reps[idx].comments = [...(reps[idx].comments || []), comment];
    reps[idx].updatedAt = new Date().toISOString();
    if (reps[idx].status === 'new') reps[idx].status = 'open';
    stored.tickets = reps;
    localStorage.setItem('idibages_db_v3', JSON.stringify(stored));
    refreshTickets();
    setSelectedTicket({ ...reps[idx] });
    setReplyText('');
    showToast('Reponse ajoutee', 'success');
  };

  const handleStatusChange = (ticketId: string, newStatus: string) => {
    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    const reps = stored.tickets || [];
    const idx = reps.findIndex((t: any) => t.id === ticketId);
    if (idx === -1) return;
    reps[idx].status = newStatus;
    reps[idx].updatedAt = new Date().toISOString();
    stored.tickets = reps;
    localStorage.setItem('idibages_db_v3', JSON.stringify(stored));
    refreshTickets();
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...reps[idx] });
    }
    showToast(`Statut mis a jour : ${newStatus}`, 'success');
  };

  const handleAssign = (ticketId: string, userId: string, userName: string) => {
    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    const reps = stored.tickets || [];
    const idx = reps.findIndex((t: any) => t.id === ticketId);
    if (idx === -1) return;
    reps[idx].assignedTo = userId;
    reps[idx].assignedToName = userName;
    reps[idx].updatedAt = new Date().toISOString();
    stored.tickets = reps;
    localStorage.setItem('idibages_db_v3', JSON.stringify(stored));
    refreshTickets();
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket({ ...reps[idx] });
    }
    showToast(`Assigne a ${userName}`, 'success');
  };

  const handleDeleteTicket = (ticketId: string) => {
    if (!confirm('Supprimer ce ticket definitivement ?')) return;
    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    stored.tickets = (stored.tickets || []).filter((t: any) => t.id !== ticketId);
    localStorage.setItem('idibages_db_v3', JSON.stringify(stored));
    refreshTickets();
    setSelectedTicket(null);
    showToast('Ticket supprime', 'success');
  };

  const filteredFaq = faqItems.filter(f =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()) || f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header with view switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Centre de Support</h2>
          <p className="text-xs text-[var(--text-muted)]">Tickets, FAQ et assistance technique</p>
        </div>
        <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
          {[
            { key: 'tickets', label: 'Tickets', icon: <Headphones size={14} /> },
            { key: 'faq', label: 'FAQ', icon: <BookOpen size={14} /> },
            { key: 'stats', label: 'Statistiques', icon: <CheckSquare size={14} /> },
          ].map(v => (
            <button key={v.key} onClick={() => setActiveView(v.key as any)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${activeView === v.key ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ====== TICKETS VIEW ====== */}
      {activeView === 'tickets' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Ouverts', value: stats.open, icon: <Clock size={16} />, c: '#F59E0B' },
              { label: 'En attente', value: stats.waiting, icon: <AlertTriangle size={16} />, c: '#3B82F6' },
              { label: 'Résolus', value: stats.resolved, icon: <CheckCircle size={16} />, c: '#10B981' },
              { label: 'Critiques', value: stats.critical, icon: <Zap size={16} />, c: '#EF4444' },
            ].map((s, i) => (
              <GlassCard key={s.label} delay={i * 0.05}><div className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.c + '20', color: s.c }}>{s.icon}</div>
                <div><p className="text-base font-bold text-[var(--text-primary)]">{s.value}</p><p className="text-[10px] text-[var(--text-muted)]">{s.label}</p></div>
              </div></GlassCard>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un ticket..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 glass-input text-xs">
              <option value="all">Tous statuts</option><option value="new">Nouveau</option><option value="open">Ouvert</option><option value="in_progress">En cours</option><option value="waiting">En attente</option><option value="resolved">Résolu</option>
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="h-9 px-3 glass-input text-xs">
              <option value="all">Toutes categories</option>
              {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="h-9 px-3 glass-input text-xs">
              <option value="all">Toutes priorites</option><option value="critical">Critique</option><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse</option>
            </select>
            <button onClick={() => setShowNewTicket(true)} className="btn-primary h-9 gap-1.5"><Plus size={14} /> Ticket</button>
          </div>

          {/* Table */}
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--divider)] text-[10px] text-[var(--text-muted)] uppercase">
                    <th className="text-left p-3">N°</th>
                    <th className="text-left p-3">Sujet</th>
                    <th className="text-left p-3">Categorie</th>
                    <th className="text-left p-3">Priorite</th>
                    <th className="text-left p-3">Statut</th>
                    <th className="text-left p-3">Assigne</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-center p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ticket, i) => (
                    <motion.tr key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-[var(--divider)]/50 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      style={{ borderLeft: `3px solid ${priorityColors[ticket.priority] || '#4A5568'}` }}
                    >
                      <td className="p-3 font-mono text-[var(--text-muted)]" onClick={() => setSelectedTicket(ticket)}>#{ticket.id.split('-')[1]}</td>
                      <td className="p-3" onClick={() => setSelectedTicket(ticket)}>
                        <p className="text-sm font-medium text-[var(--text-primary)]">{ticket.subject}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{ticket.requesterName}</p>
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: (categoryLabels[ticket.category]?.color || '#6B7280') + '20', color: categoryLabels[ticket.category]?.color || '#6B7280' }}>
                          {categoryLabels[ticket.category]?.icon} {categoryLabels[ticket.category]?.label || ticket.category}
                        </span>
                      </td>
                      <td className="p-3"><StatusBadge status={ticket.priority} /></td>
                      <td className="p-3"><StatusBadge status={ticket.status} /></td>
                      <td className="p-3 text-[var(--text-secondary)]">{ticket.assignedToName || <span className="text-[var(--text-muted)]">—</span>}</td>
                      <td className="p-3 text-[var(--text-muted)]">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setSelectedTicket(ticket)} className="p-1.5 rounded hover:bg-white/5 text-[var(--accent-secondary)]"><Eye size={12} /></button>
                          <button onClick={() => handleDeleteTicket(ticket.id)} className="p-1.5 rounded hover:bg-white/5 text-[var(--accent-danger)]"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="p-8 text-center text-[var(--text-muted)]">
                  <Headphones size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-xs">Aucun ticket trouve</p>
                </div>
              )}
            </div>
          </GlassCard>
        </>
      )}

      {/* ====== FAQ VIEW ====== */}
      {activeView === 'faq' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 max-w-md relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher dans la FAQ..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaq.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard><div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium">{faq.category}</span>
                      <h4 className="text-sm font-medium text-[var(--text-primary)] mt-1.5">{faq.q}</h4>
                    </div>
                    <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="p-1 rounded hover:bg-white/5 shrink-0">
                      {expandedFaq === i ? <ChevronUp size={14} className="text-[var(--accent-primary)]" /> : <ChevronDown size={14} className="text-[var(--text-muted)]" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {expandedFaq === i && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <p className="text-xs text-[var(--text-secondary)] mt-3 pt-3 border-t border-[var(--divider)]/50 leading-relaxed">{faq.a}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-primary)]"><ThumbsUp size={10} /> Utile ({faq.helpful})</button>
                          <button className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-danger)]"><ThumbsDown size={10} /> Pas utile</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div></GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ====== STATS VIEW ====== */}
      {activeView === 'stats' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total tickets', value: stats.total, icon: <Headphones size={16} />, c: '#3B82F6' },
              { label: 'Taux resolution', value: stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}%` : '0%', icon: <CheckCircle size={16} />, c: '#10B981' },
              { label: 'Temps moyen', value: stats.avgRésolution, icon: <Clock size={16} />, c: '#F59E0B' },
              { label: 'En attente', value: stats.waiting, icon: <AlertTriangle size={16} />, c: '#8B5CF6' },
            ].map((s, i) => (
              <GlassCard key={s.label} delay={i * 0.05}><div className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.c + '20', color: s.c }}>{s.icon}</div>
                <div><p className="text-base font-bold text-[var(--text-primary)]">{s.value}</p><p className="text-[10px] text-[var(--text-muted)]">{s.label}</p></div>
              </div></GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard><div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Par categorie</h3>
              <div className="space-y-2">
                {Object.entries(categoryLabels).map(([k, v]) => {
                  const count = tickets.filter((t: any) => t.category === k).length;
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={k} className="flex items-center gap-2">
                      <span className="text-[10px] w-20 text-[var(--text-secondary)] flex items-center gap-1">{v.icon} {v.label}</span>
                      <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: v.color }} /></div>
                      <span className="text-[10px] text-[var(--text-muted)] w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div></GlassCard>

            <GlassCard><div className="p-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Par statut</h3>
              <div className="space-y-2">
                {['new', 'open', 'in_progress', 'waiting', 'resolved'].map(s => {
                  const count = tickets.filter((t: any) => t.status === s).length;
                  const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  const colors: Record<string, string> = { new: '#6B7280', open: '#3B82F6', in_progress: '#F59E0B', waiting: '#8B5CF6', resolved: '#10B981' };
                  return (
                    <div key={s} className="flex items-center gap-2">
                      <span className="text-[10px] w-20 text-[var(--text-secondary)] capitalize">{s.replace('_', ' ')}</span>
                      <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[s] }} /></div>
                      <span className="text-[10px] text-[var(--text-muted)] w-6 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div></GlassCard>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }} className="glass-card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-[var(--divider)] flex items-start justify-between shrink-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono text-[var(--text-muted)]">#{selectedTicket.id.split('-')[1]}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: (categoryLabels[selectedTicket.category]?.color || '#6B7280') + '20', color: categoryLabels[selectedTicket.category]?.color || '#6B7280' }}>
                      {categoryLabels[selectedTicket.category]?.label || selectedTicket.category}
                    </span>
                    <StatusBadge status={selectedTicket.priority} />
                    <StatusBadge status={selectedTicket.status} />
                  </div>
                  <h2 className="text-base font-semibold text-[var(--text-primary)]">{selectedTicket.subject}</h2>
                </div>
                <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-lg hover:bg-white/5 shrink-0"><X size={16} className="text-[var(--text-muted)]" /></button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="glass-card-compact p-2"><span className="text-[var(--text-muted)]">Demandeur:</span> <span className="text-[var(--text-primary)] font-medium">{selectedTicket.requesterName}</span></div>
                  <div className="glass-card-compact p-2"><span className="text-[var(--text-muted)]">Email:</span> <span className="text-[var(--text-primary)]">{(selectedTicket as any).requesterEmail || '—'}</span></div>
                  <div className="glass-card-compact p-2"><span className="text-[var(--text-muted)]">Cree le:</span> <span className="text-[var(--text-primary)]">{new Date(selectedTicket.createdAt).toLocaleString('fr-FR')}</span></div>
                  <div className="glass-card-compact p-2"><span className="text-[var(--text-muted)]">Mis a jour:</span> <span className="text-[var(--text-primary)]">{new Date(selectedTicket.updatedAt).toLocaleString('fr-FR')}</span></div>
                </div>

                <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--glass-border)] mb-4">
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line">{selectedTicket.description}</p>
                </div>

                {/* Status actions */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs text-[var(--text-muted)] mr-1">Changer statut:</span>
                  {['new', 'open', 'in_progress', 'waiting', 'resolved'].map(s => (
                    <button key={s} onClick={() => handleStatusChange(selectedTicket.id, s)} className={`rounded border px-2 py-0.5 text-xs font-semibold ${selectedTicket.status === s ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)] text-white' : 'border-[var(--glass-border)] bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}>
                      {s.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                {/* Assign */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-[var(--text-muted)]">Assigner a:</span>
                  <select onChange={(e) => { const u = users.find((x: any) => x.uid === e.target.value); if (u) handleAssign(selectedTicket.id, u.uid, u.displayName); }} className="h-8 px-2 glass-input text-xs" value={selectedTicket.assignedTo || ''}>
                    <option value="">Non assigne</option>
                    {users.map((u: any) => <option key={u.uid} value={u.uid}>{u.displayName} ({u.roleName})</option>)}
                  </select>
                </div>

                {/* Comments */}
                <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2"><MessageCircle size={14} className="text-[var(--accent-primary)]" /> Fil de discussion ({(selectedTicket.comments || []).length})</h4>
                <div className="space-y-3 mb-4">
                  {(selectedTicket.comments || []).map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white text-xs font-medium shrink-0">
                        {comment.authorName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 glass-card-compact p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-[var(--text-primary)]">{comment.authorName}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">{new Date(comment.createdAt).toLocaleString('fr-FR')}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{comment.content}</p>
                      </div>
                    </div>
                  ))}
                  {(selectedTicket.comments || []).length === 0 && (
                    <p className="text-xs text-[var(--text-muted)] text-center py-4">Aucun commentaire. Soyez le premier a repondre.</p>
                  )}
                </div>
              </div>

              {/* Reply input */}
              <div className="p-4 border-t border-[var(--divider)] shrink-0">
                <div className="flex gap-2">
                  <input value={replyText} onChange={(e) => setReplyText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} className="flex-1 h-9 px-3 glass-input text-sm" placeholder="Votre reponse..." />
                  <button onClick={handleAddComment} className="btn-primary h-9 px-3 gap-1"><Send size={14} /></button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Ticket Modal */}
      <AnimatePresence>
        {showNewTicket && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full w-full max-w-lg overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--bg-card)] shadow-2xl">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2"><Plus size={16} className="text-[var(--accent-primary)]" /> Nouveau Ticket</h2>
                  <button onClick={() => setShowNewTicket(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={16} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3">
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Sujet <span className="text-[var(--accent-danger)]">*</span></label>
                    <input value={newTicketForm.subject} onChange={e => setNewTicketForm({ ...newTicketForm, subject: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="Resume du probleme..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Categorie</label>
                      <select value={newTicketForm.category} onChange={e => setNewTicketForm({ ...newTicketForm, category: e.target.value })} className="w-full h-9 px-3 glass-input text-sm">
                        {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Priorite</label>
                      <select value={newTicketForm.priority} onChange={e => setNewTicketForm({ ...newTicketForm, priority: e.target.value })} className="w-full h-9 px-3 glass-input text-sm">
                        <option value="critical">Critique</option><option value="high">Haute</option><option value="medium">Moyenne</option><option value="low">Basse</option>
                      </select>
                    </div>
                  </div>
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Description <span className="text-[var(--accent-danger)]">*</span></label>
                    <textarea value={newTicketForm.description} onChange={e => setNewTicketForm({ ...newTicketForm, description: e.target.value })} className="w-full h-24 p-3 glass-input text-sm resize-none" placeholder="Decrivez le probleme en detail..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Votre nom</label>
                      <input value={newTicketForm.requesterName} onChange={e => setNewTicketForm({ ...newTicketForm, requesterName: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="Nom du demandeur" />
                    </div>
                    <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Email</label>
                      <input value={newTicketForm.requesterEmail} onChange={e => setNewTicketForm({ ...newTicketForm, requesterEmail: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="email@idibagroup.cm" />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowNewTicket(false)} className="btn-secondary h-9 flex-1">Annuler</button>
                    <button onClick={handleCreateTicket} className="btn-primary h-9 flex-1 gap-1.5"><Plus size={14} /> Creer le ticket</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
