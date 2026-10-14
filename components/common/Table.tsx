"use client";

import { CustomCheckbox } from "@/components/ui/CustomCheckbox";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CalendarPlus, ChevronDown, ChevronLeft, ChevronRight, Download, Filter, Plus, Search, Sparkles, Upload } from 'lucide-react';

export interface Column<T> {
  accessor: keyof T | "actions";
  header: string | (() => ReactNode);
  cell?: (item: T, index?: number) => ReactNode;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  sticky?: "left" | "right" | boolean;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  showSearch?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearch?: (query: string) => void;
  searchDebounce?: number;
  showFilters?: boolean;
  onFilter?: () => void;
  filterDropdown?: ReactNode;
  customFilter?: { component: ReactNode };
  /** Independently keyed controls wrap in the toolbar at narrow widths. */
  filters?: Array<{ id: string; component: ReactNode }>;
  toolbarActions?: Array<{
    id: string;
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    primary?: boolean;
  }>;
  showAddButton?: boolean;
  addButtonLabel?: string;
  onAdd?: () => void;
  showImportButton?: boolean;
  onImportCSV?: () => void;
  onGenerate?: () => void;
  /** Opens the bulk-run panel; highlighted while a run is under way. */
  onSchedule?: () => void;
  scheduleActive?: boolean;
  filterCount?: number;
  onDownloadSample?: () => void;
  primaryCTA?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: ReactNode;
  };
  secondaryCTA?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    icon?: ReactNode;
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (size: number) => void;
    itemsPerPageOptions?: number[];
  };
  showPagination?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  showRowSelector?: boolean;
  showSerialNumber?: boolean;
  rowIdAccessor?: keyof T;
  onSelectionChange?: (selected: Set<string>) => void;
  actions?: Array<{
    icon: ReactNode;
    label: string;
    onClick: (row: T) => void;
    color?: string;
    show?: (row: T) => boolean;
  }>;
  onSort?: (accessor: keyof T) => void;
  sortColumn?: keyof T;
  sortDirection?: "asc" | "desc";
}

// Feature tables own filtering and slicing; this component renders their current page.
export default function Table<T>({
  columns,
  data,
  onRowClick,
  showSearch = true,
  searchPlaceholder = "Rechercher…",
  searchValue,
  onSearch,
  searchDebounce = 0,
  showFilters = true,
  onFilter,
  filterDropdown,
  customFilter,
  filters = [],
  toolbarActions = [],
  showAddButton = true,
  addButtonLabel = "Ajouter",
  onAdd,
  showImportButton = false,
  onImportCSV,
  onGenerate,
  onSchedule,
  scheduleActive,
  filterCount = 0,
  onDownloadSample,
  primaryCTA,
  secondaryCTA,
  pagination,
  showPagination = true,
  loading = false,
  emptyMessage = "Aucun enregistrement.",
  className = "",
  showRowSelector = true,
  showSerialNumber = true,
  rowIdAccessor = "id" as keyof T,
  onSelectionChange,
  actions,
  onSort,
  sortColumn,
  sortDirection,
}: TableProps<T>) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    },
    [],
  );
  useEffect(() => {
    if (!filtersOpen) return;
    const dismiss = (event: PointerEvent) => {
      if (!filtersRef.current?.contains(event.target as Node))
        setFiltersOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [filtersOpen]);
  const rowId = (row: T) => String(row[rowIdAccessor]);
  const visibleSelected = data.filter((row) => selected.has(rowId(row))).length;
  const select = (next: Set<string>) => {
    setSelected(next);
    onSelectionChange?.(new Set(next));
  };
  const selectPage = (checked: boolean) => {
    const next = new Set(selected);
    data.forEach((row) => {
      if (checked) next.add(rowId(row));
      else next.delete(rowId(row));
    });
    select(next);
  };
  const hasSerial = showRowSelector || showSerialNumber;
  const hasActions = Boolean(actions?.length);
  const actionsWidth = Math.max(120, (actions?.length ?? 0) * 36 + 24);
  const colCount = columns.length + Number(hasSerial) + Number(hasActions);
  const pages = Math.max(1, pagination?.totalPages ?? 1);
  const page = Math.max(1, Math.min(pagination?.currentPage ?? 1, pages));
  const start =
    pagination && pagination.totalItems
      ? (page - 1) * pagination.itemsPerPage + 1
      : 0;
  const end = pagination
    ? Math.min(page * pagination.itemsPerPage, pagination.totalItems)
    : 0;
  const button =
    "inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded border border-[var(--glass-border)] px-5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50";
  const cellClass = (column: Column<T>) =>
    `${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : "text-left"} ${column.sticky ? `sticky ${column.sticky === "right" ? "right-0" : "left-0"} z-10 bg-[var(--bg-card)]` : ""}`;
  const changeSearch = (value: string) => {
    setQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (searchDebounce > 0)
      searchTimer.current = setTimeout(() => onSearch?.(value), searchDebounce);
    else onSearch?.(value);
  };
  return (
    <div
      aria-busy={loading}
      className={`flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--bg-card)] ${className}`}
    >
      <div className="shrink-0 border-b border-[var(--glass-border)] bg-[var(--bg-card)] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {showSearch && (
              <div className="relative w-80 max-w-full">
                <Search
                  size={20}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                />
                <input
                  aria-label={searchPlaceholder}
                  type="search"
                  placeholder={searchPlaceholder}
                  value={searchValue ?? query}
                  onChange={(event) => changeSearch(event.target.value)}
                  className="h-10 w-80 max-w-full rounded border border-[var(--glass-border)] bg-[var(--bg-card)] pl-12 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--text-primary)]"
                />
              </div>
            )}
            {customFilter?.component}
            {showFilters &&
              filters.map((filter) => (
                <div key={filter.id} className="min-w-0 max-w-full">
                  {filter.component}
                </div>
              ))}
            {toolbarActions.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={action.onClick}
                disabled={loading || action.disabled}
                className={`${button} ${action.primary ? "bg-[var(--accent-primary)] text-white border-transparent shadow-[0_6px_16px_-4px_color-mix(in_srgb,var(--accent-primary)_55%,transparent)] hover:-translate-y-0.5 hover:bg-[var(--accent-primary-hover)] hover:shadow-[0_10px_22px_-4px_color-mix(in_srgb,var(--accent-primary)_60%,transparent)] active:translate-y-0 active:scale-[0.97] active:shadow-[0_2px_8px_-2px_color-mix(in_srgb,var(--accent-primary)_50%,transparent)]" : "bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]"}`}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
            {showFilters && (onFilter || filterDropdown) && (
              <div className="relative" ref={filtersRef}>
                <button
                  type="button"
                  title="Filtres"
                  aria-label="Filtres"
                  aria-expanded={filterDropdown ? filtersOpen : undefined}
                  disabled={loading}
                  onClick={() =>
                    filterDropdown
                      ? setFiltersOpen((open) => !open)
                      : onFilter?.()
                  }
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[var(--glass-border)] bg-[var(--bg-card-hover)] text-[var(--text-muted)] hover:border-[var(--text-primary)] hover:text-[var(--text-primary)] disabled:opacity-50"
                >
                  <Filter size={18} />
                  {filterCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded bg-[var(--text-primary)] px-1 text-[10px] text-white">
                      {filterCount}
                    </span>
                  )}
                </button>
                {filtersOpen && filterDropdown && (
                  <div className="absolute left-0 top-full z-30 mt-2 min-w-56 rounded border border-[var(--glass-border)] bg-[var(--bg-card)] p-2 shadow-xl">
                    {filterDropdown}
                  </div>
                )}
              </div>
            )}
            {showImportButton && onImportCSV && (
              <button
                type="button"
                title="Import questions"
                aria-label="Import questions"
                disabled={loading}
                onClick={onImportCSV}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[var(--accent-success)]/20 bg-[var(--accent-success)]/10 text-[var(--accent-success)] transition-colors hover:bg-[var(--accent-success)] hover:text-white disabled:opacity-50"
              >
                <Upload size={18} />
              </button>
            )}
            {onGenerate && (
              <button
                type="button"
                title="Generate questions"
                aria-label="Generate questions"
                disabled={loading}
                onClick={onGenerate}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-[var(--accent-purple)]/20 bg-[var(--accent-purple)]/10 text-[var(--accent-purple)] transition-colors hover:bg-[var(--accent-purple)] hover:text-white disabled:opacity-50"
              >
                <Sparkles size={18} />
              </button>
            )}
            {onSchedule && (
              <button
                type="button"
                title={scheduleActive ? "Bulk run in progress" : "Schedule a bulk run"}
                aria-label={scheduleActive ? "Bulk run in progress" : "Schedule a bulk run"}
                onClick={onSchedule}
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded border transition-colors ${
                  scheduleActive
                    ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-white"
                    : "border-[var(--text-primary)]/20 bg-[var(--bg-card-hover)] text-[var(--text-primary)] hover:bg-[var(--text-primary)] hover:text-white"
                }`}
              >
                <CalendarPlus size={18} />
              </button>
            )}
            {onDownloadSample && (
              <button
                type="button"
                disabled={loading}
                onClick={onDownloadSample}
                className={`${button} text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]`}
              >
                <Download size={18} />
                Sample CSV
              </button>
            )}
            {secondaryCTA && (
              <button
                type="button"
                disabled={loading || secondaryCTA.disabled}
                onClick={secondaryCTA.onClick}
                className={`${button} hover:bg-[var(--bg-card-hover)]`}
              >
                {secondaryCTA.icon}
                {secondaryCTA.label}
              </button>
            )}
            {primaryCTA && (
              <button
                type="button"
                disabled={loading || primaryCTA.disabled}
                onClick={primaryCTA.onClick}
                className={`${button} bg-[var(--accent-primary)] text-white border-transparent shadow-[0_6px_16px_-4px_color-mix(in_srgb,var(--accent-primary)_55%,transparent)] hover:-translate-y-0.5 hover:bg-[var(--accent-primary-hover)] hover:shadow-[0_10px_22px_-4px_color-mix(in_srgb,var(--accent-primary)_60%,transparent)] active:translate-y-0 active:scale-[0.97] active:shadow-[0_2px_8px_-2px_color-mix(in_srgb,var(--accent-primary)_50%,transparent)]`}
              >
                {primaryCTA.icon}
                {primaryCTA.label}
              </button>
            )}
          </div>
          {showAddButton && onAdd && (
            <button
              type="button"
              disabled={loading}
              onClick={onAdd}
              className={`${button} group ml-auto bg-[var(--accent-primary)] text-white border-transparent shadow-[0_6px_16px_-4px_color-mix(in_srgb,var(--accent-primary)_55%,transparent)] hover:-translate-y-0.5 hover:bg-[var(--accent-primary-hover)] hover:shadow-[0_10px_22px_-4px_color-mix(in_srgb,var(--accent-primary)_60%,transparent)] active:translate-y-0 active:scale-[0.97] active:shadow-[0_2px_8px_-2px_color-mix(in_srgb,var(--accent-primary)_50%,transparent)]`}
            >
              <Plus size={18} className="transition-transform duration-200 group-hover:rotate-90" />
              {addButtonLabel}
            </button>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="platform-data-table w-full min-w-max text-sm">
          <colgroup>
            {hasSerial && <col style={{ width: 80, minWidth: 80 }} />}
            {columns.map((column, index) => (
              <col
                key={index}
                style={{ width: column.width, minWidth: column.minWidth }}
              />
            ))}
            {hasActions && (
              <col style={{ width: actionsWidth, minWidth: actionsWidth }} />
            )}
          </colgroup>
          <thead className="sticky top-0 z-20 bg-[var(--bg-card-hover)]">
            <tr className="border-b border-[var(--glass-border)]">
              {hasSerial && (
                <th
                  scope="col"
                  style={{ width: 80, minWidth: 80 }}
                  className="sticky left-0 z-10 border-r border-[var(--glass-border)] bg-[var(--bg-card-hover)] px-4 py-4 text-left text-xs font-semibold text-[var(--text-muted)]"
                >
                  <div className="flex items-center gap-2">
                    {showRowSelector && !loading && (
                      <CustomCheckbox
                        label="Sélectionner toutes les lignes de la page"
                        checked={
                          data.length > 0 && visibleSelected === data.length
                        }
                        indeterminate={
                          visibleSelected > 0 && visibleSelected < data.length
                        }
                        onChange={selectPage}
                      />
                    )}
                    N°
                  </div>
                </th>
              )}
              {columns.map((column) => (
                <th
                  scope="col"
                  key={`${String(column.accessor)}-${typeof column.header === "string" ? column.header : "custom"}`}
                  aria-sort={
                    column.sortable
                      ? sortColumn === column.accessor
                        ? sortDirection === "desc"
                          ? "descending"
                          : "ascending"
                        : "none"
                      : undefined
                  }
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    maxWidth: column.maxWidth,
                  }}
                  className={`border-r border-[var(--glass-border)] px-4 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] ${cellClass(column)}`}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.accessor as keyof T)}
                      className="inline-flex items-center gap-1"
                    >
                      {typeof column.header === "function"
                        ? column.header()
                        : column.header}
                      {sortColumn === column.accessor && (
                        <span>{sortDirection === "desc" ? "▼" : "▲"}</span>
                      )}
                    </button>
                  ) : typeof column.header === "function" ? (
                    column.header()
                  ) : (
                    column.header
                  )}
                </th>
              ))}
              {hasActions && (
                <th
                  scope="col"
                  style={{ width: actionsWidth, minWidth: actionsWidth }}
                  className="sticky right-0 z-10 border-l border-[var(--glass-border)] bg-[var(--bg-card-hover)] px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]"
                >
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from(
                { length: Math.min(pagination?.itemsPerPage ?? 10, 12) },
                (_, row) => (
                  <tr
                    key={row}
                    aria-hidden
                    className="border-b border-[var(--divider)]"
                  >
                    {Array.from({ length: colCount }, (_, col) => (
                      <td
                        key={col}
                        className="border-r border-[var(--divider)] px-4 py-4"
                      >
                        <div className="h-4 w-24 animate-pulse rounded bg-[var(--divider)]" />
                      </td>
                    ))}
                  </tr>
                ),
              )
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, colCount)}
                  className="px-4 py-12 text-center text-[var(--text-muted)]"
                >
                  <p>{emptyMessage}</p>
                  {showAddButton && onAdd && (
                    <button
                      type="button"
                      onClick={onAdd}
                      className={`${button} mt-4 bg-[var(--accent-primary)] text-white border-transparent shadow-[0_6px_16px_-4px_color-mix(in_srgb,var(--accent-primary)_55%,transparent)] hover:-translate-y-0.5 hover:bg-[var(--accent-primary-hover)] hover:shadow-[0_10px_22px_-4px_color-mix(in_srgb,var(--accent-primary)_60%,transparent)] active:translate-y-0 active:scale-[0.97] active:shadow-[0_2px_8px_-2px_color-mix(in_srgb,var(--accent-primary)_50%,transparent)]`}
                    >
                      {addButtonLabel}
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={rowId(row)}
                  onClick={(event) => {
                    if (
                      !(event.target as HTMLElement).closest(
                        "button, input, a, select, label, [data-checkbox-column]",
                      )
                    )
                      onRowClick?.(row);
                  }}
                  className={`border-b border-[var(--divider)] ${selected.has(rowId(row)) ? "bg-[var(--bg-card-hover)]" : "hover:bg-[var(--bg-card-hover)]"} ${onRowClick ? "cursor-pointer" : ""}`}
                >
                  {hasSerial && (
                    <td
                      data-checkbox-column
                      style={{ width: 80, minWidth: 80 }}
                      className="sticky left-0 z-10 border-r border-[var(--divider)] bg-[var(--bg-card)] px-4 py-4 text-[var(--text-muted)]"
                    >
                      <div className="flex items-center gap-2">
                        {showRowSelector && (
                          <CustomCheckbox
                            label={`Sélectionner la ligne ${rowId(row)}`}
                            checked={selected.has(rowId(row))}
                            onChange={(checked) => {
                              const next = new Set(selected);
                              if (checked) next.add(rowId(row));
                              else next.delete(rowId(row));
                              select(next);
                            }}
                          />
                        )}
                        {(pagination
                          ? (page - 1) * pagination.itemsPerPage
                          : 0) +
                          index +
                          1}
                      </div>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={`${String(column.accessor)}-${typeof column.header === "string" ? column.header : "custom"}`}
                      style={{
                        width: column.width,
                        minWidth: column.minWidth,
                        maxWidth: column.maxWidth,
                      }}
                      className={`border-r border-[var(--divider)] px-4 py-4 ${cellClass(column)}`}
                    >
                      {column.cell
                        ? column.cell(row, index)
                        : column.accessor === "actions"
                          ? null
                          : String(row[column.accessor] ?? "—")}
                    </td>
                  ))}
                  {hasActions && (
                    <td
                      style={{ width: actionsWidth, minWidth: actionsWidth }}
                      className="sticky right-0 z-10 border-l border-[var(--glass-border)] bg-[var(--bg-card)] px-4 py-4"
                    >
                      <div className="flex flex-nowrap items-center gap-1">
                        {actions
                          ?.filter((action) => !action.show || action.show(row))
                          .map((action) => (
                            <button
                              key={action.label}
                              type="button"
                              title={action.label}
                              aria-label={action.label}
                              onClick={() => action.onClick(row)}
                              className={`rounded p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] ${action.color ?? "hover:text-[var(--text-primary)]"}`}
                            >
                              {action.icon}
                            </button>
                          ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showPagination && pagination && (
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[var(--glass-border)] bg-[var(--bg-card)] px-6 py-4">
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-[var(--text-muted)]">
              Affichage de <span className="font-medium text-[var(--text-primary)]">{start}</span>{" "}
              à <span className="font-medium text-[var(--text-primary)]">{end}</span> sur{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {pagination.totalItems}
              </span>{" "}
              résultats
            </p>
            {pagination.onItemsPerPageChange && (
              <label className="relative flex h-10 shrink-0 items-center overflow-hidden rounded border border-[var(--glass-border)] text-sm">
                <span className="bg-[var(--bg-card-hover)] px-3 py-3 text-[var(--text-muted)]">Afficher</span>
                <select
                  aria-label="Lignes par page"
                  disabled={loading}
                  value={pagination.itemsPerPage}
                  onChange={(event) =>
                    pagination.onItemsPerPageChange?.(
                      Number(event.target.value),
                    )
                  }
                  className="h-full w-20 appearance-none bg-[var(--bg-card)] pl-3 pr-8 outline-none"
                >
                  {(
                    pagination.itemsPerPageOptions ??
                    Array.from(
                      new Set([25, 50, 100, pagination.itemsPerPage]),
                    ).sort((a, b) => a - b)
                  ).map((size) => (
                    <option key={size}>{size}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute right-3 text-[var(--text-muted)]"
                />
              </label>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Page précédente"
              disabled={loading || page <= 1}
              onClick={() => pagination.onPageChange(page - 1)}
              className="rounded border border-[var(--glass-border)] p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-medium">
              {page}
              <span className="text-[var(--text-muted)]"> / {pages}</span>
            </span>
            <button
              type="button"
              aria-label="Page suivante"
              disabled={loading || page >= pages}
              onClick={() => pagination.onPageChange(page + 1)}
              className="rounded border border-[var(--glass-border)] p-2 text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
