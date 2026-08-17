import { cn } from '@/lib/cn';
import { formatCount, formatDays, formatINR, formatPercent } from '@/lib/format';
import { useCountUp } from '@/motion/useCountUp';

export type MetricType = 'count' | 'inr' | 'percent' | 'days' | 'text';

export interface MetricValueProps {
  value: number | string;
  type?: MetricType;
  unit?: string;
  className?: string;
  /** Skip count-up (e.g. when parent already interpolated). */
  animate?: boolean;
  size?: 'xl' | '2xl' | '3xl';
}

function formatMetric(value: number, type: MetricType): string {
  switch (type) {
    case 'inr':
      return formatINR(value);
    case 'percent':
      return formatPercent(value);
    case 'days':
      return formatDays(value);
    case 'count':
    default:
      return formatCount(value);
  }
}

export function MetricValue({
  value,
  type = 'count',
  unit,
  className,
  animate = true,
  size,
}: MetricValueProps) {
  const numeric = typeof value === 'number' ? value : 0;
  const counted = useCountUp(numeric, { enabled: animate && type !== 'text' && typeof value === 'number' });

  if (type === 'text' || typeof value === 'string') {
    return (
      <span
        className={cn(
          'leading-none text-content-primary',
          size === '3xl' ? 'text-3xl font-extrabold' : 'text-xl font-bold',
          className,
        )}
      >
        {String(value)}
        {unit ? <span className="ml-1 text-sm font-medium text-content-secondary">{unit}</span> : null}
      </span>
    );
  }

  const display = formatMetric(counted, type);
  const sizeClass =
    size === '3xl'
      ? 'text-3xl font-extrabold'
      : size === 'xl'
        ? 'text-xl font-bold'
        : 'text-2xl font-extrabold';

  return (
    <span
      className={cn('tabular leading-none text-content-primary', sizeClass, className)}
      aria-label={formatMetric(numeric, type)}
    >
      {display}
      {unit ? <span className="ml-1 text-sm font-medium text-content-secondary">{unit}</span> : null}
    </span>
  );
}
