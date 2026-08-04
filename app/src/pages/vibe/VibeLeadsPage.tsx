import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Flame, Thermometer, Snowflake, Search, Filter, Eye, Trash2,
  Linkedin, Mail, Phone, MapPin, Building2, Tag, Star, ArrowUpRight,
  Plus, X, ChevronDown, Edit3, Target, TrendingUp, Award,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { useVibeStore } from '@/stores/vibeStore';
import { getAll, addAndNotify, updateAndNotify, removeAndNotify } from '@/lib/db';

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: 'Nouveau', color: '#3B82F6' },
  contacted: { label: 'Contacte', color: '#8B5CF6' },
  qualified: { label: 'Qualifie', color: '#2DD4A8' },
  proposal: { label: 'Proposition', color: '#F59E0B' },
  negotiation: { label: 'Negociation', color: '#EF4444' },
  won: { label: 'Gagne', color: '#10B981' },
  lost: { label: 'Perdu', color: '#6B7280' },
  nurturing: { label: 'Nurturing', color: '#EC4899' },
};

const temperatureIcons = {
  hot: <Flame size={12} className="text-[var(--accent-danger)]" />,
  warm: <Thermometer size={12} className="text-[var(--accent-warning)]" />,
  cold: <Snowflake size={12} className="text-[var(--accent-secondary)]" />,
};

export function VibeLeadsPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { leadStatusFilter, setLeadStatusFilter, searchQuery, setSearchQuery } = useVibeStore();
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [newLead, setNewLead] = useState({ fullName: '', company: '', position: '', email: '', phone: '', industry: '', country: 'Cameroun', city: '', source: 'social_media' as any, estimatedValue: '', notes: '' });
  const [tempFilter, setTempFilter] = useState<'all' | 'hot' | 'warm' | 'cold'>('all');

  useEffect(() => { setCurrentPageTitle('Qualification des Leads'); }, [setCurrentPageTitle]);

  const leads = getAll('leads');
  const users = getAll('users');

  const filteredLeads = leads.filter(l => {
    if (leadStatusFilter !== 'all' && l.status !== leadStatusFilter) return false;
    if (tempFilter !== 'all' && l.temperature !== tempFilter) return false;
    if (searchQuery && !l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) && !l.company.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreate = () => {
    if (!newLead.fullName || !newLead.email) return;
    const lead = {
      id: `lead-${Date.now()}`,
      fullName: newLead.fullName,
      company: newLead.company,
      position: newLead.position,
      email: newLead.email,
      phone: newLead.phone,
      industry: newLead.industry,
      country: newLead.country,
      city: newLead.city,
      source: newLead.source,
      status: 'new' as const,
      score: 0,
      temperature: 'cold' as const,
      signals: [],
      lastActivity: new Date().toISOString(),
      assignedTo: '',
      assignedToName: 'Non assigne',
      notes: newLead.notes,
      tags: [],
      estimatedValue: Number(newLead.estimatedValue) || 0,
      currency: 'XAF',
      createdAt: new Date().toISOString(),
      companyId: 'comp-1',
    };
    addAndNotify('leads', lead);
    setShowDrawer(false);
    setNewLead({ fullName: '', company: '', position: '', email: '', phone: '', industry: '', country: 'Cameroun', city: '', source: 'social_media', estimatedValue: '', notes: '' });
    showToast('Lead cree avec succes', 'success');
  };

  const updateStatus = (leadId: string, status: any) => {
    updateAndNotify('leads', leadId, { status }, 'id');
    showToast('Statut mis a jour', 'success');
  };

  const deleteLead = (leadId: string) => {
    if (confirm('Supprimer ce lead ?')) {
      removeAndNotify('leads', leadId, 'id');
      if (selectedLead?.id === leadId) setSelectedLead(null);
      showToast('Lead supprime', 'success');
    }
  };

  const scoreColor = (score: number) => score >= 80 ? 'text-[var(--accent-primary)]' : score >= 50 ? 'text-[var(--accent-warning)]' : 'text-[var(--accent-secondary)]';
  const scoreBg = (score: number) => score >= 80 ? 'bg-[var(--accent-primary)]/10' : score >= 50 ? 'bg-[var(--accent-warning)]/10' : 'bg-[var(--accent-secondary)]/10';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Qualification des Leads</h2>
          <p className="text-xs text-[var(--text-muted)]">{filteredLeads.length} leads · Scoring IA automatique</p>
        </div>
        <div className="flex gap-2">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="h-9 px-3 glass-input text-sm w-40" />
          <select value={leadStatusFilter} onChange={(e) => setLeadStatusFilter(e.target.value)} className="h-9 px-3 glass-input text-sm">
            <option value="all">Tous statuts</option>
            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
            {[{ k: 'all', i: <Users size={12} /> }, { k: 'hot', i: <Flame size={12} /> }, { k: 'warm', i: <Thermometer size={12} /> }, { k: 'cold', i: <Snowflake size={12} /> }].map(t => (
              <button key={t.k} onClick={() => setTempFilter(t.k as any)} className={`px-2 py-1.5 text-xs rounded-md ${tempFilter === t.k ? 'bg-[var(--bg-card)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{t.i}</button>
            ))}
          </div>
          <button onClick={() => setShowDrawer(true)} className="btn-primary h-9"><Plus size={16} /> Nouveau</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: leads.length, icon: <Users size={16} />, color: 'var(--accent-primary)' },
          { label: 'Chauds', value: leads.filter(l => l.temperature === 'hot').length, icon: <Flame size={16} />, color: 'var(--accent-danger)' },
          { label: 'Tiedes', value: leads.filter(l => l.temperature === 'warm').length, icon: <Thermometer size={16} />, color: 'var(--accent-warning)' },
          { label: 'Score moyen', value: Math.round(leads.reduce((s, l) => s + l.score, 0) / (leads.length || 1)), icon: <Star size={16} />, color: 'var(--accent-purple)' },
          { label: 'Pipeline', value: new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', notation: 'compact' }).format(leads.reduce((s, l) => s + l.estimatedValue, 0)), icon: <TrendingUp size={16} />, color: 'var(--accent-secondary)' },
        ].map((s, i) => (
          <GlassCard key={s.label} delay={i * 0.05}>
            <div className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.icon}</div>
              <div><p className="text-base font-bold text-[var(--text-primary)]">{s.value}</p><p className="text-[10px] text-[var(--text-muted)]">{s.label}</p></div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Leads Table */}
      <GlassCard delay={0.2}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--divider)] text-[10px] text-[var(--text-muted)] uppercase">
                <th className="text-left p-3">Lead</th>
                <th className="text-left p-3">Entreprise</th>
                <th className="text-left p-3">Score</th>
                <th className="text-left p-3">Temp.</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Source</th>
                <th className="text-right p-3">Valeur</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead: any) => (
                <tr key={lead.id} className="border-b border-[var(--divider)]/50 hover:bg-white/[0.02] transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-xs">
                        {lead.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--text-primary)]">{lead.fullName}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{lead.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1"><Building2 size={10} className="text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)]">{lead.company}</span></div>
                    <p className="text-[10px] text-[var(--text-muted)]">{lead.industry} · {lead.city}</p>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--accent-primary)]" style={{ width: `${lead.score}%` }} />
                      </div>
                      <span className={`text-[10px] font-bold ${scoreColor(lead.score)}`}>{lead.score}</span>
                    </div>
                  </td>
                  <td className="p-3">{temperatureIcons[lead.temperature as keyof typeof temperatureIcons]}</td>
                  <td className="p-3">
                    <select
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className="text-[10px] px-1.5 py-0.5 rounded border-0 cursor-pointer"
                      style={{ backgroundColor: statusLabels[lead.status]?.color + '20', color: statusLabels[lead.status]?.color }}
                    >
                      {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </td>
                  <td className="p-3"><span className="text-[10px] text-[var(--text-muted)]">{lead.source.replace('_', ' ')}</span></td>
                  <td className="p-3 text-right">
                    <span className="text-xs font-medium text-[var(--text-primary)]">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(lead.estimatedValue)}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelectedLead(lead)} className="p-1 rounded hover:bg-white/5 text-[var(--text-muted)]"><Eye size={12} /></button>
                      <button onClick={() => deleteLead(lead.id)} className="p-1 rounded hover:bg-white/5 text-[var(--accent-danger)]"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLead && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setSelectedLead(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card z-50 max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold">{selectedLead.fullName.charAt(0)}</div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">{selectedLead.fullName}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{selectedLead.position} · {selectedLead.company}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedLead(null)} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} className="text-[var(--text-muted)]" /></button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="glass-card-compact p-2"><p className="text-[10px] text-[var(--text-muted)]">Score</p><p className={`text-sm font-bold ${scoreColor(selectedLead.score)}`}>{selectedLead.score}/100</p></div>
                  <div className="glass-card-compact p-2"><p className="text-[10px] text-[var(--text-muted)]">Valeur estimee</p><p className="text-sm font-bold text-[var(--text-primary)]">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(selectedLead.estimatedValue)}</p></div>
                  <div className="glass-card-compact p-2"><p className="text-[10px] text-[var(--text-muted)]">Temperature</p><div className="flex items-center gap-1">{temperatureIcons[selectedLead.temperature as keyof typeof temperatureIcons]}<span className="text-sm font-bold text-[var(--text-primary)] capitalize">{selectedLead.temperature}</span></div></div>
                  <div className="glass-card-compact p-2"><p className="text-[10px] text-[var(--text-muted)]">Statut</p><p className="text-sm font-bold" style={{ color: statusLabels[selectedLead.status]?.color }}>{statusLabels[selectedLead.status]?.label}</p></div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs"><Mail size={12} className="text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)]">{selectedLead.email}</span></div>
                  {selectedLead.phone && <div className="flex items-center gap-2 text-xs"><Phone size={12} className="text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)]">{selectedLead.phone}</span></div>}
                  <div className="flex items-center gap-2 text-xs"><MapPin size={12} className="text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)]">{selectedLead.city}, {selectedLead.country}</span></div>
                  <div className="flex items-center gap-2 text-xs"><Tag size={12} className="text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)]">{selectedLead.industry}</span></div>
                </div>

                {selectedLead.signals.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase mb-2">Signaux detectes</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedLead.signals.map((sig: string) => <span key={sig} className="text-[9px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-1.5 py-0.5 rounded">{sig}</span>)}
                    </div>
                  </div>
                )}

                {selectedLead.notes && (
                  <div className="mb-4">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Notes</p>
                    <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-2 rounded">{selectedLead.notes}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setSelectedLead(null)} className="flex-1 btn-ghost h-9 text-xs">Fermer</button>
                  <button onClick={() => { setSelectedLead(null); showToast('Redirection vers Messages IA...', 'info'); }} className="flex-1 btn-primary h-9 text-xs">Contacter via IA</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Lead Drawer */}
      <AnimatePresence>
        {showDrawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowDrawer(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-card)] border-l border-[var(--glass-border)] z-50 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouveau Lead</h2>
                  <button onClick={() => setShowDrawer(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-4">
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Nom complet</label><input value={newLead.fullName} onChange={e => setNewLead({ ...newLead, fullName: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="Jean Dupont" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Entreprise</label><input value={newLead.company} onChange={e => setNewLead({ ...newLead, company: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="Societe S.A." /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Poste</label><input value={newLead.position} onChange={e => setNewLead({ ...newLead, position: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="Directeur IT" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Email</label><input type="email" value={newLead.email} onChange={e => setNewLead({ ...newLead, email: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="email@entreprise.cm" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Telephone</label><input value={newLead.phone} onChange={e => setNewLead({ ...newLead, phone: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="+237 6XX XXX XXX" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Industrie</label><input value={newLead.industry} onChange={e => setNewLead({ ...newLead, industry: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="Telecoms" /></div>
                    <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Ville</label><input value={newLead.city} onChange={e => setNewLead({ ...newLead, city: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="Douala" /></div>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Source</label>
                    <select value={newLead.source} onChange={e => setNewLead({ ...newLead, source: e.target.value as any })} className="w-full h-10 px-3 glass-input text-sm">
                      <option value="social_media">Social Media</option>
                      <option value="signal_detection">Signal Detection</option>
                      <option value="referral">Referral</option>
                      <option value="event">Evenement</option>
                      <option value="website">Site web</option>
                      <option value="scraping">Scraping</option>
                    </select>
                  </div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Valeur estimee (FCFA)</label><input type="number" value={newLead.estimatedValue} onChange={e => setNewLead({ ...newLead, estimatedValue: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="5000000" /></div>
                  <div><label className="block text-sm text-[var(--text-secondary)] mb-1.5">Notes</label><textarea value={newLead.notes} onChange={e => setNewLead({ ...newLead, notes: e.target.value })} className="w-full h-20 px-3 py-2 glass-input text-sm resize-none" placeholder="Notes additionnelles..." /></div>
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => setShowDrawer(false)} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                    <button onClick={handleCreate} disabled={!newLead.fullName || !newLead.email} className="flex-1 btn-primary h-10 justify-center disabled:opacity-50">Creer</button>
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
