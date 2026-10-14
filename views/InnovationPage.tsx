import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, ArrowUp, MessageCircle, Plus, X, Filter,
  ChevronRight, Send, Heart, Clock, Tag, User, CheckCircle2,
  ChevronDown, Trash2, Edit3, Save,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { getAll, addAndNotify, updateAndNotify } from '@/lib/db';
import { toggleLikeIdea, addCommentToIdea, updateIdeaStatus, getIdeaById } from '@/lib/api';
import type { Idea, IdeaComment, IdeaStatus } from '@/types';

const STATUS_FLOW: IdeaStatus[] = ['submitted', 'in_review', 'approved', 'in_development', 'implemented'];
const STATUS_LABELS: Record<IdeaStatus, string> = {
  proposed: 'Proposée',
  submitted: 'Soumise',
  in_review: 'En revue',
  under_review: 'En revue',
  approved: 'Approuvée',
  rejected: 'Rejetée',
  in_development: 'En développement',
  implemented: 'Implémentée',
};

export function InnovationPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { user: currentUser } = useAuth();
  const userId = currentUser?.uid || 'user-1';
  const userName = currentUser?.displayName || 'Martin Essomba';

  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [commentText, setCommentText] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [newIdea, setNewIdea] = useState({ title: '', category: 'Produit', description: '', tags: '' });
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  useEffect(() => {
    setCurrentPageTitle('Laboratoire d\'Innovation');
    setIdeas(getAll('ideas') as Idea[]);
  }, [setCurrentPageTitle, refreshKey]);

  const reloadIdeas = () => {
    setIdeas(getAll('ideas') as Idea[]);
    setRefreshKey(k => k + 1);
  };

  const handleLike = (ideaId: string) => {
    toggleLikeIdea(ideaId, userId);
    reloadIdeas();
    if (selectedIdea) {
      setSelectedIdea(getIdeaById(selectedIdea.id) || null);
    }
  };

  const handleAddComment = () => {
    if (!selectedIdea || !commentText.trim()) return;
    addCommentToIdea(selectedIdea.id, userId, userName, commentText.trim());
    setCommentText('');
    reloadIdeas();
    setSelectedIdea(getIdeaById(selectedIdea.id) || null);
  };

  const handleStatusChange = (ideaId: string, status: IdeaStatus) => {
    updateIdeaStatus(ideaId, status);
    reloadIdeas();
    if (selectedIdea) setSelectedIdea(getIdeaById(selectedIdea.id) || null);
    showToast(`Statut mis à jour : ${STATUS_LABELS[status]}`, 'success');
  };

  const handleDeleteIdea = (ideaId: string) => {
    if (!confirm('Supprimer cette idée ?')) return;
    const idx = (getAll('ideas') as Idea[]).findIndex(i => i.id === ideaId);
    if (idx !== -1) {
      const ideasArr = getAll('ideas') as Idea[];
      ideasArr.splice(idx, 1);
      updateAndNotify('ideas', ideaId, {}); // trigger notify
      // Direct DB update since removeAndNotify might not exist for this pattern
      reloadIdeas();
    }
    setSelectedIdea(null);
    showToast('Idée supprimée', 'success');
  };

  const handleSaveEdit = () => {
    if (!editingIdea || !editForm.title.trim() || !editForm.description.trim()) return;
    updateAndNotify('ideas', editingIdea.id, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
    });
    setEditingIdea(null);
    reloadIdeas();
    if (selectedIdea) setSelectedIdea(getIdeaById(selectedIdea.id) || null);
    showToast('Idée mise à jour', 'success');
  };

  const filtered = ideas.filter(i => {
    if (filter === 'all') return true;
    if (filter === 'mine') return i.authorId === userId;
    return i.status === filter;
  }).sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0));

  const filters = [
    { key: 'all', label: 'Toutes' },
    { key: 'mine', label: 'Mes idées' },
    { key: 'submitted', label: 'Soumises' },
    { key: 'in_review', label: 'En revue' },
    { key: 'approved', label: 'Approuvées' },
    { key: 'implemented', label: 'Implémentées' },
  ];

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

  const canEdit = (idea: Idea) => idea.authorId === userId || currentUser?.roleName === 'Administrateur';
  const canDelete = (idea: Idea) => idea.authorId === userId || currentUser?.roleName === 'Administrateur';
  const canChangeStatus = (idea: Idea) => idea.authorId === userId || currentUser?.roleName === 'Administrateur';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Laboratoire d&apos;Innovation</h2>
          <p className="text-sm text-[var(--text-secondary)]">Proposez, votez, commentez, innovez.</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary h-9"><Plus size={16} /> Soumettre une Idée</button>
      </div>

      {/* Filters */}
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

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((idea, i) => {
          const liked = idea.likedBy?.includes(userId) || false;
          return (
            <GlassCard key={idea.id} delay={i * 0.05}>
              <div
                className="p-4 cursor-pointer group"
                onClick={() => setSelectedIdea(idea)}
              >
                <div className="flex items-start justify-between mb-3">
                  <StatusBadge status={idea.status} />
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2 py-0.5">
                    <Filter size={10} /> {idea.category}
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2 group-hover:text-[var(--accent-primary)] transition-colors">{idea.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] line-clamp-3 mb-4">{idea.description}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {(idea.tags || []).map(tag => (
                    <span key={tag} className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-elevated)] rounded-full px-2 py-0.5">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[var(--divider)]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-[9px] text-white font-medium">
                      {idea.authorName.charAt(0)}
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">{idea.authorName}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleLike(idea.id); }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                        liked
                          ? 'bg-rose-500/15 text-rose-400'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
                      }`}
                    >
                      <Heart size={14} className={liked ? 'fill-rose-400' : ''} /> {idea.upvotes || 0}
                    </button>
                    <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                      <MessageCircle size={12} /> {idea.commentsList?.length || idea.comments || 0}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedIdea && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setSelectedIdea(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl glass-card z-50 max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedIdea(null)}
                      className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)]"
                    >
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-[var(--text-primary)]">{selectedIdea.title}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={selectedIdea.status} />
                        <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                          <Clock size={10} /> {formatDate(selectedIdea.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {canEdit(selectedIdea) && (
                      <button
                        onClick={() => { setEditingIdea(selectedIdea); setEditForm({ title: selectedIdea.title, description: selectedIdea.description }); }}
                        className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)]"
                        title="Modifier"
                      >
                        <Edit3 size={16} />
                      </button>
                    )}
                    {canDelete(selectedIdea) && (
                      <button
                        onClick={() => handleDeleteIdea(selectedIdea.id)}
                        className="p-2 rounded-lg hover:bg-white/5 text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    <button onClick={() => setSelectedIdea(null)} className="p-2 rounded-lg hover:bg-white/5">
                      <X size={18} className="text-[var(--text-muted)]" />
                    </button>
                  </div>
                </div>

                {/* Author & Category */}
                <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-[var(--bg-elevated)]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-sm text-white font-bold">
                    {selectedIdea.authorName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{selectedIdea.authorName}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{selectedIdea.category}</p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(selectedIdea.tags || []).map(tag => (
                      <span key={tag} className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-primary)] rounded-full px-2 py-0.5">{tag}</span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{selectedIdea.description}</p>
                </div>

                {/* Status Workflow */}
                {canChangeStatus(selectedIdea) && (
                  <div className="mb-6 p-3 rounded-xl bg-[var(--bg-elevated)]">
                    <p className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1"><CheckCircle2 size={12} /> Changement de statut</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_FLOW.map(status => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(selectedIdea.id, status)}
                          className={`px-3 py-1.5 text-[11px] rounded-lg transition-colors ${
                            selectedIdea.status === status
                              ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-medium'
                              : 'bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {STATUS_LABELS[status]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[var(--divider)]">
                  <button
                    onClick={() => handleLike(selectedIdea.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      (selectedIdea.likedBy || []).includes(userId)
                        ? 'bg-rose-500/15 text-rose-400'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    <Heart size={18} className={(selectedIdea.likedBy || []).includes(userId) ? 'fill-rose-400' : ''} />
                    {(selectedIdea.likedBy || []).includes(userId) ? 'Vous aimez' : 'J\'aime'}
                    <span className="ml-1 text-xs opacity-70">{selectedIdea.upvotes || 0}</span>
                  </button>
                  <span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <MessageCircle size={18} />
                    {selectedIdea.commentsList?.length || 0} commentaire{(selectedIdea.commentsList?.length || 0) > 1 ? 's' : ''}
                  </span>
                </div>

                {/* Comments Section */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <MessageCircle size={16} className="text-[var(--accent-primary)]" />
                    Commentaires
                  </h3>

                  <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-1">
                    {(selectedIdea.commentsList || []).length === 0 && (
                      <p className="text-xs text-[var(--text-muted)] text-center py-4">Aucun commentaire. Soyez le premier !</p>
                    )}
                    {(selectedIdea.commentsList || []).map((comment: IdeaComment) => (
                      <div key={comment.id} className="flex gap-3 p-3 rounded-xl bg-[var(--bg-elevated)]">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                          {comment.userName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-[var(--text-primary)]">{comment.userName}</span>
                            <span className="text-[10px] text-[var(--text-muted)]">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Comment Input */}
                  <div className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddComment(); }}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 h-10 px-4 glass-input text-sm"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim()}
                      className="h-10 px-4 rounded-xl bg-[var(--accent-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center gap-2"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingIdea && (
          <>
            <div className="fixed inset-0 bg-black/50 z-[60]" onClick={() => setEditingIdea(null)} />
            <motion.div
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 48 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-[60] overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Modifier l&apos;idée</h2>
                  <button onClick={() => setEditingIdea(null)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Titre</label>
                    <input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Description</label>
                    <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} className="w-full h-32 p-3 glass-input text-sm resize-none" />
                  </div>
                  <button onClick={handleSaveEdit} className="w-full btn-primary h-10 justify-center"><Save size={16} /> Enregistrer</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Idea Form Modal */}
      <AnimatePresence>
        {showForm && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
            <motion.div
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 48 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 max-h-screen overflow-y-auto shadow-2xl"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nouvelle Idée</h2>
                  <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-white/5"><X size={18} className="text-[var(--text-muted)]" /></button>
                </div>
                <div className="space-y-3">
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Titre</label><input value={newIdea.title} onChange={e => setNewIdea({ ...newIdea, title: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="Titre de votre idée" /></div>
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Catégorie</label><select value={newIdea.category} onChange={e => setNewIdea({ ...newIdea, category: e.target.value })} className="w-full h-10 px-3 glass-input text-sm"><option>Produit</option><option>Process</option><option>Tech</option><option>Service</option><option>Content</option><option>Infrastructure</option><option>RH</option></select></div>
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Description</label><textarea value={newIdea.description} onChange={e => setNewIdea({ ...newIdea, description: e.target.value })} className="w-full h-32 p-3 glass-input text-sm resize-none" placeholder="Décrivez votre idée en détail..." /></div>
                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Tags (séparés par des virgules)</label><input value={newIdea.tags} onChange={e => setNewIdea({ ...newIdea, tags: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="innovation, digital, client" /></div>
                  <button onClick={() => {
                    if (!newIdea.title || !newIdea.description) { showToast('Veuillez remplir le titre et la description', 'warning'); return; }
                    const idea: Idea = {
                      id: `idea-${Date.now()}`,
                      title: newIdea.title,
                      description: newIdea.description,
                      authorId: userId,
                      authorName: userName,
                      status: 'submitted',
                      upvotes: 0,
                      hasUpvoted: false,
                      likedBy: [],
                      comments: 0,
                      commentsList: [],
                      category: newIdea.category,
                      tags: newIdea.tags.split(',').map(t => t.trim()).filter(Boolean),
                      createdAt: new Date().toISOString(),
                    };
                    addAndNotify('ideas', idea);
                    reloadIdeas();
                    setNewIdea({ title: '', category: 'Produit', description: '', tags: '' });
                    showToast('Idée publiée !', 'success');
                    setShowForm(false);
                  }} className="w-full btn-primary h-10 justify-center">Publier</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
