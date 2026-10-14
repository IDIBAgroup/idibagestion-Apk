import { useEffect, useState } from 'react';
import { getAll, subscribe } from '@/lib/db';
import type { Database } from '@/lib/db';
import type { BadgeVariant } from '@/components/ui/BadgePill';
import type { OpportunityStage } from '@/types';

export const formatXAF = (amount: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(amount || 0);

export const formatDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const CLIENT_TYPES = [
  { value: 'entreprise', label: 'Entreprise' },
  { value: 'particulier', label: 'Particulier' },
  { value: 'administration', label: 'Administration' },
] as const;

export const clientTypeVariant: Record<string, BadgeVariant> = {
  entreprise: 'sky',
  particulier: 'purple',
  administration: 'gray',
};

export const STAGES: { value: OpportunityStage; label: string; variant: BadgeVariant }[] = [
  { value: 'prospecting', label: 'Prospection', variant: 'sky' },
  { value: 'qualification', label: 'Qualification', variant: 'purple' },
  { value: 'proposal', label: 'Proposition', variant: 'warning' },
  { value: 'negotiation', label: 'Négociation', variant: 'pink' },
  { value: 'closed_won', label: 'Gagnée', variant: 'success' },
  { value: 'closed_lost', label: 'Perdue', variant: 'error' },
];

export const stageMeta = (stage: OpportunityStage) => STAGES.find((s) => s.value === stage) ?? STAGES[0];

/** Reads a local collection and refreshes whenever it changes. */
export function useCollection<K extends keyof Database>(name: K): Database[K] {
  const [rows, setRows] = useState<Database[K]>(() => getAll(name));
  useEffect(() => {
    const load = () => setRows([...(getAll(name) as unknown[])] as Database[K]);
    load();
    return subscribe(name as string, load);
  }, [name]);
  return rows;
}
