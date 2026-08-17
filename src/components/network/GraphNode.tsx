import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  Building,
  CheckCircle2,
  GitBranch,
  MapPin,
  Store,
} from 'lucide-react';
import type { EntityType } from '@/data/types';
import { ENTITY_TYPE_COLORS } from '@/data/colors';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/cn';

const TYPE_ICONS: Record<EntityType, LucideIcon> = {
  zone: MapPin,
  branch: Building,
  category: AlertCircle,
  segment: GitBranch,
  mode: Store,
  status: CheckCircle2,
  account: Building,
};

export interface GraphNodeProps {
  id: string;
  label: string;
  sublabel?: string;
  type: EntityType;
  value: number;
  x: number;
  y: number;
  radius: number;
  floatX?: number;
  floatY?: number;
  pulseScale?: number;
  dimmed?: boolean;
  highlighted?: boolean;
  selected?: boolean;
  onPointerEnter?: (id: string) => void;
  onPointerLeave?: () => void;
  onClick?: (id: string, rect: DOMRect) => void;
}

export const GraphNodeView = memo(function GraphNodeView({
  id,
  label,
  sublabel,
  type,
  value,
  x,
  y,
  radius,
  floatX = 0,
  floatY = 0,
  pulseScale = 1,
  dimmed = false,
  highlighted = false,
  selected = false,
  onPointerEnter,
  onPointerLeave,
  onClick,
}: GraphNodeProps) {
  const color = ENTITY_TYPE_COLORS[type];
  const Icon = TYPE_ICONS[type];
  const r = radius * pulseScale * (highlighted || selected ? 1.08 : 1);
  const opacity = dimmed ? 0.18 : 1;
  const strokeW = selected ? 3 : highlighted ? 2.5 : 2;

  return (
    <g
      transform={`translate(${x + floatX}, ${y + floatY})`}
      opacity={opacity}
      style={{ transition: 'opacity 150ms' }}
      onPointerEnter={() => onPointerEnter?.(id)}
      onPointerLeave={() => onPointerLeave?.()}
      onClick={(e) => {
        const circle = e.currentTarget.querySelector('circle');
        const rect = circle?.getBoundingClientRect() ?? e.currentTarget.getBoundingClientRect();
        onClick?.(id, rect);
      }}
      role="treeitem"
      tabIndex={-1}
      aria-label={`${label}, ${formatCount(value)} transactions`}
      className={cn('cursor-pointer outline-none')}
    >
      <circle
        r={r}
        fill={color}
        fillOpacity={0.18}
        stroke={color}
        strokeWidth={strokeW}
        style={
          highlighted || selected
            ? { filter: `drop-shadow(0 0 8px ${color})` }
            : undefined
        }
      />
      <foreignObject x={-8} y={-8} width={16} height={16} className="pointer-events-none">
        <div className="flex h-full w-full items-center justify-center" style={{ color }}>
          <Icon size={14} strokeWidth={1.75} aria-hidden />
        </div>
      </foreignObject>
      <text
        y={r + 14}
        textAnchor="middle"
        className="pointer-events-none fill-[var(--text-primary)] text-xs font-semibold"
        style={{ fontSize: 12 }}
      >
        {label}
        {sublabel ? ` ${sublabel}` : ''}
      </text>
      <text
        y={r + 28}
        textAnchor="middle"
        className="pointer-events-none fill-[var(--text-secondary)]"
        style={{ fontSize: 12 }}
      >
        {formatCount(value)}
      </text>
    </g>
  );
});

export { TYPE_ICONS };
