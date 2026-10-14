import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Filter, Users, Star, Mail, Linkedin, Phone, MapPin, Building2,
  Tag, ChevronDown, Plus, X, Download, Save, List, BarChart3, Target,
  Zap, Globe, Cpu, TrendingUp, ArrowUpRight, CheckCircle, Clock,
  Send, MessageSquare, Smartphone, Award, Layers, Trash2, Eye,
  Sparkles, Briefcase, DollarSign, Activity, MoreHorizontal,
  Play, Pause, Copy, Check, ChevronRight, RefreshCw, Upload,
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll, addAndNotify, updateAndNotify } from '@/lib/db';

// ============================================
// TYPES
// ============================================
interface Prospect {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  position: string;
  seniority: string;
  company: string;
  companySize: string;
  industry: string;
  country: string;
  city: string;
  technologies: string[];
  intentSignals: string[];
  score: number;
  enriched: boolean;
  source: string;
  lastActivity: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'engaged' | 'qualified' | 'customer';
  tags: string[];
  linkedinUrl?: string;
  revenue?: string;
  funding?: string;
}

interface Sequence {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  steps: SequenceStep[];
  prospectsCount: number;
  sentCount: number;
  openedCount: number;
  repliedCount: number;
  conversionRate: number;
  createdAt: string;
  channel: 'email' | 'linkedin' | 'phone' | 'multi';
}

interface SequenceStep {
  id: string;
  order: number;
  channel: 'email' | 'linkedin' | 'phone' | 'sms';
  delayDays: number;
  subject?: string;
  template: string;
  aiPersonalized: boolean;
}

interface SavedList {
  id: string;
  name: string;
  filters: Record<string, any>;
  count: number;
  createdAt: string;
}

// ============================================
// MOCK DATA GENERATOR
// ============================================
const INDUSTRIES = ['Technologie', 'Finance', 'Santé', 'Retail', 'Énergie', 'Télécoms', 'Agroalimentaire', 'Transport', 'Éducation', 'Immobilier'];
const COUNTRIES = ['Cameroun', 'Côte d\'Ivoire', 'Sénégal', 'Gabon', 'Tchad', 'RCA', 'Guinée', 'Mali', 'Burkina Faso', 'RDC'];
const CITIES: Record<string, string[]> = {
  'Cameroun': ['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda'],
  'Côte d\'Ivoire': ['Abidjan', 'Bouaké', 'San-Pédro'],
  'Sénégal': ['Dakar', 'Thiès', 'Saint-Louis'],
  'Gabon': ['Libreville', 'Port-Gentil'],
  'Tchad': ['N\'Djamena', 'Moundou'],
  'RCA': ['Bangui'],
  'Guinée': ['Conakry', 'Nzérékoré'],
  'Mali': ['Bamako', 'Sikasso'],
  'Burkina Faso': ['Ouagadougou', 'Bobo-Dioulasso'],
  'RDC': ['Kinshasa', 'Lubumbashi', 'Goma'],
};
const POSITIONS = ['CEO', 'Directeur Marketing', 'Directeur IT', 'Directeur Commercial', 'Responsable RH', 'CFO', 'CMO', 'CTO', 'Product Manager', 'Sales Manager'];
const SENIORITIES = ['Executive', 'Director', 'Manager', 'Senior', 'Entry'];
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];
const TECHNOLOGIES = ['Salesforce', 'HubSpot', 'Zoho', 'SAP', 'Oracle', 'Microsoft Dynamics', 'Slack', 'Google Workspace', 'AWS', 'Azure'];
const INTENT_SIGNALS = ['Recherche active', 'Visite site web', 'Download contenu', 'Changement dirigeant', 'Levée de fonds', 'Expansion', 'Projet IT', 'Appel d\'offres'];
const REVENUES = ['< 100M FCFA', '100M - 500M FCFA', '500M - 1Md FCFA', '1Md - 5Md FCFA', '> 5Md FCFA'];

function generateMockProspects(count: number): Prospect[] {
  const prospects: Prospect[] = [];
  const firstNames = ['Jean', 'Marie', 'Paul', 'Grace', 'Koffi', 'Amélie', 'Sarah', 'Martin', 'Ingrid', 'Abdou', 'Fatima', 'Emmanuel', 'Sophie', 'Brice', 'Aïcha'];
  const lastNames = ['Nkolo', 'Moussa', 'Mensah', 'Abena', 'Fouda', 'Biya', 'Tchuente', 'Essomba', 'Kamga', 'Ouattara', 'Diallo', 'Traoré', 'Sylla', 'Kone', 'Sow'];

  for (let i = 0; i < count; i++) {
    const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
    const cityList = CITIES[country] || ['Unknown'];
    const industry = INDUSTRIES[Math.floor(Math.random() * INDUSTRIES.length)];
    const techCount = Math.floor(Math.random() * 4) + 1;
    const technologies = Array.from(new Set(Array.from({ length: techCount }, () => TECHNOLOGIES[Math.floor(Math.random() * TECHNOLOGIES.length)])));
    const intentCount = Math.floor(Math.random() * 3);
    const intentSignals = intentCount > 0 ? Array.from(new Set(Array.from({ length: intentCount }, () => INTENT_SIGNALS[Math.floor(Math.random() * INTENT_SIGNALS.length)]))) : [];
    const fname = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lname = lastNames[Math.floor(Math.random() * lastNames.length)];

    prospects.push({
      id: `prospect-${i + 1}`,
      fullName: `${fname} ${lname}`,
      email: `${fname.toLowerCase()}.${lname.toLowerCase()}@${['gmail.com', 'yahoo.fr', 'entreprise.cm', 'societe.ci', 'company.sn'][Math.floor(Math.random() * 5)]}`,
      phone: `+237 6${Math.floor(Math.random() * 9)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
      position: POSITIONS[Math.floor(Math.random() * POSITIONS.length)],
      seniority: SENIORITIES[Math.floor(Math.random() * SENIORITIES.length)],
      company: `${['Société', 'Groupe', 'Entreprise', 'Corporation', 'Industries'][Math.floor(Math.random() * 5)]} ${['Africaine', 'Centrale', 'Digitale', 'Moderne', 'Innovante'][Math.floor(Math.random() * 5)]} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      companySize: COMPANY_SIZES[Math.floor(Math.random() * COMPANY_SIZES.length)],
      industry,
      country,
      city: cityList[Math.floor(Math.random() * cityList.length)],
      technologies,
      intentSignals,
      score: Math.floor(Math.random() * 60) + 40,
      enriched: Math.random() > 0.5,
      source: ['Apollo DB', 'LinkedIn', 'Import', 'Event', 'Referral'][Math.floor(Math.random() * 5)],
      lastActivity: new Date(Date.now() - Math.floor(Math.random() * 30) * 86400000).toISOString(),
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 90) * 86400000).toISOString(),
      status: ['new', 'new', 'new', 'contacted', 'engaged', 'qualified'][Math.floor(Math.random() * 6)] as any,
      tags: [],
      linkedinUrl: '#',
      revenue: REVENUES[Math.floor(Math.random() * REVENUES.length)],
      funding: Math.random() > 0.7 ? ['Série A', 'Série B', 'Amorçage', 'Bootstrapped'][Math.floor(Math.random() * 4)] : undefined,
    });
  }
  return prospects;
}

// ============================================
// MAIN COMPONENT
// ============================================
export function VibeProspectingPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const [activeTab, setActiveTab] = useState<'search' | 'sequences' | 'lists' | 'analytics'>('search');
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [sequences, setSequences] = useState<Sequence[]>([]);
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [selectedProspects, setSelectedProspects] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [showSequenceModal, setShowSequenceModal] = useState(false);
  const [showProspectDetail, setShowProspectDetail] = useState<Prospect | null>(null);
  const [showCreateSequence, setShowCreateSequence] = useState(false);
  const [showSaveList, setShowSaveList] = useState(false);
  const [listName, setListName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [enriching, setEnriching] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState({
    industry: '',
    companySize: '',
    country: '',
    seniority: '',
    position: '',
    technology: '',
    intentSignal: '',
    scoreMin: '',
    scoreMax: '',
    status: '',
    enriched: '',
  });

  // New sequence form
  const [newSequence, setNewSequence] = useState({
    name: '',
    channel: 'email' as 'email' | 'linkedin' | 'phone' | 'multi',
    steps: [{ id: 'step-1', order: 1, channel: 'email' as const, delayDays: 0, subject: '', template: '', aiPersonalized: true }],
  });

  useEffect(() => {
    setCurrentPageTitle('Prospection');
    // Load or generate prospects
    const stored = getAll('prospects') as Prospect[];
    if (stored.length === 0) {
      const generated = generateMockProspects(50);
      generated.forEach(p => addAndNotify('prospects', p));
      setProspects(generated);
    } else {
      setProspects(stored);
    }

    // Load sequences
    const storedSeq = getAll('sequences') as Sequence[];
    if (storedSeq.length === 0) {
      const defaultSeq: Sequence[] = [
        {
          id: 'seq-1', name: 'Séquence Bienvenue Email', status: 'active', prospectsCount: 24, sentCount: 96, openedCount: 48, repliedCount: 12, conversionRate: 12.5,
          channel: 'email',
          steps: [
            { id: 's1-1', order: 1, channel: 'email', delayDays: 0, subject: 'Introduction IDIBA Group', template: 'Bonjour {{prenom}},\n\nJe suis de IDIBA Group...', aiPersonalized: true },
            { id: 's1-2', order: 2, channel: 'email', delayDays: 3, subject: 'Re: Introduction', template: 'Bonjour {{prenom}},\n\nJe me permets de relancer...', aiPersonalized: true },
            { id: 's1-3', order: 3, channel: 'linkedin', delayDays: 7, template: 'Connection request + message', aiPersonalized: false },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'seq-2', name: 'Séquence LinkedIn + Phone', status: 'active', prospectsCount: 18, sentCount: 54, openedCount: 32, repliedCount: 8, conversionRate: 14.8,
          channel: 'multi',
          steps: [
            { id: 's2-1', order: 1, channel: 'linkedin', delayDays: 0, template: 'Demande de connexion personnalisée', aiPersonalized: true },
            { id: 's2-2', order: 2, channel: 'phone', delayDays: 2, template: 'Appel de prospection', aiPersonalized: false },
            { id: 's2-3', order: 3, channel: 'email', delayDays: 5, subject: 'Suite à notre échange', template: 'Bonjour {{prenom}},\n\nComme convenu...', aiPersonalized: true },
          ],
          createdAt: new Date().toISOString(),
        },
        {
          id: 'seq-3', name: 'Séquence Signal d\'Achat', status: 'draft', prospectsCount: 0, sentCount: 0, openedCount: 0, repliedCount: 0, conversionRate: 0,
          channel: 'email',
          steps: [
            { id: 's3-1', order: 1, channel: 'email', delayDays: 0, subject: 'Votre projet {{signal}}', template: 'Bonjour {{prenom}},\n\nNous avons détecté...', aiPersonalized: true },
          ],
          createdAt: new Date().toISOString(),
        },
      ];
      defaultSeq.forEach(s => addAndNotify('sequences', s));
      setSequences(defaultSeq);
    } else {
      setSequences(storedSeq);
    }

    // Load saved lists
    const storedLists = getAll('savedLists') as SavedList[];
    if (storedLists.length === 0) {
      const defaultLists: SavedList[] = [
        { id: 'list-1', name: 'Prospects Technologie Cameroun', filters: { country: 'Cameroun', industry: 'Technologie' }, count: 12, createdAt: new Date().toISOString() },
        { id: 'list-2', name: 'Décideurs Finance CEMAC', filters: { industry: 'Finance', seniority: 'Executive' }, count: 8, createdAt: new Date().toISOString() },
        { id: 'list-3', name: 'Startups en levée de fonds', filters: { intentSignal: 'Levée de fonds' }, count: 5, createdAt: new Date().toISOString() },
      ];
      defaultLists.forEach(l => addAndNotify('savedLists', l));
      setSavedLists(defaultLists);
    } else {
      setSavedLists(storedLists);
    }
  }, [setCurrentPageTitle]);

  // Filtered prospects
  const filteredProspects = useMemo(() => {
    return prospects.filter(p => {
      if (searchQuery && !p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) && !p.company.toLowerCase().includes(searchQuery.toLowerCase()) && !p.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filters.industry && p.industry !== filters.industry) return false;
      if (filters.companySize && p.companySize !== filters.companySize) return false;
      if (filters.country && p.country !== filters.country) return false;
      if (filters.seniority && p.seniority !== filters.seniority) return false;
      if (filters.position && !p.position.toLowerCase().includes(filters.position.toLowerCase())) return false;
      if (filters.technology && !p.technologies.includes(filters.technology)) return false;
      if (filters.intentSignal && !p.intentSignals.includes(filters.intentSignal)) return false;
      if (filters.scoreMin && p.score < Number(filters.scoreMin)) return false;
      if (filters.scoreMax && p.score > Number(filters.scoreMax)) return false;
      if (filters.status && p.status !== filters.status) return false;
      if (filters.enriched === 'yes' && !p.enriched) return false;
      if (filters.enriched === 'no' && p.enriched) return false;
      return true;
    });
  }, [prospects, searchQuery, filters]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedProspects);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedProspects(next);
  };

  const selectAll = () => {
    if (selectedProspects.size === filteredProspects.length) {
      setSelectedProspects(new Set());
    } else {
      setSelectedProspects(new Set(filteredProspects.map(p => p.id)));
    }
  };

  const handleEnrich = (prospectId: string) => {
    setEnriching(prospectId);
    setTimeout(() => {
      const p = prospects.find(pr => pr.id === prospectId);
      if (p) {
        const enriched: Prospect = { ...p, enriched: true, score: Math.min(100, p.score + 15), technologies: [...p.technologies, TECHNOLOGIES[Math.floor(Math.random() * TECHNOLOGIES.length)]] };
        updateAndNotify('prospects', prospectId, enriched);
        setProspects(prev => prev.map(pr => pr.id === prospectId ? enriched : pr));
        showToast('Prospect enrichi avec succès', 'success');
      }
      setEnriching(null);
    }, 1500);
  };

  const handleSaveList = () => {
    if (!listName.trim()) return;
    const newList: SavedList = {
      id: `list-${Date.now()}`,
      name: listName.trim(),
      filters: { ...filters },
      count: filteredProspects.length,
      createdAt: new Date().toISOString(),
    };
    addAndNotify('savedLists', newList);
    setSavedLists(prev => [...prev, newList]);
    setListName('');
    setShowSaveList(false);
    showToast(`Liste "${newList.name}" sauvegardée (${newList.count} prospects)`, 'success');
  };

  const handleCreateSequence = () => {
    if (!newSequence.name.trim() || newSequence.steps.length === 0) return;
    const seq: Sequence = {
      id: `seq-${Date.now()}`,
      name: newSequence.name.trim(),
      status: 'draft',
      steps: newSequence.steps,
      prospectsCount: 0,
      sentCount: 0,
      openedCount: 0,
      repliedCount: 0,
      conversionRate: 0,
      channel: newSequence.channel,
      createdAt: new Date().toISOString(),
    };
    addAndNotify('sequences', seq);
    setSequences(prev => [...prev, seq]);
    setNewSequence({ name: '', channel: 'email', steps: [{ id: 'step-1', order: 1, channel: 'email', delayDays: 0, subject: '', template: '', aiPersonalized: true }] });
    setShowCreateSequence(false);
    showToast('Séquence créée', 'success');
  };

  const handleAddToSequence = (sequenceId: string) => {
    if (selectedProspects.size === 0) {
      showToast('Sélectionnez d\'abord des prospects', 'warning');
      return;
    }
    const seq = sequences.find(s => s.id === sequenceId);
    if (!seq) return;
    const updated = { ...seq, prospectsCount: seq.prospectsCount + selectedProspects.size };
    updateAndNotify('sequences', sequenceId, updated);
    setSequences(prev => prev.map(s => s.id === sequenceId ? updated : s));
    setSelectedProspects(new Set());
    setShowSequenceModal(false);
    showToast(`${selectedProspects.size} prospects ajoutés à "${seq.name}"`, 'success');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

  const scoreColor = (score: number) => score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-blue-400';
  const scoreBg = (score: number) => score >= 80 ? 'bg-emerald-500/10' : score >= 60 ? 'bg-amber-500/10' : 'bg-blue-500/10';

  const statusLabels: Record<string, { label: string; color: string }> = {
    new: { label: 'Nouveau', color: '#3B82F6' },
    contacted: { label: 'Contacté', color: '#8B5CF6' },
    engaged: { label: 'Engagé', color: '#F59E0B' },
    qualified: { label: 'Qualifié', color: '#2DD4A8' },
    customer: { label: 'Client', color: '#10B981' },
  };

  const channelIcons: Record<string, React.ReactNode> = {
    email: <Mail size={12} />,
    linkedin: <Linkedin size={12} />,
    phone: <Phone size={12} />,
    sms: <Smartphone size={12} />,
    multi: <Layers size={12} />,
  };

  // Analytics data
  const industryDist = useMemo(() => {
    const map = new Map<string, number>();
    prospects.forEach(p => map.set(p.industry, (map.get(p.industry) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [prospects]);

  const countryDist = useMemo(() => {
    const map = new Map<string, number>();
    prospects.forEach(p => map.set(p.country, (map.get(p.country) || 0) + 1));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [prospects]);

  const scoreDist = useMemo(() => [
    { range: '90-100', count: prospects.filter(p => p.score >= 90).length },
    { range: '80-89', count: prospects.filter(p => p.score >= 80 && p.score < 90).length },
    { range: '70-79', count: prospects.filter(p => p.score >= 70 && p.score < 80).length },
    { range: '60-69', count: prospects.filter(p => p.score >= 60 && p.score < 70).length },
    { range: '40-59', count: prospects.filter(p => p.score >= 40 && p.score < 60).length },
  ], [prospects]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Prospection</h2>
          <p className="text-xs text-[var(--text-muted)]">Base B2B, filtres avancés, séquences, scoring & analytics</p>
        </div>
        <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
          {[
            { k: 'search', l: 'Recherche', i: <Search size={12} /> },
            { k: 'sequences', l: 'Séquences', i: <Play size={12} /> },
            { k: 'lists', l: 'Listes', i: <List size={12} /> },
            { k: 'analytics', l: 'Analytics', i: <BarChart3 size={12} /> },
          ].map(t => (
            <button key={t.k} onClick={() => setActiveTab(t.k as any)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md ${activeTab === t.k ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>{t.i} {t.l}</button>
          ))}
        </div>
      </div>

      {/* ============================================ */}
      {/* TAB: SEARCH / PROSPECT DATABASE */}
      {/* ============================================ */}
      {activeTab === 'search' && (
        <div className="space-y-4">
          {/* Search Bar + Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, entreprise, email..."
                className="w-full h-10 pl-9 pr-4 glass-input text-sm"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`h-10 px-3 rounded-lg text-sm font-medium flex items-center gap-2 ${showFilters ? 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
              <Filter size={14} /> Filtres {Object.values(filters).some(v => v !== '') && <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />}
            </button>
            <button onClick={() => setShowSaveList(true)} disabled={filteredProspects.length === 0} className="h-10 px-3 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)] text-sm font-medium flex items-center gap-2 hover:text-[var(--text-primary)] disabled:opacity-40">
              <Save size={14} /> Sauvegarder
            </button>
            <button onClick={() => setShowSequenceModal(true)} disabled={selectedProspects.size === 0} className="h-10 px-3 rounded-lg bg-[var(--accent-primary)] text-white text-sm font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-40">
              <Send size={14} /> Ajouter à séquence ({selectedProspects.size})
            </button>
            <button onClick={() => showToast('Export CSV généré', 'success')} className="h-10 px-3 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-muted)] text-sm font-medium flex items-center gap-2 hover:text-[var(--text-primary)]">
              <Download size={14} /> Export
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--divider)] grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Industrie</label>
                    <select value={filters.industry} onChange={e => setFilters({ ...filters, industry: e.target.value })} className="w-full h-9 px-2 glass-input text-xs">
                      <option value="">Toutes</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Taille</label>
                    <select value={filters.companySize} onChange={e => setFilters({ ...filters, companySize: e.target.value })} className="w-full h-9 px-2 glass-input text-xs">
                      <option value="">Toutes</option>
                      {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Pays</label>
                    <select value={filters.country} onChange={e => setFilters({ ...filters, country: e.target.value })} className="w-full h-9 px-2 glass-input text-xs">
                      <option value="">Tous</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Seniorité</label>
                    <select value={filters.seniority} onChange={e => setFilters({ ...filters, seniority: e.target.value })} className="w-full h-9 px-2 glass-input text-xs">
                      <option value="">Toutes</option>
                      {SENIORITIES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Poste</label>
                    <input value={filters.position} onChange={e => setFilters({ ...filters, position: e.target.value })} placeholder="ex: CEO" className="w-full h-9 px-2 glass-input text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Technologie</label>
                    <select value={filters.technology} onChange={e => setFilters({ ...filters, technology: e.target.value })} className="w-full h-9 px-2 glass-input text-xs">
                      <option value="">Toutes</option>
                      {TECHNOLOGIES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Signal d'achat</label>
                    <select value={filters.intentSignal} onChange={e => setFilters({ ...filters, intentSignal: e.target.value })} className="w-full h-9 px-2 glass-input text-xs">
                      <option value="">Tous</option>
                      {INTENT_SIGNALS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Score min</label>
                    <input type="number" value={filters.scoreMin} onChange={e => setFilters({ ...filters, scoreMin: e.target.value })} placeholder="0" className="w-full h-9 px-2 glass-input text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Score max</label>
                    <input type="number" value={filters.scoreMax} onChange={e => setFilters({ ...filters, scoreMax: e.target.value })} placeholder="100" className="w-full h-9 px-2 glass-input text-xs" />
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Statut</label>
                    <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="w-full h-9 px-2 glass-input text-xs">
                      <option value="">Tous</option>
                      {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-[var(--text-muted)] uppercase mb-1 block">Enrichi</label>
                    <select value={filters.enriched} onChange={e => setFilters({ ...filters, enriched: e.target.value })} className="w-full h-9 px-2 glass-input text-xs">
                      <option value="">Tous</option>
                      <option value="yes">Oui</option>
                      <option value="no">Non</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button onClick={() => setFilters({ industry: '', companySize: '', country: '', seniority: '', position: '', technology: '', intentSignal: '', scoreMin: '', scoreMax: '', status: '', enriched: '' })} className="h-9 px-3 rounded-lg text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1">
                      <RefreshCw size={12} /> Réinitialiser
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">
              <span className="text-[var(--text-primary)] font-medium">{filteredProspects.length}</span> prospects trouvés
              {selectedProspects.size > 0 && <span className="ml-2 text-[var(--accent-primary)]">· {selectedProspects.size} sélectionnés</span>}
            </p>
            <button onClick={selectAll} className="text-xs text-[var(--accent-primary)] hover:underline">
              {selectedProspects.size === filteredProspects.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>

          {/* Prospects Table */}
          <GlassCard>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--divider)] text-[10px] text-[var(--text-muted)] uppercase">
                    <th className="p-3 w-8"><input type="checkbox" checked={selectedProspects.size === filteredProspects.length && filteredProspects.length > 0} onChange={selectAll} className="rounded" /></th>
                    <th className="text-left p-3">Prospect</th>
                    <th className="text-left p-3">Entreprise</th>
                    <th className="text-left p-3">Score</th>
                    <th className="text-left p-3">Intentions</th>
                    <th className="text-left p-3">Tech</th>
                    <th className="text-left p-3">Localisation</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProspects.map((prospect) => (
                    <tr key={prospect.id} className="border-b border-[var(--divider)]/50 hover:bg-white/[0.02] transition-colors">
                      <td className="p-3"><input type="checkbox" checked={selectedProspects.has(prospect.id)} onChange={() => toggleSelect(prospect.id)} className="rounded" /></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white font-bold text-xs">
                            {prospect.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-[var(--text-primary)]">{prospect.fullName}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">{prospect.position} · {prospect.seniority}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-[var(--text-secondary)]">{prospect.company}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{prospect.industry} · {prospect.companySize} employés</p>
                      </td>
                      <td className="p-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${scoreBg(prospect.score)}`}>
                          <Star size={10} className={scoreColor(prospect.score)} />
                          <span className={`text-[10px] font-bold ${scoreColor(prospect.score)}`}>{prospect.score}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {prospect.intentSignals.slice(0, 2).map(s => (
                            <span key={s} className="text-[9px] bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] px-1.5 py-0.5 rounded-full">{s}</span>
                          ))}
                          {prospect.intentSignals.length > 2 && <span className="text-[9px] text-[var(--text-muted)]">+{prospect.intentSignals.length - 2}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {prospect.technologies.slice(0, 2).map(t => (
                            <span key={t} className="text-[9px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-1.5 py-0.5 rounded">{t}</span>
                          ))}
                          {prospect.technologies.length > 2 && <span className="text-[9px] text-[var(--text-muted)]">+{prospect.technologies.length - 2}</span>}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                          <MapPin size={10} /> {prospect.city}, {prospect.country}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setShowProspectDetail(prospect)} className="p-1.5 rounded hover:bg-white/5 text-[var(--text-muted)]" title="Voir détail"><Eye size={12} /></button>
                          <button onClick={() => handleEnrich(prospect.id)} disabled={enriching === prospect.id || prospect.enriched} className="p-1.5 rounded hover:bg-white/5 text-[var(--accent-primary)] disabled:opacity-40" title="Enrichir">
                            {enriching === prospect.id ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          </button>
                          <button onClick={() => { navigator.clipboard.writeText(prospect.email); showToast('Email copié', 'success'); }} className="p-1.5 rounded hover:bg-white/5 text-[var(--text-muted)]" title="Copier email"><Copy size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>
      )}

      {/* ============================================ */}
      {/* TAB: SEQUENCES */}
      {/* ============================================ */}
      {activeTab === 'sequences' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">{sequences.length} séquences · Automatisez vos campagnes multi-canal</p>
            <button onClick={() => setShowCreateSequence(true)} className="btn-primary h-9 text-xs gap-1.5"><Plus size={14} /> Nouvelle séquence</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sequences.map((seq, i) => (
              <motion.div key={seq.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)]">
                          {channelIcons[seq.channel] || <Layers size={14} />}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{seq.name}</h3>
                          <p className="text-[10px] text-[var(--text-muted)]">{seq.steps.length} étapes · {seq.channel}</p>
                        </div>
                      </div>
                      <StatusBadge status={seq.status} />
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{seq.prospectsCount}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Prospects</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                        <p className="text-sm font-bold text-[var(--text-primary)]">{seq.sentCount}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Envoyés</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                        <p className="text-sm font-bold text-[var(--accent-warning)]">{seq.openedCount}</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Ouverts</p>
                      </div>
                      <div className="text-center p-2 rounded-lg bg-[var(--bg-elevated)]">
                        <p className="text-sm font-bold text-[var(--accent-primary)]">{seq.conversionRate}%</p>
                        <p className="text-[9px] text-[var(--text-muted)]">Conversion</p>
                      </div>
                    </div>

                    {/* Steps preview */}
                    <div className="space-y-1.5 mb-3">
                      {seq.steps.map((step, idx) => (
                        <div key={step.id} className="flex items-center gap-2 text-[10px]">
                          <span className="w-5 h-5 rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] font-medium">{idx + 1}</span>
                          <span className="text-[var(--text-secondary)]">{channelIcons[step.channel]}</span>
                          <span className="text-[var(--text-muted)] flex-1">{step.channel} · J+{step.delayDays}</span>
                          {step.aiPersonalized && <Sparkles size={10} className="text-[var(--accent-purple)]" />}
                        </div>
                      ))}
                    </div>

                    {/* Funnel bars */}
                    <div className="space-y-1">
                      {[
                        { label: 'Ouvertures', value: seq.openedCount, total: seq.sentCount, color: 'var(--accent-warning)' },
                        { label: 'Réponses', value: seq.repliedCount, total: seq.sentCount, color: 'var(--accent-primary)' },
                      ].map(item => (
                        <div key={item.label} className="flex items-center gap-2">
                          <span className="text-[9px] text-[var(--text-secondary)] w-16">{item.label}</span>
                          <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${(item.value / Math.max(item.total, 1)) * 100}%`, backgroundColor: item.color }} />
                          </div>
                          <span className="text-[9px] text-[var(--text-primary)] w-6 text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TAB: SAVED LISTS */}
      {/* ============================================ */}
      {activeTab === 'lists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--text-muted)]">{savedLists.length} listes sauvegardées</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedLists.map((list, i) => (
              <motion.div key={list.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <GlassCard>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-lg bg-[var(--accent-secondary)]/10 flex items-center justify-center text-[var(--accent-secondary)]">
                          <List size={14} />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{list.name}</h3>
                          <p className="text-[10px] text-[var(--text-muted)]">{list.count} prospects · {formatDate(list.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {Object.entries(list.filters).filter(([, v]) => v).map(([k, v]) => (
                        <span key={k} className="text-[9px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-2 py-0.5 rounded-full">{k}: {String(v)}</span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setFilters(list.filters as any); setActiveTab('search'); showToast(`Filtres "${list.name}" appliqués`, 'success'); }} className="flex-1 h-8 rounded-lg bg-[var(--accent-primary)] text-white text-xs font-medium hover:opacity-90 flex items-center justify-center gap-1">
                        <Search size={12} /> Voir
                      </button>
                      <button onClick={() => { setSavedLists(prev => prev.filter(l => l.id !== list.id)); showToast('Liste supprimée', 'success'); }} className="h-8 w-8 rounded-lg bg-[var(--bg-elevated)] text-[var(--accent-danger)] flex items-center justify-center hover:bg-white/5">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* TAB: ANALYTICS */}
      {/* ============================================ */}
      {activeTab === 'analytics' && (
        <div className="space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Prospects totaux', value: prospects.length, icon: <Users size={16} />, color: 'var(--accent-primary)' },
              { label: 'Score moyen', value: Math.round(prospects.reduce((s, p) => s + p.score, 0) / (prospects.length || 1)), icon: <Star size={16} />, color: 'var(--accent-warning)' },
              { label: 'Enrichis', value: prospects.filter(p => p.enriched).length, icon: <Sparkles size={16} />, color: 'var(--accent-purple)' },
              { label: 'Séquences actives', value: sequences.filter(s => s.status === 'active').length, icon: <Play size={16} />, color: 'var(--accent-secondary)' },
            ].map((s, i) => (
              <GlassCard key={s.label} delay={i * 0.05}>
                <div className="p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: s.color + '20', color: s.color }}>{s.icon}</div>
                  <div><p className="text-base font-bold text-[var(--text-primary)]">{s.value}</p><p className="text-[10px] text-[var(--text-muted)]">{s.label}</p></div>
                </div>
              </GlassCard>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Industry Distribution */}
            <GlassCard>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Briefcase size={14} className="text-[var(--accent-primary)]" /> Répartition par Industrie</h3>
                <div className="space-y-2">
                  {industryDist.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-secondary)] w-24 truncate">{item.name}</span>
                      <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${(item.value / Math.max(...industryDist.map(d => d.value))) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-[var(--text-primary)] w-6 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Country Distribution */}
            <GlassCard>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Globe size={14} className="text-[var(--accent-secondary)]" /> Répartition par Pays</h3>
                <div className="space-y-2">
                  {countryDist.map(item => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-secondary)] w-24 truncate">{item.name}</span>
                      <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent-secondary)] rounded-full" style={{ width: `${(item.value / Math.max(...countryDist.map(d => d.value))) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-[var(--text-primary)] w-6 text-right">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Score Distribution */}
            <GlassCard>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Target size={14} className="text-[var(--accent-warning)]" /> Distribution des Scores</h3>
                <div className="space-y-2">
                  {scoreDist.map(item => (
                    <div key={item.range} className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-secondary)] w-16">{item.range}</span>
                      <div className="flex-1 h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent-warning)] rounded-full" style={{ width: `${(item.count / Math.max(...scoreDist.map(d => d.count))) * 100}%` }} />
                      </div>
                      <span className="text-[10px] text-[var(--text-primary)] w-6 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Sequence Performance */}
            <GlassCard>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Activity size={14} className="text-[var(--accent-primary)]" /> Performance des Séquences</h3>
                <div className="space-y-3">
                  {sequences.filter(s => s.status === 'active').map(seq => (
                    <div key={seq.id} className="glass-card-compact p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[var(--text-primary)]">{seq.name}</span>
                        <span className="text-xs font-bold text-[var(--accent-primary)]">{seq.conversionRate}%</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div><p className="text-xs font-bold text-[var(--text-primary)]">{seq.sentCount}</p><p className="text-[9px] text-[var(--text-muted)]">Envoyés</p></div>
                        <div><p className="text-xs font-bold text-[var(--accent-warning)]">{seq.openedCount}</p><p className="text-[9px] text-[var(--text-muted)]">Ouverts</p></div>
                        <div><p className="text-xs font-bold text-[var(--accent-primary)]">{seq.repliedCount}</p><p className="text-[9px] text-[var(--text-muted)]">Réponses</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {/* Prospect Detail Modal */}
      <AnimatePresence>
        {showProspectDetail && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowProspectDetail(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg glass-card z-50 max-h-[85vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)] flex items-center justify-center text-white font-bold text-lg">
                      {showProspectDetail.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-[var(--text-primary)]">{showProspectDetail.fullName}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{showProspectDetail.position} · {showProspectDetail.company}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowProspectDetail(null)} className="p-1.5 rounded-lg hover:bg-white/5"><X size={16} className="text-[var(--text-muted)]" /></button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="glass-card-compact p-2"><p className="text-[10px] text-[var(--text-muted)]">Score</p><p className={`text-sm font-bold ${scoreColor(showProspectDetail.score)}`}>{showProspectDetail.score}/100</p></div>
                  <div className="glass-card-compact p-2"><p className="text-[10px] text-[var(--text-muted)]">Seniorité</p><p className="text-sm font-bold text-[var(--text-primary)]">{showProspectDetail.seniority}</p></div>
                  <div className="glass-card-compact p-2"><p className="text-[10px] text-[var(--text-muted)]">Taille</p><p className="text-sm font-bold text-[var(--text-primary)]">{showProspectDetail.companySize}</p></div>
                  <div className="glass-card-compact p-2"><p className="text-[10px] text-[var(--text-muted)]">Revenu</p><p className="text-sm font-bold text-[var(--text-primary)]">{showProspectDetail.revenue}</p></div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs"><Mail size={12} className="text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)]">{showProspectDetail.email}</span></div>
                  {showProspectDetail.phone && <div className="flex items-center gap-2 text-xs"><Phone size={12} className="text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)]">{showProspectDetail.phone}</span></div>}
                  <div className="flex items-center gap-2 text-xs"><MapPin size={12} className="text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)]">{showProspectDetail.city}, {showProspectDetail.country}</span></div>
                  <div className="flex items-center gap-2 text-xs"><Building2 size={12} className="text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)]">{showProspectDetail.industry}</span></div>
                  {showProspectDetail.funding && <div className="flex items-center gap-2 text-xs"><DollarSign size={12} className="text-[var(--text-muted)]" /><span className="text-[var(--text-secondary)]">{showProspectDetail.funding}</span></div>}
                </div>

                <div className="mb-4">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase mb-2">Technologies</p>
                  <div className="flex flex-wrap gap-1">
                    {showProspectDetail.technologies.map(t => <span key={t} className="text-[10px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-2 py-0.5 rounded">{t}</span>)}
                  </div>
                </div>

                {showProspectDetail.intentSignals.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase mb-2">Signaux d'achat</p>
                    <div className="flex flex-wrap gap-1">
                      {showProspectDetail.intentSignals.map(s => <span key={s} className="text-[10px] bg-[var(--accent-warning)]/10 text-[var(--accent-warning)] px-2 py-0.5 rounded-full">{s}</span>)}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { handleEnrich(showProspectDetail.id); setShowProspectDetail(null); }} disabled={showProspectDetail.enriched} className="flex-1 btn-primary h-9 text-xs justify-center disabled:opacity-40">
                    <Sparkles size={14} /> {showProspectDetail.enriched ? 'Déjà enrichi' : 'Enrichir'}
                  </button>
                  <button onClick={() => { setShowProspectDetail(null); showToast('Ajouté aux leads', 'success'); }} className="flex-1 h-9 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-medium hover:bg-white/5 flex items-center justify-center gap-1">
                    <Plus size={14} /> Ajouter aux leads
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add to Sequence Modal */}
      <AnimatePresence>
        {showSequenceModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowSequenceModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md glass-card z-50">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Ajouter à une séquence</h2>
                <p className="text-xs text-[var(--text-muted)] mb-4">{selectedProspects.size} prospect(s) sélectionné(s)</p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {sequences.map(seq => (
                    <button key={seq.id} onClick={() => handleAddToSequence(seq.id)} className="w-full text-left p-3 rounded-xl bg-[var(--bg-elevated)] hover:bg-white/5 transition-colors flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)]">{channelIcons[seq.channel]}</div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">{seq.name}</p>
                          <p className="text-[10px] text-[var(--text-muted)]">{seq.steps.length} étapes · {seq.prospectsCount} prospects</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-[var(--text-muted)]" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Save List Modal */}
      <AnimatePresence>
        {showSaveList && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowSaveList(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 overflow-y-auto shadow-2xl">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Sauvegarder la liste</h2>
                <input value={listName} onChange={e => setListName(e.target.value)} placeholder="Nom de la liste..." className="w-full h-10 px-3 glass-input text-sm mb-4" />
                <p className="text-xs text-[var(--text-muted)] mb-4">{filteredProspects.length} prospects seront sauvegardés avec les filtres actuels.</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowSaveList(false)} className="flex-1 btn-ghost h-10 text-xs">Annuler</button>
                  <button onClick={handleSaveList} disabled={!listName.trim()} className="flex-1 btn-primary h-10 text-xs justify-center disabled:opacity-40">Sauvegarder</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Create Sequence Modal */}
      <AnimatePresence>
        {showCreateSequence && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowCreateSequence(false)} />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-lg border-l border-[var(--glass-border)] bg-[var(--bg-card)] z-50 max-h-screen overflow-y-auto shadow-2xl">
              <div className="p-6">
                <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Nouvelle Séquence</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Nom</label>
                    <input value={newSequence.name} onChange={e => setNewSequence({ ...newSequence, name: e.target.value })} className="w-full h-10 px-3 glass-input text-sm" placeholder="ex: Séquence Bienvenue" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Canal principal</label>
                    <div className="flex gap-2">
                      {(['email', 'linkedin', 'phone', 'multi'] as const).map(c => (
                        <button key={c} onClick={() => setNewSequence({ ...newSequence, channel: c })} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${newSequence.channel === c ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] ring-1 ring-[var(--accent-primary)]/30' : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'}`}>
                          {channelIcons[c]} {c === 'multi' ? 'Multi-canal' : c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-2">Étapes</label>
                    <div className="space-y-2">
                      {newSequence.steps.map((step, idx) => (
                        <div key={step.id} className="p-3 rounded-xl bg-[var(--bg-elevated)] space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)] text-xs font-bold">{idx + 1}</span>
                            <select value={step.channel} onChange={e => {
                              const steps = [...newSequence.steps];
                              steps[idx] = { ...step, channel: e.target.value as any };
                              setNewSequence({ ...newSequence, steps });
                            }} className="h-8 px-2 glass-input text-xs">
                              <option value="email">Email</option>
                              <option value="linkedin">LinkedIn</option>
                              <option value="phone">Téléphone</option>
                              <option value="sms">SMS</option>
                            </select>
                            <input type="number" value={step.delayDays} onChange={e => {
                              const steps = [...newSequence.steps];
                              steps[idx] = { ...step, delayDays: Number(e.target.value) };
                              setNewSequence({ ...newSequence, steps });
                            }} className="h-8 w-16 px-2 glass-input text-xs" min={0} />
                            <span className="text-[10px] text-[var(--text-muted)]">jours</span>
                            {newSequence.steps.length > 1 && (
                              <button onClick={() => {
                                const steps = newSequence.steps.filter((_, i) => i !== idx);
                                setNewSequence({ ...newSequence, steps: steps.map((s, i) => ({ ...s, order: i + 1 })) });
                              }} className="ml-auto p-1 rounded hover:bg-white/5 text-[var(--accent-danger)]"><Trash2 size={12} /></button>
                            )}
                          </div>
                          {step.channel === 'email' && (
                            <input value={step.subject} onChange={e => {
                              const steps = [...newSequence.steps];
                              steps[idx] = { ...step, subject: e.target.value };
                              setNewSequence({ ...newSequence, steps });
                            }} placeholder="Objet..." className="w-full h-8 px-2 glass-input text-xs" />
                          )}
                          <textarea value={step.template} onChange={e => {
                            const steps = [...newSequence.steps];
                            steps[idx] = { ...step, template: e.target.value };
                            setNewSequence({ ...newSequence, steps });
                          }} placeholder="Template du message..." className="w-full h-16 px-2 py-1 glass-input text-xs resize-none" />
                          <label className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                            <input type="checkbox" checked={step.aiPersonalized} onChange={e => {
                              const steps = [...newSequence.steps];
                              steps[idx] = { ...step, aiPersonalized: e.target.checked };
                              setNewSequence({ ...newSequence, steps });
                            }} className="rounded" />
                            Personnalisation IA
                          </label>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setNewSequence({ ...newSequence, steps: [...newSequence.steps, { id: `step-${newSequence.steps.length + 1}`, order: newSequence.steps.length + 1, channel: 'email', delayDays: 3, subject: '', template: '', aiPersonalized: true }] })} className="mt-2 text-xs text-[var(--accent-primary)] hover:underline flex items-center gap-1">
                      <Plus size={12} /> Ajouter une étape
                    </button>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowCreateSequence(false)} className="flex-1 btn-ghost h-10 text-xs">Annuler</button>
                    <button onClick={handleCreateSequence} disabled={!newSequence.name.trim()} className="flex-1 btn-primary h-10 text-xs justify-center disabled:opacity-40">Créer la séquence</button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
