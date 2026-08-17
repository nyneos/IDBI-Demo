import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCount, formatPercent } from '@/lib/format';
import { Panel } from '@/components/ui/Panel';
import { PanelHeader } from '@/components/ui/PanelHeader';

export interface PerformanceMatrixRow {
  metric: string;
  jan: number | string;
  feb: number | string;
  mar: number | string;
  apr: number | string;
  higherIsBetter: boolean | 'neutral';
}

export interface PerformanceMatrixProps {
  title?: string;
  caption?: string;
  rows: PerformanceMatrixRow[];
  footerLabel?: string;
  onFooterClick?: () => void;
  className?: string;
}

function asNumber(v: number | string): number | null {
  if (typeof v === 'number') return v;
  const n = Number(String(v).replace(/%/g, ''));
  return Number.isFinite(n) ? n : null;
}

function formatCell(metric: string, value: number | string): string {
  if (typeof value === 'string') return value;
  if (metric.toLowerCase().includes('rate') || metric.toLowerCase().includes('compliance') || metric.toLowerCase().includes('score')) {
    return formatPercent(value);
  }
  if (metric.toLowerCase().includes('time') || metric.toLowerCase().includes('days')) {
    return value.toFixed(1);
  }
  if (metric.toLowerCase().includes('10k') || metric.toLowerCase().includes('per 10')) {
    return value.toFixed(1);
  }
  return formatCount(value);
}

function trendFrom(row: PerformanceMatrixRow): {
  direction: 'up' | 'down' | 'flat';
  tone: string;
} {
  const a = asNumber(row.mar);
  const b = asNumber(row.apr);
  if (a === null || b === null) {
    return { direction: 'flat', tone: 'text-content-tertiary' };
  }
  const delta = b - a;
  if (Math.abs(delta) < 0.05) {
    return { direction: 'flat', tone: 'text-content-tertiary' };
  }
  const rising = delta > 0;
  const direction = rising ? 'up' : 'down';
  if (row.higherIsBetter === 'neutral') {
    return { direction, tone: 'text-status-warning' };
  }
  const good = row.higherIsBetter ? rising : !rising;
  return { direction, tone: good ? 'text-status-success' : 'text-status-error' };
}

export function PerformanceMatrix({
  title = 'Past Performance Summary',
  caption = 'Comparison with previous 3 months',
  rows,
  footerLabel,
  onFooterClick,
  className,
}: PerformanceMatrixProps) {
  return (
    <Panel className={cn('flex h-full flex-col', className)}>
      <PanelHeader
        title={title}
        actionLabel={footerLabel}
        onActionClick={onFooterClick}
      />
      {caption ? (
        <p className="-mt-2 mb-3 text-xs text-content-tertiary">{caption}</p>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-raised">
              {['Metric', 'Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'Trend'].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className={cn(
                    'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-content-tertiary',
                    h === 'Metric' || h === 'Trend' ? 'text-left' : 'text-right',
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const trend = trendFrom(row);
              const Icon =
                trend.direction === 'flat'
                  ? Minus
                  : trend.direction === 'up'
                    ? ArrowUp
                    : ArrowDown;
              return (
                <tr key={row.metric} className="border-t border-hairline" style={{ height: 44 }}>
                  <td className="px-3 py-2 text-xs font-medium text-content-primary">
                    {row.metric}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular text-content-secondary">
                    {formatCell(row.metric, row.jan)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular text-content-secondary">
                    {formatCell(row.metric, row.feb)}
                  </td>
                  <td className="px-3 py-2 text-right text-xs tabular text-content-secondary">
                    {formatCell(row.metric, row.mar)}
                  </td>
                  <td className="bg-raised px-3 py-2 text-right text-xs font-semibold tabular text-content-primary">
                    {formatCell(row.metric, row.apr)}
                  </td>
                  <td className={cn('px-3 py-2', trend.tone)}>
                    <Icon size={14} strokeWidth={2} aria-hidden />
                    <span className="sr-only">{trend.direction}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
