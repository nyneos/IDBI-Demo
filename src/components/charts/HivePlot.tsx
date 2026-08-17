import { useMemo, useState } from 'react';
import { colorForLabel } from '@/components/dashboard-builder/dimensionRegistry';
import { formatCount } from '@/lib/format';
import { ChartTooltip } from './ChartTooltip';

export interface HiveAxis {
  key: string;
  label: string;
  nodes: { id: string; label: string; value: number }[];
}

export interface HiveEdge {
  source: string;
  target: string;
  value: number;
}

export interface HivePlotProps {
  axes: HiveAxis[];
  edges: HiveEdge[];
  size?: number;
}

export function HivePlot({ axes, edges, size = 320 }: HivePlotProps) {
  const [hover, setHover] = useState<string | null>(null);
  const layout = useMemo(() => {
    const n = Math.max(axes.length, 1);
    const cx = size / 2;
    const cy = size / 2;
    const inner = 28;
    const outer = size / 2 - 28;
    const positions = new Map<string, { x: number; y: number; angle: number; r: number }>();
    axes.forEach((axis, ai) => {
      const angle = (ai / n) * Math.PI * 2 - Math.PI / 2;
      const max = Math.max(1, ...axis.nodes.map((nd) => nd.value));
      axis.nodes.forEach((nd) => {
        const r = inner + (nd.value / max) * (outer - inner);
        positions.set(nd.id, {
          x: cx + Math.cos(angle) * r,
          y: cy + Math.sin(angle) * r,
          angle,
          r,
        });
      });
    });
    return { cx, cy, inner, outer, positions, n };
  }, [axes, size]);

  const related = useMemo(() => {
    if (!hover) return null;
    const ids = new Set<string>([hover]);
    for (const e of edges) {
      if (e.source === hover || e.target === hover) {
        ids.add(e.source);
        ids.add(e.target);
      }
    }
    return ids;
  }, [hover, edges]);

  return (
    <div className="relative h-full w-full">
      <svg width="100%" viewBox={`0 0 ${size} ${size}`}>
        {axes.map((axis, ai) => {
          const angle = (ai / layout.n) * Math.PI * 2 - Math.PI / 2;
          const x2 = layout.cx + Math.cos(angle) * layout.outer;
          const y2 = layout.cy + Math.sin(angle) * layout.outer;
          const lx = layout.cx + Math.cos(angle) * (layout.outer + 14);
          const ly = layout.cy + Math.sin(angle) * (layout.outer + 14);
          return (
            <g key={axis.key}>
              <line
                x1={layout.cx + Math.cos(angle) * layout.inner}
                y1={layout.cy + Math.sin(angle) * layout.inner}
                x2={x2}
                y2={y2}
                stroke="var(--border-strong)"
                strokeWidth={1}
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                className="fill-content-secondary text-xs"
              >
                {axis.label}
              </text>
            </g>
          );
        })}

        {edges.map((e) => {
          const s = layout.positions.get(e.source);
          const t = layout.positions.get(e.target);
          if (!s || !t) return null;
          const midAngle = (s.angle + t.angle) / 2;
          const midR = (s.r + t.r) / 2 + 18;
          const cpx = layout.cx + Math.cos(midAngle) * midR;
          const cpy = layout.cy + Math.sin(midAngle) * midR;
          const active = !related || related.has(e.source) || related.has(e.target);
          return (
            <path
              key={`${e.source}-${e.target}`}
              d={`M${s.x} ${s.y} Q${cpx} ${cpy} ${t.x} ${t.y}`}
              fill="none"
              stroke="var(--cat-1)"
              strokeOpacity={active ? 0.45 : 0.08}
              strokeWidth={Math.max(1, Math.min(4, Math.log2(e.value + 1)))}
            />
          );
        })}

        {axes.flatMap((axis) =>
          axis.nodes.map((nd) => {
            const p = layout.positions.get(nd.id);
            if (!p) return null;
            const active = !related || related.has(nd.id);
            return (
              <circle
                key={nd.id}
                cx={p.x}
                cy={p.y}
                r={4}
                fill={colorForLabel(nd.label)}
                opacity={active ? 1 : 0.2}
                style={{ cursor: 'pointer' }}
                onPointerEnter={() => setHover(nd.id)}
                onPointerLeave={() => setHover(null)}
              />
            );
          }),
        )}
      </svg>
      {hover ? (
        <div className="pointer-events-none absolute right-2 top-2">
          <ChartTooltip
            title={axes.flatMap((a) => a.nodes).find((n) => n.id === hover)?.label ?? hover}
            rows={[
              {
                label: 'Count',
                value: formatCount(
                  axes.flatMap((a) => a.nodes).find((n) => n.id === hover)?.value ?? 0,
                ),
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
