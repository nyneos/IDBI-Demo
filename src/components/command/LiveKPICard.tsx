import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/Panel';
import { MetricValue } from '@/components/data/MetricValue';
import { Sparkline } from '@/components/data/Sparkline';
import { TrendIndicator, type TrendFormat } from '@/components/data/TrendIndicator';

export interface LiveKPICardProps {
  label: string;
  value: number;
  format?: 'count' | 'inr' | 'days' | 'percent';
  icon?: LucideIcon;
  tint: string;
  sparkline: number[];
  delta?: {
    value: number;
    higherIsBetter: boolean | 'neutral';
    format?: TrendFormat;
    label?: string;
  };
  className?: string;
}

export const LiveKPICard = memo(function LiveKPICard({
  label,
  value,
  format = 'count',
  tint,
  sparkline,
  delta,
  className,
}: LiveKPICardProps) {
  return (
    <Panel
      interactive={false}
      className={cn('relative flex h-full min-h-[120px] flex-col overflow-hidden rounded-2xl', className)}
      style={{ borderColor: `color-mix(in srgb, ${tint} 25%, transparent)` }}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 opacity-30" aria-hidden>
        <Sparkline
          data={sparkline}
          color={tint}
          width={280}
          height={48}
          fill
          className="h-full w-full"
        />
      </div>

      <div className="relative z-[1] flex flex-col gap-1.5">
        <p className="text-sm font-semibold uppercase tracking-wider text-content-tertiary">
          {label}
        </p>
        <MetricValue value={value} type={format} size="3xl" />
        {delta ? (
          <TrendIndicator
            value={delta.value}
            higherIsBetter={delta.higherIsBetter}
            format={delta.format ?? 'percent'}
            label={delta.label ?? 'vs Yesterday'}
            settled={false}
          />
        ) : null}
      </div>
    </Panel>
  );
});
