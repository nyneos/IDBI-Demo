import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';

export interface DetectionRowProps {
  icon: LucideIcon;
  title: string;
  detail: string;
  delta: number;
  higherIsBetter: boolean;
  className?: string;
}

export const DetectionRow = memo(function DetectionRow({
  icon: Icon,
  title,
  detail,
  delta,
  higherIsBetter,
  className,
}: DetectionRowProps) {
  const rising = delta > 0;
  const DeltaIcon = rising ? ArrowUp : ArrowDown;
  const good = higherIsBetter ? rising : !rising;
  const tone = good ? 'text-status-success' : rising ? 'text-status-error' : 'text-status-warning';
  const tint = good ? 'var(--status-success)' : rising ? 'var(--status-error)' : 'var(--status-warning)';

  return (
    <div className={cn('flex items-start gap-3 py-2', className)}>
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{
          backgroundColor: `color-mix(in srgb, ${tint} 16%, transparent)`,
          color: tint,
        }}
        aria-hidden
      >
        <Icon size={14} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-content-primary">{title}</p>
        <p className="mt-0.5 text-sm text-content-tertiary">{detail}</p>
      </div>
      <span className={cn('inline-flex shrink-0 items-center gap-0.5 text-xs font-bold', tone)}>
        <DeltaIcon size={12} strokeWidth={2.25} aria-hidden />
        <span className="tabular">{formatPercent(Math.abs(delta), 0)}</span>
      </span>
    </div>
  );
});
