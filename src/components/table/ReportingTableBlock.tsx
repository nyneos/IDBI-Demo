import { useMemo, useState } from 'react';
import {
  createColumnHelper,
  getCoreRowModel,
  getExpandedRowModel,
  getGroupedRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnOrderState,
} from '@tanstack/react-table';
import { GroupedTable } from '@/components/table/GroupedTable';
import type { ReportSection } from '@/components/table/reportSection';
import type { DashboardBlock, DashboardDataSource, SlimRecord } from '@/components/dashboard-builder/types';
import { formatDateIST } from '@/lib/format';

const PREVIEW_ROW_CAP = 12;
const TABLE_ROW_CAP = 400;

function humanize(key: string) {
  return key.replace(/_/g, ' ');
}

function cellDisplay(key: string, value: unknown): string {
  if (value === undefined || value === null || value === '') return '—';
  const k = key.toLowerCase();
  if (k.includes('date') && !k.includes('time')) {
    try {
      return formatDateIST(String(value));
    } catch {
      return String(value);
    }
  }
  if (typeof value === 'number') return value.toLocaleString('en-IN');
  return String(value);
}

export function defaultReportingConfig(source: DashboardDataSource): NonNullable<DashboardBlock['reportingConfig']> {
  const dims = source.dimensions.map((d) => d.key);
  const metrics = (source.metrics ?? []).map((d) => d.key);
  const dates = (source.dates ?? []).map((d) => d.key);
  const all = [...dims, ...metrics, ...dates].filter(Boolean);
  return {
    groupBy: dims.slice(0, 1),
    columns: all.slice(0, 6),
    aggregatableColumns: metrics.slice(0, 2),
    expandableFields: [],
  };
}

export function ReportingTableBlock({
  block,
  source,
  compact = false,
}: {
  block: DashboardBlock;
  source: DashboardDataSource;
  compact?: boolean;
}) {
  const cfg = useMemo(
    () => block.reportingConfig ?? defaultReportingConfig(source),
    [block.reportingConfig, source],
  );
  const groupBy = useMemo(() => cfg.groupBy.filter(Boolean).slice(0, 2), [cfg.groupBy]);
  const columnKeys = useMemo(
    () => (cfg.columns.length > 0 ? cfg.columns : groupBy).filter(Boolean).slice(0, 8),
    [cfg.columns, groupBy],
  );
  const aggregatable = useMemo(
    () => cfg.aggregatableColumns.filter(Boolean),
    [cfg.aggregatableColumns],
  );

  const data = useMemo<SlimRecord[]>(() => {
    const rows = (source.facts?.length ? source.facts : ((source.raw ?? []) as SlimRecord[])) ?? [];
    return rows.slice(0, compact ? PREVIEW_ROW_CAP : TABLE_ROW_CAP);
  }, [source.facts, source.raw, compact]);

  const columns = useMemo<ColumnDef<SlimRecord>[]>(() => {
    const helper = createColumnHelper<SlimRecord>();
    const keys = [...new Set([...groupBy, ...columnKeys])].filter(Boolean);
    return keys.map((key) =>
      helper.accessor((row) => row[key], {
        id: key,
        header: humanize(key),
        enableGrouping: groupBy.includes(key),
        aggregationFn: aggregatable.includes(key) ? 'sum' : undefined,
        cell: (info) => cellDisplay(key, info.getValue()),
      }),
    );
  }, [columnKeys, groupBy, aggregatable]);

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(() =>
    columns.map((c) => String(c.id)),
  );

  const table = useReactTable({
    data,
    columns,
    state: { grouping: groupBy, columnOrder },
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getGroupedRowModel: groupBy.length > 0 ? getGroupedRowModel() : undefined,
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    groupedColumnMode: 'reorder',
    autoResetExpanded: false,
    getRowCanExpand: (row) => row.getIsGrouped(),
  });

  const sections: ReportSection<SlimRecord>[] | undefined =
    !compact && cfg.expandableFields.length > 0
      ? [
          {
            title: 'Details',
            fields: cfg.expandableFields.map((key) => ({
              key,
              label: humanize(key),
            })),
          },
        ]
      : undefined;

  const nonDraggable = columnKeys.filter((k) => /id$/i.test(k) || /_id$/i.test(k) || k.toLowerCase() === 'id');

  if (columns.length === 0) {
    return <p className="p-4 text-sm text-content-secondary">Pick at least one column for this report.</p>;
  }

  return (
    <GroupedTable
      table={table}
      columns={columns}
      nonDraggableColumns={nonDraggable}
      nonSortingColumns={groupBy}
      aggregatableColumns={aggregatable}
      sections={sections}
      enableColumnDrag={!compact}
    />
  );
}
