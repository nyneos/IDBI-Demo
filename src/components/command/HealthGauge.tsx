import { memo } from 'react';
import { cn } from '@/lib/cn';
import { healthBand } from '@/data/colors';
import { StatusPill, type PillTone } from '@/components/ui/StatusPill';
import { DEFAULT_GAUGE_SEGMENTS, GaugeChart } from '@/components/charts/GaugeChart';

export interface HealthGaugeProps {
  name: string;
  score: number;
  previous?: number;
  size?: number;
  className?: string;
}

export const HealthGauge = memo(function HealthGauge({
  name,
  score,
  size = 152,
  className,
}: HealthGaugeProps) {
  const band = healthBand(score);
  const bandTone: PillTone =
    band === 'Excellent' || band === 'Good' ? 'success' : band === 'Average' ? 'warning' : 'error';

  return (
    <div className={cn('flex min-w-0 flex-col items-center gap-1.5', className)}>
      <p className="max-w-full truncate text-center text-sm font-medium text-content-primary">
        {name}
      </p>
      <GaugeChart
        framed={false}
        ratio={score}
        value={Math.round(score)}
        width={size}
        height={size}
        showNeedle
        segments={DEFAULT_GAUGE_SEGMENTS}
        ariaSummary={`${name} health score ${score}`}
      />
      <StatusPill label={band} tone={bandTone} />
    </div>
  );
});
