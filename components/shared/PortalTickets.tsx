import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Send, Clock, CheckCircle, AlertCircle, X, Plus } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getAll, addAndNotify, updateAndNotify } from '@/lib/db';
import type { PortalTicket, PortalTicketResponse } from '@/types';

export function PortalTicketsView({ portalUser, portalType }: { portalUser: any; portalType: 'client' | 'vendor' | 'partner' }) {
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<PortalTicket | null>(null);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'medium' as const });
  const [response, setResponse] = useState('');

  const allTickets = (getAll('portalTickets') as PortalTicket[]) || [];
  const tickets = allTickets.filter(t => t.portalUserId === portalUser.id && t.portalType === portalType);

  const handleCreateTicket = () => {
    const ticket: PortalTicket = {
      id: `ticket-${Date.now()}`,
      portalUserId: portalUser.id,
      portalUserName: portalUser.name,
      portalType,
      subject: newTicket.subject,
      description: newTicket.description,
      status: 'open',
      priority: newTicket.priority,
      responses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    addAndNotify('portalTickets', ticket);
    setShowNewTicket(false);
    setNewTicket({ subject: '', description: '', priority: 'medium' });
  };

  const handleAddResponse = () => {
    if (!selectedTicket || !response.trim()) return;
    const resp: PortalTicketResponse = {
      id: `resp-${Date.now()}`,
      userId: portalUser.id,
      userName: portalUser.name,
      isStaff: false,
      content: response,
      createdAt: new Date().toISOString(),
    };
    updateAndNotify('portalTickets', selectedTicket.id, {
      responses: [...selectedTicket.responses, resp],
      updatedAt: new Date().toISOString(),
    });
    setResponse('');
    setSelectedTicket({ ...selectedTicket, responses: [...selectedTicket.responses, resp] });
  };

  const priorityIcons = {
    low: <Clock size={12} />,
    medium: <AlertCircle size={12} />,
    high: <AlertCircle size={12} className="text-[var(--accent-warning)]" />,
    urgent: <AlertCircle size={12} className="text-[var(--accent-danger)]" />,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Support Tickets</h2>
        <button onClick={() => setShowNewTicket(true)} className="btn-primary h-9 text-xs gap-1.5"><Plus size={14} /> Nouveau ticket</button>
      </div>

      {tickets.length === 0 && !showNewTicket && (
        <GlassCard className="p-8 text-center">
          <MessageSquare size={32} className="text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-sm text-[var(--text-muted)]">Aucun ticket. Créez votre premier ticket de support.</p>
        </GlassCard>
      )}

      {!selectedTicket && !showNewTicket && (
        <div className="space-y-2">
          {tickets.map((ticket, i) => (
            <motion.div key={ticket.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
              <div onClick={() => setSelectedTicket(ticket)} className="glass-card-compact p-4 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    {priorityIcons[ticket.priority]}
                    <span className="text-sm font-medium text-[var(--text-primary)]">{ticket.subject}</span>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-1">{ticket.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-[var(--text-muted)]">{new Date(ticket.createdAt).toLocaleDateString('fr-FR')}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">{ticket.responses.length} réponse{ticket.responses.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* New Ticket Form */}
      <AnimatePresence>
        {showNewTicket && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Nouveau Ticket</h3>
              <button onClick={() => setShowNewTicket(false)} className="p-1.5 rounded-lg hover:bg-white/5"><X size={14} className="text-[var(--text-muted)]" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Sujet</label>
                <input value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="Ex: Probleme de facturation" />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Priorité</label>
                <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })} className="w-full h-9 px-3 glass-input text-sm">
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1.5">Description</label>
                <textarea value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} className="w-full h-24 p-3 glass-input text-sm resize-none" placeholder="Décrivez votre problème en detail..." />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowNewTicket(false)} className="flex-1 btn-ghost h-9 justify-center text-xs">Annuler</button>
                <button onClick={handleCreateTicket} disabled={!newTicket.subject || !newTicket.description} className="flex-1 btn-primary h-9 justify-center text-xs disabled:opacity-50">Créer le ticket</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ticket Detail */}
      <AnimatePresence>
        {selectedTicket && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <div className="flex items-center gap-2">
              <button onClick={() => setSelectedTicket(null)} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)]"><X size={14} /></button>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{selectedTicket.subject}</h3>
              <StatusBadge status={selectedTicket.status} />
            </div>

            <div className="glass-card-compact p-3">
              <p className="text-xs text-[var(--text-secondary)]">{selectedTicket.description}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-2">Créé le {new Date(selectedTicket.createdAt).toLocaleDateString('fr-FR')}</p>
            </div>

            {/* Responses */}
            <div className="space-y-2">
              {selectedTicket.responses.map((resp) => (
                <div key={resp.id} className={`glass-card-compact p-3 ${resp.isStaff ? 'border-l-2 border-[var(--accent-primary)]' : ''}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[var(--text-primary)]">{resp.userName}</span>
                    {resp.isStaff && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">Equipe IDIBAGES</span>}
                    <span className="text-[10px] text-[var(--text-muted)]">{new Date(resp.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)]">{resp.content}</p>
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <div className="glass-card-compact p-3 flex gap-2">
              <input value={response} onChange={(e) => setResponse(e.target.value)} className="flex-1 h-9 px-3 glass-input text-sm" placeholder="Votre réponse..." />
              <button onClick={handleAddResponse} disabled={!response.trim()} className="btn-primary h-9 px-3 disabled:opacity-50"><Send size={14} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
