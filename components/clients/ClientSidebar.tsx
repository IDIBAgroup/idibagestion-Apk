'use client';

import { useEffect, useId, useState } from 'react';
import { Building2, Hash, Mail, MapPin, Phone, Tag, User, UserCheck, Briefcase, FileText } from 'lucide-react';
import SlideOver from '@/components/common/SlideOver';
import { ErrorNotice, FormFooter } from '@/components/common/FormParts';
import FloatedInput from '@/components/ui/FloatedInput';
import type { Client } from '@/types';
import { CLIENT_TYPES } from './shared';

export type ClientForm = Pick<
  Client,
  'name' | 'type' | 'sector' | 'contactName' | 'contactEmail' | 'email' | 'phone' | 'address' | 'city' | 'ifu' | 'rccm' | 'status'
>;

const EMPTY: ClientForm = {
  name: '', type: 'entreprise', sector: '', contactName: '', contactEmail: '', email: '',
  phone: '', address: '', city: 'Douala', ifu: '', rccm: '', status: 'active',
};

interface Props {
  open: boolean;
  item: Client | null;
  onClose: () => void;
  onSave: (form: ClientForm) => Promise<void> | void;
}

export function ClientSidebar({ open, item, onClose, onSave }: Props) {
  const [form, setForm] = useState<ClientForm>(EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const formId = useId();

  useEffect(() => {
    if (!open) return;
    // Reseed from the selected record whenever the panel opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(item ? { ...EMPTY, ...item } : EMPTY);
    setError('');
  }, [open, item]);

  const set = <K extends keyof ClientForm>(key: K, value: ClientForm[K]) => setForm((p) => ({ ...p, [key]: value }));
  const text = (key: keyof ClientForm, label: string, icon: React.ReactNode, required = false, type: 'text' | 'email' | 'tel' = 'text') => (
    <FloatedInput
      id={`${formId}-${key}`}
      name={key}
      compact
      label={label}
      type={type}
      required={required}
      leftIcon={icon}
      value={String(form[key] ?? '')}
      onChange={(value) => set(key, value as never)}
    />
  );

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!form.name.trim()) {
      setError('Le nom du client est requis.');
      return;
    }
    setPending(true);
    setError('');
    try {
      await onSave(form);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setPending(false);
    }
  }

  return (
    <SlideOver
      open={open}
      onClose={() => !pending && onClose()}
      title={item ? 'Modifier le client' : 'Nouveau client'}
      subtitle="Coordonnées, contact principal et informations fiscales."
      footer={<FormFooter form={formId} pending={pending} onClose={onClose} label="Enregistrer" />}
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        <ErrorNotice message={error} />
        <fieldset disabled={pending} className="space-y-4">
          {text('name', 'Raison sociale / Nom', <Building2 size={16} />, true)}
          <FloatedInput
            id={`${formId}-type`}
            name="type"
            compact
            label="Type de client"
            leftIcon={<Tag size={16} />}
            value={form.type}
            onChange={(value) => set('type', value as Client['type'])}
            options={CLIENT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />
          {text('sector', 'Secteur d’activité', <Briefcase size={16} />)}

          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Contact principal</p>
          {text('contactName', 'Nom du contact', <User size={16} />)}
          {text('contactEmail', 'E-mail du contact', <Mail size={16} />, false, 'email')}
          {text('email', 'E-mail de la société', <Mail size={16} />, false, 'email')}
          {text('phone', 'Téléphone', <Phone size={16} />, false, 'tel')}

          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Adresse</p>
          {text('address', 'Adresse', <MapPin size={16} />)}
          {text('city', 'Ville', <MapPin size={16} />)}

          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Informations fiscales</p>
          {text('ifu', 'NIU / IFU', <Hash size={16} />)}
          {text('rccm', 'RCCM', <FileText size={16} />)}
          <FloatedInput
            id={`${formId}-status`}
            name="status"
            compact
            label="Statut"
            leftIcon={<UserCheck size={16} />}
            value={form.status}
            onChange={(value) => set('status', value as Client['status'])}
            options={[
              { value: 'active', label: 'Actif' },
              { value: 'inactive', label: 'Inactif' },
            ]}
          />
        </fieldset>
      </form>
    </SlideOver>
  );
}
