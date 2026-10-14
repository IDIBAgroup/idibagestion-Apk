'use client';

import { useEffect, useMemo, useState } from 'react';
import { Briefcase, Building2, Eye, FileText, Hash, Mail, MapPin, Pencil, Phone, Trash2, User, UserCheck } from 'lucide-react';
import Table, { type Column } from '@/components/common/Table';
import SlideOver from '@/components/common/SlideOver';
import { ErrorNotice, FormFooter } from '@/components/common/FormParts';
import FloatedInput from '@/components/ui/FloatedInput';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { Badge } from '@/components/ui/BadgePill';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { addAndNotify, removeAndNotify, updateAndNotify } from '@/lib/db';
import { swalConfirm, swalSuccess } from '@/lib/sweetalert';
import { useUIStore } from '@/stores/uiStore';
import { useCollection } from '@/components/clients/shared';
import type { Supplier } from '@/types';

type SupplierDraft = Pick<Supplier, 'name' | 'email' | 'contactName' | 'contactEmail' | 'phone' | 'sector' | 'address' | 'city' | 'country' | 'ifu' | 'rccm' | 'status'>;
const EMPTY: SupplierDraft = { name: '', email: '', contactName: '', contactEmail: '', phone: '', sector: '', address: '', city: '', country: 'Cameroun', ifu: '', rccm: '', status: 'active' };

export function SuppliersPage() {
  const { companyId } = useActiveCompany();
  const { setCurrentPageTitle, showToast } = useUIStore();
  const allSuppliers = useCollection('suppliers') as Supplier[];
  const localCompanyId = String(companyId ?? '') === '1' ? 'comp-1' : String(companyId ?? '');
  const suppliers = useMemo(() => allSuppliers.filter((item) => !localCompanyId || item.companyId === localCompanyId), [allSuppliers, localCompanyId]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [viewing, setViewing] = useState<Supplier | null>(null);
  const [draft, setDraft] = useState<SupplierDraft>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const formId = 'supplier-form';

  useEffect(() => { setCurrentPageTitle('Fournisseurs'); }, [setCurrentPageTitle]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return suppliers.filter((item) => {
      const text = [item.name, item.contactName, item.email, item.contactEmail, item.sector, item.city, item.country].some((value) => value?.toLocaleLowerCase().includes(query));
      return text && (!status || item.status === status);
    });
  }, [suppliers, search, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pages);

  const startCreate = () => { setEditing(null); setDraft(EMPTY); setError(''); setOpen(true); };
  const startEdit = (item: Supplier) => { setEditing(item); setDraft({ ...EMPTY, ...item }); setError(''); setOpen(true); };

  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;
    if (!draft.name.trim() || !(draft.contactEmail.trim() || draft.email.trim())) {
      setError('Renseignez le nom du fournisseur et une adresse e-mail de contact.');
      return;
    }
    setSaving(true);
    const normalized: SupplierDraft = {
      ...draft,
      name: draft.name.trim(), email: draft.email.trim() || draft.contactEmail.trim(),
      contactName: draft.contactName.trim(), contactEmail: draft.contactEmail.trim() || draft.email.trim(),
      phone: draft.phone.trim(), sector: draft.sector.trim(), address: draft.address.trim(),
      city: draft.city.trim(), country: draft.country.trim() || 'Cameroun',
      ifu: draft.ifu?.trim() || undefined, rccm: draft.rccm?.trim() || undefined,
    };
    if (editing) {
      updateAndNotify('suppliers', editing.id, normalized);
      showToast('Fiche fournisseur mise à jour.', 'success');
    } else {
      addAndNotify('suppliers', { ...normalized, id: `supplier-${Date.now()}`, createdAt: new Date().toISOString(), companyId: localCompanyId || 'comp-1' });
      showToast('Fournisseur ajouté au registre.', 'success');
    }
    setSaving(false);
    setOpen(false);
  };

  const remove = async (item: Supplier) => {
    if (!(await swalConfirm('Supprimer ce fournisseur ?', `La fiche « ${item.name} » sera retirée du registre.`))) return;
    removeAndNotify('suppliers', item.id);
    void swalSuccess('Fournisseur supprimé du registre.');
  };

  const field = (key: keyof SupplierDraft, label: string, icon: React.ReactNode, type: 'text' | 'email' | 'tel' = 'text') => (
    <FloatedInput id={`${formId}-${key}`} name={key} compact label={label} type={type} leftIcon={icon} value={String(draft[key] ?? '')}
      onChange={(value) => setDraft((current) => ({ ...current, [key]: value }))} />
  );

  const columns: Column<Supplier>[] = [
    { accessor: 'name', header: 'Fournisseur', minWidth: '250px', cell: (item) => <div className="flex items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded bg-[var(--bg-card-hover)] text-[var(--text-primary)]"><Building2 size={17} /></span><div className="min-w-0"><p className="truncate font-semibold text-[var(--text-primary)]">{item.name}</p><p className="truncate text-xs text-[var(--text-muted)]">{item.sector || '—'}</p></div></div> },
    { accessor: 'contactName', header: 'Contact', minWidth: '220px', cell: (item) => <div className="min-w-0"><p className="truncate">{item.contactName || '—'}</p><p className="truncate text-xs text-[var(--text-muted)]">{item.contactEmail || item.email}</p></div> },
    { accessor: 'phone', header: 'Téléphone', minWidth: '150px', cell: (item) => item.phone || '—' },
    { accessor: 'city', header: 'Ville', minWidth: '120px', cell: (item) => item.city || '—' },
    { accessor: 'status', header: 'Statut', cell: (item) => <Badge size="sm" variant={item.status === 'active' ? 'active' : 'inactive'}>{item.status === 'active' ? 'Actif' : 'Inactif'}</Badge> },
    { accessor: 'createdAt', header: 'Créé le', minWidth: '120px', cell: (item) => new Date(item.createdAt).toLocaleDateString('fr-FR') },
  ];

  return <div className="-m-6 h-[calc(100vh-76px)] min-h-0">
    <Table
      columns={columns}
      data={filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)}
      searchValue={search}
      searchPlaceholder="Rechercher un fournisseur…"
      onSearch={(value) => { setSearch(value); setPage(1); }}
      filters={[{ id: 'status', component: <CustomDropdown className="w-40" value={status} onChange={(value) => { setStatus(value); setPage(1); }} placeholder="Statut" options={[{ value: '', label: 'Tous les statuts' }, { value: 'active', label: 'Actif' }, { value: 'inactive', label: 'Inactif' }]} /> }]}
      onAdd={startCreate}
      addButtonLabel="Nouveau fournisseur"
      emptyMessage="Aucun fournisseur trouvé."
      showSerialNumber
      actions={[{ label: 'Voir', icon: <Eye size={18} />, onClick: setViewing }, { label: 'Modifier', icon: <Pencil size={18} />, onClick: startEdit }, { label: 'Supprimer', icon: <Trash2 size={18} />, color: 'hover:text-[var(--accent-danger)]', onClick: (item) => void remove(item) }]}
      pagination={{ currentPage, totalPages: pages, totalItems: filtered.length, itemsPerPage: pageSize, onPageChange: setPage, onItemsPerPageChange: (size) => { setPageSize(size); setPage(1); } }}
    />
    <SlideOver open={open} onClose={() => !saving && setOpen(false)} title={editing ? 'Modifier le fournisseur' : 'Nouveau fournisseur'} subtitle="Coordonnées, contact principal et informations fiscales." footer={<FormFooter form={formId} pending={saving} onClose={() => setOpen(false)} label={editing ? 'Enregistrer' : 'Créer le fournisseur'} />}>
      <form id={formId} onSubmit={save} className="space-y-4">
        <ErrorNotice message={error} />
        <fieldset disabled={saving} className="space-y-4">
          {field('name', 'Raison sociale', <Building2 size={16} />)}
          {field('sector', 'Secteur d’activité', <Briefcase size={16} />)}
          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Contact principal</p>
          {field('contactName', 'Nom du contact', <User size={16} />)}
          {field('contactEmail', 'E-mail du contact', <Mail size={16} />, 'email')}
          {field('email', 'E-mail de la société', <Mail size={16} />, 'email')}
          {field('phone', 'Téléphone', <Phone size={16} />, 'tel')}
          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Adresse</p>
          {field('address', 'Adresse', <MapPin size={16} />)}
          {field('city', 'Ville', <MapPin size={16} />)}
          {field('country', 'Pays', <MapPin size={16} />)}
          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Informations fiscales</p>
          {field('ifu', 'NIU / IFU', <Hash size={16} />)}
          {field('rccm', 'RCCM', <FileText size={16} />)}
          <FloatedInput id={`${formId}-status`} name="status" compact label="Statut" leftIcon={<UserCheck size={16} />} value={draft.status} onChange={(value) => setDraft((current) => ({ ...current, status: value as SupplierDraft['status'] }))} options={[{ value: 'active', label: 'Actif' }, { value: 'inactive', label: 'Inactif' }]} />
        </fieldset>
      </form>
    </SlideOver>
    <SlideOver open={!!viewing} onClose={() => setViewing(null)} title={viewing?.name || 'Fiche fournisseur'} subtitle="Coordonnées et informations du fournisseur.">
      {viewing && <div className="space-y-5">
        <div className="flex items-center gap-3 border-b border-[var(--glass-border)] pb-4"><span className="grid size-12 place-items-center rounded bg-[var(--bg-card-hover)]"><Building2 size={20} /></span><div><h3 className="font-semibold text-[var(--text-primary)]">{viewing.name}</h3><p className="text-sm text-[var(--text-muted)]">{viewing.sector || 'Secteur non renseigné'}</p></div></div>
        <Detail label="Contact principal" value={viewing.contactName} />
        <Detail label="E-mail du contact" value={viewing.contactEmail || viewing.email} />
        <Detail label="E-mail général" value={viewing.email} />
        <Detail label="Téléphone" value={viewing.phone} />
        <Detail label="Adresse" value={[viewing.address, viewing.city, viewing.country].filter(Boolean).join(', ')} />
        <Detail label="NIU / IFU" value={viewing.ifu} />
        <Detail label="RCCM" value={viewing.rccm} />
        <Detail label="Statut" value={viewing.status === 'active' ? 'Actif' : 'Inactif'} />
        <button type="button" onClick={() => { setViewing(null); startEdit(viewing); }} className="inline-flex h-10 items-center gap-2 rounded bg-[var(--text-primary)] px-4 text-sm font-semibold text-white"><Pencil size={15} />Modifier le fournisseur</button>
      </div>}
    </SlideOver>
  </div>;
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return <div className="border-b border-[var(--glass-border)] pb-3"><p className="text-xs font-medium text-[var(--text-muted)]">{label}</p><p className="mt-1 text-sm text-[var(--text-primary)]">{value || '—'}</p></div>;
}
