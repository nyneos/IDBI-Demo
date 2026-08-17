import { memo, useMemo } from 'react';
import { ENTITY_TYPE_COLORS } from '@/data/colors';
import type { EntityType } from '@/data/types';

export interface ParticleEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  value: number;
  sourceType: EntityType;
  speedBoost?: boolean;
}

export interface EdgeParticlesProps {
  edges: ParticleEdge[];
  time: number;
  enabled: boolean;
}

interface ParticleSpec {
  edgeId: string;
  offset: number;
  period: number;
  color: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function pickEdges(edges: ParticleEdge[]): ParticleEdge[] {
  if (edges.length === 0) return [];
  const sorted = [...edges].sort((a, b) => b.value - a.value);
  const topCount = Math.max(1, Math.ceil(sorted.length * 0.2));
  let picked = sorted.slice(0, topCount);

  // Cap total particles at 60 (1–3 per edge)
  let budget = 60;
  const result: ParticleEdge[] = [];
  for (const e of picked) {
    const count = e.value > 1500 ? 3 : e.value > 800 ? 2 : 1;
    if (budget < count) break;
    budget -= count;
    result.push(e);
  }
  return result;
}

export const EdgeParticles = memo(function EdgeParticles({
  edges,
  time,
  enabled,
}: EdgeParticlesProps) {
  const specs = useMemo(() => {
    const picked = pickEdges(edges);
    const out: ParticleSpec[] = [];
    for (const e of picked) {
      const count = e.value > 1500 ? 3 : e.value > 800 ? 2 : 1;
      for (let i = 0; i < count; i++) {
        out.push({
          edgeId: e.id,
          offset: i / count,
          period: 3000 + (e.value % 3000),
          color: ENTITY_TYPE_COLORS[e.sourceType],
          x1: e.x1,
          y1: e.y1,
          x2: e.x2,
          y2: e.y2,
        });
      }
    }
    return out.slice(0, 60);
  }, [edges]);

  if (!enabled) return null;

  return (
    <g aria-hidden className="pointer-events-none">
      {specs.map((p, i) => {
        const edge = edges.find((e) => e.id === p.edgeId);
        const boost = edge?.speedBoost ? 1.6 : 1;
        const period = p.period / boost;
        const t = ((time / period + p.offset) % 1 + 1) % 1;
        const x = p.x1 + (p.x2 - p.x1) * t;
        const y = p.y1 + (p.y2 - p.y1) * t;
        return (
          <circle
            key={`${p.edgeId}-${i}`}
            cx={x}
            cy={y}
            r={2}
            fill={p.color}
            fillOpacity={0.7}
          />
        );
      })}
    </g>
  );
});
