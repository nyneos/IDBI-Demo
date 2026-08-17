import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import type { GraphEdge, GraphNode, EntityType } from '@/data/types';

export interface SimNode extends SimulationNodeDatum, GraphNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  value: number;
  kind: GraphEdge['kind'];
  source: string | SimNode;
  target: string | SimNode;
}

export interface ForcePositions {
  nodes: SimNode[];
  links: SimLink[];
}

function nodeRadius(value: number, maxValue: number): number {
  return 18 + Math.sqrt(value / (maxValue || 1)) * 26;
}

export function useForceSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  activeTypes: Set<EntityType> | null,
) {
  const simRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const [positions, setPositions] = useState<ForcePositions>({ nodes: [], links: [] });
  const maxValue = useMemo(() => Math.max(...nodes.map((n) => n.value), 1), [nodes]);

  const filtered = useMemo(() => {
    const ns = activeTypes
      ? nodes.filter((n) => activeTypes.has(n.type))
      : nodes;
    const ids = new Set(ns.map((n) => n.id));
    const ls = edges.filter((e) => ids.has(e.source) && ids.has(e.target));
    return { nodes: ns, edges: ls };
  }, [nodes, edges, activeTypes]);

  const rebuild = useCallback(() => {
    if (width < 10 || height < 10) return;

    simRef.current?.stop();

    const simNodes: SimNode[] = filtered.nodes.map((n, i) => {
      const angle = (i / filtered.nodes.length) * Math.PI * 2;
      const r = Math.min(width, height) * 0.28;
      return {
        ...n,
        x: width / 2 + Math.cos(angle) * r,
        y: height / 2 + Math.sin(angle) * r,
      };
    });

    const simLinks: SimLink[] = filtered.edges.map((e) => ({
      source: e.source,
      target: e.target,
      value: e.value,
      kind: e.kind,
    }));

    const linkForce = forceLink<SimNode, SimLink>(simLinks)
      .id((d) => d.id)
      .distance((d) => {
        const v = d.value;
        return 90 + Math.min(70, Math.sqrt(v) * 2);
      })
      .strength(0.4);

    const sim = forceSimulation<SimNode, SimLink>(simNodes)
      .force('link', linkForce)
      .force('charge', forceManyBody().strength(-280).distanceMax(420))
      .force(
        'collide',
        forceCollide<SimNode>()
          .radius((d) => nodeRadius(d.value, maxValue) + 8)
          .strength(0.9),
      )
      .force('center', forceCenter(width / 2, height / 2))
      .alphaDecay(0.035)
      .velocityDecay(0.42)
      .on('tick', () => {
        if (sim.alpha() < 0.01) {
          sim.stop();
        }
        setPositions({
          nodes: simNodes.map((n) => ({ ...n, x: n.x ?? 0, y: n.y ?? 0 })),
          links: simLinks.slice(),
        });
      });

    simRef.current = sim;
    setPositions({
      nodes: simNodes.map((n) => ({ ...n, x: n.x ?? 0, y: n.y ?? 0 })),
      links: simLinks.slice(),
    });
  }, [filtered, width, height, maxValue]);

  useEffect(() => {
    rebuild();
    return () => {
      simRef.current?.stop();
    };
  }, [rebuild]);

  const reheat = useCallback((alpha = 0.4) => {
    const sim = simRef.current;
    if (!sim) return;
    sim.alpha(alpha).restart();
  }, []);

  const pinNode = useCallback((id: string, x: number, y: number) => {
    const sim = simRef.current;
    if (!sim) return;
    const node = sim.nodes().find((n) => n.id === id);
    if (!node) return;
    node.fx = x;
    node.fy = y;
  }, []);

  const unpinNode = useCallback((id: string) => {
    const sim = simRef.current;
    if (!sim) return;
    const node = sim.nodes().find((n) => n.id === id);
    if (!node) return;
    node.fx = null;
    node.fy = null;
  }, []);

  return {
    positions,
    maxValue,
    nodeRadius: (value: number) => nodeRadius(value, maxValue),
    reheat,
    pinNode,
    unpinNode,
    simulation: simRef,
  };
}
