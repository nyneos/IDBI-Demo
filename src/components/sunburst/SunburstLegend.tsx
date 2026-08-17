import { ZONE_COLORS } from '@/data/colors';
import { cn } from '@/lib/cn';

const LEVELS = [
  { id: 'l1', label: 'Zone', color: ZONE_COLORS['North Zone'] },
  { id: 'l2', label: 'Branch', color: 'color-mix(in srgb, var(--cat-1) 78%, white)' },
  { id: 'l3', label: 'Category', color: 'color-mix(in srgb, var(--cat-1) 56%, white)' },
] as const;

export interface SunburstLegendProps {
  className?: string;
}

export function SunburstLegend({ className }: SunburstLegendProps) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-3', className)} aria-label="Hierarchy levels">
      {LEVELS.map((level) => (
        <li key={level.id} className="inline-flex items-center gap-1.5 text-xs text-content-secondary">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ backgroundColor: level.color }}
            aria-hidden
          />
          {level.label}
        </li>
      ))}
    </ul>
  );
}
