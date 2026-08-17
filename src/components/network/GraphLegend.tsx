import { memo } from 'react';
import type { EntityType } from '@/data/types';
import { ENTITY_TYPE_COLORS } from '@/data/colors';
import { cn } from '@/lib/cn';
import { StatusPill } from '@/components/ui/StatusPill';

const LABELS: Record<EntityType, string> = {
  zone: 'Zone',
  branch: 'Branch',
  category: 'Category',
  segment: 'Segment',
  mode: 'Mode',
  status: 'Status',
  account: 'Account',
};

const ORDER: EntityType[] = ['zone', 'branch', 'category', 'segment', 'mode', 'status', 'account'];

export interface GraphLegendProps {
  active: Set<EntityType>;
  onToggle: (type: EntityType) => void;
  className?: string;
}

export const GraphLegend = memo(function GraphLegend({
  active,
  onToggle,
  className,
}: GraphLegendProps) {
  return (
    <ul className={cn('flex flex-wrap justify-end gap-1.5', className)}>
      {ORDER.map((type) => {
        const color = ENTITY_TYPE_COLORS[type];
        const isActive = active.has(type);
        return (
          <li key={type}>
            <button
              type="button"
              aria-pressed={isActive}
              onClick={() => onToggle(type)}
              className={cn('outline-none', !isActive && 'opacity-40')}
            >
              <StatusPill label={LABELS[type]} color={color} />
            </button>
          </li>
        );
      })}
    </ul>
  );
});
