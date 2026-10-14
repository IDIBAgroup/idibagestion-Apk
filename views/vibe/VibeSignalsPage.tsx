import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, Eye, ExternalLink, Bot, CheckCircle, Circle,
  Linkedin, Twitter, Facebook, Newspaper, Briefcase, MessageSquare,
  Filter, Sparkles, TrendingUp, AlertTriangle, Target, Clock,
  Send, ThumbsUp, ThumbsDown, Copy,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { useVibeStore } from '@/stores/vibeStore';
import { getAll, updateAndNotify } from '@/lib/db';

const platformIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin size={12} />,
  twitter: <Twitter size={12} />,
  facebook: <Facebook size={12} />,
  reddit: <MessageSquare size={12} />,
  news: <Newspaper size={12} />,
  job_board: <Briefcase size={12} />,
  forum: <MessageSquare size={12} />,
  instagram: <MessageSquare size={12} />,
};

const signalTypeLabels: Record<string, string> = {
  hiring_intent: 'Recrutement IT',
  tech_upgrade: 'Upgrade Technologique',
  funding: 'Financement',
  expansion: 'Expansion',
  competitor_switch: 'Changement Fournisseur',
  budget_announcement: 'Annonce Budget',
  regulatory_change: 'Changement Reglementaire',
  pain_point: 'Point de Douleur',
};

const signalTypeColors: Record<string, string> = {
  hiring_intent: '#2DD4A8',
  tech_upgrade: '#3B82F6',
  funding: '#8B5CF6',
  expansion: '#F59E0B',
  competitor_switch: '#EF4444',
  budget_announcement: '#EC4899',
  regulatory_change: '#06B6D4',
  pain_point: 'var(--accent-primary)',
};

export function VibeSignalsPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { signalTypeFilter, setSignalTypeFilter } = useVibeStore();
  const [selectedSignal, setSelectedSignal] = useState<any>(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'actioned'>('all');

  useEffect(() => { setCurrentPageTitle('Signaux d\'Achat'); }, [setCurrentPageTitle]);

  const signals = getAll('signals');

  const filteredSignals = signals.filter(s => {
    if (signalTypeFilter !== 'all' && s.type !== signalTypeFilter) return false;
    if (filterRead === 'unread' && s.isRead) return false;
    if (filterRead === 'actioned' && !s.isActioned) return false;
    return true;
  });

  const unreadCount = signals.filter(s => !s.isRead).length;
  const actionedCount = signals.filter(s => s.isActioned).length;

  const markAsRead = (sigId: string) => {
    updateAndNotify('signals', sigId, { isRead: true }, 'id');
    showToast('Signale lu', 'success');
  };

  const markAsActioned = (sigId: string) => {
    updateAndNotify('signals', sigId, { isActioned: true }, 'id');
    showToast('Signale actionne', 'success');
  };

  const copyMessage = (msg: string) => {
    navigator.clipboard.writeText(msg);
    showToast('Message copie dans le presse-papiers', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Signaux d'Achat</h2>
          <p className="text-xs text-[var(--text-muted)]">{unreadCount} non lus · Detection automatisee par IA</p>
        </div>
        <div className="flex gap-2">
          <select value={signalTypeFilter} onChange={(e) => setSignalTypeFilter(e.target.value)} className="h-9 px-3 glass-input text-sm">
            <option value="all">Tous types</option>
            {Object.entries(signalTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
            {[{ k: 'all', l: 'Tous' }, { k: 'unread', l: 'Non lus' }, { k: 'actioned', l: 'Actionnes' }].map(f => (
              <button key={f.k} onClick={() => setFilterRead(f.k as any)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${filterRead === f.k ? 'bg-[var(--bg-card)] text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>{f.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <GlassCard delay={0}>
          <div className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center"><Zap size={20} className="text-[var(--accent-primary)]" /></div>
            <div><p className="text-lg font-bold text-[var(--text-primary)]">{signals.length}</p><p className="text-[10px] text-[var(--text-muted)]">Signaux totaux</p></div>
          </div>
        </GlassCard>
        <GlassCard delay={0.05}>
          <div className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-warning)]/10 flex items-center justify-center"><AlertTriangle size={20} className="text-[var(--accent-warning)]" /></div>
            <div><p className="text-lg font-bold text-[var(--text-primary)]">{unreadCount}</p><p className="text-[10px] text-[var(--text-muted)]">Non lus</p></div>
          </div>
        </GlassCard>
        <GlassCard delay={0.1}>
          <div className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-secondary)]/10 flex items-center justify-center"><CheckCircle size={20} className="text-[var(--accent-secondary)]" /></div>
            <div><p className="text-lg font-bold text-[var(--text-primary)]">{actionedCount}</p><p className="text-[10px] text-[var(--text-muted)]">Actionnes</p></div>
          </div>
        </GlassCard>
        <GlassCard delay={0.15}>
          <div className="p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[var(--accent-purple)]/10 flex items-center justify-center"><Target size={20} className="text-[var(--accent-purple)]" /></div>
            <div><p className="text-lg font-bold text-[var(--text-primary)]">{Math.round(signals.reduce((s, sig) => s + sig.confidence, 0) / (signals.length || 1))}%</p><p className="text-[10px] text-[var(--text-muted)]">Confiance moyenne</p></div>
          </div>
        </GlassCard>
      </div>

      {/* Signals List */}
      <div className="space-y-3">
        {filteredSignals.map((sig, i) => (
          <motion.div
            key={sig.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard hover={false}>
              <div className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {!sig.isRead && <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)] shrink-0" />}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: signalTypeColors[sig.type] }}>
                      {platformIcons[sig.platform]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[var(--text-primary)]">{signalTypeLabels[sig.type]}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: signalTypeColors[sig.type] + '20', color: signalTypeColors[sig.type] }}>
                          {sig.platform}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)]">{sig.company} {sig.leadName ? `· ${sig.leadName}` : ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-[var(--text-muted)]">Confiance</span>
                        <div className="w-16 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${sig.confidence}%`, backgroundColor: signalTypeColors[sig.type] }} />
                        </div>
                        <span className="text-[10px] font-medium text-[var(--text-primary)]">{sig.confidence}%</span>
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[10px] text-[var(--text-muted)]">Pertinence</span>
                        <span className="text-[10px] font-medium text-[var(--accent-primary)]">{sig.relevance}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] mb-3 leading-relaxed">{sig.description}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {sig.tags.map(tag => (
                    <span key={tag} className="text-[9px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-1.5 py-0.5 rounded">#{tag}</span>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {!sig.isRead && (
                    <button onClick={() => markAsRead(sig.id)} className="flex items-center gap-1 text-[10px] text-[var(--accent-primary)] hover:underline">
                      <Eye size={10} /> Marquer comme lu
                    </button>
                  )}
                  {!sig.isActioned && (
                    <button onClick={() => markAsActioned(sig.id)} className="flex items-center gap-1 text-[10px] text-[var(--accent-secondary)] hover:underline">
                      <CheckCircle size={10} /> Marquer actionne
                    </button>
                  )}
                  {sig.url && (
                    <a href={sig.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-primary)]">
                      <ExternalLink size={10} /> Source
                    </a>
                  )}
                  {sig.aiGeneratedMessage && (
                    <button onClick={() => { setSelectedSignal(sig); setShowAIModal(true); }} className="flex items-center gap-1 text-[10px] text-[var(--accent-purple)] hover:underline ml-auto">
                      <Sparkles size={10} /> Voir message IA
                    </button>
                  )}
                  {sig.suggestedApproach && (
                    <button onClick={() => { setSelectedSignal(sig); setShowAIModal(true); }} className="flex items-center gap-1 text-[10px] text-[var(--accent-warning)] hover:underline">
                      <Bot size={10} /> Approche suggeree
                    </button>
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
        {filteredSignals.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <Zap size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun signal ne correspond aux filtres selectionnes</p>
          </div>
        )}
      </div>

      {/* AI Message Modal */}
      <AnimatePresence>
        {showAIModal && selectedSignal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowAIModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card z-50 max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-purple)]/10 flex items-center justify-center"><Sparkles size={16} className="text-[var(--accent-purple)]" /></div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Message IA Genere</h3>
                  </div>
                  <button onClick={() => setShowAIModal(false)} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)]">✕</button>
                </div>

                <div className="space-y-4">
                  {selectedSignal.suggestedApproach && (
                    <div className="glass-card-compact p-3 bg-[var(--accent-warning)]/5">
                      <p className="text-[10px] text-[var(--text-muted)] uppercase mb-1">Approche suggeree</p>
                      <p className="text-xs text-[var(--text-primary)]">{selectedSignal.suggestedApproach}</p>
                    </div>
                  )}

                  {selectedSignal.aiGeneratedMessage && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-[var(--text-muted)] uppercase">Message genere</p>
                        <button onClick={() => copyMessage(selectedSignal.aiGeneratedMessage)} className="flex items-center gap-1 text-[10px] text-[var(--accent-primary)] hover:underline"><Copy size={10} /> Copier</button>
                      </div>
                      <div className="bg-[var(--bg-elevated)] rounded-lg p-3 border border-[var(--glass-border)]">
                        <p className="text-xs text-[var(--text-primary)] whitespace-pre-line leading-relaxed">{selectedSignal.aiGeneratedMessage}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button onClick={() => { copyMessage(selectedSignal.aiGeneratedMessage || selectedSignal.suggestedApproach); setShowAIModal(false); }} className="flex-1 btn-primary h-9 text-xs justify-center gap-1.5">
                      <Send size={12} /> Utiliser ce message
                    </button>
                    <button onClick={() => setShowAIModal(false)} className="flex-1 btn-ghost h-9 text-xs justify-center">
                      Fermer
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
