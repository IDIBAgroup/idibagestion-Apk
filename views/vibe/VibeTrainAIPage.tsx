import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Brain, Plus, X, Star, MessageSquare, Zap, Target, TrendingUp,
  CheckCircle, Database, Sparkles, Trash2, Send, BookOpen,
  ChevronDown, Award, BarChart3, Lightbulb, ThumbsUp, ThumbsDown,
  FileText, Users, Clock, Copy, Wand2, Save,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify, removeAndNotify } from '@/lib/db';

interface TrainingExample {
  id: string;
  type: 'message' | 'knowledge' | 'feedback' | 'template';
  title: string;
  content: string;
  context?: string;
  sector?: string;
  rating?: number;
  tags: string[];
  createdAt: string;
  authorName: string;
}

const SECTORS = ['Banque & Finance', 'Telecommunications', 'Agroalimentaire', 'Energie', 'Immobilier', 'Sante', 'Education', 'Commerce', 'Administration', 'Technologie', 'Media'];

const QUICK_TEMPLATES = [
  { title: 'Message de prospection froid', content: 'Bonjour [Nom],\n\nJe suis [Votre nom] de IDIBA Group, une agence creative et marketing basee a Douala. J\'ai decouvert [Entreprise] et votre travail dans le secteur [Secteur] m\'inspire beaucoup.\n\nNous accompagnons les entreprises comme la votre avec [Service]. Seriez-vous ouvert a un echange de 15 minutes ?\n\nCordialement,' },
  { title: 'Suivi apres premiere prise de contact', content: 'Bonjour [Nom],\n\nJe me permis de vous relancer suite a notre echange de [Date].\n\nComme promis, je vous partage notre showreel et une etude de cas du secteur [Secteur] : [Lien]\n\nReste a votre disposition pour une demo.\n\nCordialement,' },
  { title: 'Reponse a un signal d\'achat (hiring)', content: 'Bonjour [Nom],\n\nJ\'ai remarque que [Entreprise] recrute activement des profiles [Poste]. C\'est un signe fort de croissance et d\'ambition digitale.\n\nIDIBA Group peut vous accompagner pour accelerer vos projets creatifs pendant cette phase de croissance.\n\nPourrions-nous en discuter ?\n\nCordialement,' },
  { title: 'Proposition de partenariat', content: 'Cher [Nom],\n\nFélicitations pour [Projet/Nouvelle]. C\'est une initiative remarquable pour le secteur [Secteur].\n\nIDIBA Group dispose d\'une expertise complète en [Services] qui pourrait parfaitement completer votre vision.\n\nPourrions-nous explorer un partenariat gagnant-gagnant ?\n\nCordialement,' },
];

export function VibeTrainAIPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'examples' | 'knowledge' | 'feedback' | 'templates'>('examples');
  const [showForm, setShowForm] = useState(false);
  const [newExample, setNewExample] = useState({ type: 'message' as any, title: '', content: '', context: '', sector: '', tags: '' });
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setCurrentPageTitle('Vibe Prospecting - Nourrir l\'IA');
    loadExamples();
  }, [setCurrentPageTitle]);

  const loadExamples = () => {
    const stored = localStorage.getItem('vibe_ai_training');
    if (stored) {
      setExamples(JSON.parse(stored));
    } else {
      // Seed data
      const seed: TrainingExample[] = [
        { id: 'te-1', type: 'message', title: 'Message SABC - Campagne 33 Export', content: 'Cher François,\n\nFélicitations pour le budget alloué à la campagne 33 Export 2025. C\'est une opportunité exceptionnelle de créer un impact mémorable.\n\nIDIBA Group dispose d\'une expertise spécifique dans les campagnes CPG avec des concepts créatifs primés et une production audiovisuelle de classe internationale.\n\nPourrions-nous vous présenter notre vision créative lors d\'une réunion la semaine prochaine ?', context: 'Signal : funding detecte, budget 500M FCFA', sector: 'Agroalimentaire', rating: 5, tags: ['cpg', 'campagne', 'funding'], createdAt: '2025-02-12T00:00:00Z', authorName: 'Martin Essomba' },
        { id: 'te-2', type: 'message', title: 'Message Canal+ - Production video', content: 'Bonjour Aïssatou,\n\nJ\'ai remarque que Canal+ Afrique recrute activement dans la production de contenu digital. C\'est un signe fort d\'ambition créative.\n\nIDIBA Group a accompagné 3 acteurs majeurs des médias en Afrique centrale avec des productions vidéo primées et des stratégies content marketing innovantes.\n\nSeriez-vous ouverte à un échange de 15 minutes sur vos besoins de production ?', context: 'Signal : hiring intent, 4 postes production', sector: 'Media & Communication', rating: 5, tags: ['media', 'production', 'hiring'], createdAt: '2025-02-15T00:00:00Z', authorName: 'Jean-Pierre Moussa' },
        { id: 'te-3', type: 'knowledge', title: 'Secteur Banque - Approche recommandee', content: 'Les banques en zone CEMAC recherchent activement des solutions de branding et de marketing digital pour se differencier. Les thematiques RSE, l\'inclusion financiere et la digitalisation des services sont prioritaires. L\'approche doit etre formelle, basee sur des metriques et des etudes de cas.', context: 'Analyse de 15 leads banques', sector: 'Banque & Finance', tags: ['banque', 'approche', 'sector-insight'], createdAt: '2025-02-10T00:00:00Z', authorName: 'Grace Abena' },
        { id: 'te-4', type: 'feedback', title: 'Feedback message IA - Ecobank', content: 'Le message genere par l\'IA pour Ecobank etait bien structure mais trop generique. Il faut mentionner des exemples concrets du secteur bancaire et adapter le ton a la culture corporate d\'Ecobank.', sector: 'Banque & Finance', rating: 3, tags: ['feedback', 'amelioration', 'banque'], createdAt: '2025-02-18T00:00:00Z', authorName: 'Martin Essomba' },
        { id: 'te-5', type: 'template', title: 'Template - Approche apres event', content: 'Bonjour [Nom],\n\nC\'etait un plaisir de vous rencontrer lors de [Evenement]. Votre vision sur [Sujet] m\'a beaucoup inspire.\n\nComme discute, IDIBA Group peut vous accompagner sur [Service adapte]. Je vous propose un appel la semaine prochaine pour approfondir.\n\nCordialement,', context: 'A utiliser apres rencontre en salon ou conference', sector: '', tags: ['template', 'event', 'suivi'], createdAt: '2025-02-20T00:00:00Z', authorName: 'Jean-Pierre Moussa' },
        { id: 'te-6', type: 'knowledge', title: 'Secteur Telecom - Pain points', content: 'Les operateurs telecom en Afrique centrale partagent les memes defis : churn client, acquisition de jeunes, adoption des services digitaux (MoMo), et concurrence des OTT. Les campagnes doivent etre visuellement impactantes, multicanales, et mesurables.', context: 'Experience cumulee avec MTN et Orange', sector: 'Telecommunications', tags: ['telecom', 'insight', 'campagne'], createdAt: '2025-02-22T00:00:00Z', authorName: 'Grace Abena' },
      ];
      setExamples(seed);
      localStorage.setItem('vibe_ai_training', JSON.stringify(seed));
    }
  };

  const saveExamples = (updated: TrainingExample[]) => {
    setExamples(updated);
    localStorage.setItem('vibe_ai_training', JSON.stringify(updated));
  };

  const handleAdd = () => {
    if (!newExample.title || !newExample.content) {
      showToast('Titre et contenu sont requis', 'warning');
      return;
    }
    const ex: TrainingExample = {
      id: `te-${Date.now()}`,
      type: newExample.type,
      title: newExample.title,
      content: newExample.content,
      context: newExample.context,
      sector: newExample.sector,
      rating: newExample.type === 'feedback' ? 3 : undefined,
      tags: newExample.tags.split(',').map(t => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
      authorName: 'Utilisateur', // Would come from auth
    };
    const updated = [ex, ...examples];
    saveExamples(updated);
    setShowForm(false);
    setNewExample({ type: 'message', title: '', content: '', context: '', sector: '', tags: '' });
    showToast('Exemple ajoute avec succes. L\'IA va l\'utiliser pour s\'ameliorer.', 'success');
  };

  const handleDelete = (id: string) => {
    const updated = examples.filter(e => e.id !== id);
    saveExamples(updated);
    showToast('Exemple supprime', 'success');
  };

  const handleRate = (id: string, rating: number) => {
    const updated = examples.map(e => e.id === id ? { ...e, rating } : e);
    saveExamples(updated);
  };

  const filtered = examples.filter(e => {
    if (activeTab === 'examples') return e.type === 'message' || e.type === 'template';
    if (activeTab === 'knowledge') return e.type === 'knowledge';
    if (activeTab === 'feedback') return e.type === 'feedback';
    if (activeTab === 'templates') return e.type === 'template';
    return true;
  }).filter(e => !searchQuery || e.title.toLowerCase().includes(searchQuery.toLowerCase()) || e.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

  const stats = {
    total: examples.length,
    messages: examples.filter(e => e.type === 'message').length,
    knowledge: examples.filter(e => e.type === 'knowledge').length,
    feedback: examples.filter(e => e.type === 'feedback').length,
    templates: examples.filter(e => e.type === 'template').length,
    avgRating: examples.filter(e => e.rating).length > 0 ? (examples.filter(e => e.rating).reduce((s, e) => s + (e.rating || 0), 0) / examples.filter(e => e.rating).length).toFixed(1) : 'N/A',
  };

  const sectorDistribution = SECTORS.map(s => ({
    sector: s,
    count: examples.filter(e => e.sector === s).length,
  })).filter(s => s.count > 0).sort((a, b) => b.count - a.count);

  const copyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    showToast('Template copie', 'success');
  };

  const typeConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    message: { label: 'Message', color: 'var(--accent-primary)', icon: <MessageSquare size={12} /> },
    knowledge: { label: 'Connaissance', color: 'var(--accent-secondary)', icon: <BookOpen size={12} /> },
    feedback: { label: 'Feedback', color: 'var(--accent-warning)', icon: <Star size={12} /> },
    template: { label: 'Template', color: 'var(--accent-purple)', icon: <FileText size={12} /> },
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Nourrir l&apos;IA</h2>
          <p className="text-xs text-[var(--text-muted)]">Enrichir l&apos;intelligence artificielle de Vibe Prospecting</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary h-9 text-xs gap-1.5">
          <Plus size={14} /> Ajouter un exemple
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {[
          { label: 'Total exemples', value: stats.total, icon: <Database size={16} />, color: 'var(--accent-primary)' },
          { label: 'Messages', value: stats.messages, icon: <MessageSquare size={16} />, color: 'var(--accent-primary)' },
          { label: 'Connaissances', value: stats.knowledge, icon: <BookOpen size={16} />, color: 'var(--accent-secondary)' },
          { label: 'Feedbacks', value: stats.feedback, icon: <Star size={16} />, color: 'var(--accent-warning)' },
          { label: 'Templates', value: stats.templates, icon: <FileText size={16} />, color: 'var(--accent-purple)' },
          { label: 'Note moyenne', value: stats.avgRating, icon: <Award size={16} />, color: 'var(--accent-primary)' },
        ].map((s, i) => (
          <GlassCard key={s.label} delay={i * 0.05}>
            <div className="p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.icon}</div>
              <div><p className="text-base font-bold text-[var(--text-primary)]">{s.value}</p><p className="text-[10px] text-[var(--text-muted)]">{s.label}</p></div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Training Impact + Sector Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard delay={0.15} className="lg:col-span-2">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-[var(--accent-primary)]" /> Impact de l&apos;entrainement</h3>
            <div className="space-y-3">
              {[
                { label: 'Personnalisation des messages', value: 87, target: 95 },
                { label: 'Detection des signaux d\'achat', value: 72, target: 90 },
                { label: 'Recommandation de services', value: 80, target: 95 },
                { label: 'Taux de reponse des leads', value: 68, target: 85 },
              ].map((item, i) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-secondary)]">{item.label}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{item.value}% / objectif {item.target}%</span>
                  </div>
                  <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(item.value / item.target) * 100}%` }} transition={{ duration: 1, delay: i * 0.2 }} className="h-full rounded-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-primary-hover)]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.2}>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-[var(--accent-secondary)]" /> Secteurs couverts</h3>
            <div className="space-y-1.5">
              {sectorDistribution.length > 0 ? sectorDistribution.map(s => (
                <div key={s.sector} className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-secondary)] w-24 truncate">{s.sector}</span>
                  <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-secondary)] rounded-full" style={{ width: `${Math.min(s.count * 25, 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--text-primary)] w-4 text-right">{s.count}</span>
                </div>
              )) : (
                <p className="text-xs text-[var(--text-muted)]">Aucune donnee sectorielle</p>
              )}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Tabs + Content */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
          {[
            { k: 'examples', l: 'Exemples & Messages', i: <MessageSquare size={12} /> },
            { k: 'knowledge', l: 'Connaissances', i: <BookOpen size={12} /> },
            { k: 'feedback', l: 'Feedbacks IA', i: <Star size={12} /> },
            { k: 'templates', l: 'Templates rapides', i: <FileText size={12} /> },
          ].map(t => (
            <button key={t.k} onClick={() => setActiveTab(t.k as any)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${activeTab === t.k ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>{t.i} {t.l}</button>
          ))}
        </div>
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher..." className="h-9 px-3 glass-input text-sm w-48" />
      </div>

      {/* Content */}
      <div className="space-y-3">
        {activeTab === 'templates' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {QUICK_TEMPLATES.map((tpl, i) => (
              <GlassCard key={i} delay={i * 0.05}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">{tpl.title}</h4>
                    <button onClick={() => copyTemplate(tpl.content)} className="p-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)]"><Copy size={12} /></button>
                  </div>
                  <div className="bg-[var(--bg-elevated)] rounded-lg p-3 border border-[var(--glass-border)]">
                    <pre className="text-[11px] text-[var(--text-secondary)] whitespace-pre-line font-sans">{tpl.content}</pre>
                  </div>
                  <button onClick={() => { setNewExample({ ...newExample, type: 'template', title: tpl.title, content: tpl.content }); setShowForm(true); }} className="mt-3 text-[10px] text-[var(--accent-primary)] hover:underline flex items-center gap-1">
                    <Plus size={10} /> Ajouter a l&apos;entrainement
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        ) : (
          filtered.map((ex, i) => {
            const tc = typeConfig[ex.type];
            return (
              <motion.div key={ex.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <GlassCard hover={false}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)]">{tc.icon}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ backgroundColor: tc.color + '20', color: tc.color }}>{tc.label}</span>
                        {ex.sector && <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">{ex.sector}</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        {ex.rating !== undefined && (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(r => (
                              <button key={r} onClick={() => handleRate(ex.id, r)} className={r <= ex.rating! ? 'text-[var(--accent-warning)]' : 'text-[var(--text-muted)]'}><Star size={10} fill={r <= ex.rating! ? 'currentColor' : 'none'} /></button>
                            ))}
                          </div>
                        )}
                        <button onClick={() => handleDelete(ex.id)} className="p-1 rounded hover:bg-white/5 text-[var(--text-muted)] ml-2"><Trash2 size={10} /></button>
                      </div>
                    </div>
                    <h4 className="text-xs font-semibold text-[var(--text-primary)] mb-1">{ex.title}</h4>
                    <div className="bg-[var(--bg-elevated)] rounded-lg p-2.5 border border-[var(--glass-border)] mb-2">
                      <pre className="text-[11px] text-[var(--text-secondary)] whitespace-pre-line font-sans">{ex.content}</pre>
                    </div>
                    {ex.context && <p className="text-[10px] text-[var(--text-muted)] mb-1.5">{ex.context}</p>}
                    <div className="flex flex-wrap gap-1">
                      {ex.tags.map(tag => <span key={tag} className="text-[9px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-1.5 py-0.5 rounded">#{tag}</span>)}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })
        )}
        {filtered.length === 0 && activeTab !== 'templates' && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <Brain size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Aucun exemple dans cette categorie</p>
            <button onClick={() => setShowForm(true)} className="mt-3 text-xs text-[var(--accent-primary)] hover:underline">Ajouter un exemple</button>
          </div>
        )}
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowForm(false)} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 max-h-screen overflow-y-auto shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Brain size={16} className="text-[var(--accent-primary)]" /> Ajouter un exemple d&apos;entrainement</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} className="text-[var(--text-muted)]" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Type</label>
                  <select value={newExample.type} onChange={e => setNewExample({ ...newExample, type: e.target.value as any })} className="w-full h-9 px-3 glass-input text-sm">
                    <option value="message">Message de prospection</option>
                    <option value="knowledge">Connaissance sectorielle</option>
                    <option value="feedback">Feedback sur l&apos;IA</option>
                    <option value="template">Template de message</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Titre</label>
                  <input value={newExample.title} onChange={e => setNewExample({ ...newExample, title: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="Ex: Message pour SABC" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Contenu</label>
                  <textarea value={newExample.content} onChange={e => setNewExample({ ...newExample, content: e.target.value })} className="w-full h-32 px-3 py-2 glass-input text-sm resize-none" placeholder="Le message, la connaissance ou le feedback..." />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Contexte (optionnel)</label>
                  <input value={newExample.context} onChange={e => setNewExample({ ...newExample, context: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="Signal detecte, situation..." />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Secteur</label>
                  <select value={newExample.sector} onChange={e => setNewExample({ ...newExample, sector: e.target.value })} className="w-full h-9 px-3 glass-input text-sm">
                    <option value="">Selectionner...</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Tags (separés par des virgules)</label>
                  <input value={newExample.tags} onChange={e => setNewExample({ ...newExample, tags: e.target.value })} className="w-full h-9 px-3 glass-input text-sm" placeholder="campagne, agroalimentaire, branding" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} className="flex-1 btn-ghost h-9 text-xs">Annuler</button>
                  <button onClick={handleAdd} className="flex-1 btn-primary h-9 text-xs gap-1.5"><Save size={12} /> Enregistrer</button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
