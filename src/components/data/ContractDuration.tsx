import { cn } from '@/lib/cn';

export interface ContractDurationProps {
  start: string | null;
  end: string | null;
  /** Reference date for "time left" (defaults to 2024-04-30 per fixtures). */
  asOf?: string;
  className?: string;
  /** When true, render only the end date + remaining caption. */
  endOnly?: boolean;
  /** When true, render only the start date. */
  startOnly?: boolean;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
}

export function formatContractDate(iso: string): string {
  const d = parseISO(iso);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${dd} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function monthsBetween(from: Date, to: Date): number {
  const years = to.getUTCFullYear() - from.getUTCFullYear();
  const months = to.getUTCMonth() - from.getUTCMonth();
  const days = to.getUTCDate() - from.getUTCDate();
  return years * 12 + months + days / 30;
}

function formatRemaining(months: number): string {
  if (months <= 0) return 'Expired';
  if (months < 12) return `${months.toFixed(1)} mos left`;
  return `${(months / 12).toFixed(1)} yrs left`;
}

export function ContractDuration({
  start,
  end,
  asOf = '2024-04-30',
  className,
  endOnly = false,
  startOnly = false,
}: ContractDurationProps) {
  if (!start || !end) {
    return <span className={cn('text-xs text-content-tertiary', className)}>—</span>;
  }

  if (startOnly) {
    return (
      <span className={cn('text-xs tabular text-content-secondary', className)}>
        {formatContractDate(start)}
      </span>
    );
  }

  const remaining = monthsBetween(parseISO(asOf), parseISO(end));
  const warn = remaining < 12 && remaining > 0;

  if (endOnly) {
    return (
      <span className={cn('text-xs leading-tight tabular', className)}>
        <span className={warn ? 'text-status-warning' : 'text-content-secondary'}>
          {formatContractDate(end)}
        </span>
        <span className="ml-1 text-content-tertiary">({formatRemaining(remaining)})</span>
      </span>
    );
  }

  return (
    <div className={cn('text-xs leading-tight', className)}>
      <div className="tabular text-content-secondary">{formatContractDate(start)}</div>
      <div className={cn('tabular', warn ? 'text-status-warning' : 'text-content-secondary')}>
        {formatContractDate(end)}
        <span className="ml-1 text-content-tertiary">({formatRemaining(remaining)})</span>
      </div>
    </div>
  );
}
