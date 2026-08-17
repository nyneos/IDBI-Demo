import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatCount, formatPercent } from '@/lib/format';
import { Panel } from '@/components/ui/Panel';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { Tooltip } from '@/components/ui/Tooltip';
import { RankingRow } from './RankingRow';

export interface RankingColumn {
  key: 'rank' | 'label' | 'value' | 'share';
  header: string;
  align?: 'left' | 'right';
}

export interface RankingTableRow {
  id: string;
  label: string;
  value: number;
  share?: number;
  color?: string;
}

export interface RankingTableProps {
  title: string;
  rows: RankingTableRow[];
  columns?: RankingColumn[];
  footerLabel?: string;
  onFooterClick?: () => void;
  onRowClick?: (row: RankingTableRow) => void;
  infoLabel?: string;
  onInfoClick?: () => void;
  className?: string;
  showBars?: boolean;
  dense?: boolean;
}

const DEFAULT_COLUMNS: RankingColumn[] = [
  { key: 'rank', header: '#', align: 'left' },
  { key: 'label', header: 'Name', align: 'left' },
  { key: 'value', header: 'Count', align: 'right' },
  { key: 'share', header: 'Share', align: 'right' },
];

export function RankingTable({
  title,
  rows,
  columns = DEFAULT_COLUMNS,
  footerLabel,
  onFooterClick,
  onRowClick,
  infoLabel,
  onInfoClick,
  className,
  showBars = false,
  dense = true,
}: RankingTableProps) {
  const hasShare = columns.some((c) => c.key === 'share');

  return (
    <Panel className={cn('flex h-full flex-col', className)}>
      <PanelHeader
        title={title}
        infoLabel={infoLabel}
        onInfoClick={onInfoClick}
        actionLabel={footerLabel}
        onActionClick={onFooterClick}
      />

      <div className="overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr className="bg-raised">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-content-tertiary',
                    col.align === 'right' ? 'text-right' : 'text-left',
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.id}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'border-t border-hairline',
                  'h-11',
                  onRowClick &&
                    'cursor-pointer transition-colors duration-fast ease-standard hover:bg-raised focus-visible:bg-raised focus-visible:outline-none',
                )}
              >
                {columns.map((col) => {
                  let cell: ReactNode = null;
                  if (col.key === 'rank') cell = i + 1;
                  if (col.key === 'label') {
                    cell = (
                      <Tooltip content={row.label}>
                        <span className="block max-w-[14rem] truncate">{row.label}</span>
                      </Tooltip>
                    );
                  }
                  if (col.key === 'value') cell = formatCount(row.value);
                  if (col.key === 'share') {
                    cell = row.share !== undefined ? formatPercent(row.share) : '—';
                  }
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 text-xs leading-tight text-content-secondary',
                        col.key === 'label' && 'font-medium text-content-primary',
                        (col.key === 'value' || col.key === 'share' || col.key === 'rank') &&
                          'tabular',
                        col.align === 'right' ? 'text-right' : 'text-left',
                        dense && 'py-2',
                      )}
                    >
                      {cell}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showBars ? (
        <div className="mt-3 space-y-1">
          {rows.map((row, i) => (
            <RankingRow
              key={row.id}
              rank={i + 1}
              label={row.label}
              value={row.value}
              share={hasShare ? row.share : undefined}
              color={row.color}
              index={i}
              showBar
            />
          ))}
        </div>
      ) : null}
    </Panel>
  );
}
