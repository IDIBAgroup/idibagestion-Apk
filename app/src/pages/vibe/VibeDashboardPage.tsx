import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Users, Target, MessageSquare, Zap, Eye,
  ArrowUpRight, ArrowDownRight, Filter, BarChart3, Funnel,
  Flame, Thermometer, Snowflake, Mail, Linkedin, Smartphone, MessageCircle,
  Search, Sparkles,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, FunnelChart, Funnel as ReFunnel, LabelList,
} from 'recharts';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { VibeAnalyzerModal } from './VibeAnalyzerModal';

const COLORS = ['#2DD4A8', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899'];

export function VibeDashboardPage() {
  const { setCurrentPageTitle } = useUIStore();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('30d');
  const [showAnalyzer, setShowAnalyzer] = useState(false);

  useEffect(() => { setCurrentPageTitle('Vibe Prospecting - Tableau de Bord'); }, [setCurrentPageTitle]);

  const leads = getAll('leads');
  const signals = getAll('signals');
  const trends = getAll('trends');
  const campaigns = getAll('campaigns');
  const messages = getAll('messages');

  // KPIs
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.temperature === 'hot').length;
  const warmLeads = leads.filter(l => l.temperature === 'warm').length;
  const coldLeads = leads.filter(l => l.temperature === 'cold').length;
  const avgScore = Math.round(leads.reduce((s, l) => s + l.score, 0) / (leads.length || 1));
  const totalPipeline = leads.reduce((s, l) => s + l.estimatedValue, 0);
  const wonValue = leads.filter(l => l.status === 'won').reduce((s, l) => s + l.estimatedValue, 0);

  const newSignals = signals.filter(s => !s.isRead).length;
  const activeTrends = trends.filter(t => t.isActive).length;
  const runningCampaigns = campaigns.filter(c => c.status === 'running').length;
  const totalMessages = messages.length;
  const repliedMessages = messages.filter(m => m.status === 'replied').length;
  const replyRate = totalMessages > 0 ? Math.round((repliedMessages / totalMessages) * 100) : 0;

  // Funnel data
  const funnelData = useMemo(() => [
    { stage: 'Nouveaux', count: leads.filter(l => l.status === 'new').length, value: leads.filter(l => l.status === 'new').reduce((s, l) => s + l.estimatedValue, 0), conversionRate: 100, avgDays: 0, fill: '#2DD4A8' },
    { stage: 'Contactes', count: leads.filter(l => l.status === 'contacted').length, value: leads.filter(l => l.status === 'contacted').reduce((s, l) => s + l.estimatedValue, 0), conversionRate: Math.round((leads.filter(l => ['contacted', 'qualified', 'proposal', 'negotiation', 'won'].includes(l.status)).length / (totalLeads || 1)) * 100), avgDays: 5, fill: '#3B82F6' },
    { stage: 'Qualifies', count: leads.filter(l => l.status === 'qualified').length, value: leads.filter(l => l.status === 'qualified').reduce((s, l) => s + l.estimatedValue, 0), conversionRate: Math.round((leads.filter(l => ['qualified', 'proposal', 'negotiation', 'won'].includes(l.status)).length / (totalLeads || 1)) * 100), avgDays: 12, fill: '#8B5CF6' },
    { stage: 'Proposition', count: leads.filter(l => l.status === 'proposal').length, value: leads.filter(l => l.status === 'proposal').reduce((s, l) => s + l.estimatedValue, 0), conversionRate: Math.round((leads.filter(l => ['proposal', 'negotiation', 'won'].includes(l.status)).length / (totalLeads || 1)) * 100), avgDays: 21, fill: '#F59E0B' },
    { stage: 'Negociation', count: leads.filter(l => l.status === 'negotiation').length, value: leads.filter(l => l.status === 'negotiation').reduce((s, l) => s + l.estimatedValue, 0), conversionRate: Math.round((leads.filter(l => ['negotiation', 'won'].includes(l.status)).length / (totalLeads || 1)) * 100), avgDays: 35, fill: '#EF4444' },
    { stage: 'Gagnes', count: leads.filter(l => l.status === 'won').length, value: wonValue, conversionRate: Math.round((leads.filter(l => l.status === 'won').length / (totalLeads || 1)) * 100), avgDays: 45, fill: '#EC4899' },
  ], [leads, totalLeads, wonValue]);

  // Temperature distribution
  const tempData = [
    { name: 'Chaud', value: hotLeads, color: '#EF4444' },
    { name: 'Tiede', value: warmLeads, color: '#F59E0B' },
    { name: 'Froid', value: coldLeads, color: '#3B82F6' },
  ];

  // Source breakdown
  const sourceData = [
    { name: 'Social Media', value: leads.filter(l => l.source === 'social_media').length },
    { name: 'Signaux', value: leads.filter(l => l.source === 'signal_detection').length },
    { name: 'Referral', value: leads.filter(l => l.source === 'referral').length },
    { name: 'Event', value: leads.filter(l => l.source === 'event').length },
    { name: 'Website', value: leads.filter(l => l.source === 'website').length },
    { name: 'Scraping', value: leads.filter(l => l.source === 'scraping').length },
  ];

  // Campaign performance
  const campaignPerf = campaigns.map(c => ({
    name: c.name.length > 20 ? c.name.slice(0, 20) + '...' : c.name,
    taux: c.conversionRate,
    envoi: c.sentCount,
  }));

  // Signal types breakdown
  const signalTypeData = [
    { type: 'Recrutement IT', count: signals.filter(s => s.type === 'hiring_intent').length },
    { type: 'Upgrade Tech', count: signals.filter(s => s.type === 'tech_upgrade').length },
    { type: 'Financement', count: signals.filter(s => s.type === 'funding').length },
    { type: 'Expansion', count: signals.filter(s => s.type === 'expansion').length },
    { type: 'Changement', count: signals.filter(s => s.type === 'competitor_switch').length },
    { type: 'Budget', count: signals.filter(s => s.type === 'budget_announcement').length },
    { type: 'Reglementation', count: signals.filter(s => s.type === 'regulatory_change').length },
    { type: 'Douleur', count: signals.filter(s => s.type === 'pain_point').length },
  ];

  const formatXAF = (a: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(a);

  return (
    <div className="space-y-5">
      {/* Header with filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Vibe Prospecting</h2>
          <p className="text-xs text-[var(--text-muted)]">Intelligence commerciale & prospection IA</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAnalyzer(true)}
            className="btn-primary h-9 text-xs gap-1.5 flex items-center"
          >
            <Sparkles size={14} /> Analyseur Vibe
          </button>
          <div className="flex gap-1 bg-[var(--bg-elevated)] rounded-lg p-0.5">
            {[{ k: '7d', l: '7j' }, { k: '30d', l: '30j' }, { k: '90d', l: '90j' }, { k: 'all', l: 'Tout' }].map(r => (
              <button key={r.k} onClick={() => setDateRange(r.k)} className={`px-3 py-1.5 text-xs font-medium rounded-md ${dateRange === r.k ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm' : 'text-[var(--text-muted)]'}`}>{r.l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GlassCard delay={0}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10"><Users size={20} className="text-[var(--accent-primary)]" /></div>
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-primary)]"><TrendingUp size={12} /> +24%</span>
            </div>
            <p className="kpi-value">{totalLeads}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Prospects totaux</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-[var(--accent-danger)]"><Flame size={10} /> {hotLeads} chaud</span>
              <span className="flex items-center gap-1 text-[10px] text-[var(--accent-warning)]"><Thermometer size={10} /> {warmLeads} tiede</span>
              <span className="flex items-center gap-1 text-[10px] text-[var(--accent-secondary)]"><Snowflake size={10} /> {coldLeads} froid</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard delay={0.05}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-[var(--accent-secondary)]/10"><Target size={20} className="text-[var(--accent-secondary)]" /></div>
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-secondary)]"><ArrowUpRight size={12} /> {avgScore}/100</span>
            </div>
            <p className="kpi-value">{formatXAF(totalPipeline)}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Pipeline total</p>
            <div className="mt-3 h-10"><ResponsiveContainer width="100%" height="100%"><AreaChart data={[{v:30},{v:45},{v:38},{v:55},{v:48},{v:62}]}><Area type="monotone" dataKey="v" stroke="#3B82F6" fill="rgba(59,130,246,0.1)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
          </div>
        </GlassCard>

        <GlassCard delay={0.1}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-[var(--accent-warning)]/10"><Zap size={20} className="text-[var(--accent-warning)]" /></div>
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-warning)]"><ArrowUpRight size={12} /> {activeTrends}</span>
            </div>
            <p className="kpi-value">{newSignals}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Nouveaux signaux</p>
            <div className="mt-3 h-10"><ResponsiveContainer width="100%" height="100%"><AreaChart data={[{v:5},{v:8},{v:12},{v:7},{v:15},{v:11}]}><Area type="monotone" dataKey="v" stroke="#F59E0B" fill="rgba(245,158,11,0.1)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
          </div>
        </GlassCard>

        <GlassCard delay={0.15}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-[var(--accent-purple)]/10"><MessageSquare size={20} className="text-[var(--accent-purple)]" /></div>
              <span className="flex items-center gap-1 text-xs font-medium text-[var(--accent-purple)]"><ArrowUpRight size={12} /> {replyRate}%</span>
            </div>
            <p className="kpi-value">{replyRate}%</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Taux de reponse</p>
            <div className="mt-3 h-10"><ResponsiveContainer width="100%" height="100%"><AreaChart data={[{v:10},{v:15},{v:12},{v:20},{v:18},{v:25}]}><Area type="monotone" dataKey="v" stroke="#8B5CF6" fill="rgba(139,92,246,0.1)" strokeWidth={2} /></AreaChart></ResponsiveContainer></div>
          </div>
        </GlassCard>
      </div>

      {/* Main content: Funnel + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Conversion Funnel */}
        <GlassCard delay={0.2} className="lg:col-span-1">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-[var(--text-primary)] flex items-center gap-2"><Funnel size={16} className="text-[var(--accent-primary)]" /> Entonnoir de Conversion</h3>
            </div>
            <div className="space-y-2">
              {funnelData.map((stage, i) => (
                <motion.div
                  key={stage.stage}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: stage.fill }}>
                      {stage.count}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-medium text-[var(--text-primary)]">{stage.stage}</span>
                        <span className="text-[10px] text-[var(--text-muted)]">{stage.conversionRate}% conv.</span>
                      </div>
                      <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${stage.conversionRate}%` }}
                          transition={{ duration: 1, delay: 0.3 + i * 0.1 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: stage.fill }}
                        />
                      </div>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{formatXAF(stage.value)} · {stage.avgDays > 0 ? `~${stage.avgDays}j` : ' initial'}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--divider)]">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Valeur totale pipeline</span>
                <span className="text-sm font-bold text-[var(--accent-primary)]">{formatXAF(totalPipeline)}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-[var(--text-secondary)]">Taux de conversion global</span>
                <span className="text-sm font-bold text-[var(--accent-secondary)]">{funnelData[funnelData.length - 1]?.conversionRate ?? 0}%</span>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Temperature Distribution + Source */}
        <GlassCard delay={0.25} className="lg:col-span-1">
          <div className="p-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Thermometer size={16} className="text-[var(--accent-warning)]" /> Temperature des Leads</h3>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={tempData} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2} dataKey="value">
                    {tempData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {tempData.map(t => (
                  <div key={t.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-xs text-[var(--text-secondary)] flex-1">{t.name}</span>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{t.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-[var(--divider)] my-4" />

            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><BarChart3 size={14} className="text-[var(--accent-primary)]" /> Sources de Prospection</h3>
            <div className="space-y-1.5">
              {sourceData.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-secondary)] w-20">{s.name}</span>
                  <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-primary)] rounded-full" style={{ width: `${(s.value / Math.max(...sourceData.map(d => d.value))) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--text-primary)] w-4 text-right">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>

        {/* Signal Types + Campaign Performance */}
        <GlassCard delay={0.3} className="lg:col-span-1">
          <div className="p-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Zap size={16} className="text-[var(--accent-warning)]" /> Types de Signaux Detectes</h3>
            <div className="space-y-1.5">
              {signalTypeData.map(s => (
                <div key={s.type} className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--text-secondary)] w-24 truncate">{s.type}</span>
                  <div className="flex-1 h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-warning)] rounded-full" style={{ width: `${(s.count / Math.max(...signalTypeData.map(d => d.count))) * 100}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--text-primary)] w-4 text-right">{s.count}</span>
                </div>
              ))}
            </div>

            <div className="h-px bg-[var(--divider)] my-4" />

            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2"><Target size={14} className="text-[var(--accent-primary)]" /> Performance Campagnes</h3>
            <div className="space-y-2">
              {campaignPerf.map(c => (
                <div key={c.name} className="glass-card-compact p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[var(--text-secondary)] truncate flex-1">{c.name}</span>
                    <span className="text-[10px] font-bold text-[var(--accent-primary)] ml-2">{c.taux}%</span>
                  </div>
                  <div className="h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full" style={{ width: `${Math.min(c.taux * 2, 100)}%` }} />
                  </div>
                  <p className="text-[9px] text-[var(--text-muted)] mt-0.5">{c.envoi} messages envoyes</p>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row: Trend Volume + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard delay={0.35}>
          <div className="p-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Eye size={16} className="text-[var(--accent-primary)]" /> Volume des Tendances par Plateforme</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={trends.map(t => ({ name: t.platform.charAt(0).toUpperCase() + t.platform.slice(1), volume: t.volumeScore, croissance: t.growthRate }))} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#8A96A8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8A96A8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#141D28', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, color: '#F0F2F5', fontSize: 12 }} />
                <Bar dataKey="volume" fill="#2DD4A8" radius={[4, 4, 0, 0]} name="Volume" />
                <Bar dataKey="croissance" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Croissance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard delay={0.4}>
          <div className="p-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><MessageSquare size={16} className="text-[var(--accent-primary)]" /> Messages Recents</h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {messages.slice(0, 6).map((msg, i) => (
                <div key={msg.id} className="flex items-start gap-3 p-2 rounded-lg bg-[var(--bg-elevated)] hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate('/vibe/outreach')}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {msg.leadName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--text-primary)]">{msg.leadName}</span>
                      {msg.channel === 'email' && <Mail size={10} className="text-[var(--text-muted)]" />}
                      {msg.channel === 'linkedin' && <Linkedin size={10} className="text-[var(--text-muted)]" />}
                      {msg.channel === 'whatsapp' && <Smartphone size={10} className="text-[var(--text-muted)]" />}
                      {msg.channel === 'sms' && <MessageCircle size={10} className="text-[var(--text-muted)]" />}
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{msg.subject || msg.body.slice(0, 60)}...</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${msg.status === 'replied' ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]' : msg.status === 'opened' ? 'bg-[var(--accent-warning)]/10 text-[var(--accent-warning)]' : 'bg-[var(--bg-card)] text-[var(--text-muted)]'}`}>
                        {msg.status}
                      </span>
                      {msg.aiGenerated && <span className="text-[9px] bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] px-1.5 py-0.5 rounded">IA</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Analyseur Vibe Prospecting Modal */}
      <VibeAnalyzerModal isOpen={showAnalyzer} onClose={() => setShowAnalyzer(false)} />
    </div>
  );
}
