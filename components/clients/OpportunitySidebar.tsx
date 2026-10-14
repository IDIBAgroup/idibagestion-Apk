'use client';

import { useEffect, useId, useState } from 'react';
import { Briefcase, Calendar, Mail, Percent, Phone, Tag, User, Wallet, Megaphone } from 'lucide-react';
import SlideOver from '@/components/common/SlideOver';
import { ErrorNotice, FormFooter } from '@/components/common/FormParts';
import FloatedInput from '@/components/ui/FloatedInput';
import type { Client, Opportunity, OpportunityStage } from '@/types';
import { STAGES } from './shared';

export interface OpportunityForm {
  title: string;
  clientId: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  value: string;
  probability: string;
  stage: OpportunityStage;
  expectedCloseDate: string;
  source: string;
  notes: string;
}

const EMPTY: OpportunityForm = {
  title: '', clientId: '', clientName: '', contactName: '', contactEmail: '', contactPhone: '',
  value: '', probability: '50', stage: 'prospecting', expectedCloseDate: '', source: '', notes: '',
};

interface Props {
  open: boolean;
  item: Opportunity | null;
  clients: Client[];
  onClose: () => void;
  onSave: (form: OpportunityForm) => Promise<void> | void;
}

export function OpportunitySidebar({ open, item, clients, onClose, onSave }: Props) {
  const [form, setForm] = useState<OpportunityForm>(EMPTY);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const formId = useId();

  useEffect(() => {
    if (!open) return;
    // Reseed from the selected record whenever the panel opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(
      item
        ? {
            title: item.title, clientId: item.clientId, clientName: item.clientName, contactName: item.contactName,
            contactEmail: item.contactEmail, contactPhone: item.contactPhone, value: String(item.value),
            probability: String(item.probability), stage: item.stage,
            expectedCloseDate: item.expectedCloseDate?.slice(0, 10) ?? '', source: item.source, notes: item.notes,
          }
        : EMPTY,
    );
    setError('');
  }, [open, item]);

  const set = <K extends keyof OpportunityForm>(key: K, value: OpportunityForm[K]) => setForm((p) => ({ ...p, [key]: value }));
  const field = (key: keyof OpportunityForm, label: string, icon: React.ReactNode, opts: { required?: boolean; type?: 'text' | 'email' | 'tel' | 'number' | 'date' } = {}) => (
    <FloatedInput
      id={`${formId}-${key}`}
      name={key}
      compact
      label={label}
      type={opts.type ?? 'text'}
      required={opts.required}
      leftIcon={icon}
      value={form[key]}
      onChange={(value) => set(key, value as never)}
    />
  );

  function pickClient(id: string) {
    const client = clients.find((c) => c.id === id);
    setForm((p) => ({
      ...p,
      clientId: id,
      clientName: client?.name ?? '',
      contactName: p.contactName || client?.contactName || '',
      contactEmail: p.contactEmail || client?.contactEmail || '',
      contactPhone: p.contactPhone || client?.phone || '',
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!form.title.trim() || !form.clientName.trim() || !form.value) {
      setError('Le titre, le client et la valeur sont requis.');
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
      title={item ? 'Modifier l’opportunité' : 'Nouvelle opportunité'}
      subtitle="Suivez une affaire du premier contact à la signature."
      footer={<FormFooter form={formId} pending={pending} onClose={onClose} label="Enregistrer" />}
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        <ErrorNotice message={error} />
        <fieldset disabled={pending} className="space-y-4">
          {field('title', 'Titre de l’opportunité', <Briefcase size={16} />, { required: true })}
          <FloatedInput
            id={`${formId}-client`}
            name="clientId"
            compact
            label="Client"
            leftIcon={<User size={16} />}
            value={form.clientId}
            onChange={pickClient}
            options={[{ value: '', label: 'Choisir un client' }, ...clients.map((c) => ({ value: c.id, label: c.name }))]}
          />
          {!form.clientId && field('clientName', 'Ou saisir un nom de client', <User size={16} />)}
          {field('contactName', 'Contact', <User size={16} />)}
          {field('contactEmail', 'E-mail du contact', <Mail size={16} />, { type: 'email' })}
          {field('contactPhone', 'Téléphone', <Phone size={16} />, { type: 'tel' })}

          <p className="pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Affaire</p>
          {field('value', 'Valeur estimée (XAF)', <Wallet size={16} />, { type: 'number', required: true })}
          {field('probability', 'Probabilité (%)', <Percent size={16} />, { type: 'number' })}
          <FloatedInput
            id={`${formId}-stage`}
            name="stage"
            compact
            label="Étape"
            leftIcon={<Tag size={16} />}
            value={form.stage}
            onChange={(value) => set('stage', value as OpportunityStage)}
            options={STAGES.map((s) => ({ value: s.value, label: s.label }))}
          />
          {field('expectedCloseDate', 'Clôture prévue', <Calendar size={16} />, { type: 'date' })}
          {field('source', 'Source', <Megaphone size={16} />)}
          <label className="block text-xs font-medium text-[var(--text-muted)]">
            Notes
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="mt-1.5 block w-full rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--text-primary)]"
            />
          </label>
        </fieldset>
      </form>
    </SlideOver>
  );
}
