import { useMemo, useState } from 'react';
import { chord, ribbon, type Chord, type ChordGroup } from 'd3-chord';
import { arc as d3Arc } from 'd3-shape';
import { colorForLabel } from '@/components/dashboard-builder/dimensionRegistry';
import { formatCount } from '@/lib/format';
import { ChartTooltip } from './ChartTooltip';

export interface ChordDiagramProps {
  labels: string[];
  matrix: number[][];
  size?: number;
}

export function ChordDiagram({ labels, matrix, size = 280 }: ChordDiagramProps) {
  const [hover, setHover] = useState<{ kind: 'arc' | 'ribbon'; i: number; j?: number } | null>(
    null,
  );

  const { groups, ribbons, inner, outer } = useMemo(() => {
    const innerR = size / 2 - 40;
    const outerR = innerR + 12;
    const layout = chord().padAngle(0.04).sortSubgroups((a, b) => b - a)(matrix);
    return {
      groups: layout.groups,
      ribbons: Array.from(layout) as Chord[],
      inner: innerR,
      outer: outerR,
    };
  }, [matrix, size]);

  const arcGen = useMemo(
    () =>
      d3Arc<unknown, ChordGroup>()
        .innerRadius(inner)
        .outerRadius(outer),
    [inner, outer],
  );
  const ribbonGen = useMemo(() => ribbon<Chord, Chord['source']>().radius(inner), [inner]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg width="100%" viewBox={`0 0 ${size} ${size}`}>
        <g transform={`translate(${cx},${cy})`}>
          {ribbons.map((r) => {
            const active =
              !hover ||
              (hover.kind === 'arc' &&
                (hover.i === r.source.index || hover.i === r.target.index)) ||
              (hover.kind === 'ribbon' &&
                hover.i === r.source.index &&
                hover.j === r.target.index);
            return (
              <path
                key={`r-${r.source.index}-${r.target.index}`}
                d={ribbonGen(r) ?? ''}
                fill={colorForLabel(labels[r.source.index] ?? '')}
                fillOpacity={active ? 0.55 : 0.08}
                style={{ cursor: 'pointer' }}
                onPointerEnter={() =>
                  setHover({ kind: 'ribbon', i: r.source.index, j: r.target.index })
                }
                onPointerLeave={() => setHover(null)}
              />
            );
          })}
          {groups.map((g) => {
            const faded = hover?.kind === 'arc' && hover.i !== g.index;
            const mid = (g.startAngle + g.endAngle) / 2 - Math.PI / 2;
            const lx = Math.cos(mid) * (outer + 12);
            const ly = Math.sin(mid) * (outer + 12);
            const name = labels[g.index] ?? '';
            return (
              <g key={`g-${g.index}`}>
                <path
                  d={arcGen(g) ?? ''}
                  fill={colorForLabel(name)}
                  opacity={faded ? 0.25 : 1}
                  style={{ cursor: 'pointer' }}
                  onPointerEnter={() => setHover({ kind: 'arc', i: g.index })}
                  onPointerLeave={() => setHover(null)}
                />
                <text
                  x={lx}
                  y={ly}
                  textAnchor={lx > 0 ? 'start' : 'end'}
                  dominantBaseline="middle"
                  className="fill-content-secondary text-xs"
                >
                  {name.length > 10 ? `${name.slice(0, 9)}…` : name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      {hover ? (
        <div className="pointer-events-none absolute right-2 top-2">
          <ChartTooltip
            title={
              hover.kind === 'arc'
                ? labels[hover.i] ?? ''
                : `${labels[hover.i]} → ${labels[hover.j ?? 0]}`
            }
            rows={[
              {
                label: 'Count',
                value: formatCount(
                  hover.kind === 'arc'
                    ? (matrix[hover.i] ?? []).reduce((s, n) => s + n, 0)
                    : matrix[hover.i]?.[hover.j ?? 0] ?? 0,
                ),
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
