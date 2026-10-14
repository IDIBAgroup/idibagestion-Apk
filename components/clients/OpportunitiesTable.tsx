'use client';

import { useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import Table, { type Column } from '@/components/common/Table';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { Badge } from '@/components/ui/BadgePill';
import type { Opportunity } from '@/types';
import { STAGES, formatDate, formatXAF, stageMeta } from './shared';

interface Props {
  items: Opportunity[];
  onAdd: () => void;
  onView: (opp: Opportunity) => void;
  onEdit: (opp: Opportunity) => void;
  onDelete: (opp: Opportunity) => void;
}

export function OpportunitiesTable({ items, onAdd, onView, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = items.filter((o) => {
    const text = `${o.title} ${o.clientName} ${o.contactName} ${o.assignedToName} ${o.source}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (!stage || o.stage === stage);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);

  const columns: Column<Opportunity>[] = [
    {
      accessor: 'title',
      header: 'Opportunité',
      minWidth: '260px',
      cell: (o) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-[var(--text-primary)]">{o.title}</p>
          <p className="truncate text-xs text-[var(--text-muted)]">{o.clientName}</p>
        </div>
      ),
    },
    {
      accessor: 'stage',
      header: 'Étape',
      cell: (o) => {
        const meta = stageMeta(o.stage);
        return <Badge size="sm" variant={meta.variant}>{meta.label}</Badge>;
      },
    },
    { accessor: 'value', header: 'Valeur', align: 'right', minWidth: '150px', cell: (o) => <span className="tabular-nums">{formatXAF(o.value)}</span> },
    {
      accessor: 'probability',
      header: 'Probabilité',
      minWidth: '150px',
      cell: (o) => (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-20 overflow-hidden bg-[var(--divider)]">
            <span className="block h-full bg-[var(--text-primary)]" style={{ width: `${o.probability}%` }} />
          </span>
          <span className="text-xs tabular-nums text-[var(--text-muted)]">{o.probability}%</span>
        </div>
      ),
    },
    { accessor: 'expectedCloseDate', header: 'Clôture prévue', minWidth: '130px', cell: (o) => formatDate(o.expectedCloseDate) },
    { accessor: 'assignedToName', header: 'Responsable', minWidth: '150px', cell: (o) => o.assignedToName || '—' },
  ];

  return (
    <Table
      columns={columns}
      data={filtered.slice((current - 1) * pageSize, current * pageSize)}
      searchValue={search}
      searchPlaceholder="Rechercher une opportunité…"
      onSearch={(value) => {
        setSearch(value);
        setPage(1);
      }}
      filters={[
        {
          id: 'stage',
          component: (
            <CustomDropdown
              className="w-48"
              value={stage}
              onChange={(value) => {
                setStage(value);
                setPage(1);
              }}
              placeholder="Étape"
              options={[{ value: '', label: 'Toutes les étapes' }, ...STAGES.map((s) => ({ value: s.value, label: s.label }))]}
            />
          ),
        },
      ]}
      onAdd={onAdd}
      addButtonLabel="Nouvelle opportunité"
      emptyMessage="Aucune opportunité trouvée."
      actions={[
        { label: 'Voir', icon: <Eye size={18} />, onClick: onView },
        { label: 'Modifier', icon: <Pencil size={18} />, onClick: onEdit },
        { label: 'Supprimer', icon: <Trash2 size={18} />, color: 'hover:text-[var(--accent-danger)]', onClick: onDelete },
      ]}
      pagination={{
        currentPage: current,
        totalPages: pages,
        totalItems: filtered.length,
        itemsPerPage: pageSize,
        onPageChange: setPage,
        onItemsPerPageChange: (size) => {
          setPageSize(size);
          setPage(1);
        },
      }}
    />
  );
}
