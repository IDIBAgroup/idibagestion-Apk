'use client';

import { Mail, MapPin, Phone, User, Hash, FileText } from 'lucide-react';
import SlideOver from '@/components/common/SlideOver';
import { Badge } from '@/components/ui/BadgePill';
import { StatusBadge } from '@/components/shared/StatusBadge';
import type { Client } from '@/types';
import { CLIENT_TYPES, formatDate, formatXAF, useCollection } from './shared';
import { secondaryButton } from '@/components/common/FormParts';

interface Props {
  item: Client | null;
  onClose: () => void;
  onEdit: (client: Client) => void;
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--divider)] py-3">
      <span className="mt-0.5 text-[var(--text-muted)]">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</dt>
        <dd className="mt-0.5 break-words text-sm text-[var(--text-primary)]">{value || '—'}</dd>
      </div>
    </div>
  );
}

export function ClientViewSidebar({ item, onClose, onEdit }: Props) {
  const invoices = useCollection('invoices');
  const clientInvoices = item ? invoices.filter((inv) => inv.clientName === item.name) : [];
  return (
    <SlideOver
      open={Boolean(item)}
      onClose={onClose}
      title={item?.name ?? 'Client'}
      subtitle={item?.sector}
      footer={
        item && (
          <button type="button" className={secondaryButton} onClick={() => onEdit(item)}>
            Modifier
          </button>
        )
      }
    >
      {item && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge size="sm" variant="gray" icon={false}>
              {CLIENT_TYPES.find((t) => t.value === item.type)?.label ?? item.type}
            </Badge>
            <Badge size="sm" variant={item.status === 'active' ? 'active' : 'inactive'}>
              {item.status === 'active' ? 'Actif' : 'Inactif'}
            </Badge>
          </div>

          <div className="grid grid-cols-3 divide-x divide-[var(--divider)] border border-[var(--glass-border)]">
            {[
              ['Facturé', item.totalInvoiced],
              ['Encaissé', item.totalPaid],
              ['Solde dû', item.outstandingBalance],
            ].map(([label, value]) => (
              <div key={label as string} className="p-3">
                <p className="text-[11px] text-[var(--text-muted)]">{label}</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-[var(--text-primary)]">{formatXAF(value as number)}</p>
              </div>
            ))}
          </div>

          <dl>
            <Row icon={<User size={16} />} label="Contact" value={item.contactName} />
            <Row icon={<Mail size={16} />} label="E-mail du contact" value={item.contactEmail} />
            <Row icon={<Mail size={16} />} label="E-mail société" value={item.email} />
            <Row icon={<Phone size={16} />} label="Téléphone" value={item.phone} />
            <Row icon={<MapPin size={16} />} label="Adresse" value={[item.address, item.city, item.country].filter(Boolean).join(', ')} />
            <Row icon={<Hash size={16} />} label="NIU / IFU" value={item.ifu} />
            <Row icon={<FileText size={16} />} label="RCCM" value={item.rccm} />
          </dl>
          <p className="text-xs text-[var(--text-muted)]">Client depuis le {formatDate(item.createdAt)}</p>

          <section>
            <h3 className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Factures ({clientInvoices.length})</h3>
            {clientInvoices.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Aucune facture pour ce client.</p>
            ) : (
              <ul className="divide-y divide-[var(--divider)] border border-[var(--glass-border)]">
                {clientInvoices.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--text-primary)]">{inv.number}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatDate(inv.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm tabular-nums">{formatXAF(inv.total)}</p>
                      <StatusBadge status={inv.status} />
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
