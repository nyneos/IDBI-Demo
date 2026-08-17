import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';

interface ZoneCalloutProps {
  zone: string;
  count: number;
  delta: number;
  active: boolean;
  onClick: (rect: DOMRect) => void;
}

export function ZoneCallout({ zone, count, delta, active, onClick }: ZoneCalloutProps) {
  const higherIsBetter = false;
  const good = higherIsBetter ? delta > 0 : delta < 0;

  return (
    <foreignObject x={-70} y={-36} width={140} height={56} style={{ overflow: 'visible' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(e.currentTarget.getBoundingClientRect());
        }}
        className={cn(
          'glass flex w-[140px] flex-col rounded-lg border px-2 py-1.5 text-left transition-transform duration-fast',
          active ? 'scale-105 border-brand' : 'border-hairline',
        )}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-content-secondary">
          {zone}
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="text-base font-bold tabular text-content-primary">
            {formatCount(count)}
          </span>
          <span className={cn('text-xs font-medium', good ? 'text-status-success' : 'text-status-error')}>
            {delta > 0 ? '↑' : '↓'} {Math.abs(delta)}%
          </span>
        </span>
      </button>
    </foreignObject>
  );
}
