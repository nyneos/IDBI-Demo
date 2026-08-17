import { memo } from 'react';
import type { GraphEdge } from '@/data/types';
import { formatCount } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface GraphEdgeProps {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: number;
  kind: GraphEdge['kind'];
  dimmed?: boolean;
  highlighted?: boolean;
  showLabel?: boolean;
}

const DASH: Record<GraphEdge['kind'], string | undefined> = {
  related: undefined,
  status: '6 3 1 3',
};

export function edgeWidth(value: number): number {
  return Math.min(4, 1 + Math.sqrt(value) / 8);
}

export const GraphEdgeView = memo(function GraphEdgeView({
  id,
  x1,
  y1,
  x2,
  y2,
  value,
  kind,
  dimmed = false,
  highlighted = false,
  showLabel = true,
}: GraphEdgeProps) {
  const width = edgeWidth(value) + (highlighted ? 1 : 0);
  const opacity = dimmed ? 0.12 : highlighted ? 0.85 : 0.28;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  return (
    <g className={cn('pointer-events-none')} opacity={opacity} style={{ transition: 'opacity 150ms' }}>
      <line
        id={id}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke="var(--text-secondary)"
        strokeWidth={width}
        strokeDasharray={DASH[kind]}
      />
      {showLabel ? (
        <text
          x={mx}
          y={my - 4}
          textAnchor="middle"
          fill="var(--text-tertiary)"
          style={{ fontSize: 12 }}
        >
          {formatCount(value)}
        </text>
      ) : null}
    </g>
  );
});
