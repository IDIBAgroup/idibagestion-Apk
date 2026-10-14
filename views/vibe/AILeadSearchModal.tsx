import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Search, X, Building2, MapPin, Briefcase, Users,
  Globe, Target, Star, Mail, Phone, TrendingUp, Check, Loader2,
  Filter, Download, Save, Flame, Snowflake, Thermometer,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { addAndNotify } from '@/lib/db';
import { useUIStore } from '@/stores/uiStore';

interface AILeadResult {
  id: string;
  fullName: string;
  position: string;
  company: string;
  industry: string;
  companySize: string;
  country: string;
  city: string;
  email: string;
  phone: string;
  linkedInUrl: string;
  website: string;
  score: number;
  temperature: 'hot' | 'warm' | 'cold';
  source: string;
  estimatedValue: number;
  aiReason: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const INDUSTRIES = [
  'Tous', 'Agroalimentaire', 'Télécommunications', 'Banque & Finance', 'Énergie',
  'Transport & Logistique', 'Immobilier', 'Santé', 'Éducation', 'Technologie',
  'Commerce de gros', 'Hôtellerie & Tourisme', 'Construction', 'Média & Publicité',
];

const COUNTRIES = [
  'Tous', 'Cameroun', 'Côte d\'Ivoire', 'Sénégal', 'Gabon', 'Togo', 'Bénin',
  'RDC', 'Congo', 'Tchad', 'Guinée', 'Mali', 'Burkina Faso', 'Niger',
];

const COMPANY_SIZES = [
  'Toutes', '1-10 employés', '11-50 employés', '51-200 employés', '201-500 employés', '500+ employés',
];

const POSITIONS = [
  'Tous', 'Directeur Général', 'Directeur Commercial', 'Directeur IT', 'Directeur Marketing',
  'Responsable Achats', 'Responsable RH', 'Chef de Projet', 'Développeur', 'Consultant',
];

// Simulated AI-found leads
const MOCK_AI_LEADS: AILeadResult[] = [
  { id: 'ai-1', fullName: 'Alain Mballa', position: 'Directeur Commercial', company: 'Agro Cameroun SARL', industry: 'Agroalimentaire', companySize: '51-200 employés', country: 'Cameroun', city: 'Yaoundé', email: 'a.mballa@agrocameroun.cm', phone: '+237 677 88 99 00', linkedInUrl: 'linkedin.com/in/alain-mballa', website: 'agrocameroun.cm', score: 92, temperature: 'hot', source: 'ia_research', estimatedValue: 12500000, aiReason: 'Achat récent de 3 parcelles — expansion imminente. Budget alloué à la digitalisation.' },
  { id: 'ai-2', fullName: 'Sophie Nkolo', position: 'Directrice IT', company: 'Tech Afrique Group', industry: 'Technologie', companySize: '201-500 employés', country: 'Cameroun', city: 'Douala', email: 's.nkolo@techafrique.cm', phone: '+237 699 12 34 56', linkedInUrl: 'linkedin.com/in/sophie-nkolo', website: 'techafrique.cm', score: 87, temperature: 'hot', source: 'ia_research', estimatedValue: 35000000, aiReason: 'Recrutement massif de développeurs (45 offres actives). Besoin évident en infrastructure.' },
  { id: 'ai-3', fullName: 'Jean-Paul Eto\'o', position: 'Responsable Marketing', company: 'Hôtel Plage Dorée', industry: 'Hôtellerie & Tourisme', companySize: '51-200 employés', country: 'Cameroun', city: 'Kribi', email: 'jp.etoo@plagedoree.cm', phone: '+237 233 45 67 89', linkedInUrl: 'linkedin.com/in/jp-etoo', website: 'plagedoree.cm', score: 71, temperature: 'warm', source: 'ia_research', estimatedValue: 8000000, aiReason: 'Rénovation complète annoncée sur les réseaux. Recherche active de prestataires design.' },
  { id: 'ai-4', fullName: 'Grace Abena', position: 'Directrice Générale', company: 'MediPlus Santé', industry: 'Santé', companySize: '11-50 employés', country: 'Cameroun', city: 'Bafoussam', email: 'g.abena@mediplus.cm', phone: '+237 676 55 44 33', linkedInUrl: 'linkedin.com/in/grace-abena', website: 'mediplus.cm', score: 95, temperature: 'hot', source: 'ia_research', estimatedValue: 22000000, aiReason: 'Ouverture de 2 nouvelles cliniques. Contrat cadre à établir. Décision rapide.' },
  { id: 'ai-5', fullName: 'Koffi Mensah', position: 'Directeur Achats', company: 'Ciment du Congo', industry: 'Construction', companySize: '500+ employés', country: 'Congo', city: 'Pointe-Noire', email: 'k.mensah@cimentcongo.cg', phone: '+242 05 555 66 77', linkedInUrl: 'linkedin.com/in/koffi-mensah', website: 'cimentcongo.cg', score: 78, temperature: 'warm', source: 'ia_research', estimatedValue: 45000000, aiReason: 'Appel d\'offres publié pour rebranding. Délai court (60 jours). Très réactif.' },
  { id: 'ai-6', fullName: 'Aminata Diallo', position: 'Responsable Communication', company: 'Orange Côte d\'Ivoire', industry: 'Télécommunications', companySize: '500+ employés', country: 'Côte d\'Ivoire', city: 'Abidjan', email: 'a.diallo@orange.ci', phone: '+225 07 08 09 10 11', linkedInUrl: 'linkedin.com/in/aminata-diallo', website: 'orange.ci', score: 65, temperature: 'cold', source: 'ia_research', estimatedValue: 18000000, aiReason: 'Processus d\'achat long mais budget annuel confirmé. Suivi recommandé.' },
  { id: 'ai-7', fullName: 'Bernard Faye', position: 'Directeur Général', company: 'Sénégal Logistique', industry: 'Transport & Logistique', companySize: '201-500 employés', country: 'Sénégal', city: 'Dakar', email: 'b.faye@senlog.sn', phone: '+221 77 123 45 67', linkedInUrl: 'linkedin.com/in/bernard-faye', website: 'senlog.sn', score: 83, temperature: 'warm', source: 'ia_research', estimatedValue: 15000000, aiReason: 'Partenariat avec IDIBAGES évoqué sur LinkedIn. Opportunité chaude à saisir.' },
  { id: 'ai-8', fullName: 'Claire Nguema', position: 'Chef de Projet Digital', company: 'Banque Gabonaise', industry: 'Banque & Finance', companySize: '500+ employés', country: 'Gabon', city: 'Libreville', email: 'c.nguema@banquegabon.ga', phone: '+241 06 22 33 44', linkedInUrl: 'linkedin.com/in/claire-nguema', website: 'banquegabon.ga', score: 89, temperature: 'hot', source: 'ia_research', estimatedValue: 30000000, aiReason: 'Lancement imminant d\'une app mobile. Budget validé en CA. Décisionnelle directe.' },
  { id: 'ai-9', fullName: 'Marc Zou', position: 'Directeur IT', company: 'Énergie du Tchad', industry: 'Énergie', companySize: '201-500 employés', country: 'Tchad', city: 'N\'Djamena', email: 'm.zou@energietchad.td', phone: '+235 66 77 88 99', linkedInUrl: 'linkedin.com/in/marc-zou', website: 'energietchad.td', score: 74, temperature: 'warm', source: 'ia_research', estimatedValue: 28000000, aiReason: 'Modernisation des systèmes ERP. Phase d\'appel d\'offres en cours.' },
  { id: 'ai-10', fullName: 'Fatima Touré', position: 'Responsable RH', company: 'École Supérieure Polytechnique', industry: 'Éducation', companySize: '51-200 employés', country: 'Mali', city: 'Bamako', email: 'f.toure@esp.edu.ml', phone: '+223 76 55 44 33', linkedInUrl: 'linkedin.com/in/fatima-toure', website: 'esp.edu.ml', score: 68, temperature: 'cold', source: 'ia_research', estimatedValue: 5000000, aiReason: 'Besoin en formation digitale. Budget modeste mais récurrent annuel.' },
  { id: 'ai-11', fullName: 'Pierre Koné', position: 'Directeur Commercial', company: 'Immobilier Abidjan', industry: 'Immobilier', companySize: '11-50 employés', country: 'Côte d\'Ivoire', city: 'Abidjan', email: 'p.kone@immobilier.ci', phone: '+225 05 44 33 22 11', linkedInUrl: 'linkedin.com/in/pierre-kone', website: 'immobilier.ci', score: 81, temperature: 'warm', source: 'ia_research', estimatedValue: 12000000, aiReason: 'Nouveau programme de 200 logements. Besoin branding + site web + campagnes.' },
  { id: 'ai-12', fullName: 'Rose Kaboré', position: 'Directrice Marketing', company: 'Média Burkina', industry: 'Média & Publicité', companySize: '51-200 employés', country: 'Burkina Faso', city: 'Ouagadougou', email: 'r.kabore@mediabf.bf', phone: '+226 70 11 22 33', linkedInUrl: 'linkedin.com/in/rose-kabore', website: 'mediabf.bf', score: 76, temperature: 'warm', source: 'ia_research', estimatedValue: 9000000, aiReason: 'Lancement d\'une chaîne TV digitale. Recherche partenaire technique.' },
];

export function AILeadSearchModal({ isOpen, onClose }: Props) {
  const { showToast } = useUIStore();
  const [query, setQuery] = useState('');
  const [industry, setIndustry] = useState('Tous');
  const [country, setCountry] = useState('Tous');
  const [companySize, setCompanySize] = useState('Toutes');
  const [position, setPosition] = useState('Tous');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const filteredResults = useMemo(() => {
    return MOCK_AI_LEADS.filter(l => {
      if (industry !== 'Tous' && l.industry !== industry) return false;
      if (country !== 'Tous' && l.country !== country) return false;
      if (companySize !== 'Toutes' && l.companySize !== companySize) return false;
      if (position !== 'Tous' && !l.position.toLowerCase().includes(position.toLowerCase())) return false;
      if (query && !l.fullName.toLowerCase().includes(query.toLowerCase()) && !l.company.toLowerCase().includes(query.toLowerCase()) && !l.industry.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, industry, country, companySize, position]);

  const handleSearch = () => {
    setIsSearching(true);
    setHasSearched(false);
    setSelectedIds(new Set());
    setTimeout(() => {
      setIsSearching(false);
      setHasSearched(true);
    }, 1800);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredResults.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredResults.map(l => l.id)));
    }
  };

  const saveLeads = (leads: AILeadResult[]) => {
    let saved = 0;
    leads.forEach(lead => {
      const dbLead = {
        id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fullName: lead.fullName,
        company: lead.company,
        position: lead.position,
        email: lead.email,
        phone: lead.phone,
        industry: lead.industry,
        country: lead.country,
        city: lead.city,
        source: 'scraping' as const,
        status: 'new' as const,
        score: lead.score,
        temperature: lead.temperature,
        signals: [lead.aiReason.slice(0, 60)],
        lastActivity: new Date().toISOString(),
        assignedTo: '',
        assignedToName: 'Non assigné',
        notes: `Lead trouvé via IA. Raison : ${lead.aiReason}\nSite : ${lead.website}\nLinkedIn : ${lead.linkedInUrl}`,
        tags: ['ia', lead.temperature, lead.industry.toLowerCase().replace(/\s/g, '_')],
        estimatedValue: lead.estimatedValue,
        currency: 'XAF',
        createdAt: new Date().toISOString(),
        companyId: 'comp-1',
      };
      addAndNotify('leads', dbLead);
      saved++;
    });
    showToast(`${saved} lead${saved > 1 ? 's' : ''} enregistré${saved > 1 ? 's' : ''} avec succès`, 'success');
    setSelectedIds(new Set());
  };

  const saveOne = (lead: AILeadResult) => {
    saveLeads([lead]);
  };

  const scoreColor = (score: number) => score >= 80 ? 'text-[var(--accent-primary)]' : score >= 50 ? 'text-[var(--accent-warning)]' : 'text-[var(--accent-secondary)]';

  const temperatureIcon = (temp: string) => {
    if (temp === 'hot') return <Flame size={12} className="text-red-400" />;
    if (temp === 'warm') return <Thermometer size={12} className="text-amber-400" />;
    return <Snowflake size={12} className="text-blue-400" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-5xl h-[100dvh] bg-[var(--bg-card)] flex flex-col border-l border-[var(--divider)] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--divider)] shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Recherche IA de Leads</h2>
                  <p className="text-[11px] sm:text-xs text-[var(--text-muted)]">Intelligence artificielle — style Apollo</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 transition-colors">
                <X size={20} className="text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 sm:p-5 border-b border-[var(--divider)] shrink-0 space-y-3">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder="Rechercher par nom, entreprise, secteur..."
                    className="w-full h-11 pl-9 pr-4 glass-input text-sm rounded-xl"
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`h-11 px-3 rounded-xl border transition-colors flex items-center gap-2 text-sm ${showFilters ? 'bg-violet-500/10 border-violet-500/30 text-violet-400' : 'glass-input border-[var(--divider)] text-[var(--text-muted)]'}`}
                >
                  <Filter size={16} /> <span className="hidden sm:inline">Filtres</span>
                </button>
                <button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="h-11 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-60"
                >
                  {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  <span className="hidden sm:inline">{isSearching ? 'Recherche IA...' : 'Rechercher'}</span>
                </button>
              </div>

              {/* Filters */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Secteur</label>
                        <select value={industry} onChange={e => setIndustry(e.target.value)} className="w-full h-9 px-2 glass-input text-xs rounded-lg">
                          {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Pays</label>
                        <select value={country} onChange={e => setCountry(e.target.value)} className="w-full h-9 px-2 glass-input text-xs rounded-lg">
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Taille</label>
                        <select value={companySize} onChange={e => setCompanySize(e.target.value)} className="w-full h-9 px-2 glass-input text-xs rounded-lg">
                          {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Poste</label>
                        <select value={position} onChange={e => setPosition(e.target.value)} className="w-full h-9 px-2 glass-input text-xs rounded-lg">
                          {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {!hasSearched && !isSearching && (
                <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)]">
                  <div className="w-20 h-20 rounded-full bg-violet-500/10 flex items-center justify-center mb-4">
                    <Target size={36} className="text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Recherche intelligente de leads</p>
                  <p className="text-xs text-center max-w-sm">Définissez vos critères et laissez l'IA découvrir des prospects qualifiés pour vous.</p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {['Directeurs commerciaux', 'Startups tech', 'Grands groupes', 'PME en croissance'].map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--divider)] text-[var(--text-muted)]">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              {isSearching && (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="relative mb-4">
                    <div className="w-16 h-16 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                    <Sparkles size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-400" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)] animate-pulse">Analyse IA en cours...</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Scan des bases de données · Scoring · Qualification</p>
                  <div className="w-48 h-1.5 rounded-full bg-[var(--bg-elevated)] mt-4 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.8, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}

              {hasSearched && (
                <div className="space-y-3">
                  {/* Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={selectAll} className="text-xs flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/5 text-[var(--text-muted)] transition-colors">
                        {selectedIds.size === filteredResults.length && filteredResults.length > 0 ? <Check size={14} className="text-violet-400" /> : <div className="w-3.5 h-3.5 rounded border border-[var(--divider)]" />}
                        <span>Tout sélectionner</span>
                      </button>
                      <span className="text-[10px] text-[var(--text-muted)]">{filteredResults.length} résultat{filteredResults.length > 1 ? 's' : ''}</span>
                    </div>
                    {selectedIds.size > 0 && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => saveLeads(filteredResults.filter(l => selectedIds.has(l.id)))}
                        className="h-8 px-3 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition-opacity"
                      >
                        <Save size={14} /> Enregistrer {selectedIds.size} lead{selectedIds.size > 1 ? 's' : ''}
                      </motion.button>
                    )}
                  </div>

                  {/* Cards */}
                  {filteredResults.map((lead, idx) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <GlassCard>
                        <div className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                            {/* Avatar + Select */}
                            <div className="flex items-center gap-2">
                              <button onClick={() => toggleSelect(lead.id)} className="shrink-0">
                                {selectedIds.has(lead.id) ? (
                                  <div className="w-5 h-5 rounded bg-violet-500 flex items-center justify-center">
                                    <Check size={12} className="text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded border border-[var(--divider)] hover:border-violet-500/50 transition-colors" />
                                )}
                              </button>
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                                {lead.fullName.charAt(0)}
                              </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{lead.fullName}</h3>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] text-[var(--text-muted)]">{lead.position}</span>
                                <div className="flex items-center gap-1">
                                  {temperatureIcon(lead.temperature)}
                                  <span className={`text-[10px] font-bold ${scoreColor(lead.score)}`}>{lead.score}</span>
                                </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-[var(--text-muted)] mb-2">
                                <span className="flex items-center gap-1"><Building2 size={11} />{lead.company}</span>
                                <span className="flex items-center gap-1"><MapPin size={11} />{lead.city}, {lead.country}</span>
                                <span className="flex items-center gap-1"><Users size={11} />{lead.companySize}</span>
                                <span className="flex items-center gap-1"><Briefcase size={11} />{lead.industry}</span>
                              </div>

                              {/* AI Reason */}
                              <div className="p-2.5 rounded-lg bg-violet-500/5 border border-violet-500/10 mb-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Sparkles size={10} className="text-violet-400" />
                                  <span className="text-[10px] font-medium text-violet-400 uppercase">Analyse IA</span>
                                </div>
                                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{lead.aiReason}</p>
                              </div>

                              {/* Contact row */}
                              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                                <span className="flex items-center gap-1 text-[var(--text-secondary)]"><Mail size={11} className="text-[var(--text-muted)]" />{lead.email}</span>
                                <span className="flex items-center gap-1 text-[var(--text-secondary)]"><Phone size={11} className="text-[var(--text-muted)]" />{lead.phone}</span>
                                <span className="flex items-center gap-1 text-[var(--text-secondary)]"><Globe size={11} className="text-[var(--text-muted)]" />{lead.website}</span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-row sm:flex-col items-center gap-2 shrink-0">
                              <button
                                onClick={() => saveOne(lead)}
                                className="h-8 px-3 rounded-lg bg-violet-500/10 text-violet-400 text-xs font-medium hover:bg-violet-500/20 transition-colors flex items-center gap-1.5"
                              >
                                <Save size={14} /> Enregistrer
                              </button>
                              <span className="text-[10px] font-bold text-[var(--text-primary)]">
                                {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(lead.estimatedValue)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </GlassCard>
                    </motion.div>
                  ))}

                  {filteredResults.length === 0 && (
                    <div className="text-center py-10 text-[var(--text-muted)]">
                      <Search size={32} className="mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Aucun résultat trouvé</p>
                      <p className="text-xs">Essayez d'autres critères de recherche</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
