import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Calendar, ChevronRight, Tag, ArrowRight,
  Heart, MessageCircle, Share2, Send, Image as ImageIcon,
  ThumbsUp, X, User,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { cn } from '@/lib/utils';
import {
  getPortalNews, toggleLikeNews, addCommentToNews, shareNews,
} from '@/lib/api';
import { useUIStore } from '@/stores/uiStore';
import type { PortalNews, PortalNewsComment } from '@/types';

interface Props {
  portalType: 'client' | 'vendor' | 'partner';
  userId: string;
  userName: string;
}

export function PortalNewsFeed({ portalType, userId, userName }: Props) {
  const [selectedNews, setSelectedNews] = useState<PortalNews | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [newsState, setNewsState] = useState(0); // force refresh
  const { showToast } = useUIStore();

  const news = getPortalNews(portalType);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  const handleLike = (e: React.MouseEvent, newsId: string) => {
    e.stopPropagation();
    toggleLikeNews(newsId, userId);
    setNewsState(s => s + 1);
  };

  const handleComment = (e: React.MouseEvent, newsId: string) => {
    e.stopPropagation();
    setSelectedNews(news.find(n => n.id === newsId) || null);
    setShowComments(true);
  };

  const handleSubmitComment = () => {
    if (!selectedNews || !commentText.trim()) return;
    addCommentToNews(selectedNews.id, userId, userName, commentText.trim());
    setCommentText('');
    setNewsState(s => s + 1);
    setSelectedNews(getPortalNews(portalType).find(n => n.id === selectedNews.id) || null);
  };

  const handleShare = (e: React.MouseEvent, newsId: string) => {
    e.stopPropagation();
    const shares = shareNews(newsId);
    setNewsState(s => s + 1);
    showToast(`Partagé ! (${shares} partages)`, 'success');
  };

  // ---- DETAIL VIEW ----
  if (selectedNews) {
    const liked = selectedNews.likedBy?.includes(userId) || false;
    const comments = selectedNews.comments || [];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => { setSelectedNews(null); setShowComments(false); }} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)]">
            <ArrowRight size={16} className="rotate-180" />
          </button>
          <h2 className="text-xl font-bold text-[var(--text-primary)] line-clamp-1">{selectedNews.title}</h2>
        </div>

        <GlassCard><div className="p-0 overflow-hidden">
          {/* Image */}
          {selectedNews.imageUrl ? (
            <div className="w-full h-48 sm:h-64 bg-[var(--bg-elevated)] relative">
              <img src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          ) : (
            <div className="w-full h-32 bg-[var(--bg-elevated)] flex items-center justify-center">
              <ImageIcon size={40} className="text-[var(--text-muted)] opacity-30" />
            </div>
          )}

          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--divider)] text-[var(--text-muted)] flex items-center gap-1">
                <Tag size={10} /> {selectedNews.category}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                <Calendar size={10} /> {formatDate(selectedNews.publishedAt || selectedNews.createdAt)}
              </span>
              <span className="text-[11px] text-[var(--text-muted)]">Par {selectedNews.authorName}</span>
              {selectedNews.priority === 'high' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 font-medium">Important</span>
              )}
            </div>

            <div className="prose prose-invert prose-sm max-w-none mb-5">
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{selectedNews.content}</p>
            </div>

            {/* Social actions */}
            <div className="flex items-center gap-4 pt-4 border-t border-[var(--divider)]">
              <button
                onClick={(e) => handleLike(e, selectedNews.id)}
                className={cn(
                  "flex items-center gap-1.5 text-sm transition-colors",
                  liked ? "text-pink-400" : "text-[var(--text-muted)] hover:text-pink-400"
                )}
              >
                <Heart size={16} fill={liked ? "currentColor" : "none"} />
                <span>{selectedNews.likes || 0}</span>
              </button>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-blue-400 transition-colors"
              >
                <MessageCircle size={16} />
                <span>{comments.length}</span>
              </button>
              <button
                onClick={(e) => handleShare(e, selectedNews.id)}
                className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-emerald-400 transition-colors"
              >
                <Share2 size={16} />
                <span>{selectedNews.shares || 0}</span>
              </button>
            </div>

            {/* Comments section */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-[var(--divider)] overflow-hidden"
                >
                  <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-3">Commentaires ({comments.length})</h4>
                  <div className="space-y-3 mb-3 max-h-64 overflow-y-auto pr-1">
                    {comments.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] italic">Aucun commentaire. Soyez le premier !</p>
                    ) : (
                      comments.map((c) => (
                        <div key={c.id} className="flex gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                            <User size={12} className="text-[var(--text-muted)]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[var(--text-primary)]">{c.userName}</span>
                              <span className="text-[10px] text-[var(--text-muted)]">{formatTime(c.createdAt)}</span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{c.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                      placeholder="Ajouter un commentaire..."
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    <button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim()}
                      className="px-3 py-2 rounded-lg bg-[var(--accent-primary)] text-white disabled:opacity-40"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div></GlassCard>
      </div>
    );
  }

  // ---- LIST VIEW ----
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
        <Newspaper size={20} className="text-[var(--accent-primary)]" /> Actualités
      </h2>
      {news.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-muted)]">
          <Newspaper size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucune actualité pour le moment</p>
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((item, idx) => {
            const liked = item.likedBy?.includes(userId) || false;
            const comments = item.comments || [];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <GlassCard hover><div className="p-0 overflow-hidden">
                  {/* Image */}
                  {item.imageUrl ? (
                    <div className="w-full h-36 sm:h-48 bg-[var(--bg-elevated)] relative cursor-pointer" onClick={() => setSelectedNews(item)}>
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    </div>
                  ) : null}

                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">{item.category}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{formatDate(item.publishedAt || item.createdAt)}</span>
                      {item.priority === 'high' && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Important</span>
                      )}
                    </div>

                    <button onClick={() => setSelectedNews(item)} className="w-full text-left">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1 hover:text-[var(--accent-primary)] transition-colors">{item.title}</h3>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-2">{item.excerpt}</p>
                    </button>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--divider)]">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleLike(e, item.id)}
                          className={cn(
                            "flex items-center gap-1 text-xs transition-colors",
                            liked ? "text-pink-400" : "text-[var(--text-muted)] hover:text-pink-400"
                          )}
                        >
                          <Heart size={14} fill={liked ? "currentColor" : "none"} />
                          <span>{item.likes || 0}</span>
                        </button>
                        <button
                          onClick={(e) => handleComment(e, item.id)}
                          className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                        >
                          <MessageCircle size={14} />
                          <span>{comments.length}</span>
                        </button>
                        <button
                          onClick={(e) => handleShare(e, item.id)}
                          className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-emerald-400 transition-colors"
                        >
                          <Share2 size={14} />
                          <span>{item.shares || 0}</span>
                        </button>
                      </div>
                      <button onClick={() => setSelectedNews(item)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div></GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
