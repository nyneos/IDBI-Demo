import { Fragment, type ReactNode } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { restrictToFirstScrollableAncestor } from '@dnd-kit/modifiers';
import { flexRender, type Column, type ColumnDef, type Row, type Table } from '@tanstack/react-table';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { ColumnDragHandle } from '@/components/table/ColumnDragHandle';
import type { ReportSection } from '@/components/table/reportSection';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { formatDateIST } from '@/lib/format';

type GroupedTableProps<T> = {
  table: Table<T>;
  columns: ColumnDef<T>[];
  nonDraggableColumns: string[];
  nonSortingColumns: string[];
  aggregatableColumns?: string[];
  loading?: boolean;
  sections?: ReportSection<T>[];
  enableColumnDrag?: boolean;
};

export function collectLeafRows<T>(rows: Row<T>[]): Row<T>[] {
  const leafRows: Row<T>[] = [];
  const seen = new Set<string>();

  const walk = (rs: Row<T>[]) => {
    rs.forEach((r) => {
      if (seen.has(r.id)) return;
      if (r.subRows && r.subRows.length > 0) {
        walk(r.subRows);
        return;
      }
      seen.add(r.id);
      leafRows.push(r);
    });
  };

  walk(rows);
  return leafRows;
}

export function calculateGroupTotals<T>(
  rows: Row<T>[],
  visibleCols: Column<T, unknown>[],
  aggregatableColumns?: string[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  const leaves = collectLeafRows(rows);

  visibleCols.forEach((col) => {
    if (aggregatableColumns && !aggregatableColumns.includes(col.id)) return;

    let sum = 0;
    let foundNumeric = false;

    leaves.forEach((r) => {
      const val = r.getValue(col.id);
      if (typeof val === 'number' && Number.isFinite(val)) {
        sum += val;
        foundNumeric = true;
      } else if (
        aggregatableColumns?.includes(col.id) &&
        typeof val === 'string' &&
        val.trim() !== '' &&
        !Number.isNaN(Number(val))
      ) {
        sum += Number(val);
        foundNumeric = true;
      }
    });

    if (foundNumeric) totals[col.id] = sum;
  });

  return totals;
}

function formatValue(key: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  const keyStr = key.toLowerCase();
  if (keyStr.includes('date') || keyStr.endsWith('at') || keyStr.includes('time')) {
    try {
      return formatDateIST(String(value));
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'number') return value.toLocaleString('en-IN');
  return String(value);
}

export function GroupedTable<T>({
  table,
  columns,
  nonDraggableColumns,
  nonSortingColumns,
  aggregatableColumns,
  loading,
  sections,
  enableColumnDrag = true,
}: GroupedTableProps<T>) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (
      nonDraggableColumns.includes(String(active.id)) ||
      nonDraggableColumns.includes(String(over.id))
    ) {
      return;
    }
    table.setColumnOrder((current) => {
      const order = current.length ? [...current] : table.getAllLeafColumns().map((col) => col.id);
      const oldIndex = order.indexOf(String(active.id));
      const newIndex = order.indexOf(String(over.id));
      if (oldIndex < 0 || newIndex < 0) return current;
      const [moved] = order.splice(oldIndex, 1);
      order.splice(newIndex, 0, moved!);
      return order;
    });
  };

  const hasExpandableSections = (row: Row<T>) =>
    Boolean(
      row.original &&
        typeof row.original === 'object' &&
        sections?.some((s) => {
          const f = typeof s.fields === 'function' ? s.fields(row.original) : s.fields;
          return Array.isArray(f) && f.length > 0;
        }),
    );

  const toggleRowExpansion = (row: Row<T>) => {
    row.toggleExpanded();
  };

  const renderDetail = (row: Row<T>) =>
    sections?.map(({ title, fields }) => (
      <div key={title} className="mb-4 last:mb-0">
        <div className="mb-2 pb-1 text-sm font-medium text-content-primary">{title}</div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {(typeof fields === 'function' ? fields(row.original) : fields).map((field) => {
            const key = String(field.key);
            const value = (row.original as Record<string, unknown>)[key];
            const display =
              typeof field.formatter === 'function'
                ? field.formatter(value, row.original)
                : formatValue(key, value);
            return (
              <div className="flex flex-col gap-1" key={key}>
                <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                  {field.label || key.replace(/_/g, ' ')}
                </span>
                <span className="text-sm font-medium text-content-primary">{display}</span>
              </div>
            );
          })}
        </div>
      </div>
    ));

  const renderGroupedRow = (row: Row<T>, depth = 0, seen?: Set<string>, stripe?: { i: number }): ReactNode => {
    if (seen?.has(row.id)) return null;
    seen?.add(row.id);

    if (row.getIsGrouped()) {
      const visibleCols = table.getVisibleLeafColumns();
      const totals = calculateGroupTotals(row.subRows ?? [], visibleCols, aggregatableColumns);
      return (
        <Fragment key={row.id}>
          <tr className="cursor-pointer bg-canvas text-brand-text" onClick={() => toggleRowExpansion(row)}>
            <td colSpan={visibleCols.length} className="px-3 py-2 font-medium text-brand-text">
              <div className="flex items-center" style={{ paddingLeft: `${depth * 20}px` }}>
                {row.getIsExpanded() ? (
                  <ChevronDown className="mr-2 h-4 w-4 shrink-0 text-brand-text" />
                ) : (
                  <ChevronRight className="mr-2 h-4 w-4 shrink-0 text-brand-text" />
                )}
                <span className="font-semibold">
                  {(row.groupingColumnId ?? '').replace(/_/g, ' ')}:{' '}
                </span>
                <div className="ml-1 flex flex-1 items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="truncate text-sm">
                      {String(row.getValue(row.groupingColumnId ?? '') ?? '')}
                    </span>
                    <span className="whitespace-nowrap text-xs">
                      ({row.subRows.length} {row.subRows.length === 1 ? 'row' : 'rows'})
                    </span>
                  </div>
                  {Object.keys(totals).length > 0 ? (
                    <div className="flex gap-2 whitespace-nowrap text-sm">
                      {Object.entries(totals).map(([colId, val]) => (
                        <span key={colId}>
                          {colId.replace(/_/g, ' ')}:{' '}
                          <span className="font-semibold">{val.toLocaleString('en-IN')}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </td>
          </tr>
          {row.getIsExpanded()
            ? (() => {
                const sub = row.subRows || [];
                const elements: ReactNode[] = sub.map((subRow) =>
                  renderGroupedRow(subRow, depth + 1, seen, stripe),
                );
                const isLeafGroup =
                  sub.length > 0 && typeof sub[0]?.getIsGrouped === 'function' && !sub[0].getIsGrouped();
                if (isLeafGroup) {
                  const leafTotals = calculateGroupTotals(
                    sub,
                    table.getVisibleLeafColumns(),
                    aggregatableColumns,
                  );
                  if (Object.keys(leafTotals).length > 0) {
                    elements.push(
                      <tr key={`${row.id}-subtotal`} className="bg-brand-tint font-semibold text-brand-text">
                        {table.getVisibleLeafColumns().map((col, idx) => {
                          if (idx === 0) {
                            return (
                              <td key={col.id} className="border-b border-hairline px-3 py-2 text-sm">
                                Total
                              </td>
                            );
                          }
                          const val = leafTotals[col.id];
                          return (
                            <td key={col.id} className="border-b border-hairline px-3 py-2 text-left text-sm">
                              {val !== undefined ? val.toLocaleString('en-IN') : ''}
                            </td>
                          );
                        })}
                      </tr>,
                    );
                  }
                }
                return elements;
              })()
            : null}
        </Fragment>
      );
    }

    if (typeof (row as Row<T> & { getIsAggregated?: () => boolean }).getIsAggregated === 'function' &&
        (row as Row<T> & { getIsAggregated: () => boolean }).getIsAggregated()) {
      return (
        <tr key={row.id} className="bg-canvas font-semibold">
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id} className="border-b border-hairline px-3 py-2 text-sm">
              {flexRender(cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
      );
    }

    const canExpand = Boolean(sections && hasExpandableSections(row));
    const stripeIndex = stripe ? stripe.i++ : 0;
    const zebra = stripeIndex % 2 === 1 ? 'bg-brand-tint' : 'bg-white';
    return (
      <Fragment key={row.id}>
        <tr
          onClick={(e) => {
            if (!canExpand) return;
            const tgt = e.target as HTMLElement;
            if (tgt.closest('input, button, a, select, textarea, label')) return;
            toggleRowExpansion(row);
          }}
          className={cn('border-t border-hairline', zebra, canExpand && 'cursor-pointer')}
        >
          {row.getVisibleCells().map((cell) => (
            <td key={cell.id} className="whitespace-nowrap px-3 py-2 text-xs leading-tight text-content-secondary">
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </td>
          ))}
        </tr>
        {row.getIsExpanded() && sections ? (
          <tr key={`${row.id}-expanded`}>
            <td colSpan={table.getVisibleLeafColumns().length} className="bg-canvas p-4">
              <div className="rounded-lg border border-hairline bg-paper p-4">{renderDetail(row)}</div>
            </td>
          </tr>
        ) : null}
      </Fragment>
    );
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-hairline">
      {loading ? (
        <div className="flex flex-col gap-2 p-3" aria-busy>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      ) : (
        <DndContext
          onDragEnd={enableColumnDrag ? handleDragEnd : undefined}
          modifiers={[restrictToFirstScrollableAncestor]}
        >
          <table className="w-full min-w-[480px] border-collapse">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="bg-brand">
                  {headerGroup.headers.map((header) => {
                    const isDraggable = !nonDraggableColumns.includes(header.column.id);
                    const canSort = !nonSortingColumns.includes(header.column.id);
                    const isSorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className="select-none px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-white"
                        style={{ width: header.getSize() }}
                      >
                        <div className="flex items-center gap-1">
                          <ColumnDragHandle id={header.column.id} disabled={!enableColumnDrag || !isDraggable}>
                            <span
                              className={canSort ? 'cursor-pointer' : ''}
                              onClick={
                                canSort
                                  ? (e) => header.column.toggleSorting(undefined, e.shiftKey)
                                  : undefined
                              }
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {canSort ? (
                                <span className="ml-1 text-[10px]">
                                  {isSorted === 'asc' ? '▲' : isSorted === 'desc' ? '▼' : (
                                    <span className="opacity-30">▲▼</span>
                                  )}
                                </span>
                              ) : null}
                            </span>
                          </ColumnDragHandle>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-3 py-12 text-center text-sm text-content-tertiary">
                    <div className="flex flex-col items-center">
                      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-canvas">
                        <FileText size={20} />
                      </span>
                      <p className="text-sm font-medium text-content-primary">No data available</p>
                    </div>
                  </td>
                </tr>
              ) : (
                (() => {
                  const seen = new Set<string>();
                  const stripe = { i: 0 };
                  return table.getRowModel().rows.map((row) => renderGroupedRow(row, 0, seen, stripe));
                })()
              )}
            </tbody>
          </table>
        </DndContext>
      )}
    </div>
  );
}
