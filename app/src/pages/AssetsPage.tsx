import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, List, Search, Plus, QrCode, MapPin, Wrench } from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useUIStore } from '@/stores/uiStore';
import { getAll } from '@/lib/db';
import type { Asset } from '@/types';

export function AssetsPage() {
  const { setCurrentPageTitle } = useUIStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => { setCurrentPageTitle('Parc Matériel'); }, [setCurrentPageTitle]);

  const assets = getAll('assets') as Asset[];

  const filtered = assets.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.serialNumber.toLowerCase().includes(search);
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatXAF = (amount: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount);

  const categoryIcons: Record<string, string> = {
    'Serveurs': '🖥️',
    'Réseau': '🌐',
    'Électrique': '⚡',
    'Informatique': '💻',
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard delay={0}>
          <div className="p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase">Total Équipements</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{assets.length}</p>
          </div>
        </GlassCard>
        <GlassCard delay={0.05}>
          <div className="p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase">Valeur Nette Totale</p>
            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{formatXAF(assets.reduce((s, a) => s + a.netValue, 0))}</p>
          </div>
        </GlassCard>
        <GlassCard delay={0.1}>
          <div className="p-4">
            <p className="text-xs text-[var(--text-muted)] uppercase">En Maintenance</p>
            <p className="text-2xl font-bold text-[var(--accent-warning)] mt-1">{assets.filter(a => a.status === 'maintenance').length}</p>
          </div>
        </GlassCard>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full h-9 pl-9 pr-4 glass-input text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 glass-input text-sm"
        >
          <option value="all">Tous</option>
          <option value="active">Actif</option>
          <option value="maintenance">En maintenance</option>
          <option value="disposed">Cédé</option>
          <option value="out_of_service">Hors service</option>
        </select>
        <div className="flex bg-[var(--bg-elevated)] rounded-lg p-0.5">
          <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-[var(--bg-card)] shadow-sm' : ''}`}><LayoutGrid size={16} className={viewMode === 'grid' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'} /></button>
          <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-[var(--bg-card)] shadow-sm' : ''}`}><List size={16} className={viewMode === 'list' ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'} /></button>
        </div>
        <button className="btn-primary h-9"><Plus size={16} /> Nouvel Asset</button>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((asset, i) => (
            <GlassCard key={asset.id} delay={i * 0.05}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[var(--bg-elevated)] flex items-center justify-center text-2xl">
                    {categoryIcons[asset.category] || '📦'}
                  </div>
                  <StatusBadge status={asset.status} />
                </div>

                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{asset.name}</h3>
                <p className="text-xs text-[var(--text-muted)] font-mono mb-3">{asset.serialNumber}</p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Valeur d'acquisition</span>
                    <span className="text-[var(--text-primary)] font-medium">{formatXAF(asset.value)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Amortissement</span>
                    <span className="text-[var(--text-warning)]">{formatXAF(asset.depreciation)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[var(--text-muted)]">Valeur nette</span>
                    <span className="text-[var(--accent-primary)] font-medium">{formatXAF(asset.netValue)}</span>
                  </div>

                  <div className="h-px bg-[var(--divider)] my-2" />

                  <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]">
                    <MapPin size={10} />
                    <span className="truncate">{asset.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                    <span>Acquis le {new Date(asset.acquisitionDate).toLocaleDateString('fr-FR')}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]">{asset.category}</span>
                  </div>
                </div>

                {/* QR Code Placeholder */}
                <div className="mt-3 flex justify-center">
                  <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center">
                    <QrCode size={32} className="text-black" />
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <GlassCard>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--divider)]">
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Nom</th>
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Catégorie</th>
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">N° Série</th>
                  <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Valeur</th>
                  <th className="text-right text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Valeur Nette</th>
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Localisation</th>
                  <th className="text-left text-xs text-[var(--text-muted)] font-medium uppercase tracking-wider px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((asset) => (
                  <tr key={asset.id} className="border-b border-[var(--divider)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoryIcons[asset.category] || '📦'}</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{asset.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{asset.category}</td>
                    <td className="px-4 py-3 text-xs font-mono text-[var(--text-muted)]">{asset.serialNumber}</td>
                    <td className="px-4 py-3 text-xs text-right text-[var(--text-primary)]">{formatXAF(asset.value)}</td>
                    <td className="px-4 py-3 text-xs text-right text-[var(--accent-primary)] font-medium">{formatXAF(asset.netValue)}</td>
                    <td className="px-4 py-3 text-xs text-[var(--text-secondary)] truncate max-w-[150px]">{asset.location}</td>
                    <td className="px-4 py-3"><StatusBadge status={asset.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
