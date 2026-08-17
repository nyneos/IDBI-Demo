import { ChartTooltip } from '@/components/charts/ChartTooltip';
import { formatCount, formatPercent } from '@/lib/format';
import type { SunburstArcDatum } from './useSunburstLayout';

export interface SunburstTooltipProps {
  arc: SunburstArcDatum | null;
  x: number;
  y: number;
  visible: boolean;
}

export function SunburstTooltip({ arc, x, y, visible }: SunburstTooltipProps) {
  if (!visible || !arc) return null;

  return (
    <div
      className="pointer-events-none absolute left-0 top-0 z-20"
      style={{ transform: `translate(${x + 12}px, ${y + 12}px)` }}
    >
      <ChartTooltip
        title={arc.name}
        rows={[
          { label: 'Transactions', value: formatCount(arc.value), color: arc.color },
          { label: 'Of parent', value: formatPercent(arc.shareOfParent) },
          { label: 'Of focus', value: formatPercent(arc.shareOfFocus) },
        ]}
      >
        <p className="mt-1 text-[10px] text-content-tertiary">Click to select</p>
      </ChartTooltip>
    </div>
  );
}
