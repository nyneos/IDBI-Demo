import { formatCount } from '@/lib/format';
import { MetricValue } from '@/components/data/MetricValue';
import { SUNBURST_CENTER_R } from './useSunburstLayout';

export interface SunburstCenterProps {
  label: string;
  sublabel?: string;
  value: number;
  hole?: number;
}

export function SunburstCenter({
  label,
  sublabel = 'TOTAL TRANSACTIONS',
  value,
  hole = SUNBURST_CENTER_R,
}: SunburstCenterProps) {
  const size = hole * 2;

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center text-center"
      style={{ width: size, height: size }}
    >
      <p className="max-w-[90%] truncate text-xs font-semibold uppercase tracking-wider text-content-tertiary">
        {label}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-content-tertiary">{sublabel}</p>
      <MetricValue value={value} type="count" size="2xl" className="mt-0.5" />
      <span className="sr-only">{formatCount(value)} transactions</span>
    </div>
  );
}
