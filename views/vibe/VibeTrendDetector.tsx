import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Radar, Search, Zap, Target, TrendingUp, AlertTriangle,
  Sparkles, Globe, Users, Hash, ArrowRight, Building2,
  MapPin, Activity, Eye, CheckCircle, BarChart3, MessageSquare,
  ChevronRight, Flame, Layers, Star,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface VibeTrendDetectorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DetectedTrend {
  id: string;
  topic: string;
  platform: string;
  volume: number;
  growth: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed';
  hashtags: string[];
  topPosts: number;
  engagement: number;
}

interface CreativeGap {
  id: string;
  competitor: string;
  gapType: string;
  description: string;
  opportunityScore: number;
  idibaService: string;
  urgency: 'high' | 'medium' | 'low';
}

interface TargetedProspect {
  id: string;
  company: string;
  position: string;
  sector: string;
  signal: string;
  trendMatch: string;
  approachAngle: string;
  estimatedValue: number;
  confidence: number;
}

interface ScanResult {
  scanScore: number;
  digitalPresence: { score: number; platforms: string[]; activityLevel: string };
  trends: DetectedTrend[];
  gaps: CreativeGap[];
  prospects: TargetedProspect[];
  aiRecommendations: string[];
  hashtags: string[];
  contentAngles: string[];
}

const SECTORS = [
  'Banque & Finance', 'Telecommunications', 'Agroalimentaire', 'Energie',
  'Immobilier', 'Sante', 'Education', 'Commerce & Distribution',
  'Administration Publique', 'Technologie & IT', 'Media & Communication',
  'Transport & Logistique',
];

const PLATFORMS = [
  { key: 'linkedin', label: 'LinkedIn', icon: <Globe size={12} /> },
  { key: 'instagram', label: 'Instagram', icon: <Eye size={12} /> },
  { key: 'facebook', label: 'Facebook', icon: <Users size={12} /> },
  { key: 'twitter', label: 'Twitter/X', icon: <Hash size={12} /> },
  { key: 'tiktok', label: 'TikTok', icon: <Activity size={12} /> },
  { key: 'youtube', label: 'YouTube', icon: <BarChart3 size={12} /> },
];

export function VibeTrendDetector({ isOpen, onClose }: VibeTrendDetectorProps) {
  const { showToast } = useUIStore();
  const [step, setStep] = useState<'config' | 'scanning' | 'results'>('config');
  const [formData, setFormData] = useState({
    sector: '',
    platforms: ['linkedin', 'instagram', 'facebook'],
    scanDepth: 'standard' as 'quick' | 'standard' | 'deep',
    focus: 'all' as 'trends' | 'gaps' | 'prospects' | 'all',
  });
  const [result, setResult] = useState<ScanResult | null>(null);

  const generateScanResult = (): ScanResult => {
    const sector = formData.sector;
    const isDeep = formData.scanDepth === 'deep';
    const trendCount = isDeep ? 8 : formData.scanDepth === 'quick' ? 4 : 6;
    const gapCount = isDeep ? 5 : 3;
    const prospectCount = isDeep ? 6 : 4;

    const trends: DetectedTrend[] = Array.from({ length: trendCount }, (_, i) => ({
      id: `td-${i}`,
      topic: getTrendTopic(sector, i),
      platform: formData.platforms[i % formData.platforms.length],
      volume: Math.floor(Math.random() * 80) + 20,
      growth: Math.floor(Math.random() * 60) + 5,
      sentiment: ['positive', 'mixed', 'positive', 'neutral'][i % 4] as any,
      hashtags: getHashtags(sector, i),
      topPosts: Math.floor(Math.random() * 500) + 50,
      engagement: Math.floor(Math.random() * 15) + 3,
    }));

    const gaps: CreativeGap[] = Array.from({ length: gapCount }, (_, i) => ({
      id: `cg-${i}`,
      competitor: getCompetitor(sector, i),
      gapType: ['Absence video', 'Design obsolete', 'SEO faible', 'Contenu generique', 'Pas de motion'][i % 5],
      description: getGapDescription(sector, i),
      opportunityScore: Math.floor(Math.random() * 30) + 65,
      idibaService: ['Production audiovisuelle', 'Conception graphique', 'Marketing digital', 'Production audiovisuelle', 'Conception graphique'][i % 5],
      urgency: (['high', 'medium', 'high', 'medium', 'low'][i % 5]) as any,
    }));

    const prospects: TargetedProspect[] = Array.from({ length: prospectCount }, (_, i) => ({
      id: `tp-${i}`,
      company: getProspectCompany(sector, i),
      position: ['Directeur Marketing', 'Responsable Communication', 'CEO', 'CMO', 'Directeur Digital'][i % 5],
      sector,
      signal: ['Hiring intent', 'Funding', 'Expansion', 'Rebranding', 'Tech upgrade'][i % 5],
      trendMatch: trends[i % trends.length].topic,
      approachAngle: getApproachAngle(sector, i),
      estimatedValue: [15000000, 25000000, 45000000, 85000000, 35000000, 18000000][i % 6],
      confidence: Math.floor(Math.random() * 25) + 70,
    }));

    return {
      scanScore: Math.floor(Math.random() * 20) + 75,
      digitalPresence: {
        score: Math.floor(Math.random() * 30) + 60,
        platforms: formData.platforms,
        activityLevel: ['Moderee', 'Elevee', 'Tres elevee'][Math.floor(Math.random() * 3)],
      },
      trends,
      gaps,
      prospects,
      aiRecommendations: getRecommendations(sector),
      hashtags: [...new Set(trends.flatMap(t => t.hashtags))].slice(0, 8),
      contentAngles: getContentAngles(sector),
    };
  };

  const getTrendTopic = (sector: string, i: number) => {
    const topics: Record<string, string[]> = {
      'Banque & Finance': ['Banque digitale CEMAC', 'Fintech mobile', 'Inclusion financiere', 'Crypto Afrique', 'Neobanques', 'Paiement QR', 'Credit scoring IA', 'Blockchain finance'],
      'Telecommunications': ['5G Afrique', 'eSIM adoption', 'Fiber to home', 'IoT connectivite', 'Cloud edge', 'Data centers', 'Cybersecurite telecom', 'Satellite internet'],
      'Agroalimentaire': ['AgriTech drone', 'Traçabilite blockchain', 'E-commerce agricole', 'Transformation locale', 'Export cacao digital', 'Smart farming', 'Marketplace agricole', 'Packaging durable'],
      'Energie': ['Energie renouvelable', 'Solar off-grid', 'Smart grid', 'RSE reporting', 'Carbone neutre', 'Hydrogene vert', 'Micro-reseaux', 'Efficacite energetique'],
      'default': ['Transformation digitale', 'IA generative', 'Marketing d\'influence', 'Experience client', 'Automatisation', 'Data-driven decision', 'Personalisation', 'Omnicanal'],
    };
    const list = topics[sector] || topics['default'];
    return list[i % list.length];
  };

  const getHashtags = (sector: string, i: number): string[] => {
    const tags: Record<string, string[][]> = {
      'Banque & Finance': [['#FintechAfrica', '#DigitalBanking'], ['#MobileMoney', '#Inclusion'], ['#Neobanque', '#CEMAC'], ['#CryptoAF', '#Blockchain']],
      'Telecommunications': [['#5GAfrica', '#IoT'], ['#eSIM', '#Connectivite'], ['#CyberSec', '#CloudEdge'], ['#DataCenter', '#AfriqueDigitale']],
      'Agroalimentaire': [['#AgriTech', '#Cacao'], ['#MadeInCameroon', '#Export'], ['#SmartFarming', '#Drone'], ['#FoodTech', '#Local']],
      'default': [['#DigitalAfrica', '#Innovation'], ['#TechAF', '#Startup'], ['#MarketingDigital', '#Content'], ['#IA', '#Automation']],
    };
    const list = tags[sector] || tags['default'];
    return list[i % list.length];
  };

  const getCompetitor = (sector: string, i: number) => {
    const comps: Record<string, string[]> = {
      'Banque & Finance': ['Ecobank', 'SGBC', 'Afriland', 'UBA', 'BGFI'],
      'Telecommunications': ['MTN', 'Orange', 'Nexttel', 'Camtel'],
      'Agroalimentaire': ['Chococam', 'SABC', 'Nestle CM', 'CICAM'],
      'default': ['Concurrent A', 'Concurrent B', 'Concurrent C'],
    };
    const list = comps[sector] || comps['default'];
    return list[i % list.length];
  };

  const getGapDescription = (sector: string, i: number) => {
    const descs = [
      ` absence de contenu video sur les reseaux sociaux. Opportunite pour IDIBA Group de proposer une strategie video complete.`,
      ` identite visuelle non actualisee depuis 3+ ans. L'occasion de proposer un rebranding complet.`,
      ` faible visibilite sur les moteurs de recherche. Besoin urgent d'une strategie SEO/SEA.`,
      ` contenu generique sans personnalisation. Opportunite pour du content marketing sur mesure.`,
      ` absence de motion design et d'animations. IDIBA Group peut combler ce manque avec son equipe creative.`,
    ];
    return descs[i % descs.length];
  };

  const getProspectCompany = (sector: string, i: number) => {
    const comps: Record<string, string[]> = {
      'Banque & Finance': ['Afriland First Bank', 'Commercial Bank', 'SGBC', 'BICEC', 'BCA'],
      'Telecommunications': ['Orange Cameroun', 'MTN Cameroun', 'Camtel', 'Ringo'],
      'Agroalimentaire': ['CICAM', 'SOSUCAM', 'Chococam', 'BOCOM', 'Maison du Cacao'],
      'default': ['Entreprise A', 'Entreprise B', 'Entreprise C', 'Startup X'],
    };
    const list = comps[sector] || comps['default'];
    return list[i % list.length];
  };

  const getApproachAngle = (sector: string, i: number) => {
    const angles = [
      `Mentionner la tendance ${getTrendTopic(sector, i)} et proposer une collaboration creative`,
      `Aborder par l'angle innovation avec une demo creative personnalisee`,
      `Proposer un audit creatif gratuit base sur l'analyse de leur presence digitale`,
      `Reference un cas similaire dans le secteur ${sector.toLowerCase()} pour etablir la credibilite`,
    ];
    return angles[i % angles.length];
  };

  const getRecommendations = (sector: string) => [
    `Prioriser la creation de contenu video dans le secteur ${sector.toLowerCase()} - forte demande detectee`,
    `Lancer une campagne ciblee sur LinkedIn pour les decisionnaires ${sector.toLowerCase()}`,
    `Proposer des audits creatifs gratuits pour convertir les prospects identifies`,
    `Developper des templates sectoriels pour accelerer la production de contenu`,
    `Creer une serie de cas d'etude ${sector.toLowerCase()} pour renforcer la credibilite`,
  ];

  const getContentAngles = (sector: string) => [
    `Etude de cas: Comment transformer la presence digitale dans le ${sector.toLowerCase()}`,
    `Infographie: Les 5 tendances ${sector.toLowerCase()} en Afrique centrale pour 2025`,
    `Webinaire: IA et marketing dans le secteur ${sector.toLowerCase()} - opportunites et defis`,
    `Video: Behind the scenes d'une campagne ${sector.toLowerCase()} reussie`,
  ];

  const handleScan = () => {
    if (!formData.sector) { showToast('Veuillez selectionner un secteur', 'warning'); return; }
    if (formData.platforms.length === 0) { showToast('Selectionnez au moins une plateforme', 'warning'); return; }
    setStep('scanning');
    setTimeout(() => {
      setResult(generateScanResult());
      setStep('results');
      showToast('Scan termine - Tendances et ecarts detectes', 'success');
    }, 3500);
  };

  const reset = () => { setStep('config'); setResult(null); setFormData({ sector: '', platforms: ['linkedin', 'instagram', 'facebook'], scanDepth: 'standard', focus: 'all' }); };

  const sentimentColor = (s: string) => s === 'positive' ? 'var(--accent-primary)' : s === 'negative' ? 'var(--accent-danger)' : s === 'mixed' ? 'var(--accent-warning)' : 'var(--text-muted)';
  const urgencyConfig = { high: { color: '#EF4444', label: 'Urgent' }, medium: { color: '#F59E0B', label: 'Moyen' }, low: { color: '#3B82F6', label: 'Faible' } };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-[60] flex justify-end" onClick={onClose}>
        <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-4xl h-full bg-[var(--bg-card)] border-l border-[var(--glass-border)] overflow-y-auto" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="p-6 border-b border-[var(--divider)] flex items-center justify-between sticky top-0 bg-[var(--bg-card)]/80 backdrop-blur-xl z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white">
                <Radar size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Detecteur de Tendances & Ecarts Creatifs</h2>
                <p className="text-xs text-[var(--text-muted)]">IA scan en temps reel - Veille creative et ciblage prospect</p>
              </div>
            </div>
            <button onClick={() => { onClose(); reset(); }} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)]"><X size={18} /></button>
          </div>

          {/* Step 1: Config */}
          {step === 'config' && (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-1.5"><Building2 size={14} className="text-[var(--accent-primary)]" /> Secteur d&apos;activite <span className="text-[var(--accent-danger)]">*</span></label>
                  <select value={formData.sector} onChange={e => setFormData({ ...formData, sector: e.target.value })} className="w-full h-10 px-3 glass-input text-sm">
                    <option value="">Selectionner un secteur...</option>
                    {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-1.5"><Activity size={14} className="text-[var(--accent-primary)]" /> Profondeur du scan</label>
                  <div className="flex gap-2">
                    {[{ k: 'quick', l: 'Rapide (30s)', i: <Zap size={12} /> }, { k: 'standard', l: 'Standard (1min)', i: <Activity size={12} /> }, { k: 'deep', l: 'Profond (2min)', i: <Layers size={12} /> }].map(d => (
                      <button key={d.k} onClick={() => setFormData({ ...formData, scanDepth: d.k as any })} className={`flex-1 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${formData.scanDepth === d.k ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>{d.i} {d.l}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-1.5"><Globe size={14} className="text-[var(--accent-secondary)]" /> Plateformes a scanner</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(p => (
                    <button key={p.key} onClick={() => setFormData({ ...formData, platforms: formData.platforms.includes(p.key) ? formData.platforms.filter(x => x !== p.key) : [...formData.platforms, p.key] })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${formData.platforms.includes(p.key) ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-1.5"><Target size={14} className="text-[var(--accent-warning)]" /> Focus d&apos;analyse</label>
                <div className="flex flex-wrap gap-2">
                  {[{ k: 'all', l: 'Complet (tendances + ecarts + prospects)', i: <Layers size={12} /> }, { k: 'trends', l: 'Tendances uniquement', i: <TrendingUp size={12} /> }, { k: 'gaps', l: 'Ecarts creatifs', i: <AlertTriangle size={12} /> }, { k: 'prospects', l: 'Prospects cibles', i: <Users size={12} /> }].map(f => (
                    <button key={f.k} onClick={() => setFormData({ ...formData, focus: f.k as any })} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${formData.focus === f.k ? 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] ring-1 ring-[var(--accent-warning)]/30' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>{f.i} {f.l}</button>
                  ))}
                </div>
              </div>

              <div className="glass-card-compact p-3 bg-[var(--accent-primary)]/5 flex items-start gap-2">
                <Radar size={14} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Le detecteur analyse en temps reel les <strong>tendances emergentes</strong>, identifie les <strong>ecarts creatifs</strong> de vos concurrents, et genere une liste de <strong>prospects cibles</strong> avec angles d&apos;approche personnalises.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                <button onClick={handleScan} disabled={!formData.sector} className="flex-1 btn-primary h-10 justify-center gap-2 disabled:opacity-50">
                  <Radar size={14} /> Lancer le scan IA
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Scanning */}
          {step === 'scanning' && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent mb-6" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Scan en cours...</h3>
              <p className="text-sm text-[var(--text-muted)] max-w-md">
                Notre IA scanne <strong className="text-[var(--text-primary)]">{formData.sector}</strong> sur {formData.platforms.length} plateforme(s) en mode <strong className="text-[var(--text-primary)]">{formData.scanDepth}</strong>.
              </p>
              <div className="mt-6 space-y-2 w-full max-w-sm">
                {[
                  `Analyse presence digitale secteur ${formData.sector}...`,
                  'Extraction des tendances virales en temps reel...',
                  'Identification des ecarts creatifs concurrents...',
                  'Matching tendances <> prospects...',
                  'Generation des angles d\'approche...',
                  'Compilation du rapport strategique...',
                ].map((s, i) => (
                  <motion.div key={s} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <CheckCircle size={12} className="text-[var(--accent-primary)]" /> {s}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && result && (
            <div className="p-6 space-y-5">
              {/* Summary Bar */}
              <div className="glass-card-compact p-4 bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-primary-hover)]/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white font-bold text-lg">
                    {result.scanScore}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">Score d&apos;opportunite</h3>
                    <p className="text-xs text-[var(--text-muted)]">{formData.sector} · {formData.platforms.length} plateformes scannees</p>
                  </div>
                  <div className="ml-auto text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">{result.digitalPresence.activityLevel}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]"><p className="text-lg font-bold text-[var(--text-primary)]">{result.trends.length}</p><p className="text-[9px] text-[var(--text-muted)]">Tendances</p></div>
                  <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]"><p className="text-lg font-bold text-[var(--text-primary)]">{result.gaps.length}</p><p className="text-[9px] text-[var(--text-muted)]">Ecarts</p></div>
                  <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]"><p className="text-lg font-bold text-[var(--text-primary)]">{result.prospects.length}</p><p className="text-[9px] text-[var(--text-muted)]">Prospects</p></div>
                  <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]"><p className="text-lg font-bold text-[var(--accent-primary)]">{result.digitalPresence.score}%</p><p className="text-[9px] text-[var(--text-muted)]">Presence digitale</p></div>
                </div>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Trends */}
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-[var(--accent-primary)]" /> Tendances detectees</h4>
                  <div className="space-y-2">
                    {result.trends.map((t, i) => (
                      <div key={t.id} className="glass-card-compact p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[var(--text-primary)]">{t.topic}</span>
                            <span className="text-[9px] text-[var(--text-muted)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">{t.platform}</span>
                          </div>
                          <span className="text-[9px]" style={{ color: sentimentColor(t.sentiment) }}>{t.sentiment}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] text-[var(--text-muted)]">Vol: <strong className="text-[var(--text-primary)]">{t.volume}</strong></span>
                          <span className="text-[10px] text-[var(--accent-primary)]">+{t.growth}%</span>
                          <span className="text-[10px] text-[var(--text-muted)]">Posts: {t.topPosts}</span>
                          <span className="text-[10px] text-[var(--text-muted)]">Eng: {t.engagement}%</span>
                          <div className="flex-1 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${t.volume}%` }} />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {t.hashtags.map(h => <span key={h} className="text-[9px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-1.5 py-0.5 rounded">{h}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Gaps */}
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><AlertTriangle size={14} className="text-[var(--accent-warning)]" /> Ecarts creatifs</h4>
                  <div className="space-y-2">
                    {result.gaps.map((g, i) => {
                      const u = urgencyConfig[g.urgency];
                      return (
                        <div key={g.id} className="glass-card-compact p-3 border border-[var(--accent-warning)]/10">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-[var(--text-primary)]">{g.competitor}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ backgroundColor: u.color + '20', color: u.color }}>{u.label}</span>
                            </div>
                            <span className="text-[9px] text-[var(--accent-primary)]">{g.opportunityScore}% opportunite</span>
                          </div>
                          <p className="text-[10px] text-[var(--text-secondary)] mb-1.5"><strong className="text-[var(--accent-warning)]">{g.gapType}:</strong>{g.description}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-[var(--text-muted)]">Service IDIBA:</span>
                            <span className="text-[9px] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-1.5 py-0.5 rounded font-medium">{g.idibaService}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Prospects */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Users size={14} className="text-[var(--accent-primary)]" /> Prospects cibles par tendance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.prospects.map((p, i) => (
                    <div key={p.id} className="glass-card-compact p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white text-xs font-bold">{p.company.charAt(0)}</div>
                          <div>
                            <p className="text-xs font-medium text-[var(--text-primary)]">{p.company}</p>
                            <p className="text-[9px] text-[var(--text-muted)]">{p.position}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-[var(--accent-primary)]">{p.confidence}%</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] bg-[var(--accent-danger)]/10 text-[var(--accent-danger)] px-1.5 py-0.5 rounded">{p.signal}</span>
                        <span className="text-[9px] bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] px-1.5 py-0.5 rounded">{p.trendMatch.slice(0, 25)}...</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mb-1.5"><strong>Angle:</strong> {p.approachAngle}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-[var(--text-muted)]">Estime: <strong className="text-[var(--text-primary)]">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(p.estimatedValue)}</strong></span>
                        <button onClick={() => showToast('Prospect ajoute a la liste', 'success')} className="text-[9px] text-[var(--accent-primary)] hover:underline flex items-center gap-1"><ChevronRight size={10} /> Ajouter</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Recommendations */}
              <div className="glass-card-compact p-4 bg-gradient-to-r from-[var(--accent-purple)]/5 to-[var(--accent-primary)]/5">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Sparkles size={14} className="text-[var(--accent-purple)]" /> Recommandations IA</h4>
                <div className="space-y-2">
                  {result.aiRecommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <ArrowRight size={12} className="text-[var(--accent-purple)] mt-0.5 shrink-0" />
                      <p className="text-xs text-[var(--text-secondary)]">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hashtags & Content Angles */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2"><Hash size={14} className="text-[var(--accent-secondary)]" /> Hashtags strategiques</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {result.hashtags.map(h => <span key={h} className="text-xs bg-[var(--bg-elevated)] text-[var(--text-primary)] px-2 py-1 rounded">{h}</span>)}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2"><Flame size={14} className="text-[var(--accent-warning)]" /> Angles de contenu</h4>
                  <div className="space-y-1.5">
                    {result.contentAngles.map((a, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[9px] text-[var(--accent-warning)] font-bold shrink-0">{i + 1}.</span>
                        <p className="text-xs text-[var(--text-secondary)]">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 btn-ghost h-10 text-xs gap-1.5"><Radar size={12} /> Nouveau scan</button>
                <button onClick={() => showToast('Rapport exporte avec succes', 'success')} className="flex-1 btn-primary h-10 text-xs gap-1.5"><Sparkles size={12} /> Exporter le rapport</button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
