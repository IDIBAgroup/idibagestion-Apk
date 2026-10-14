import { Badge, type BadgeVariant } from '@/components/ui/BadgePill';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusTone;
  label?: string;
  className?: string;
}

const statusMap: Record<string, { variant: StatusTone; label: string }> = {
  todo: { variant: 'neutral', label: '\u00c0 faire' },
  in_progress: { variant: 'info', label: 'En cours' },
  review: { variant: 'warning', label: 'En validation' },
  completed: { variant: 'success', label: 'Termin\u00e9' },
  done: { variant: 'success', label: 'Fait' },
  archived: { variant: 'neutral', label: 'Archiv\u00e9' },
  paid: { variant: 'success', label: 'Pay\u00e9e' },
  pending: { variant: 'warning', label: 'En attente' },
  overdue: { variant: 'danger', label: 'En retard' },
  draft: { variant: 'neutral', label: 'Brouillon' },
  cancelled: { variant: 'danger', label: 'Annul\u00e9' },
  active: { variant: 'success', label: 'Actif' },
  inactive: { variant: 'neutral', label: 'Inactif' },
  maintenance: { variant: 'warning', label: 'Maintenance' },
  disposed: { variant: 'neutral', label: 'C\u00e9d\u00e9' },
  out_of_service: { variant: 'danger', label: 'Hors service' },
  new: { variant: 'info', label: 'Nouveau' },
  open: { variant: 'info', label: 'Ouvert' },
  waiting: { variant: 'warning', label: 'En attente' },
  resolved: { variant: 'success', label: 'R\u00e9solu' },
  closed: { variant: 'neutral', label: 'Ferm\u00e9' },
  proposed: { variant: 'neutral', label: 'Propos\u00e9e' },
  submitted: { variant: 'info', label: 'Soumis' },
  in_review: { variant: 'warning', label: 'En revue' },
  approved: { variant: 'success', label: 'Approuv\u00e9' },
  under_review: { variant: 'info', label: 'En \u00e9tude' },
  in_development: { variant: 'warning', label: 'En d\u00e9veloppement' },
  implemented: { variant: 'success', label: 'Impl\u00e9ment\u00e9' },
  critical: { variant: 'danger', label: 'Critique' },
  high: { variant: 'warning', label: 'Haute' },
  medium: { variant: 'info', label: 'Moyenne' },
  low: { variant: 'neutral', label: 'Basse' },
  rejected: { variant: 'danger', label: 'Rejet\u00e9' },
  failed: { variant: 'danger', label: '\u00c9chou\u00e9' },
  void: { variant: 'danger', label: 'Annul\u00e9' },
  expired: { variant: 'neutral', label: 'Expir\u00e9' },
  suspended: { variant: 'warning', label: 'Suspendu' },
  trial: { variant: 'info', label: 'Essai' },
  past_due: { variant: 'warning', label: 'En retard' },
  refunded: { variant: 'neutral', label: 'Rembours\u00e9' },
  finalized: { variant: 'success', label: 'Finalis\u00e9' },
  finalised: { variant: 'success', label: 'Finalis\u00e9' },
  sent: { variant: 'info', label: 'Envoy\u00e9' },
  delivered: { variant: 'success', label: 'Livr\u00e9' },
  accepted: { variant: 'success', label: 'Accept\u00e9' },
  counter_proposal: { variant: 'warning', label: 'Modification demand\u00e9e' },
  processing: { variant: 'info', label: 'En cours' },
  reviewed_by_hod: { variant: 'info', label: 'Revu par Resp.' },
  reviewed_by_gm: { variant: 'info', label: 'Revu par DG' },
  running: { variant: 'info', label: 'En cours' },
  paused: { variant: 'warning', label: 'En pause' },
  opened: { variant: 'info', label: 'Ouvert' },
  replied: { variant: 'success', label: 'R\u00e9pondu' },
  configured: { variant: 'success', label: 'Configur\u00e9' },
  unconfigured: { variant: 'neutral', label: '\u00c0 configurer' },
  bounced: { variant: 'danger', label: 'Non distribu\u00e9' },
  scheduled: { variant: 'info', label: 'Planifi\u00e9' },
};

const toneVariant: Record<StatusTone, BadgeVariant> = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
  neutral: 'gray',
};

/** Shared status presentation. Size, border radius and typography match the Clients table badge. */
export function StatusBadge({ status, variant, label, className }: StatusBadgeProps) {
  const mapped = statusMap[status.toLowerCase()];
  const tone = variant || mapped?.variant || 'neutral';
  return (
    <Badge size="sm" variant={toneVariant[tone]} className={className}>
      {label || mapped?.label || status}
    </Badge>
  );
}
