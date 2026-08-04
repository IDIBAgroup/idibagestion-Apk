import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, ArrowUp, MessageCircle, Plus, X, Filter } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';
import type { Idea } from '@/types';

export function InnovationPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    setCurrentPageTitle('Laboratoire d\'Innovation');
    setIdeas(getAll('ideas') as Idea[]);
  }, [setCurrentPageTitle]);

  const handleUpvote = (ideaId: string) => {
    setIdeas(prev => prev.map(idea =>
      idea.id === ideaId
        ? { ...idea, upvotes: idea.hasUpvoted ? idea.upvotes - 1 : idea.upvotes + 1, hasUpvoted: !idea.hasUpvoted }
        : idea
    ));
  };

  const filtered = ideas.filter(i => {
    if (filter === 'all') return true;
    if (filter === 'mine') return i.authorName === 'Martin Essomba';
    return i.status === filter;
  }).sort((a, b) => b.upvotes - a.upvotes);

  const filters = [
    { key: 'all', label: 'Toutes' },
    { key: 'proposed', label: 'Proposées' },
    { key: 'under_review', label: 'En étude' },
    { key: 'in_development', label: 'En dev' },
    { key: 'implemented', label: 'Implémentées' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Laboratoire d&apos;Innovation</h2>
          <p className="text-sm text-[var(--text-secondary)]">Proposez, votez, innovez.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary h-9"><Plus size={16} /> Soumettre une Idée</button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              filter === f.key ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)] font-medium' : 'text-[var(--text-muted)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((idea, i) => (
          <GlassCard key={idea.id} delay={i * 0.05}>
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <StatusBadge status={idea.status} />
                <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2 py-0.5">
                  <Filter size={10} /> {idea.category}
                </div>
              </div>

              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{idea.title}</h3>
              <p className="text-xs text-[var(--text-secondary)] line-clamp-3 mb-4">{idea.description}</p>

              <div className="flex flex-wrap gap-1 mb-4">
                {idea.tags.map(tag => (
                  <span key={tag} className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2 py-0.5">{tag}</span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[var(--divider)]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-[9px] text-white font-medium">
                    {idea.authorName.charAt(0)}
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">{idea.authorName}</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleUpvote(idea.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                      idea.hasUpvoted
                        ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                    }`}
                  >
                    <ArrowUp size={14} /> {idea.upvotes}
                  </button>
                  <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                    <MessageCircle size={12} /> {idea.comments}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* New Idea Form Modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card z-50 max-h-[85vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvelle Idée</h2>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
              </div>
              <div className="space-y-3">
                <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Titre</label><input className="w-full h-9 px-3 glass-input text-sm" placeholder="Titre de votre idée" /></div>
                <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Catégorie</label><select className="w-full h-9 px-3 glass-input text-sm"><option>Produit</option><option>Process</option><option>Tech</option><option>Service</option></select></div>
                <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Description</label><textarea className="w-full h-24 p-3 glass-input text-sm resize-none" placeholder="Décrivez votre idée en détail..." /></div>
                <button onClick={() => { showToast('Idée publiée !', 'success'); setShowForm(false); }} className="w-full btn-primary h-10 justify-center">Publier</button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
