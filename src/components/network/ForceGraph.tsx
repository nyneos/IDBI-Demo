import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import type { EntityType, GraphEdge, GraphNode } from '@/data/types';
import { ENTITY_TYPE_COLORS } from '@/data/colors';
import { subscribe } from '@/motion/scheduler';
import { useReducedMotion } from '@/motion/useReducedMotion';
import { GraphNodeView } from './GraphNode';
import { GraphEdgeView } from './GraphEdge';
import { EdgeParticles, type ParticleEdge } from './EdgeParticles';
import { NodeBurst, type BurstOrigin } from './NodeBurst';
import { useForceSimulation, type SimNode } from './useForceSimulation';
import { useGraphViewport } from './useGraphViewport';

function hashSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function linkEnds(link: { source: string | SimNode; target: string | SimNode }): {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  sid: string;
  tid: string;
} | null {
  const s = link.source;
  const t = link.target;
  if (typeof s === 'string' || typeof t === 'string') return null;
  return {
    sx: s.x ?? 0,
    sy: s.y ?? 0,
    tx: t.x ?? 0,
    ty: t.y ?? 0,
    sid: s.id,
    tid: t.id,
  };
}

export interface ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId: string | null;
  activeTypes: Set<EntityType>;
  searchQuery: string;
  onSelect: (node: GraphNode, rect: DOMRect) => void;
  onHoverChange?: (nodeId: string | null) => void;
  className?: string;
}

export const ForceGraph = memo(function ForceGraph({
  nodes,
  edges,
  selectedId,
  activeTypes,
  searchQuery,
  onSelect,
  onHoverChange,
  className,
}: ForceGraphProps) {
  const reduced = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 560 });
  const [hovered, setHovered] = useState<string | null>(null);
  const [floatMap, setFloatMap] = useState<Record<string, { x: number; y: number; s: number }>>(
    {},
  );
  const [time, setTime] = useState(0);
  const [burst, setBurst] = useState<BurstOrigin | null>(null);
  const [dragging, setDragging] = useState(false);
  const [hidden, setHidden] = useState(false);
  const focusIndex = useRef(0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onVis = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const { positions, nodeRadius, reheat } = useForceSimulation(
    nodes,
    edges,
    size.w,
    size.h,
    activeTypes,
  );

  const { transform, k, containerRef, zoomTo } = useGraphViewport(size.w, size.h);

  const neighborIds = useMemo(() => {
    if (!hovered && !selectedId) return null;
    const focus = hovered ?? selectedId;
    const set = new Set<string>([focus!]);
    for (const link of positions.links) {
      const ends = linkEnds(link);
      if (!ends) continue;
      if (ends.sid === focus || ends.tid === focus) {
        set.add(ends.sid);
        set.add(ends.tid);
      }
    }
    return set;
  }, [hovered, selectedId, positions.links]);

  const q = searchQuery.trim().toLowerCase();

  // Single shared scheduler subscription for float + particles
  useEffect(() => {
    if (reduced || dragging || hidden) {
      setFloatMap({});
      return;
    }
    const unsub = subscribe((now) => {
      setTime(now);
      const next: Record<string, { x: number; y: number; s: number }> = {};
      for (const n of positions.nodes) {
        const seed = hashSeed(n.id);
        const speed = 0.6 + ((seed % 80) / 80) * 0.8;
        const period = 4000 + (seed % 3000);
        const massSlow = 1 / (1 + Math.sqrt(n.value) / 80);
        const phase = (now / period) * Math.PI * 2 * speed * massSlow + (seed % 360);
        next[n.id] = {
          x: Math.sin(phase) * 2.5,
          y: Math.cos(phase * 0.87) * 2.5,
          s: 1 + Math.sin(phase * 1.1) * 0.015,
        };
      }
      setFloatMap(next);
    });
    return unsub;
  }, [positions.nodes, reduced, dragging, hidden]);

  const handleHover = useCallback(
    (id: string | null) => {
      setHovered(id);
      onHoverChange?.(id);
    },
    [onHoverChange],
  );

  const handleClick = useCallback(
    (id: string, rect: DOMRect) => {
      const node = positions.nodes.find((n) => n.id === id);
      if (!node) return;

      if (reduced) {
        onSelect(node, rect);
        zoomTo(node.x, node.y);
        return;
      }

      setBurst({
        x: node.x,
        y: node.y,
        color: ENTITY_TYPE_COLORS[node.type],
        token: performance.now(),
      });

      window.setTimeout(() => {
        onSelect(node, rect);
        zoomTo(node.x, node.y);
        reheat(0.35);
      }, 320);
    },
    [positions.nodes, onSelect, zoomTo, reheat, reduced],
  );

  useEffect(() => {
    reheat(0.4);
  }, [activeTypes, reheat]);

  const particleEdges = useMemo(() => {
    const out: ParticleEdge[] = [];
    for (const link of positions.links) {
      const ends = linkEnds(link);
      if (!ends) continue;
      const sourceNode = positions.nodes.find((n) => n.id === ends.sid);
      if (!sourceNode) continue;
      const connected =
        neighborIds && (neighborIds.has(ends.sid) || neighborIds.has(ends.tid));
      out.push({
        id: `${ends.sid}-${ends.tid}`,
        x1: ends.sx,
        y1: ends.sy,
        x2: ends.tx,
        y2: ends.ty,
        value: link.value,
        sourceType: sourceNode.type,
        speedBoost: Boolean(connected && hovered),
      });
    }
    return out;
  }, [positions, neighborIds, hovered]);

  const onKeyDown = (e: KeyboardEvent<SVGSVGElement>) => {
    if (positions.nodes.length === 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusIndex.current = (focusIndex.current + 1) % positions.nodes.length;
      const n = positions.nodes[focusIndex.current]!;
      handleHover(n.id);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusIndex.current =
        (focusIndex.current - 1 + positions.nodes.length) % positions.nodes.length;
      const n = positions.nodes[focusIndex.current]!;
      handleHover(n.id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const n = positions.nodes[focusIndex.current];
      if (n) {
        handleClick(n.id, new DOMRect(n.x, n.y, 20, 20));
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleHover(null);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={className}
      onPointerDown={() => setDragging(true)}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
    >
      <svg
        ref={containerRef}
        width="100%"
        height="100%"
        role="application"
        aria-label="Transaction relationship force graph"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="h-full w-full outline-none"
      >
        <g transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}>
          <g>
            {positions.links.map((link) => {
              const ends = linkEnds(link);
              if (!ends) return null;
              const id = `${ends.sid}-${ends.tid}`;
              const dimmed = neighborIds
                ? !(neighborIds.has(ends.sid) && neighborIds.has(ends.tid))
                : false;
              const highlighted = neighborIds
                ? neighborIds.has(ends.sid) && neighborIds.has(ends.tid) && Boolean(hovered)
                : false;
              return (
                <GraphEdgeView
                  key={id}
                  id={id}
                  x1={ends.sx}
                  y1={ends.sy}
                  x2={ends.tx}
                  y2={ends.ty}
                  value={link.value}
                  kind={link.kind}
                  dimmed={dimmed}
                  highlighted={highlighted}
                />
              );
            })}
          </g>

          <EdgeParticles
            edges={particleEdges}
            time={time}
            enabled={!reduced && k >= 0.6 && !hidden}
          />

          <NodeBurst origin={burst} />

          <g>
            {positions.nodes.map((n) => {
              const float = floatMap[n.id] ?? { x: 0, y: 0, s: 1 };
              const match = !q || n.label.toLowerCase().includes(q);
              const dimmed = neighborIds
                ? !neighborIds.has(n.id) || !match
                : !match;
              return (
                <GraphNodeView
                  key={n.id}
                  id={n.id}
                  label={n.label}
                  sublabel={n.sublabel}
                  type={n.type}
                  value={n.value}
                  x={n.x}
                  y={n.y}
                  radius={nodeRadius(n.value)}
                  floatX={float.x}
                  floatY={float.y}
                  pulseScale={float.s}
                  dimmed={dimmed}
                  highlighted={hovered === n.id || neighborIds?.has(n.id) === true}
                  selected={selectedId === n.id}
                  onPointerEnter={(id) => handleHover(id)}
                  onPointerLeave={() => handleHover(null)}
                  onClick={handleClick}
                />
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
});
