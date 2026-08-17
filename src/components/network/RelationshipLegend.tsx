import { memo } from 'react';
import { cn } from '@/lib/cn';
import { SectionSubhead } from '@/components/ui/SectionSubhead';

const ROWS: Array<{ kind: string; dash?: string; label: string }> = [
  { kind: 'related', label: 'Related' },
  { kind: 'status', dash: '6 3 1 3', label: 'Status' },
];

export interface RelationshipLegendProps {
  className?: string;
}

export const RelationshipLegend = memo(function RelationshipLegend({
  className,
}: RelationshipLegendProps) {
  return (
    <div className={cn('glass rounded-lg p-3', className)}>
      <SectionSubhead>Relationships</SectionSubhead>
      <p className="mb-2 text-xs text-content-tertiary">(Edge Meaning)</p>
      <ul className="space-y-2">
        {ROWS.map((row) => (
          <li key={row.kind} className="flex items-center gap-2">
            <svg width={24} height={8} aria-hidden className="shrink-0">
              <line
                x1={0}
                y1={4}
                x2={24}
                y2={4}
                stroke="var(--text-secondary)"
                strokeWidth={1.5}
                strokeDasharray={row.dash}
              />
            </svg>
            <span className="text-xs text-content-secondary">{row.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
