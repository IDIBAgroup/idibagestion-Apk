import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HelpCircle, Search, Plus, Clock, User, MessageCircle, X, Send } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';
import type { Ticket } from '@/types';

export function SupportPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showNewTicket, setShowNewTicket] = useState(false);

  useEffect(() => { setCurrentPageTitle('Centre de Support'); }, [setCurrentPageTitle]);

  const tickets = getAll('tickets') as Ticket[];

  const filtered = tickets.filter(t => {
    const matchesSearch = t.subject.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    open: tickets.filter(t => ['new', 'open', 'in_progress'].includes(t.status)).length,
    waiting: tickets.filter(t => t.status === 'waiting').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard delay={0}><div className="p-4"><p className="text-xs text-[var(--text-muted)]">Ouverts</p><p className="text-2xl font-bold text-[var(--accent-warning)]">{stats.open}</p></div></GlassCard>
        <GlassCard delay={0.05}><div className="p-4"><p className="text-xs text-[var(--text-muted)]">En attente</p><p className="text-2xl font-bold text-[var(--accent-secondary)]">{stats.waiting}</p></div></GlassCard>
        <GlassCard delay={0.1}><div className="p-4"><p className="text-xs text-[var(--text-muted)]">Résolus auj.</p><p className="text-2xl font-bold text-[var(--accent-primary)]">{stats.resolved}</p></div></GlassCard>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 glass-input text-sm">
          <option value="all">Tous</option><option value="new">Nouveau</option><option value="open">Ouvert</option><option value="in_progress">En cours</option><option value="waiting">En attente</option><option value="resolved">Résolu</option>
        </select>
        <button onClick={() => setShowNewTicket(true)} className="btn-primary h-9"><Plus size={16} /> Ticket</button>
      </div>

      {/* Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">N°</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Sujet</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Catégorie</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Priorité</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Assigné</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket, i) => (
                <motion.tr key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  onClick={() => setSelectedTicket(ticket)}
                  className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors cursor-pointer"
                  style={{ borderLeft: `3px solid ${ticket.priority === 'critical' ? '#EF4444' : ticket.priority === 'high' ? '#F59E0B' : '#4A5568'}` }}
                >
                  <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">#{ticket.id.split('-')[1]}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{ticket.subject}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{ticket.requesterName}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{ticket.category}</td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.priority} /></td>
                  <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{ticket.assignedToName || '-'}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedTicket(null)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass-card z-50 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-[var(--divider)] flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs font-mono text-[var(--text-muted)]">#{selectedTicket.id.split('-')[1]}</span>
                <h2 className="text-base font-semibold text-[var(--text-primary)]">{selectedTicket.subject}</h2>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedTicket.status} />
                <button onClick={() => setSelectedTicket(null)} className="p-2 rounded-lg hover:bg-white/5"><X size={16} className="text-[var(--text-muted)]" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                <div><span className="text-[var(--text-muted)]">Demandeur:</span> <span className="text-[var(--text-primary)]">{selectedTicket.requesterName}</span></div>
                <div><span className="text-[var(--text-muted)]">Catégorie:</span> <span className="text-[var(--text-primary)]">{selectedTicket.category}</span></div>
                <div><span className="text-[var(--text-muted)]">Priorité:</span> <StatusBadge status={selectedTicket.priority} /></div>
                <div><span className="text-[var(--text-muted)]">Assigné:</span> <span className="text-[var(--text-primary)]">{selectedTicket.assignedToName || 'Non assigné'}</span></div>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6">{selectedTicket.description}</p>

              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3">Fil de discussion</h4>
              <div className="space-y-3">
                {selectedTicket.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-xs font-medium shrink-0">
                      {comment.authorName.charAt(0)}
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
                {selectedTicket.comments.length === 0 && (
                  <p className="text-xs text-[var(--text-muted)] text-center py-4">Aucun commentaire</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-[var(--divider)] shrink-0">
              <div className="flex gap-2">
                <input className="flex-1 h-9 px-3 glass-input text-sm" placeholder="Votre réponse..." />
                <button className="btn-primary h-9 px-3"><Send size={14} /></button>
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* New Ticket Modal */}
      {showNewTicket && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowNewTicket(false)} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card z-50 max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouveau Ticket</h2>
                <button onClick={() => setShowNewTicket(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
              </div>
              <div className="space-y-3">
                <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Sujet</label><input className="w-full h-9 px-3 glass-input text-sm" placeholder="Sujet du ticket" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Catégorie</label><select className="w-full h-9 px-3 glass-input text-sm"><option>Bug</option><option>Demande</option><option>Incident</option><option>Question</option></select></div>
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Priorité</label><select className="w-full h-9 px-3 glass-input text-sm"><option>Critique</option><option>Haute</option><option>Moyenne</option><option>Basse</option></select></div>
                </div>
                <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Description</label><textarea className="w-full h-24 p-3 glass-input text-sm resize-none" placeholder="Décrivez le problème..." /></div>
                <button onClick={() => { showToast('Ticket créé', 'success'); setShowNewTicket(false); }} className="w-full btn-primary h-10 justify-center">Créer le Ticket</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
