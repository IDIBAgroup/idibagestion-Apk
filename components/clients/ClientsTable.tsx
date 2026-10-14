'use client';

import { useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import Table, { type Column } from '@/components/common/Table';
import CustomDropdown from '@/components/ui/CustomDropdown';
import { Badge } from '@/components/ui/BadgePill';
import type { Client } from '@/types';
import { CLIENT_TYPES, formatDate, formatXAF } from './shared';

interface Props {
  items: Client[];
  loading?: boolean;
  onAdd: () => void;
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientsTable({ items, loading = false, onAdd, onView, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = items.filter((c) => {
    const text = `${c.name} ${c.contactName} ${c.contactEmail} ${c.email} ${c.sector} ${c.city}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (!type || c.type === type) && (!status || c.status === status);
  });
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);

  const columns: Column<Client>[] = [
    {
      accessor: 'name',
      header: 'Client',
      minWidth: '260px',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-[var(--bg-card-hover)] text-sm font-bold text-[var(--text-primary)]">
            {c.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-[var(--text-primary)]">{c.name}</p>
            <p className="truncate text-xs text-[var(--text-muted)]">{c.sector || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      accessor: 'contactName',
      header: 'Contact',
      minWidth: '220px',
      cell: (c) => (
        <div className="min-w-0">
          <p className="truncate">{c.contactName || '—'}</p>
          <p className="truncate text-xs text-[var(--text-muted)]">{c.contactEmail || c.email}</p>
        </div>
      ),
    },
    { accessor: 'phone', header: 'Téléphone', minWidth: '150px', cell: (c) => c.phone || '—' },
    { accessor: 'city', header: 'Ville', minWidth: '110px', cell: (c) => c.city || '—' },
    {
      accessor: 'type',
      header: 'Type',
      cell: (c) => (
        <Badge size="sm" variant="gray" icon={false}>
          {CLIENT_TYPES.find((t) => t.value === c.type)?.label ?? c.type}
        </Badge>
      ),
    },
    {
      accessor: 'totalInvoiced',
      header: 'Facturé',
      align: 'right',
      minWidth: '140px',
      cell: (c) => <span className="tabular-nums">{formatXAF(c.totalInvoiced)}</span>,
    },
    {
      accessor: 'outstandingBalance',
      header: 'Solde dû',
      align: 'right',
      minWidth: '140px',
      cell: (c) =>
        c.outstandingBalance > 0 ? (
          <Badge size="sm" variant="warning" icon={false}>
            {formatXAF(c.outstandingBalance)}
          </Badge>
        ) : (
          <span className="text-[var(--text-muted)]">—</span>
        ),
    },
    {
      accessor: 'status',
      header: 'Statut',
      cell: (c) => (
        <Badge size="sm" variant={c.status === 'active' ? 'active' : 'inactive'}>
          {c.status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      ),
    },
    { accessor: 'createdAt', header: 'Créé le', minWidth: '120px', cell: (c) => formatDate(c.createdAt) },
  ];

  return (
    <Table
      columns={columns}
      data={filtered.slice((current - 1) * pageSize, current * pageSize)}
      loading={loading}
      searchValue={search}
      searchPlaceholder="Rechercher un client…"
      onSearch={(value) => {
        setSearch(value);
        setPage(1);
      }}
      filters={[
        {
          id: 'type',
          component: (
            <CustomDropdown
              className="w-44"
              value={type}
              onChange={(value) => {
                setType(value);
                setPage(1);
              }}
              placeholder="Type"
              options={[{ value: '', label: 'Tous les types' }, ...CLIENT_TYPES.map((t) => ({ value: t.value, label: t.label }))]}
            />
          ),
        },
        {
          id: 'status',
          component: (
            <CustomDropdown
              className="w-40"
              value={status}
              onChange={(value) => {
                setStatus(value);
                setPage(1);
              }}
              placeholder="Statut"
              options={[
                { value: '', label: 'Tous les statuts' },
                { value: 'active', label: 'Actif' },
                { value: 'inactive', label: 'Inactif' },
              ]}
            />
          ),
        },
      ]}
      onAdd={onAdd}
      addButtonLabel="Nouveau client"
      emptyMessage="Aucun client trouvé."
      showSerialNumber
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
