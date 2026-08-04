import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Globe, MapPin, Hash, Building2, Sparkles,
  TrendingUp, Zap, Target, MessageSquare, ArrowRight,
  Loader2, CheckCircle, AlertTriangle, Lightbulb,
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface VibeAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  contentIdeas: string[];
}

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

  const handleAnalyze = () => {
    if (!formData.brandName || !formData.sector) {
      showToast('Veuillez remplir au moins le nom de la marque et le secteur', 'warning');
      return;
    }
    setStep('analyzing');

    // Simulate AI analysis
    setTimeout(() => {
      const mockResult: AnalysisResult = {
        brandMentions: Math.floor(Math.random() * 500) + 50,
        sentimentScore: Math.floor(Math.random() * 30) + 65,
        competitorMentions: ['Orange Cameroun', 'MTN Cameroun', 'Societe Generale'],
        trendOpportunities: [
          `${formData.sector} : forte croissance des discussions sur LinkedIn (+${Math.floor(Math.random() * 40) + 15}%)`,
          `Hashtag #${formData.sector.replace(/\s+/g, '')}Africa en tendance dans ${formData.targetMarket || 'la CEMAC'}`,
          `Opportunite partenariat detectee avec ${Math.floor(Math.random() * 5) + 2} influenceurs du secteur`,
        ],
        signalScore: Math.floor(Math.random() * 40) + 55,
        recommendedApproach: `Approche consultative pour ${formData.brandName}. Le segment ${formData.sector.toLowerCase()} est receptif aux etudes de cas et aux demonstrations de ROI. Privilegiez un message centre sur les resultats mesurables.`,
        aiMessage: generateAIMessage(formData),
        hashtags: [`#${formData.brandName.replace(/\s+/g, '')}`, `#${formData.sector.replace(/\s+/g, '')}CEMAC`, `#Digital${formData.targetMarket || 'Africa'}`, '#Innovation', '#MarketingDigital'],
        audienceFit: Math.floor(Math.random() * 25) + 70,
        contentIdeas: [
          `Etude de cas : Comment ${formData.brandName} a transforme sa strategie ${formData.sector.toLowerCase()}`,
          `Infographie : Les 5 tendances ${formData.sector.toLowerCase()} en ${formData.targetMarket || 'Afrique Centrale'} pour 2025`,
          `Webinaire avec un expert du secteur ${formData.sector.toLowerCase()}`,
        ],
      };
      setResult(mockResult);
      setStep('results');
      showToast('Analyse Vibe Prospecting terminee', 'success');
    }, 3000);
  };

  const generateAIMessage = (data: typeof formData) => {
    return `Bonjour,

J'ai suivi avec interet l'evolution de ${data.brandName} dans le secteur ${data.sector.toLowerCase()}. Votre positionnement est remarquable.

IDIBA Group SARL accompagne les entreprises leaders comme la votre avec des solutions de marketing digital et de prospection intelligente basees sur l'IA. Nous avons aide des acteurs du ${data.sector.toLowerCase()} a augmenter leur pipeline commercial de 40% en moyenne.

Seriez-vous ouvert a un echange de 15 minutes pour explorer comment nous pourrions collaborer ?

Cordialement,
L'equipe IDIBA Group`;
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
        className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-2xl glass-card max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--divider)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                <Sparkles size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Analyseur Vibe Prospecting</h2>
                <p className="text-xs text-[var(--text-muted)]">Analyse IA d'un prospect en temps reel</p>
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
                {/* Brand Name */}
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

                {/* Sector */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm text-[var(--text-secondary)] mb-1.5">
                    <Target size={14} className="text-[var(--accent-primary)]" />
                    Secteur d'activites <span className="text-[var(--accent-danger)]">*</span>
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

                {/* Social Handle */}
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

                {/* Website */}
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

                {/* Target Market */}
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
                    <option value="Cote d'Ivoire">Cote d&apos;Ivoire</option>
                    <option value="Senegal">Senegal</option>
                    <option value="Gabon">Gabon</option>
                    <option value="Congo">Congo</option>
                    <option value="Tchad">Tchad</option>
                    <option value="RCA">RCA</option>
                    <option value="Guinee Equatoriale">Guinee Equatoriale</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="Ghana">Ghana</option>
                    <option value="CEMAC (Zone)">CEMAC (Zone)</option>
                    <option value="UEMOA (Zone)">UEMOA (Zone)</option>
                    <option value="Afrique Centrale">Afrique Centrale</option>
                    <option value="Afrique de l'Ouest">Afrique de l&apos;Ouest</option>
                  </select>
                </div>
              </div>

              {/* Quick Info */}
              <div className="glass-card-compact p-3 bg-[var(--accent-primary)]/5 flex items-start gap-2">
                <Lightbulb size={14} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
                <p className="text-[11px] text-[var(--text-secondary)]">
                  L&apos;analyseur Vibe Prospecting va scraper les reseaux sociaux, detecter les signaux d&apos;achat, analyser les tendances et generer un message d&apos;approche personnalise par IA.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={onClose} className="flex-1 btn-ghost h-10 justify-center">Annuler</button>
                <button
                  onClick={handleAnalyze}
                  disabled={!formData.brandName || !formData.sector}
                  className="flex-1 btn-primary h-10 justify-center gap-2 disabled:opacity-50"
                >
                  <Search size={14} /> Lancer l&apos;analyse
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Analyzing */}
          {step === 'analyzing' && (
            <div className="p-12 flex flex-col items-center justify-center text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent mb-6"
              />
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Analyse en cours...</h3>
              <p className="text-sm text-[var(--text-muted)] max-w-md">
                Notre IA analyse les donnees de <strong className="text-[var(--text-primary)]">{formData.brandName}</strong> sur les reseaux sociaux, detecte les signaux d&apos;achat et identifie les opportunites dans le secteur <strong className="text-[var(--text-primary)]">{formData.sector}</strong>.
              </p>
              <div className="mt-6 space-y-2 w-full max-w-sm">
                {[
                  'Scraping des reseaux sociaux...',
                  'Analyse de sentiment...',
                  'Detection des signaux d\'achat...',
                  'Identification des tendances...',
                  'Generation du message personnalise...',
                ].map((step, i) => (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.5 }}
                    className="flex items-center gap-2 text-xs text-[var(--text-secondary)]"
                  >
                    <CheckCircle size={12} className="text-[var(--accent-primary)]" />
                    {step}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 'results' && result && (
            <div className="p-6 space-y-5">
              {/* Prospect Summary */}
              <div className="glass-card-compact p-4 bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-secondary)]/5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white font-bold text-lg">
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

              {/* Trend Opportunities */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <TrendingUp size={14} className="text-[var(--accent-primary)]" /> Opportunites detectees
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

              {/* Competitor Mentions */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[var(--accent-warning)]" /> Concurrents mentionnes
                </h4>
                <div className="flex flex-wrap gap-2">
                  {result.competitorMentions.map((comp, i) => (
                    <span key={i} className="text-xs bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] px-2 py-1 rounded-full">{comp}</span>
                  ))}
                </div>
              </div>

              {/* Recommended Hashtags */}
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

              {/* Content Ideas */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                  <Lightbulb size={14} className="text-[var(--accent-purple)]" /> Idees de contenu
                </h4>
                <div className="space-y-2">
                  {result.contentIdeas.map((idea, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-[var(--accent-purple)]/5">
                      <span className="text-[10px] text-[var(--accent-purple)] font-bold shrink-0">{i + 1}.</span>
                      <p className="text-xs text-[var(--text-secondary)]">{idea}</p>
                    </div>
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
                  <span className="text-[10px] text-[var(--text-muted)]">Ton: <strong className="text-[var(--accent-secondary)]">Professionnel</strong></span>
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
