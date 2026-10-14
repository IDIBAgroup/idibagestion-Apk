'use client';

import { useEffect, useState } from 'react';
import { Calendar, Mail, Phone, StickyNote, Users, PhoneCall, CheckCircle2 } from 'lucide-react';
import SlideOver from '@/components/common/SlideOver';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { Badge } from '@/components/ui/BadgePill';
import { primaryButton, secondaryButton } from '@/components/common/FormParts';
import type { Opportunity, OpportunityActivity, OpportunityStage } from '@/types';
import { STAGES, formatDate, formatXAF, stageMeta } from './shared';

interface Props {
  item: Opportunity | null;
  onClose: () => void;
  onEdit: (opp: Opportunity) => void;
  onStageChange: (opp: Opportunity, stage: OpportunityStage) => void;
  onAddActivity: (opp: Opportunity, type: OpportunityActivity['type'], description: string) => void;
}

const ACTIVITY_ICONS: Record<OpportunityActivity['type'], React.ReactNode> = {
  call: <PhoneCall size={14} />,
  email: <Mail size={14} />,
  meeting: <Users size={14} />,
  note: <StickyNote size={14} />,
  task: <CheckCircle2 size={14} />,
};

const ACTIVITY_LABELS: Record<OpportunityActivity['type'], string> = {
  call: 'Appel', email: 'E-mail', meeting: 'Réunion', note: 'Note', task: 'Tâche',
};

export function OpportunityViewSidebar({ item, onClose, onEdit, onStageChange, onAddActivity }: Props) {
  const [type, setType] = useState<OpportunityActivity['type']>('call');
  const [description, setDescription] = useState('');
  useEffect(() => {
    // Reset the draft when another opportunity is shown.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDescription('');
    setType('call');
  }, [item?.id]);

  const meta = item ? stageMeta(item.stage) : null;

  return (
    <SlideOver
      open={Boolean(item)}
      onClose={onClose}
      title={item?.title ?? 'Opportunité'}
      subtitle={item?.clientName}
      width="max-w-xl"
      footer={
        item && (
          <button type="button" className={secondaryButton} onClick={() => onEdit(item)}>
            Modifier
          </button>
        )
      }
    >
      {item && meta && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            <CustomDropdown
              className="w-48"
              value={item.stage}
              onChange={(value) => onStageChange(item, value as OpportunityStage)}
              options={STAGES.map((s) => ({ value: s.value, label: s.label }))}
            />
          </div>

          <div className="grid grid-cols-3 divide-x divide-[var(--divider)] border border-[var(--glass-border)]">
            <div className="p-3">
              <p className="text-[11px] text-[var(--text-muted)]">Valeur</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{formatXAF(item.value)}</p>
            </div>
            <div className="p-3">
              <p className="text-[11px] text-[var(--text-muted)]">Probabilité</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{item.probability}%</p>
            </div>
            <div className="p-3">
              <p className="text-[11px] text-[var(--text-muted)]">Pondérée</p>
              <p className="mt-1 text-sm font-semibold tabular-nums">{formatXAF((item.value * item.probability) / 100)}</p>
            </div>
          </div>

          <dl className="space-y-2 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2"><Users size={14} className="text-[var(--text-muted)]" /> {item.contactName || '—'}</div>
            <div className="flex items-center gap-2"><Mail size={14} className="text-[var(--text-muted)]" /> {item.contactEmail || '—'}</div>
            <div className="flex items-center gap-2"><Phone size={14} className="text-[var(--text-muted)]" /> {item.contactPhone || '—'}</div>
            <div className="flex items-center gap-2"><Calendar size={14} className="text-[var(--text-muted)]" /> Clôture prévue : {formatDate(item.expectedCloseDate)}</div>
            <p className="text-xs text-[var(--text-muted)]">Responsable : {item.assignedToName || '—'} · Source : {item.source || '—'}</p>
          </dl>

          {item.notes && (
            <section>
              <h3 className="mb-1 text-sm font-semibold">Notes</h3>
              <p className="whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{item.notes}</p>
            </section>
          )}

          <section>
            <h3 className="mb-2 text-sm font-semibold">Activités ({item.activities?.length ?? 0})</h3>
            <div className="mb-3 flex gap-2">
              <CustomDropdown
                className="w-32 shrink-0"
                value={type}
                onChange={(value) => setType(value as OpportunityActivity['type'])}
                options={(Object.keys(ACTIVITY_LABELS) as OpportunityActivity['type'][]).map((t) => ({ value: t, label: ACTIVITY_LABELS[t] }))}
              />
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && description.trim()) {
                    onAddActivity(item, type, description.trim());
                    setDescription('');
                  }
                }}
                placeholder="Ajouter une activité…"
                className="h-10 min-w-0 flex-1 rounded border border-[var(--glass-border)] bg-[var(--bg-card)] px-3 text-sm outline-none focus:border-[var(--text-primary)]"
              />
              <button
                type="button"
                disabled={!description.trim()}
                className={primaryButton}
                onClick={() => {
                  onAddActivity(item, type, description.trim());
                  setDescription('');
                }}
              >
                Ajouter
              </button>
            </div>
            {(item.activities?.length ?? 0) === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Aucune activité enregistrée.</p>
            ) : (
              <ul className="divide-y divide-[var(--divider)] border border-[var(--glass-border)]">
                {[...item.activities].reverse().map((a) => (
                  <li key={a.id} className="flex items-start gap-3 px-3 py-2.5">
                    <span className="mt-0.5 text-[var(--text-primary)]">{ACTIVITY_ICONS[a.type]}</span>
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--text-primary)]">{a.description}</p>
                      <p className="text-xs text-[var(--text-muted)]">{a.createdByName} · {formatDate(a.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </SlideOver>
  );
}
