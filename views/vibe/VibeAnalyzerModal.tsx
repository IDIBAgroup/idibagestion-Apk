import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Globe, MapPin, Hash, Building2, Sparkles,
  TrendingUp, Zap, Target, MessageSquare, ArrowRight,
  CheckCircle, AlertTriangle, Flame, Layers, Palette,
  Monitor, Megaphone, Video, Calendar, CheckSquare,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface VibeAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DetectedSignal {
  type: string;
  description: string;
  date: string;
  confidence: number;
}

interface RecommendedService {
  icon: React.ReactNode;
  name: string;
  description: string;
  fitScore: number;
}

interface AnalysisResult {
  brandMentions: number;
  sentimentScore: number;
  competitorMentions: string[];
  trendOpportunities: string[];
  signalScore: number;
  recommendedApproach: string;
  aiMessage: string;
  hashtags: string[];
  audienceFit: number;
  detectedSignals: DetectedSignal[];
  recommendedServices: RecommendedService[];
}

const IDIBA_SERVICES = [
  { icon: <Palette size={14} />, key: 'branding', name: 'Conception graphique', description: 'Branding, identite visuelle, logo, charte graphique, supports print' },
  { icon: <Monitor size={14} />, key: 'webdev', name: 'Developpement web & mobile', description: 'Sites web, applications, e-commerce, plateformes digitales' },
  { icon: <Megaphone size={14} />, key: 'marketing', name: 'Marketing digital', description: 'Strategie digitale, reseaux sociaux, SEO/SEA, Google Ads, content marketing' },
  { icon: <Video size={14} />, key: 'audiovisual', name: 'Production audiovisuelle', description: 'Video corporate, motion design, documentaire, shooting photo' },
  { icon: <Calendar size={14} />, key: 'events', name: 'Couverture evenementielle', description: 'Live streaming, teaser, reportage, captation multi-camera' },
];

const SIGNAL_TEMPLATES: Record<string, DetectedSignal[]> = {
  'Banque & Finance': [
    { type: 'hiring_intent', description: 'Recrutement de profiles marketing digital et community managers sur LinkedIn', date: 'il y a 3 jours', confidence: 92 },
    { type: 'tech_upgrade', description: 'Publication sur la modernisation de l\'experience client digitale', date: 'il y a 5 jours', confidence: 85 },
    { type: 'funding', description: 'Annonce d\'un budget communication 2025 en hausse de 30%', date: 'il y a 1 semaine', confidence: 95 },
  ],
  'Telecommunications': [
    { type: 'expansion', description: 'Lancement d\'un nouveau produit necessitant une campagne de lancement', date: 'il y a 2 jours', confidence: 90 },
    { type: 'hiring_intent', description: 'Recherche active de créatifs et motion designers', date: 'il y a 4 jours', confidence: 88 },
    { type: 'competitor_switch', description: 'Mention de l\'insatisfaction vis-a-vis de l\'agence actuelle sur les délais', date: 'il y a 6 jours', confidence: 78 },
  ],
  'Agroalimentaire': [
    { type: 'expansion', description: 'Nouveau produit en cours de developpement avec besoin de packaging', date: 'il y a 3 jours', confidence: 87 },
    { type: 'funding', description: 'Budget marketing augmente pour la saison festive', date: 'il y a 1 semaine', confidence: 91 },
    { type: 'pain_point', description: 'Faible engagement sur les reseaux sociaux mentionne publiquement', date: 'il y a 8 jours', confidence: 82 },
  ],
  'Energie': [
    { type: 'regulatory_change', description: 'Nouvelles exigences RSE demandant une communication externe', date: 'il y a 4 jours', confidence: 93 },
    { type: 'tech_upgrade', description: 'Modernisation du site web corporate en cours de reflexion', date: 'il y a 1 semaine', confidence: 79 },
    { type: 'hiring_intent', description: 'Recherche de responsable communication digitale', date: 'il y a 10 jours', confidence: 86 },
  ],
  'Immobilier': [
    { type: 'expansion', description: 'Nouveau projet immobilier annonce avec besoin de visibilité', date: 'il y a 2 jours', confidence: 94 },
    { type: 'tech_upgrade', description: 'Recherche de solutions de visites virtuelles et de showcase digital', date: 'il y a 5 jours', confidence: 89 },
    { type: 'funding', description: 'Budget promotion du projet approuvé', date: 'il y a 1 semaine', confidence: 90 },
  ],
  'default': [
    { type: 'hiring_intent', description: 'Recrutement de profiles créatifs et digitaux detecte sur LinkedIn', date: 'il y a 3 jours', confidence: 85 },
    { type: 'tech_upgrade', description: 'Mentions de projets de modernisation digitale', date: 'il y a 6 jours', confidence: 80 },
    { type: 'pain_point', description: 'Expression de besoins non satisfaits en communication visuelle', date: 'il y a 9 jours', confidence: 75 },
  ],
};

export function VibeAnalyzerModal({ isOpen, onClose }: VibeAnalyzerModalProps) {
  const { showToast } = useUIStore();
  const [step, setStep] = useState<'form' | 'analyzing' | 'results'>('form');
  const [formData, setFormData] = useState({
    brandName: '',
    sector: '',
    socialHandle: '',
    website: '',
    targetMarket: '',
  });
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const getServicesForSector = (sector: string): RecommendedService[] => {
    const serviceMap: Record<string, string[]> = {
      'Banque & Finance': ['branding', 'webdev', 'marketing', 'audiovisual'],
      'Telecommunications': ['marketing', 'audiovisual', 'branding', 'webdev'],
      'Agroalimentaire': ['branding', 'audiovisual', 'marketing', 'events'],
      'Energie': ['audiovisual', 'branding', 'webdev', 'marketing'],
      'Immobilier': ['webdev', 'audiovisual', 'marketing', 'branding'],
      'Sante': ['branding', 'webdev', 'audiovisual', 'marketing'],
      'Education': ['webdev', 'audiovisual', 'branding', 'marketing'],
      'Commerce & Distribution': ['marketing', 'webdev', 'branding', 'events'],
      'Administration Publique': ['audiovisual', 'branding', 'webdev', 'events'],
      'Technologie & IT': ['webdev', 'marketing', 'branding', 'audiovisual'],
      'Media & Communication': ['audiovisual', 'branding', 'events', 'marketing'],
      'Logistique & Transport': ['branding', 'webdev', 'marketing', 'audiovisual'],
    };
    const keys = serviceMap[sector] || ['branding', 'marketing', 'webdev', 'audiovisual'];
    return keys.map((key, i) => {
      const svc = IDIBA_SERVICES.find(s => s.key === key)!;
      return { ...svc, fitScore: Math.floor(95 - i * 8) };
    });
  };

  const handleAnalyze = () => {
    if (!formData.brandName || !formData.sector) {
      showToast('Veuillez remplir au moins le nom de la marque et le secteur', 'warning');
      return;
    }
    setStep('analyzing');

    setTimeout(() => {
      const signals = SIGNAL_TEMPLATES[formData.sector] || SIGNAL_TEMPLATES['default'];
      const services = getServicesForSector(formData.sector);
      const mockResult: AnalysisResult = {
        brandMentions: Math.floor(Math.random() * 500) + 50,
        sentimentScore: Math.floor(Math.random() * 30) + 65,
        competitorMentions: ['Agence concurrente A', 'Agence concurrente B', 'Freelance populaire'],
        trendOpportunities: [
          `${formData.sector} : forte croissance des discussions sur LinkedIn (+${Math.floor(Math.random() * 40) + 15}%)`,
          `Hashtag #${formData.sector.replace(/\s+/g, '')}Africa en tendance dans ${formData.targetMarket || 'la CEMAC'}`,
          `Opportunite partenariat detectee avec ${Math.floor(Math.random() * 5) + 2} influenceurs du secteur`,
        ],
        signalScore: Math.floor(Math.random() * 40) + 55,
        recommendedApproach: `Approche consultative pour ${formData.brandName}. Le segment ${formData.sector.toLowerCase()} est receptif aux portfolios creatifs et aux demonstrations concretes. Privilegiez un message centre sur les resultats mesurables et les references sectorielles.`,
        aiMessage: generateAIMessage(formData, services),
        hashtags: [`#${formData.brandName.replace(/\s+/g, '')}`, `#${formData.sector.replace(/\s+/g, '')}CEMAC`, `#Digital${formData.targetMarket || 'Africa'}`, '#Innovation', '#MarketingDigital'],
        audienceFit: Math.floor(Math.random() * 25) + 70,
        detectedSignals: signals,
        recommendedServices: services,
      };
      setResult(mockResult);
      setStep('results');
      showToast('Analyse Vibe Prospecting terminee', 'success');
    }, 3000);
  };

  const generateAIMessage = (data: typeof formData, services: RecommendedService[]) => {
    const topServices = services.slice(0, 3).map(s => s.name.toLowerCase()).join(', ');
    return `Bonjour,

J'ai suivi avec interet l'evolution de ${data.brandName} dans le secteur ${data.sector.toLowerCase()}. Votre positionnement est remarquable et vos recentes initiatives digitales sont inspirantes.

Chez IDIBA Group SARL, nous sommes une agence creative et marketing specialisee en ${topServices}. Nous accompagnons les entreprises leaders comme la votre pour renforcer leur presence digitale et creer un impact visuel memorable.

Nous avons recemment accompagne des acteurs du ${data.sector.toLowerCase()} avec des resultats concluants : +40% d'engagement social, +25% de leads qualifiés en moyenne.

Seriez-vous ouvert a un echange de 15 minutes pour explorer comment IDIBA Group pourrait collaborer avec ${data.brandName} ?

Cordialement,
L'equipe IDIBA Group SARL`;
  };

  const copyMessage = () => {
    if (result?.aiMessage) {
      navigator.clipboard.writeText(result.aiMessage);
      showToast('Message copie', 'success');
    }
  };

  const reset = () => {
    setStep('form');
    setFormData({ brandName: '', sector: '', socialHandle: '', website: '', targetMarket: '' });
    setResult(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[60] flex justify-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-2xl h-full bg-[var(--bg-card)] border-l border-[var(--glass-border)] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--divider)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Analyseur Vibe Prospecting</h2>
                <p className="text-xs text-[var(--text-muted)]">Analyse IA d&apos;un prospect en temps reel</p>
              </div>
            </div>
            <button onClick={() => { onClose(); reset(); }} className="p-2 rounded-lg hover:bg-white/5 text-[var(--text-muted)]">
              <X size={18} />
            </button>
          </div>

          {/* Step 1: Form */}
          {step === 'form' && (
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-1.5">
                    <Building2 size={14} className="text-[var(--accent-primary)]" />
                    Nom de la marque / entreprise <span className="text-[var(--accent-danger)]">*</span>
                  </label>
                  <input
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full h-10 px-3 glass-input text-sm"
                    placeholder="Ex: Societe Generale Cameroun"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-1.5">
                    <Target size={14} className="text-[var(--accent-primary)]" />
                    Secteur d&apos;activites <span className="text-[var(--accent-danger)]">*</span>
                  </label>
                  <select
                    value={formData.sector}
                    onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                    className="w-full h-10 px-3 glass-input text-sm"
                  >
                    <option value="">Selectionner...</option>
                    <option value="Banque & Finance">Banque & Finance</option>
                    <option value="Telecommunications">Telecommunications</option>
                    <option value="Agroalimentaire">Agroalimentaire</option>
                    <option value="Energie">Energie</option>
                    <option value="Logistique & Transport">Logistique & Transport</option>
                    <option value="Immobilier">Immobilier</option>
                    <option value="Sante">Sante</option>
                    <option value="Education">Education</option>
                    <option value="Commerce & Distribution">Commerce & Distribution</option>
                    <option value="Administration Publique">Administration Publique</option>
                    <option value="Technologie & IT">Technologie & IT</option>
                    <option value="Media & Communication">Media & Communication</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-1.5">
                    <Hash size={14} className="text-[var(--accent-secondary)]" />
                    Handle reseaux sociaux
                  </label>
                  <input
                    value={formData.socialHandle}
                    onChange={(e) => setFormData({ ...formData, socialHandle: e.target.value })}
                    className="w-full h-10 px-3 glass-input text-sm"
                    placeholder="Ex: @SocieteGeneraleCM"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-1.5">
                    <Globe size={14} className="text-[var(--accent-secondary)]" />
                    Site web / domaine
                  </label>
                  <input
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full h-10 px-3 glass-input text-sm"
                    placeholder="Ex: www.societegenerale.cm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-1.5">
                    <MapPin size={14} className="text-[var(--accent-warning)]" />
                    Pays ou marche cible
                  </label>
                  <select
                    value={formData.targetMarket}
                    onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })}
                    className="w-full h-10 px-3 glass-input text-sm"
                  >
                    <option value="">Selectionner...</option>
                    <option value="Cameroun">Cameroun</option>
                    <option value="Cote d&apos;Ivoire">Cote d&apos;Ivoire</option>
                    <option value="Senegal">Senegal</option>
                    <option value="CEMAC (Zone)">CEMAC (Zone)</option>
                    <option value="UEMOA (Zone)">UEMOA (Zone)</option>
                    <option value="Afrique Centrale">Afrique Centrale</option>
                    <option value="Afrique de l&apos;Ouest">Afrique de l&apos;Ouest</option>
                  </select>
                </div>
              </div>
              <div className="glass-card-compact p-3 bg-[var(--accent-primary)]/5 flex items-start gap-2">
                <Layers size={14} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[var(--text-secondary)]">
                  L&apos;analyseur identifie les <strong>signaux d&apos;achat recents</strong>, les <strong>services IDIBA Group adaptes</strong> au prospect, et genere un <strong>message d&apos;approche IA</strong> personnalise.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                <button onClick={handleAnalyze} disabled={!formData.brandName || !formData.sector} className="flex-1 btn-primary h-10 justify-center gap-2 disabled:opacity-50">
                  <Search size={14} /> Lancer l&apos;analyse
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Analyzing */}
          {step === 'analyzing' && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent mb-6" />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Analyse en cours...</h3>
              <p className="text-sm text-[var(--text-muted)] max-w-md">
                Notre IA analyse <strong className="text-[var(--text-primary)]">{formData.brandName}</strong> dans le secteur <strong className="text-[var(--text-primary)]">{formData.sector}</strong> pour detecter les signaux d&apos;achat et identifier les services IDIBA Group adaptes.
              </p>
              <div className="mt-6 space-y-2 w-full max-w-sm">
                {[
                  'Scraping des reseaux sociaux...',
                  'Analyse de sentiment & mentions...',
                  'Detection des signaux d\'achat recents...',
                  'Matching avec les services IDIBA Group...',
                  'Generation du message personnalise...',
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
              {/* Prospect Summary */}
              <div className="glass-card-compact p-4 bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-primary-hover)]/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white font-bold text-lg">
                    {formData.brandName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[var(--text-primary)]">{formData.brandName}</h3>
                    <p className="text-xs text-[var(--text-muted)]">{formData.sector} {formData.targetMarket && `· ${formData.targetMarket}`}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-2xl font-bold text-[var(--accent-primary)]">{result.signalScore}%</p>
                    <p className="text-[10px] text-[var(--text-muted)]">Score opportunite</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                    <p className="text-lg font-bold text-[var(--text-primary)]">{result.brandMentions}</p>
                    <p className="text-[9px] text-[var(--text-muted)]">Mentions</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                    <p className="text-lg font-bold text-[var(--text-primary)]">{result.sentimentScore}%</p>
                    <p className="text-[9px] text-[var(--text-muted)]">Sentiment</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                    <p className="text-lg font-bold text-[var(--text-primary)]">{result.audienceFit}%</p>
                    <p className="text-[9px] text-[var(--text-muted)]">Adapte audience</p>
                  </div>
                </div>
              </div>

              {/* Detected Buy Signals */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Flame size={14} className="text-[var(--accent-danger)]" /> Signaux d&apos;achat recents detectes
                </h4>
                <div className="space-y-2">
                  {result.detectedSignals.map((sig, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-elevated)]">
                      <div className="w-8 h-8 rounded-lg bg-[var(--accent-danger)]/10 flex items-center justify-center shrink-0">
                        <AlertTriangle size={14} className="text-[var(--accent-danger)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-medium uppercase">{sig.type.replace('_', ' ')}</span>
                          <span className="text-[9px] text-[var(--text-muted)]">{sig.date}</span>
                          <span className="text-[9px] text-[var(--accent-primary)] ml-auto">{sig.confidence}% confiance</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{sig.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended IDIBA Services */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Layers size={14} className="text-[var(--accent-primary)]" /> Services IDIBA Group recommandes
                </h4>
                <div className="space-y-2">
                  {result.recommendedServices.map((svc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/10">
                      <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] shrink-0">
                        {svc.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-semibold text-[var(--text-primary)]">{svc.name}</p>
                          <div className="flex-1 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden max-w-[80px]">
                            <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${svc.fitScore}%` }} />
                          </div>
                          <span className="text-[9px] text-[var(--accent-primary)] font-medium">{svc.fitScore}% fit</span>
                        </div>
                        <p className="text-[10px] text-[var(--text-secondary)]">{svc.description}</p>
                      </div>
                      <CheckSquare size={14} className="text-[var(--accent-primary)] shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Trend Opportunities */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[var(--accent-primary)]" /> Opportunités de marché
                </h4>
                <div className="space-y-2">
                  {result.trendOpportunities.map((opp, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--bg-elevated)]">
                      <ArrowRight size={12} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
                      <p className="text-xs text-[var(--text-secondary)]">{opp}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hashtags */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Hash size={14} className="text-[var(--accent-secondary)]" /> Hashtags recommandes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {result.hashtags.map((h, i) => (
                    <span key={i} className="text-xs bg-[var(--bg-elevated)] text-[var(--text-primary)] px-2 py-1 rounded flex items-center gap-1">
                      <Hash size={10} className="text-[var(--text-muted)]" />{h}
                    </span>
                  ))}
                </div>
              </div>

              {/* AI Generated Message */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                    <MessageSquare size={14} className="text-[var(--accent-primary)]" /> Message d&apos;approche IA
                  </h4>
                  <button onClick={copyMessage} className="text-[10px] text-[var(--accent-secondary)] hover:underline flex items-center gap-1">
                    <Sparkles size={10} /> Copier
                  </button>
                </div>
                <div className="bg-[var(--bg-elevated)] rounded-lg p-4 border border-[var(--glass-border)]">
                  <pre className="text-xs text-[var(--text-primary)] whitespace-pre-line leading-relaxed font-sans">{result.aiMessage}</pre>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[10px] text-[var(--text-muted)]">Score de personnalisation: <strong className="text-[var(--accent-primary)]">92%</strong></span>
                  <span className="text-[10px] text-[var(--text-muted)]">Ton: <strong className="text-[var(--accent-secondary)]">Professionnel consultatif</strong></span>
                </div>
              </div>

              {/* Recommended Approach */}
              <div className="glass-card-compact p-3 bg-[var(--accent-primary)]/5">
                <div className="flex items-start gap-2">
                  <Zap size={12} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase mb-0.5">Approche recommandee</p>
                    <p className="text-xs text-[var(--text-primary)]">{result.recommendedApproach}</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={reset} className="flex-1 btn-ghost h-10 justify-center gap-1.5 text-xs">
                  <Search size={12} /> Nouvelle analyse
                </button>
                <button onClick={copyMessage} className="flex-1 btn-primary h-10 justify-center gap-1.5 text-xs">
                  <Sparkles size={12} /> Utiliser ce message
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
