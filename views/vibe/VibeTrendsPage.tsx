import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Eye, Hash, MapPin, BarChart3, ArrowUpRight,
  MessageSquare, Globe, ThumbsUp, ThumbsDown, Minus, Activity,
  Linkedin, Twitter, Facebook, Instagram, Youtube, Filter, Sparkles,
  Radar as RadarIcon,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { GlassCard } from '@/components/shared/GlassCard';
import { useUIStore } from '@/stores/uiStore';
import { useVibeStore } from '@/stores/vibeStore';
import { getAll } from '@/lib/db';
import { VibeTrendDetector } from './VibeTrendDetector';

const platformIcons: Record<string, React.ReactNode> = {
  linkedin: <Linkedin size={14} />,
  twitter: <Twitter size={14} />,
  facebook: <Facebook size={14} />,
  instagram: <Instagram size={14} />,
  youtube: <Youtube size={14} />,
  tiktok: <Activity size={14} />,
};

const sentimentConfig = {
  positive: { icon: <ThumbsUp size={12} />, color: 'text-[var(--accent-primary)]', bg: 'bg-[var(--accent-primary)]/10', label: 'Positif' },
  negative: { icon: <ThumbsDown size={12} />, color: 'text-[var(--accent-danger)]', bg: 'bg-[var(--accent-danger)]/10', label: 'Negatif' },
  neutral: { icon: <Minus size={12} />, color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-elevated)]', label: 'Neutre' },
  mixed: { icon: <Activity size={12} />, color: 'text-[var(--accent-warning)]', bg: 'bg-[var(--accent-warning)]/10', label: 'Mitige' },
};

export function VibeTrendsPage() {
  const { setCurrentPageTitle, showToast } = useUIStore();
  const { trendPlatformFilter, setTrendPlatformFilter, searchQuery, setSearchQuery } = useVibeStore();
  const [showDetector, setShowDetector] = useState(false);

  useEffect(() => { setCurrentPageTitle('Tendances Social Media'); }, [setCurrentPageTitle]);

  const trends = getAll('trends');

  const filteredTrends = trends.filter(t => {
    if (trendPlatformFilter !== 'all' && t.platform !== trendPlatformFilter) return false;
    if (searchQuery && !t.topic.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Aggregated data
  const platformData = ['linkedin', 'twitter', 'facebook', 'instagram', 'youtube'].map(p => ({
    platform: p.charAt(0).toUpperCase() + p.slice(1),
    volume: trends.filter(t => t.platform === p).reduce((s, t) => s + t.volumeScore, 0) / (trends.filter(t => t.platform === p).length || 1),
    count: trends.filter(t => t.platform === p).length,
  }));

  const categoryData = [...new Set(trends.map(t => t.category))].map(c => ({
    category: c,
    count: trends.filter(t => t.category === c).length,
    avgVolume: Math.round(trends.filter(t => t.category === c).reduce((s, t) => s + t.volumeScore, 0) / (trends.filter(t => t.category === c).length || 1)),
  }));

  const handleGenerateContent = (suggestion: string) => {
    showToast('Contenu genere par IA : "' + suggestion.slice(0, 50) + '..."', 'success');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Tendances Social Media</h2>
          <p className="text-xs text-[var(--text-muted)]">{filteredTrends.length} tendances detectees · Analyse en temps reel</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDetector(true)}
            className="btn-primary h-9 text-xs gap-1.5 flex items-center"
          >
            <RadarIcon size={14} /> Detecteur IA
          </button>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une tendance..."
            className="h-9 px-3 glass-input text-sm w-48"
          />
          <select
            value={trendPlatformFilter}
            onChange={(e) => setTrendPlatformFilter(e.target.value)}
            className="h-9 px-3 glass-input text-sm"
          >
            <option value="all">Toutes plateformes</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">Twitter</option>
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
          </select>
        </div>
      </div>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
        {platformData.map((p, i) => (
          <GlassCard key={p.platform} delay={i * 0.05}>
            <div className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[var(--accent-primary)]">{platformIcons[p.platform.toLowerCase()]}</span>
                <span className="text-xs font-medium text-[var(--text-primary)]">{p.platform}</span>
              </div>
              <p className="text-lg font-bold text-[var(--text-primary)]">{Math.round(p.volume)}</p>
              <p className="text-[10px] text-[var(--text-muted)]">Score volume moyen · {p.count} tendances</p>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard delay={0.2} className="lg:col-span-2">
          <div className="p-4">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-[var(--accent-primary)]" /> Volume par Plateforme & Categories</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={platformData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--divider)" />
                <XAxis dataKey="platform" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border-hover)', borderRadius: 'var(--radius)', color: 'var(--text-primary)', fontSize: 12 }} />
                <Bar dataKey="volume" fill="var(--chart-orange)" radius={[4, 4, 0, 0]} name="Volume" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard delay={0.25}>
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2"><Activity size={14} className="text-[var(--accent-secondary)]" /> Categories</h3>
            <div className="space-y-2">
              {categoryData.map(c => (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[var(--text-secondary)]">{c.category}</span>
                    <span className="text-xs font-medium text-[var(--text-primary)]">{c.count}</span>
                  </div>
                  <div className="h-1.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-secondary)] rounded-full" style={{ width: `${(c.avgVolume / 100) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Trends List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTrends.map((trend, i) => {
          const s = sentimentConfig[trend.sentiment];
          return (
            <GlassCard key={trend.id} delay={i * 0.05}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--accent-primary)]">{platformIcons[trend.platform]}</span>
                    <span className="text-xs text-[var(--text-muted)]">{trend.platform.charAt(0).toUpperCase() + trend.platform.slice(1)} · {trend.category}</span>
                  </div>
                  <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded ${s.bg} ${s.color}`}>{s.icon} {s.label}</span>
                </div>

                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">{trend.topic}</h3>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <TrendingUp size={10} className="text-[var(--accent-primary)]" />
                    <span>Volume: <strong className="text-[var(--text-primary)]">{trend.volumeScore}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <ArrowUpRight size={10} className="text-[var(--accent-primary)]" />
                    <span>Croissance: <strong className="text-[var(--text-primary)]">+{trend.growthRate}%</strong></span>
                  </div>
                </div>

                {/* Hashtags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {trend.relatedHashtags.map(h => (
                    <span key={h} className="text-[9px] bg-[var(--bg-elevated)] text-[var(--text-muted)] px-1.5 py-0.5 rounded flex items-center gap-0.5"><Hash size={8} />{h}</span>
                  ))}
                </div>

                {/* Geo Hotspots */}
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={10} className="text-[var(--text-muted)]" />
                  <div className="flex gap-1">
                    {trend.geoHotspots.slice(0, 3).map(g => (
                      <span key={g.city} className="text-[9px] text-[var(--text-secondary)] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded">{g.city} ({g.intensity})</span>
                    ))}
                  </div>
                </div>

                {/* Demographics */}
                <div className="flex gap-2 mb-3">
                  {trend.audienceDemographics.map(d => (
                    <div key={d.segment} className="flex-1 text-center">
                      <div className="h-8 bg-[var(--bg-elevated)] rounded flex items-end justify-center p-1">
                        <div className="w-full bg-[var(--accent-primary)]/30 rounded" style={{ height: `${d.percentage}%` }} />
                      </div>
                      <p className="text-[8px] text-[var(--text-muted)] mt-0.5">{d.segment}</p>
                      <p className="text-[9px] font-medium text-[var(--text-primary)]">{d.percentage}%</p>
                    </div>
                  ))}
                </div>

                {/* AI Content Suggestion */}
                <div className="glass-card-compact p-2 bg-gradient-to-r from-[var(--accent-primary)]/5 to-[var(--accent-primary-hover)]/5">
                  <div className="flex items-start gap-2">
                    <Sparkles size={12} className="text-[var(--accent-primary)] mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="text-[10px] text-[var(--text-secondary)] mb-1">Suggestion IA pour contenu</p>
                      <p className="text-[10px] text-[var(--text-primary)]">{trend.suggestedContent}</p>
                    </div>
                    <button onClick={() => handleGenerateContent(trend.suggestedContent)} className="text-[10px] text-[var(--accent-primary)] hover:underline shrink-0">Generer</button>
                  </div>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Detecteur de Tendances & Ecarts Creatifs */}
      <VibeTrendDetector isOpen={showDetector} onClose={() => setShowDetector(false)} />
    </div>
  );
}
