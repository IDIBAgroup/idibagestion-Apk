import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Newspaper, Plus, Pencil, Trash2, Eye, Search, Filter,
  Save, X, CheckCircle, AlertTriangle, Globe, Building2,
  Truck, Handshake, UserPlus, Lock, Mail, Phone, MapPin,
  ChevronDown, ChevronUp, Tag, Calendar, Users,
  Heart, MessageCircle, Share2, Image as ImageIcon, User,
  Activity, Shield,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/uiStore';
import {
  getAllPortalNews, createPortalNews, updatePortalNews, deletePortalNews,
  getPortalNewsById,
} from '@/lib/api';
import { getAll } from '@/lib/db';
import { createPortalAccount, updatePortalAccount } from '@/lib/api';
import type { PortalNews, PortalUser, PortalNewsComment } from '@/types';

// ============================================
// ADMIN PORTALS PAGE - Gestion actualités & comptes
// ============================================

type AdminSubTab = 'news' | 'accounts' | 'audit';

export function AdminPortalsPage() {
  const [subTab, setSubTab] = useState<AdminSubTab>('news');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Administration Portails</h1>
        <div className="flex p-1 rounded-xl bg-[var(--bg-elevated)] border border-[var(--divider)]">
          {([
            { key: 'news', label: 'Actualités', icon: <Newspaper size={14} /> },
            { key: 'accounts', label: 'Comptes', icon: <Users size={14} /> },
            { key: 'audit', label: 'Audit Log', icon: <Activity size={14} /> },
          ] as { key: AdminSubTab; label: string; icon: React.ReactNode }[]).map(t => (
            <button
              key={t.key}
              onClick={() => setSubTab(t.key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors",
                subTab === t.key
                  ? "bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {subTab === 'news' && <NewsManager />}
          {subTab === 'accounts' && <AccountsManager />}
          {subTab === 'audit' && <AuditLogManager />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ============================================
// NEWS MANAGER
// ============================================

function NewsManager() {
  const { showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [filterTarget, setFilterTarget] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingNews, setViewingNews] = useState<PortalNews | null>(null);
  const [form, setForm] = useState<Partial<PortalNews>>({
    title: '', content: '', excerpt: '', category: 'Entreprise',
    targetType: 'all', isPublished: true, priority: 'normal', imageUrl: '',
  });

  const allNews = useMemo(() => getAllPortalNews(), [showForm, editingId]);

  const filteredNews = useMemo(() => {
    return allNews.filter(n => {
      const matchesSearch = !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase());
      const matchesTarget = filterTarget === 'all' || n.targetType === filterTarget;
      return matchesSearch && matchesTarget;
    });
  }, [allNews, search, filterTarget]);

  const handleSave = () => {
    if (!form.title?.trim() || !form.content?.trim()) {
      showToast('Le titre et le contenu sont obligatoires', 'error');
      return;
    }
    const excerpt = form.excerpt?.trim() || form.content!.slice(0, 120) + '...';
    if (editingId) {
      updatePortalNews(editingId, { ...form, excerpt });
      showToast('Actualité mise à jour', 'success');
    } else {
      createPortalNews({
        title: form.title!,
        content: form.content!,
        excerpt,
        category: form.category || 'Entreprise',
        targetType: (form.targetType as any) || 'all',
        isPublished: form.isPublished ?? true,
        imageUrl: form.imageUrl || '',
        authorId: 'user-1',
        authorName: 'Martin Essomba',
        priority: (form.priority as any) || 'normal',
        companyId: 'comp-1',
        likes: 0,
        likedBy: [],
        shares: 0,
        comments: [],
      });
      showToast('Actualité publiée avec succès', 'success');
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ title: '', content: '', excerpt: '', category: 'Entreprise', targetType: 'all', isPublished: true, priority: 'normal', imageUrl: '' });
  };

  const handleEdit = (id: string) => {
    const news = getPortalNewsById(id);
    if (news) {
      setForm({
        title: news.title,
        content: news.content,
        excerpt: news.excerpt,
        category: news.category,
        targetType: news.targetType,
        isPublished: news.isPublished,
        priority: news.priority,
        imageUrl: news.imageUrl || '',
      });
      setEditingId(id);
      setShowForm(true);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette actualité ?')) {
      deletePortalNews(id);
      showToast('Actualité supprimée', 'success');
    }
  };

  if (viewingNews) {
    const comments = viewingNews.comments || [];
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setViewingNews(null)} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)]">
            <X size={16} />
          </button>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{viewingNews.title}</h2>
        </div>
        <GlassCard><div className="p-0 overflow-hidden">
          {viewingNews.imageUrl ? (
            <div className="w-full h-48 bg-[var(--bg-elevated)] relative">
              <img src={viewingNews.imageUrl} alt={viewingNews.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          ) : (
            <div className="w-full h-32 bg-[var(--bg-elevated)] flex items-center justify-center">
              <ImageIcon size={40} className="text-[var(--text-muted)] opacity-30" />
            </div>
          )}
          <div className="p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)]">{viewingNews.category}</span>
              <span className="text-[11px] text-[var(--text-muted)]">{new Date(viewingNews.publishedAt || viewingNews.createdAt).toLocaleDateString('fr-FR')}</span>
              <span className="text-[11px] text-[var(--text-muted)]">Par {viewingNews.authorName}</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap mb-4">{viewingNews.content}</p>
            <div className="flex items-center gap-4 pt-3 border-t border-[var(--divider)]">
              <span className="flex items-center gap-1 text-xs text-pink-400"><Heart size={14} /> {viewingNews.likes || 0}</span>
              <span className="flex items-center gap-1 text-xs text-blue-400"><MessageCircle size={14} /> {comments.length}</span>
              <span className="flex items-center gap-1 text-xs text-emerald-400"><Share2 size={14} /> {viewingNews.shares || 0}</span>
            </div>
          </div>
        </div></GlassCard>

        {/* Comments */}
        <GlassCard><div className="p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <MessageCircle size={16} className="text-blue-400" /> Commentaires ({comments.length})
          </h3>
          {comments.length === 0 ? (
            <p className="text-xs text-[var(--text-muted)] italic">Aucun commentaire pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {comments.map(c => (
                <div key={c.id} className="flex gap-2.5 p-3 rounded-lg bg-[var(--bg-elevated)]">
                  <div className="w-7 h-7 rounded-full bg-[var(--bg-primary)] flex items-center justify-center shrink-0">
                    <User size={12} className="text-[var(--text-muted)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--text-primary)]">{c.userName}</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{new Date(c.createdAt).toLocaleDateString('fr-FR')} {new Date(c.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div></GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher une actualité..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
        <select
          value={filterTarget}
          onChange={e => setFilterTarget(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none"
        >
          <option value="all">Toutes les cibles</option>
          <option value="client">Client</option>
          <option value="vendor">Fournisseur</option>
          <option value="partner">Partenaire</option>
        </select>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ title: '', content: '', excerpt: '', category: 'Entreprise', targetType: 'all', isPublished: true, priority: 'normal', imageUrl: '' }); }}
          className="px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Nouvelle actualité
        </motion.button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard><div className="p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                {editingId ? 'Modifier l\'actualité' : 'Nouvelle actualité'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="sm:col-span-2">
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Titre *</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Catégorie</label>
                  <input
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Cible</label>
                  <select
                    value={form.targetType}
                    onChange={e => setForm(p => ({ ...p, targetType: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="all">Tous les portails</option>
                    <option value="client">Portail Client</option>
                    <option value="vendor">Portail Fournisseur</option>
                    <option value="partner">Portail Partenaire</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">URL de l'image (optionnel)</label>
                  <div className="flex gap-2">
                    <input
                      value={form.imageUrl}
                      onChange={e => setForm(p => ({ ...p, imageUrl: e.target.value }))}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                    {form.imageUrl && (
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-primary)] border border-[var(--divider)] overflow-hidden shrink-0">
                        <img src={form.imageUrl} alt="preview" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Extrait</label>
                  <input
                    value={form.excerpt}
                    onChange={e => setForm(p => ({ ...p, excerpt: e.target.value }))}
                    placeholder="Résumé court (auto-généré si vide)"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Contenu *</label>
                  <textarea
                    value={form.content}
                    onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isPublished}
                      onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))}
                      className="rounded border-[var(--divider)]"
                    />
                    Publié
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.priority === 'high'}
                      onChange={e => setForm(p => ({ ...p, priority: e.target.checked ? 'high' : 'normal' }))}
                      className="rounded border-[var(--divider)]"
                    />
                    Important
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] border border-[var(--divider)] hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium flex items-center gap-2 hover:opacity-90"
                >
                  <Save size={14} /> {editingId ? 'Mettre à jour' : 'Publier'}
                </motion.button>
              </div>
            </div></GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* News List */}
      <div className="space-y-3">
        {filteredNews.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)]">
            <Newspaper size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucune actualité trouvée</p>
          </div>
        ) : (
          filteredNews.map(item => (
            <GlassCard key={item.id}><div className="p-0 overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Image thumbnail */}
                {item.imageUrl ? (
                  <div className="w-full sm:w-32 h-24 sm:h-auto shrink-0 bg-[var(--bg-elevated)] relative">
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                ) : (
                  <div className="w-full sm:w-24 h-24 sm:h-auto shrink-0 bg-[var(--bg-elevated)] flex items-center justify-center">
                    <ImageIcon size={24} className="text-[var(--text-muted)] opacity-30" />
                  </div>
                )}
                <div className="p-4 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">{item.category}</span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded",
                      item.targetType === 'all' ? 'bg-blue-500/15 text-blue-400' :
                      item.targetType === 'client' ? 'bg-blue-500/15 text-blue-400' :
                      item.targetType === 'vendor' ? 'bg-emerald-500/15 text-emerald-400' :
                      'bg-purple-500/15 text-purple-400'
                    )}>
                      {item.targetType === 'all' ? 'Tous' : item.targetType === 'client' ? 'Client' : item.targetType === 'vendor' ? 'Fournisseur' : 'Partenaire'}
                    </span>
                    {item.priority === 'high' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 text-red-400">Important</span>
                    )}
                    {!item.isPublished && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400">Brouillon</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{item.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-1">{item.excerpt}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-[var(--text-muted)]">
                    <span>Par {item.authorName}</span>
                    <span>{new Date(item.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span className="flex items-center gap-1 text-pink-400"><Heart size={10} /> {item.likes || 0}</span>
                    <span className="flex items-center gap-1 text-blue-400"><MessageCircle size={10} /> {(item.comments || []).length}</span>
                    <span className="flex items-center gap-1 text-emerald-400"><Share2 size={10} /> {item.shares || 0}</span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:justify-center gap-1 p-3 border-t sm:border-t-0 sm:border-l border-[var(--divider)]">
                  <button
                    onClick={() => setViewingNews(item)}
                    className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                    title="Voir"
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    onClick={() => handleEdit(item.id)}
                    className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                    title="Modifier"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div></GlassCard>
          ))
        )}
      </div>
    </div>
  );
}

// ============================================
// ACCOUNTS MANAGER
// ============================================

function AccountsManager() {
  const { showToast } = useUIStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '', password: '', displayName: '', portalType: 'client' as 'client' | 'vendor' | 'partner',
    companyName: '', phone: '', address: '', city: '', country: '', ifu: '', rccm: '',
  });

  const allUsers = useMemo(() => (getAll('portalUsers') as PortalUser[]).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [showForm, editingId]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter(u => {
      const matchesSearch = !search || u.displayName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || u.companyName.toLowerCase().includes(search.toLowerCase());
      const matchesType = filterType === 'all' || u.portalType === filterType;
      return matchesSearch && matchesType;
    });
  }, [allUsers, search, filterType]);

  const handleSave = () => {
    if (!form.email.trim() || !form.displayName.trim() || !form.companyName.trim()) {
      showToast('Email, nom et entreprise sont obligatoires', 'error');
      return;
    }
    if (!editingId && !form.password.trim()) {
      showToast('Le mot de passe est obligatoire pour la création', 'error');
      return;
    }
    if (editingId) {
      updatePortalAccount(editingId, form);
      showToast('Compte mis à jour', 'success');
    } else {
      createPortalAccount(form);
      showToast('Compte créé avec succès', 'success');
    }
    setShowForm(false);
    setEditingId(null);
    setForm({ email: '', password: '', displayName: '', portalType: 'client', companyName: '', phone: '', address: '', city: '', country: '', ifu: '', rccm: '' });
  };

  const handleEdit = (user: PortalUser) => {
    setForm({
      email: user.email,
      password: '',
      displayName: user.displayName,
      portalType: user.portalType as any,
      companyName: user.companyName,
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      country: user.country || '',
      ifu: user.ifu || '',
      rccm: user.rccm || '',
    });
    setEditingId(user.id);
    setShowForm(true);
  };

  const getPortalIcon = (type: string) => {
    if (type === 'client') return <Building2 size={14} className="text-blue-400" />;
    if (type === 'vendor') return <Truck size={14} className="text-emerald-400" />;
    return <Handshake size={14} className="text-purple-400" />;
  };

  const getPortalLabel = (type: string) => {
    if (type === 'client') return 'Client';
    if (type === 'vendor') return 'Fournisseur';
    return 'Partenaire';
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un compte..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none"
        >
          <option value="all">Tous les types</option>
          <option value="client">Client</option>
          <option value="vendor">Fournisseur</option>
          <option value="partner">Partenaire</option>
        </select>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ email: '', password: '', displayName: '', portalType: 'client', companyName: '', phone: '', address: '', city: '', country: '', ifu: '', rccm: '' }); }}
          className="px-4 py-2.5 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <UserPlus size={16} /> Nouveau compte
        </motion.button>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard><div className="p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                {editingId ? 'Modifier le compte' : 'Nouveau compte portail'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Type de portail *</label>
                  <select
                    value={form.portalType}
                    onChange={e => setForm(p => ({ ...p, portalType: e.target.value as any }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none"
                  >
                    <option value="client">Client</option>
                    <option value="vendor">Fournisseur</option>
                    <option value="partner">Partenaire</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Nom complet *</label>
                  <input
                    value={form.displayName}
                    onChange={e => setForm(p => ({ ...p, displayName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">{editingId ? 'Nouveau mot de passe (optionnel)' : 'Mot de passe *'}</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Entreprise *</label>
                  <input
                    value={form.companyName}
                    onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Téléphone</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Adresse</label>
                  <input
                    value={form.address}
                    onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Ville</label>
                  <input
                    value={form.city}
                    onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Pays</label>
                  <input
                    value={form.country}
                    onChange={e => setForm(p => ({ ...p, country: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">IFU</label>
                    <input
                      value={form.ifu}
                      onChange={e => setForm(p => ({ ...p, ifu: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[var(--text-muted)] mb-1 block">RCCM</label>
                    <input
                      value={form.rccm}
                      onChange={e => setForm(p => ({ ...p, rccm: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)]"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-elevated)] text-sm text-[var(--text-primary)] border border-[var(--divider)] hover:bg-white/5 transition-colors"
                >
                  Annuler
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  className="px-4 py-2 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium flex items-center gap-2 hover:opacity-90"
                >
                  <Save size={14} /> {editingId ? 'Mettre à jour' : 'Créer le compte'}
                </motion.button>
              </div>
            </div></GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accounts List */}
      <div className="space-y-3">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)]">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun compte trouvé</p>
          </div>
        ) : (
          filteredUsers.map(user => (
            <GlassCard key={user.id}><div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center shrink-0">
                    {getPortalIcon(user.portalType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">{user.displayName}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        user.portalType === 'client' ? 'bg-blue-500/15 text-blue-400' :
                        user.portalType === 'vendor' ? 'bg-emerald-500/15 text-emerald-400' :
                        'bg-purple-500/15 text-purple-400'
                      )}>
                        {getPortalLabel(user.portalType)}
                      </span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        user.status === 'active' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                      )}>
                        {user.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">{user.companyName}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-[var(--text-muted)]">
                      <span className="flex items-center gap-1"><Mail size={10} /> {user.email}</span>
                      {user.phone && <span className="flex items-center gap-1"><Phone size={10} /> {user.phone}</span>}
                      {user.city && <span className="flex items-center gap-1"><MapPin size={10} /> {user.city}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)] hover:text-blue-400 transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            </div></GlassCard>
          ))
        )}
      </div>
    </div>
  );
}


// ============================================
// AUDIT LOG MANAGER
// ============================================

function AuditLogManager() {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const auditLogs = (getAll('auditLogs') as any[]) || [];

  const filtered = auditLogs.filter((log: any) => {
    const m = !search || log.userName.toLowerCase().includes(search.toLowerCase()) || log.action.toLowerCase().includes(search.toLowerCase()) || log.entityType.toLowerCase().includes(search.toLowerCase());
    return m && (filterAction === 'all' || log.action === filterAction);
  });

  const actions = ['all', ...Array.from(new Set(auditLogs.map((l: any) => l.action)))];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher dans l'audit log..." className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-primary)]" />
        </div>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} className="px-3 py-2.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--divider)] text-sm text-[var(--text-primary)] focus:outline-none">
          {actions.map(a => <option key={a} value={a}>{a === 'all' ? 'Toutes actions' : a}</option>)}
        </select>
      </div>

      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--divider)]">
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Date</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Utilisateur</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Action</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Entité</th>
                <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">Aucun log d'audit</td></tr>
              )}
              {filtered.map((log: any, i: number) => (
                <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{new Date(log.createdAt).toLocaleDateString('fr-FR')} {new Date(log.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="px-4 py-2.5 text-xs font-medium text-[var(--text-primary)]">{log.userName}</td>
                  <td className="px-4 py-2.5"><span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">{log.action}</span></td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{log.entityType} <span className="text-[var(--text-muted)]">({log.entityId})</span></td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-muted)]">{log.details}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
