import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Upload, Search, X, FileText, Image, FileSpreadsheet, Camera,
  Presentation, FileCode, Download, Trash2, Eye, Plus, Filter,
  Lock, Unlock, Tag, User, Calendar, ChevronDown, File, Archive,
  GraduationCap, ShieldCheck, ClipboardList, HelpCircle, Sparkles,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';

const categoryConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  reglement: { label: 'Reglement interieur', icon: <ShieldCheck size={16} />, color: '#EF4444' },
  procedure: { label: 'Manuel de procedure', icon: <ClipboardList size={16} />, color: '#3B82F6' },
  manuel: { label: 'Manuel', icon: <BookOpen size={16} />, color: '#8B5CF6' },
  formation: { label: 'Formation', icon: <GraduationCap size={16} />, color: '#10B981' },
  template: { label: 'Template', icon: <FileSpreadsheet size={16} />, color: '#F59E0B' },
  politique: { label: 'Politique', icon: <ShieldCheck size={16} />, color: '#EC4899' },
  archives: { label: 'Archives', icon: <Archive size={16} />, color: '#6B7280' },
  autre: { label: 'Autre', icon: <File size={16} />, color: '#6B7280' },
};

const fileTypeIcons: Record<string, React.ReactNode> = {
  'application/pdf': <FileText size={24} />,
  'image/': <Image size={24} />,
  'application/vnd.openxmlformats-officedocument': <FileSpreadsheet size={24} />,
  'application/vnd.ms-powerpoint': <Presentation size={24} />,
  'application/msword': <FileText size={24} />,
  'text/': <FileCode size={24} />,
};

function getFileIcon(fileType: string) {
  for (const [prefix, icon] of Object.entries(fileTypeIcons)) {
    if (fileType.startsWith(prefix.replace('*', ''))) return icon;
  }
  return <File size={24} />;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

export function LibraryPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '', description: '', category: 'reglement' as string,
    isRestricted: false, allowedDepartments: [] as string[], tags: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setCurrentPageTitle('Bibliothèque Interne');
    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    setDocuments(stored.libraryDocuments || []);
    setDepartments((stored.departments || []).map((d: any) => ({ id: d.id, name: d.name })));
  }, [setCurrentPageTitle]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadForm.title) setUploadForm(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
    }
  };

  const handleUpload = () => {
    if (!uploadForm.title || !selectedFile) { showToast('Titre et fichier requis', 'warning'); return; }

    const newDoc: any = {
      id: `lib-${Date.now()}`,
      title: uploadForm.title,
      description: uploadForm.description,
      category: uploadForm.category,
      fileName: selectedFile.name,
      fileSize: formatFileSize(selectedFile.size),
      fileType: selectedFile.type || 'application/octet-stream',
      uploadedBy: 'current-user',
      uploadedByName: 'Utilisateur Actuel',
      downloadCount: 0,
      isRestricted: uploadForm.isRestricted,
      allowedDepartments: uploadForm.isRestricted ? uploadForm.allowedDepartments : undefined,
      tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      companyId: 'comp-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    stored.libraryDocuments = [...(stored.libraryDocuments || []), newDoc];
    localStorage.setItem('idibages_db_v3', JSON.stringify(stored));
    setDocuments(prev => [...prev, newDoc]);
    setShowUploadForm(false);
    setUploadForm({ title: '', description: '', category: 'reglement', isRestricted: false, allowedDepartments: [], tags: '' });
    setSelectedFile(null);
    showToast('Document ajoute a la bibliotheque', 'success');
  };

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce document ?')) return;
    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    stored.libraryDocuments = (stored.libraryDocuments || []).filter((d: any) => d.id !== id);
    localStorage.setItem('idibages_db_v3', JSON.stringify(stored));
    setDocuments(prev => prev.filter(d => d.id !== id));
    showToast('Document supprime', 'success');
  };

  const handleDownload = (doc: any) => {
    const stored = JSON.parse(localStorage.getItem('idibages_db_v3') || '{}');
    const docs = stored.libraryDocuments || [];
    const idx = docs.findIndex((d: any) => d.id === doc.id);
    if (idx !== -1) {
      docs[idx].downloadCount = (docs[idx].downloadCount || 0) + 1;
      stored.libraryDocuments = docs;
      localStorage.setItem('idibages_db_v3', JSON.stringify(stored));
      setDocuments([...docs]);
    }
    showToast(`Telechargement de "${doc.title}"`, 'success');
  };

  const toggleDept = (deptId: string) => {
    setUploadForm(prev => ({
      ...prev,
      allowedDepartments: prev.allowedDepartments.includes(deptId)
        ? prev.allowedDepartments.filter(d => d !== deptId)
        : [...prev.allowedDepartments, deptId],
    }));
  };

  const filteredDocs = documents.filter((d: any) => {
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    if (searchTerm && !d.title?.toLowerCase().includes(searchTerm.toLowerCase()) && !d.description?.toLowerCase().includes(searchTerm.toLowerCase()) && !d.tags?.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase()))) return false;
    return true;
  });

  const stats = {
    total: documents.length,
    downloads: documents.reduce((sum: number, d: any) => sum + (d.downloadCount || 0), 0),
    categories: new Set(documents.map((d: any) => d.category)).size,
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Bibliothèque Interne</h2>
          <p className="text-xs text-[var(--text-muted)]">Documents, reglements et manuels de l'entreprise</p>
        </div>
        <button onClick={() => setShowUploadForm(true)} className="btn-primary h-9 gap-1.5"><Upload size={14} /> Ajouter un document</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Documents', value: stats.total, icon: <BookOpen size={16} />, c: '#3B82F6' },
          { label: 'Telechargements', value: stats.downloads, icon: <Download size={16} />, c: '#10B981' },
          { label: 'Categories', value: stats.categories, icon: <Tag size={16} />, c: '#8B5CF6' },
        ].map((s, i) => (
          <GlassCard key={s.label} delay={i * 0.05}><div className="p-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.c + '20', color: s.c }}>{s.icon}</div>
            <div><p className="text-base font-bold text-[var(--text-primary)]">{s.value}</p><p className="text-[10px] text-[var(--text-muted)]">{s.label}</p></div>
          </div></GlassCard>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="library-category-filter">Filtrer par catégorie</label>
        <select id="library-category-filter" value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)} className="h-9 min-w-[210px] px-3 glass-input text-sm">
          <option value="all">Toutes les catégories</option>
          {Object.entries(categoryConfig).map(([key, category]) => <option key={key} value={key}>{category.label}</option>)}
        </select>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <div className="flex-1 max-w-md relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} placeholder="Rechercher par titre, description ou tag..." className="w-full h-9 pl-9 pr-4 glass-input text-sm" />
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">{filteredDocs.length} document(s)</span>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <GlassCard><div className="p-8 text-center text-[var(--text-muted)]">
          <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-xs">Aucun document dans la bibliotheque</p>
          <button onClick={() => setShowUploadForm(true)} className="mt-3 text-[10px] text-[var(--accent-primary)] hover:underline">Ajouter le premier document</button>
        </div></GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc: any, i: number) => (
            <motion.div key={doc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <GlassCard><div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: categoryConfig[doc.category]?.color + '15', color: categoryConfig[doc.category]?.color }}>
                    {getFileIcon(doc.fileType)}
                  </div>
                  <div className="flex items-center gap-1">
                    {doc.isRestricted && <span title="Acces restreint"><Lock size={12} className="text-[var(--accent-warning)]" /></span>}
                    <button onClick={() => handleDownload(doc)} className="p-1.5 rounded hover:bg-white/5 text-[var(--accent-primary)]" title="Telecharger"><Download size={14} /></button>
                    <button onClick={() => { setSelectedDoc(doc); setShowDetail(true); }} className="p-1.5 rounded hover:bg-white/5 text-[var(--text-secondary)]" title="Voir details"><Eye size={14} /></button>
                    <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded hover:bg-white/5 text-[var(--accent-danger)]" title="Supprimer"><Trash2 size={14} /></button>
                  </div>
                </div>

                <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: categoryConfig[doc.category]?.color + '20', color: categoryConfig[doc.category]?.color }}>
                  {categoryConfig[doc.category]?.icon} {categoryConfig[doc.category]?.label}
                </span>

                <h4 className="text-sm font-semibold text-[var(--text-primary)] mt-2 line-clamp-1" title={doc.title}>{doc.title}</h4>
                <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 mt-1 mb-2">{doc.description}</p>

                <div className="flex items-center gap-2 text-[9px] text-[var(--text-muted)] mb-2">
                  <span className="flex items-center gap-1"><FileText size={9} /> {doc.fileName}</span>
                  <span>{doc.fileSize}</span>
                </div>

                {doc.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {doc.tags.map((t: string, idx: number) => <span key={idx} className="text-[8px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-[var(--divider)]/50 text-[9px] text-[var(--text-muted)]">
                  <span className="flex items-center gap-1"><User size={9} /> {doc.uploadedByName}</span>
                  <span className="flex items-center gap-1"><Calendar size={9} /> {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                  <span className="flex items-center gap-1"><Download size={9} /> {doc.downloadCount || 0}</span>
                </div>
              </div></GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="h-full w-full max-w-lg overflow-y-auto border-l border-[var(--glass-border)] bg-[var(--bg-card)] shadow-2xl">
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2"><Upload size={14} className="text-[var(--accent-primary)]" /> Ajouter un document</h3>
                  <button onClick={() => setShowUploadForm(false)} className="p-1 rounded hover:bg-white/5"><X size={16} /></button>
                </div>

                <div className="space-y-3">
                  {/* File Drop Zone */}
                  <div className="border-2 border-dashed border-[var(--divider)] rounded-xl p-6 text-center hover:border-[var(--accent-primary)]/30 transition-colors">
                    <input type="file" onChange={(event) => { handleFileSelect(event); event.currentTarget.value = ''; }} className="hidden" id="lib-file-input" />
                    <label htmlFor="lib-file-input" className="cursor-pointer">
                      <Upload size={24} className="mx-auto mb-2 text-[var(--accent-primary)]" />
                      <p className="text-xs text-[var(--text-primary)] font-medium">{selectedFile ? selectedFile.name : 'Cliquez pour selectionner un fichier'}</p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">{selectedFile ? formatFileSize(selectedFile.size) : 'PDF, DOC, XLS, PPT, JPG, PNG (max 10 Mo)'}</p>
                    </label>
                    <div className="mt-3"><input type="file" accept="image/*" capture="environment" onChange={(event) => { handleFileSelect(event); event.currentTarget.value = ''; }} className="hidden" id="lib-scan-input" /><label htmlFor="lib-scan-input" className="btn-secondary mx-auto h-9 w-fit cursor-pointer"><Camera size={14} /> Scanner un document</label><p className="mt-1 text-[10px] text-[var(--text-muted)]">Pour un scanner relié à l’ordinateur, lancez son logiciel, enregistrez le scan en PDF, puis choisissez ce PDF dans la zone ci-dessus.</p></div>
                  </div>

                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Titre</label>
                    <input value={uploadForm.title} onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="Titre du document..." />
                  </div>

                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Description</label>
                    <textarea value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} className="w-full h-16 px-3 py-2 glass-input text-xs resize-none" placeholder="Description du contenu..." />
                  </div>

                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Categorie</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {Object.entries(categoryConfig).map(([k, v]) => (
                        <button key={k} onClick={() => setUploadForm({ ...uploadForm, category: k })} className={`flex flex-col items-center gap-1 p-2 rounded text-[9px] font-medium transition-colors ${uploadForm.category === k ? 'ring-1 ring-offset-1' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`} style={uploadForm.category === k ? { backgroundColor: v.color + '15', color: v.color, '--tw-ring-color': v.color } as any : {}}>
                          {v.icon} {v.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Tags (separes par des virgules)</label>
                    <input value={uploadForm.tags} onChange={e => setUploadForm({ ...uploadForm, tags: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="ex: RH, procedure, 2026..." />
                  </div>

                  {/* Restriction */}
                  <div className="flex items-center gap-2">
                    <button onClick={() => setUploadForm({ ...uploadForm, isRestricted: !uploadForm.isRestricted })} className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg ${uploadForm.isRestricted ? 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                      {uploadForm.isRestricted ? <Lock size={12} /> : <Unlock size={12} />} {uploadForm.isRestricted ? 'Acces restreint' : 'Acces public'}
                    </button>
                  </div>

                  {uploadForm.isRestricted && (
                    <div><label className="block text-xs text-[var(--text-secondary)] mb-1">Departements autorises</label>
                      <div className="flex flex-wrap gap-1.5">
                        {departments.map((d: any) => (
                          <button key={d.id} onClick={() => toggleDept(d.id)} className={`text-[9px] px-2 py-1 rounded ${uploadForm.allowedDepartments.includes(d.id) ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                            {uploadForm.allowedDepartments.includes(d.id) ? '✓ ' : ''}{d.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setShowUploadForm(false)} className="btn-secondary h-8 text-xs">Annuler</button>
                    <button onClick={handleUpload} className="btn-primary h-8 text-xs gap-1" disabled={!selectedFile || !uploadForm.title}><Upload size={12} /> Ajouter</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetail && selectedDoc && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass-card w-full max-w-md">
              <div className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: categoryConfig[selectedDoc.category]?.color + '15', color: categoryConfig[selectedDoc.category]?.color }}>
                    {getFileIcon(selectedDoc.fileType)}
                  </div>
                  <button onClick={() => setShowDetail(false)} className="p-1 rounded hover:bg-white/5"><X size={16} /></button>
                </div>

                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: categoryConfig[selectedDoc.category]?.color + '20', color: categoryConfig[selectedDoc.category]?.color }}>
                  {categoryConfig[selectedDoc.category]?.icon} {categoryConfig[selectedDoc.category]?.label}
                </span>

                <h3 className="text-base font-semibold text-[var(--text-primary)] mt-2">{selectedDoc.title}</h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">{selectedDoc.description || 'Aucune description'}</p>

                <div className="mt-4 space-y-2 text-xs text-[var(--text-secondary)]">
                  <div className="flex justify-between py-1 border-b border-[var(--divider)]/30"><span className="text-[var(--text-muted)]">Fichier</span><span className="text-[var(--text-primary)]">{selectedDoc.fileName}</span></div>
                  <div className="flex justify-between py-1 border-b border-[var(--divider)]/30"><span className="text-[var(--text-muted)]">Taille</span><span>{selectedDoc.fileSize}</span></div>
                  <div className="flex justify-between py-1 border-b border-[var(--divider)]/30"><span className="text-[var(--text-muted)]">Telechargements</span><span>{selectedDoc.downloadCount || 0}</span></div>
                  <div className="flex justify-between py-1 border-b border-[var(--divider)]/30"><span className="text-[var(--text-muted)]">Par</span><span>{selectedDoc.uploadedByName}</span></div>
                  <div className="flex justify-between py-1 border-b border-[var(--divider)]/30"><span className="text-[var(--text-muted)]">Date</span><span>{new Date(selectedDoc.createdAt).toLocaleDateString('fr-FR')}</span></div>
                  <div className="flex justify-between py-1"><span className="text-[var(--text-muted)]">Acces</span><span className="flex items-center gap-1">{selectedDoc.isRestricted ? <><Lock size={10} className="text-[var(--accent-warning)]" /> Restreint</> : <><Unlock size={10} className="text-[var(--accent-primary)]" /> Public</>}</span></div>
                </div>

                {selectedDoc.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {selectedDoc.tags.map((t: string, i: number) => <span key={i} className="text-[9px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">{t}</span>)}
                  </div>
                )}

                <button onClick={() => { handleDownload(selectedDoc); setShowDetail(false); }} className="w-full btn-primary h-9 justify-center gap-2 mt-4">
                  <Download size={14} /> Telecharger
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
