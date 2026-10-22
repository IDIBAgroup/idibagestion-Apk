import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

const statusMap: Record<string, { variant: StatusBadgeProps['variant']; label: string }> = {
  // Project/Task statuses
  todo: { variant: 'neutral', label: 'À faire' },
  in_progress: { variant: 'info', label: 'En cours' },
  review: { variant: 'warning', label: 'En révision' },
  completed: { variant: 'success', label: 'Terminé' },
  done: { variant: 'success', label: 'Fait' },
  archived: { variant: 'neutral', label: 'Archivé' },
  // Invoice statuses
  paid: { variant: 'success', label: 'Payée' },
  pending: { variant: 'warning', label: 'En attente' },
  overdue: { variant: 'danger', label: 'En retard' },
  draft: { variant: 'neutral', label: 'Brouillon' },
  cancelled: { variant: 'danger', label: 'Annulée' },
  // User statuses
  active: { variant: 'success', label: 'Actif' },
  inactive: { variant: 'danger', label: 'Inactif' },
  // Asset statuses
  maintenance: { variant: 'warning', label: 'Maintenance' },
  disposed: { variant: 'neutral', label: 'Cédé' },
  out_of_service: { variant: 'danger', label: 'Hors service' },
  // Ticket statuses
  new: { variant: 'info', label: 'Nouveau' },
  open: { variant: 'info', label: 'Ouvert' },
  waiting: { variant: 'warning', label: 'En attente' },
  resolved: { variant: 'success', label: 'Résolu' },
  closed: { variant: 'neutral', label: 'Fermé' },
  // Idea statuses
  proposed: { variant: 'neutral', label: 'Proposée' },
  submitted: { variant: 'info', label: 'Soumise' },
  in_review: { variant: 'warning', label: 'En revue' },
  approved: { variant: 'success', label: 'Approuvée' },
  under_review: { variant: 'info', label: 'En étude' },
  in_development: { variant: 'warning', label: 'En dev' },
  implemented: { variant: 'success', label: 'Implémentée' },
  // Ticket priorities
  critical: { variant: 'danger', label: 'Critique' },
  high: { variant: 'warning', label: 'Haute' },
  medium: { variant: 'info', label: 'Moyenne' },
  low: { variant: 'neutral', label: 'Basse' },
  // Task priorities
  // Expense statuses
  rejected: { variant: 'danger', label: 'Rejeté' },
};

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const mapped = statusMap[status.toLowerCase()];
  const finalVariant = variant || mapped?.variant || 'neutral';
  const label = mapped?.label || status;

  const variantClasses = {
    success: 'status-badge-success',
    warning: 'status-badge-warning',
    danger: 'status-badge-danger',
    info: 'status-badge-info',
    neutral: 'status-badge-neutral',
  };

  return (
    <span className={cn('status-badge', variantClasses[finalVariant], className)}>
      {label}
    </span>
  );
}
