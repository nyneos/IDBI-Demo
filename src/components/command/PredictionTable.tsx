import { memo } from 'react';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';
import { Panel } from '@/components/ui/Panel';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';

export interface PredictionRow {
  label: string;
  low: number;
  high: number;
  risk: 'High' | 'Medium' | 'Low';
}

export interface PredictionTableProps {
  rows: PredictionRow[];
  onFooterClick?: () => void;
  className?: string;
}

function riskTone(risk: PredictionRow['risk']): StatusTone {
  if (risk === 'High') return 'error';
  if (risk === 'Medium') return 'warning';
  return 'success';
}

export const PredictionTable = memo(function PredictionTable({
  rows,
  onFooterClick,
  className,
}: PredictionTableProps) {
  return (
    <Panel className={cn('flex h-full flex-col', className)}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-2xl font-semibold text-content-primary">AI Predictions</h3>
          <p className="mt-0.5 text-xs text-content-tertiary">(NEXT 7 DAYS)</p>
        </div>
        <StatusPill label="Model output" tone="info" />
      </div>

      <div className="overflow-hidden rounded-lg border border-hairline">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-raised">
              <th
                scope="col"
                className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-content-tertiary"
              >
                Train / Zone
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary"
              >
                Predicted
              </th>
              <th
                scope="col"
                className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-content-tertiary"
              >
                Risk
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="h-11 border-t border-hairline">
                <td className="px-3 py-2 text-xs font-medium text-content-primary">{row.label}</td>
                <td className="px-3 py-2 text-right">
                  <span className="inline-flex items-center justify-end gap-2">
                    <StatusPill label="AI" tone="info" />
                    <span className="text-xs font-semibold tabular text-cat-6">
                      {formatCount(row.low)} – {formatCount(row.high)}
                    </span>
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <StatusPill label={row.risk} tone={riskTone(row.risk)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {onFooterClick ? (
        <div className="mt-auto pt-3">
          <PanelHeader
            title=""
            actionLabel="View Prediction Model"
            onActionClick={onFooterClick}
            className="mb-0"
          />
        </div>
      ) : null}
    </Panel>
  );
});
