'use client';

import { useEffect, useId, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, Hash, MapPin, Package, Plus, Search, Wallet } from 'lucide-react';
import { StatusBadge } from '@/components/shared/StatusBadge';
import SlideOver from '@/components/common/SlideOver';
import { ErrorNotice, FormFooter } from '@/components/common/FormParts';
import FloatedInput from '@/components/ui/FloatedInput';
import { useUIStore } from '@/stores/uiStore';
import type { Asset, AssetStatus } from '@/types';
import { formatPlatformCurrency, usePlatformFinancialSettings } from '@/hooks/usePlatformFinancialSettings';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { trpc } from '@/providers/trpc';
import { calculateEstimatedDepreciation } from '@/lib/finance/fixed-assets';

const ASSET_CATEGORIES = ['Agriculture et élevage', 'Agro-industrie', 'Bâtiment et travaux publics', 'Commerce et distribution', 'Éducation et formation', 'Énergie et environnement', 'Finance et assurance', 'Hôtellerie et restauration', 'Industrie et production', 'Informatique et télécommunications', 'Immobilier', 'Médias et communication', 'Santé et pharmacie', 'Transport et logistique', 'Tourisme', 'Autre'];
const ASSET_STATUSES: { value: AssetStatus; label: string }[] = [
  { value: 'active', label: 'Actif' },
  { value: 'maintenance', label: 'En maintenance' },
  { value: 'disposed', label: 'Cédé' },
  { value: 'out_of_service', label: 'Hors service' },
];
const EMPTY_ASSET = { name: '', category: '', serialNumber: '', description: '', acquisitionDate: '', usefulLifeYears: '', depreciationMethod: 'linear' as 'linear' | 'degressive', value: '', location: '', status: 'active' as AssetStatus };

export function AssetsPage() {
  const { currency } = usePlatformFinancialSettings();
  const { companyId } = useActiveCompany();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const utils = trpc.useUtils();
  const assetsQuery = trpc.asset.list.useQuery({ companyId: companyId ?? 0 }, { enabled: Boolean(companyId) });
  const createAsset = trpc.asset.create.useMutation({
    onSuccess: async () => {
      await utils.asset.list.invalidate({ companyId: companyId ?? 0 });
      setNewAsset(EMPTY_ASSET);
      setError('');
      setShowForm(false);
      showToast('Immobilisation enregistrée', 'success');
    },
    onError: (mutationError) => setError(mutationError.message),
  });
  const updateAssetStatus = trpc.asset.setStatus.useMutation({
    onSuccess: async () => {
      await utils.asset.list.invalidate({ companyId: companyId ?? 0 });
      showToast('Statut de l’immobilisation mis à jour.', 'success');
    },
    onError: (mutationError) => showToast(mutationError.message, 'error'),
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [newAsset, setNewAsset] = useState(EMPTY_ASSET);
  const [error, setError] = useState('');
  const formId = useId();

  useEffect(() => {
    setCurrentPageTitle('Parc Matériel');
  }, [setCurrentPageTitle]);

  const assets: Asset[] = (assetsQuery.data ?? []).map((asset) => ({
    id: String(asset.id),
    name: asset.name,
    category: asset.category,
    serialNumber: asset.serialNumber,
    description: asset.description ?? '',
    acquisitionDate: asset.acquisitionDate ?? '',
    value: asset.acquisitionValue,
    currencyCode: asset.currencyCode,
    depreciation: 0,
    netValue: asset.acquisitionValue,
    location: asset.location ?? '',
    status: asset.status,
    companyId: String(asset.companyId),
    usefulLifeYears: asset.usefulLifeYears ?? undefined,
    depreciationMethod: asset.depreciationMethod ?? undefined,
    depreciationStartDate: asset.acquisitionDate ?? undefined,
  }));
  const filtered = assets.filter((asset) => {
    const query = search.toLocaleLowerCase();
    const matchesSearch = [asset.name, asset.serialNumber, asset.category, asset.location].some((value) => value?.toLocaleLowerCase().includes(query));
    return matchesSearch && (statusFilter === 'all' || asset.status === statusFilter);
  });
  const saveAsset = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newAsset.name.trim() || !newAsset.serialNumber.trim() || !newAsset.value || Number(newAsset.value) <= 0) {
      setError('Indiquez le nom, le numéro de série et une valeur d’acquisition valide.');
      return;
    }
    const value = Number(newAsset.value);
    if (!companyId) {
      setError('Sélectionnez une entreprise avant d’enregistrer une immobilisation.');
      return;
    }
    createAsset.mutate({
      companyId,
      name: newAsset.name.trim(),
      category: newAsset.category.trim() || 'Autre',
      serialNumber: newAsset.serialNumber.trim(),
      description: newAsset.description.trim() || undefined,
      acquisitionDate: newAsset.acquisitionDate || undefined,
      acquisitionValue: value,
      location: newAsset.location.trim() || undefined,
      status: newAsset.status,
      usefulLifeYears: Number(newAsset.usefulLifeYears) || undefined,
      depreciationMethod: newAsset.usefulLifeYears ? newAsset.depreciationMethod : undefined,
    });
  };

  const field = (key: keyof typeof EMPTY_ASSET, label: string, icon: React.ReactNode, options: { type?: 'text' | 'number' | 'date'; required?: boolean; min?: number; step?: number } = {}) => (
    <FloatedInput id={`${formId}-${key}`} name={key} compact label={label} type={options.type || 'text'} required={options.required} min={options.min} step={options.step} leftIcon={icon} value={String(newAsset[key])} onChange={(value) => setNewAsset((current) => ({ ...current, [key]: value }))} />
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une immobilisation…" className="glass-input h-10 w-full pl-9 pr-4 text-sm" />
        </div>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="glass-input h-10 px-3 text-sm">
          <option value="all">Tous les statuts</option>
          {ASSET_STATUSES.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
        </select>
        <button type="button" onClick={() => { setNewAsset(EMPTY_ASSET); setError(''); setShowForm(true); }} className="btn-primary h-10"><Plus size={16} /> Nouvelle immobilisation</button>
      </div>

      <div className="overflow-x-auto border-y border-[var(--divider)]">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead><tr className="border-b border-[var(--divider)] text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            <th className="px-4 py-3">Immobilisation</th><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">N° de série</th><th className="px-4 py-3 text-right">Valeur d’acquisition</th><th className="px-4 py-3 text-right">Amortissement estimé</th><th className="px-4 py-3 text-right">Valeur nette</th><th className="px-4 py-3">Localisation</th><th className="px-4 py-3">Statut</th>
          </tr></thead>
          <tbody>
            {filtered.map((asset) => { const depreciation = asset.usefulLifeYears ? calculateEstimatedDepreciation(asset.value, asset.depreciationStartDate || asset.acquisitionDate, asset.usefulLifeYears, asset.depreciationMethod || 'linear') : asset.depreciation || 0; const netValue = Math.max(0, asset.value - depreciation); return <tr key={asset.id} className="border-b border-[var(--divider)]/70 last:border-0 hover:bg-[var(--bg-elevated)]/40">
              <td className="px-4 py-3"><span className="font-medium text-[var(--text-primary)]">{asset.name}</span>{asset.acquisitionDate && <span className="mt-0.5 block text-xs text-[var(--text-muted)]">Acquis le {new Date(`${asset.acquisitionDate}T00:00:00`).toLocaleDateString('fr-FR')}</span>}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{asset.category || '—'}</td><td className="px-4 py-3 font-mono text-xs text-[var(--text-muted)]">{asset.serialNumber || '—'}</td>
              <td className="px-4 py-3 text-right tabular-nums text-[var(--text-primary)]">{formatPlatformCurrency(asset.value, asset.currencyCode || currency)}</td><td className="px-4 py-3 text-right tabular-nums text-[var(--text-secondary)]">{formatPlatformCurrency(depreciation, asset.currencyCode || currency)}</td><td className="px-4 py-3 text-right tabular-nums font-medium text-[var(--accent-primary)]">{formatPlatformCurrency(netValue, asset.currencyCode || currency)}</td>
              <td className="px-4 py-3 text-[var(--text-secondary)]">{asset.location || '—'}</td><td className="px-4 py-3"><div className="flex flex-wrap items-center gap-2"><StatusBadge status={asset.status} /><select aria-label={`Modifier le statut de ${asset.name}`} value={asset.status} disabled={updateAssetStatus.isPending || !companyId} onChange={(event) => companyId && updateAssetStatus.mutate({ companyId, assetId: Number(asset.id), status: event.target.value as AssetStatus })} className="glass-input h-8 px-2 text-xs"><option value="active">Actif</option><option value="maintenance">En maintenance</option><option value="disposed">Cédé</option><option value="out_of_service">Hors service</option></select></div></td>
            </tr>; })}
            {!filtered.length && <tr><td colSpan={8} className="px-4 py-14 text-center text-sm text-[var(--text-muted)]">{assetsQuery.isLoading ? 'Chargement du registre…' : assetsQuery.isError ? <button type="button" onClick={() => assetsQuery.refetch()} className="text-[var(--accent-primary)]">Échec du chargement. Réessayer</button> : search || statusFilter !== 'all' ? 'Aucune immobilisation ne correspond aux filtres.' : 'Aucune immobilisation enregistrée.'}</td></tr>}
          </tbody>
        </table>
      </div>

      <SlideOver open={showForm} onClose={() => setShowForm(false)} title="Nouvelle immobilisation" subtitle="Renseignez les informations de suivi de l’actif." footer={<FormFooter form={formId} pending={createAsset.isPending} onClose={() => setShowForm(false)} label="Enregistrer" />}>
        <form id={formId} onSubmit={saveAsset} className="space-y-4">
          <ErrorNotice message={error} />
          {field('name', 'Nom de l’immobilisation', <Package size={16} />, { required: true })}
          <label htmlFor={`${formId}-category`} className="block text-xs font-medium text-[var(--text-muted)]">Catégorie d’activité / famille d’immobilisation
            <div className="mt-1.5 flex h-[52px] items-center gap-3 rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-4 focus-within:ring-2 focus-within:ring-[var(--text-primary)]"><BriefcaseBusiness size={16} className="shrink-0 text-[var(--text-muted)]" /><input id={`${formId}-category`} name="category" list={`${formId}-asset-categories`} value={newAsset.category} onChange={(event) => setNewAsset((current) => ({ ...current, category: event.target.value }))} className="min-w-0 flex-1 bg-transparent text-sm text-[var(--text-primary)] outline-none" placeholder="Saisir ou choisir une catégorie" /></div>
            <datalist id={`${formId}-asset-categories`}>{ASSET_CATEGORIES.map((category) => <option key={category} value={category} />)}</datalist>
          </label>
          {field('serialNumber', 'Numéro de série', <Hash size={16} />, { required: true })}
          <FloatedInput id={`${formId}-status`} name="status" compact label="Statut" leftIcon={<Package size={16} />} value={newAsset.status} onChange={(value) => setNewAsset((current) => ({ ...current, status: value as AssetStatus }))} options={ASSET_STATUSES} />
          {field('acquisitionDate', 'Date d’acquisition', <CalendarDays size={16} />, { type: 'date' })}
          <div className="grid grid-cols-2 gap-3"><FloatedInput id={`${formId}-life`} name="usefulLifeYears" compact label="Durée d’usage (années)" type="number" min={1} step={1} leftIcon={<CalendarDays size={16} />} value={newAsset.usefulLifeYears} onChange={(value) => setNewAsset((current) => ({ ...current, usefulLifeYears: value }))} /><FloatedInput id={`${formId}-method`} name="depreciationMethod" compact label="Méthode estimative" leftIcon={<Wallet size={16} />} value={newAsset.depreciationMethod} onChange={(value) => setNewAsset((current) => ({ ...current, depreciationMethod: value as 'linear' | 'degressive' }))} options={[{ value: 'linear', label: 'Linéaire' }, { value: 'degressive', label: 'Dégressive' }]} /></div>
          {field('value', `Valeur d’acquisition (${currency})`, <Wallet size={16} />, { type: 'number', required: true, min: 0, step: 1 })}
          {field('location', 'Localisation', <MapPin size={16} />)}
          <label className="block text-sm font-medium text-[var(--text-secondary)]">Description<textarea value={newAsset.description} onChange={(event) => setNewAsset((current) => ({ ...current, description: event.target.value }))} rows={4} className="mt-1.5 w-full resize-y rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]" /></label>
        </form>
      </SlideOver>
    </div>
  );
}
