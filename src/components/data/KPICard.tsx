import { Flag, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/Panel';
import { MetricValue, type MetricType } from './MetricValue';
import { TrendIndicator, type TrendFormat } from './TrendIndicator';

export interface KPICardProps {
  label: string;
  value: number | string;
  type?: MetricType;
  icon?: LucideIcon;
  tint: string;
  delta?: {
    value: number;
    higherIsBetter: boolean | 'neutral';
    format?: TrendFormat;
    label?: string;
  };
  subline?: ReactNode;
  emphasize?: boolean;
  className?: string;
  size?: 'xl' | '2xl' | '3xl';
  /** Optional tinted border (command-center hero cards). */
  tintBorder?: boolean;
}

export function KPICard({
  label,
  value,
  type = 'count',
  tint,
  emphasize = false,
  className,
  size = '2xl',
  tintBorder = false,
  delta,
}: KPICardProps) {
  return (
    <Panel
      interactive={false}
      className={cn(
        'flex h-full flex-col gap-2 rounded-2xl',
        emphasize && 'border-status-error/30',
        className,
      )}
      style={{
        ...(emphasize ? { backgroundColor: 'var(--status-error-bg)' } : null),
        borderColor: tintBorder
          ? `color-mix(in srgb, ${tint} 25%, transparent)`
          : `color-mix(in srgb, ${tint} 12%, transparent)`,
      }}
    >
      {emphasize ? (
        <div className="flex justify-end">
          <Flag size={14} strokeWidth={1.75} className="text-status-error" aria-hidden />
        </div>
      ) : null}

      <p className="text-sm font-medium text-content-secondary">{label}</p>

      <MetricValue value={value} type={type} size={size} />

      {delta ? (
        <TrendIndicator
          value={delta.value}
          higherIsBetter={delta.higherIsBetter}
          format={delta.format ?? 'percent'}
          label={delta.label ?? 'vs Yesterday'}
          settled={false}
        />
      ) : null}
    </Panel>
  );
}
