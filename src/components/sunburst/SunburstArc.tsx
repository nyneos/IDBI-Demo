import type { MouseEvent, PointerEvent } from 'react';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';
import { MOTION } from '@/motion/tokens';
import type { SunburstArcDatum } from './useSunburstLayout';

export interface SunburstArcProps {
  arc: SunburstArcDatum;
  emphasized: boolean;
  dimmed: boolean;
  active: boolean;
  onPointerEnter: (arc: SunburstArcDatum, e: PointerEvent<SVGPathElement>) => void;
  onPointerMove: (arc: SunburstArcDatum, e: PointerEvent<SVGPathElement>) => void;
  onPointerLeave: () => void;
  onClick: (arc: SunburstArcDatum, e: MouseEvent<SVGPathElement>) => void;
}

export function SunburstArc({
  arc,
  emphasized,
  dimmed,
  active,
  onPointerEnter,
  onPointerMove,
  onPointerLeave,
  onClick,
}: SunburstArcProps) {
  return (
    <path
      d={arc.path}
      fill={arc.color}
      role="treeitem"
      tabIndex={-1}
      aria-label={`${arc.name}, ${formatPercent(arc.shareOfFocus)}, ${arc.value} transactions`}
      aria-selected={active}
      className={cn(
        'cursor-pointer outline-none transition-opacity duration-fast ease-standard',
        'focus-visible:stroke-2 focus-visible:stroke-brand',
      )}
      style={{
        opacity: dimmed ? 0.22 : emphasized ? 1 : 0.78,
        transitionDuration: `${MOTION.fast}ms`,
      }}
      stroke="var(--bg-surface)"
      strokeWidth={1.25}
      onPointerEnter={(e) => onPointerEnter(arc, e)}
      onPointerMove={(e) => onPointerMove(arc, e)}
      onPointerLeave={onPointerLeave}
      onClick={(e) => onClick(arc, e)}
    />
  );
}
