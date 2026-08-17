import { useMemo } from 'react';
import { hierarchy, partition, type HierarchyRectangularNode } from 'd3-hierarchy';
import { arc as d3Arc } from 'd3-shape';
import type { HierarchyNode } from '@/data/types';
import { ZONE_SUNBURST_COLORS } from '@/data/colors';
import { shareOf } from '@/lib/format';

export const SUNBURST_CENTER_R = 88;
const MAX_ZONES = 6;
const MAX_CHILDREN = 3;
const LIGHT_CYCLE = ['#c7d2fe', '#5eead4', '#93c5fd', '#fcd34d', '#fdba74', '#f9a8d4', '#67e8f9', '#d9f99d'];

export interface SunburstArcDatum {
  id: string;
  name: string;
  value: number;
  depth: number;
  level: HierarchyNode['level'];
  color: string;
  path: string;
  labelPath: string;
  parentId: string | null;
  shareOfParent: number;
  shareOfFocus: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  childrenIds: string[];
  midAngle: number;
  midRadius: number;
  showLabel: boolean;
}

export interface SunburstLayoutResult {
  arcs: SunburstArcDatum[];
  focusValue: number;
  outerRadius: number;
  centerR: number;
  band: number;
  ringCount: number;
  byId: Map<string, SunburstArcDatum>;
}

function zoneFill(node: HierarchyRectangularNode<HierarchyNode>): string {
  let cur: HierarchyRectangularNode<HierarchyNode> | null = node;
  while (cur) {
    if (cur.depth === 1) {
      const idx = Math.max(0, cur.parent?.children?.indexOf(cur) ?? 0);
      const base =
        ZONE_SUNBURST_COLORS[cur.data.name] ?? LIGHT_CYCLE[idx % LIGHT_CYCLE.length]!;
      if (node.depth > 1) return `color-mix(in srgb, ${base} 72%, white)`;
      return base;
    }
    cur = cur.parent;
  }
  return ZONE_SUNBURST_COLORS[node.data.name] ?? LIGHT_CYCLE[0]!;
}

function pruneForChart(node: HierarchyNode, depth = 0): HierarchyNode {
  const maxKids = depth === 0 ? MAX_ZONES : MAX_CHILDREN;
  const kids = [...(node.children ?? [])].sort((a, b) => b.value - a.value);
  if (kids.length === 0) return { ...node, children: undefined };
  const limited =
    kids.length <= maxKids
      ? kids
      : [
          ...kids.slice(0, maxKids - 1),
          {
            id: `${node.id}/__other`,
            name: 'Other',
            level: kids[0]?.level ?? 'l2',
            value: kids.slice(maxKids - 1).reduce((s, k) => s + k.value, 0),
          } satisfies HierarchyNode,
        ];
  return {
    ...node,
    children: limited.map((k) => pruneForChart(k, depth + 1)),
  };
}

function findFocus(
  root: HierarchyRectangularNode<HierarchyNode>,
  focusId: string,
): HierarchyRectangularNode<HierarchyNode> {
  if (root.data.id === focusId) return root;
  const stack = [...(root.children ?? [])];
  while (stack.length) {
    const n = stack.pop()!;
    if (n.data.id === focusId) return n;
    if (n.children) stack.push(...n.children);
  }
  return root;
}

export function useSunburstLayout(
  data: HierarchyNode,
  focusId: string,
  outerRadius: number,
): SunburstLayoutResult {
  return useMemo(() => {
    const pruned = pruneForChart(data);
    const root = hierarchy(pruned)
      .sum((d) => (d.children && d.children.length > 0 ? 0 : d.value))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0));

    const laid = partition<HierarchyNode>().size([2 * Math.PI, 4])(
      root,
    ) as HierarchyRectangularNode<HierarchyNode>;

    const focus = findFocus(laid, focusId);
    const atRoot = focus === laid || focus.depth === 0;
    const ringCount = atRoot ? 2 : 1;
    const centerR = atRoot ? Math.max(72, outerRadius * 0.28) : Math.max(96, outerRadius * 0.4);
    const band = Math.max(1, (outerRadius - centerR) / ringCount);
    const focusValue = focus.value ?? focus.data.value;
    const fx0 = focus.x0;
    const fx1 = focus.x1;
    const span = Math.max(fx1 - fx0, 1e-6);
    const fy0 = focus.y0;

    const arcGen = d3Arc<{
      x0: number;
      x1: number;
      inner: number;
      outer: number;
    }>()
      .startAngle((d) => d.x0)
      .endAngle((d) => d.x1)
      .innerRadius((d) => d.inner)
      .outerRadius((d) => d.outer)
      .padAngle(0.012)
      .padRadius(centerR);

    const arcs: SunburstArcDatum[] = [];
    const byId = new Map<string, SunburstArcDatum>();

    focus.each((node) => {
      if (node === focus) return;
      const relDepth = node.depth - focus.depth;
      if (relDepth < 1 || relDepth > ringCount) return;

      const x0 = ((node.x0 - fx0) / span) * 2 * Math.PI;
      const x1 = ((node.x1 - fx0) / span) * 2 * Math.PI;
      if (x1 - x0 < 0.01) return;

      const ringIndex = relDepth - 1;
      const inner = centerR + ringIndex * band;
      const outer = centerR + (ringIndex + 1) * band;

      const color = zoneFill(node);
      const value = node.value ?? node.data.value;
      const parentValue = node.parent?.value ?? focusValue;
      const path = arcGen({ x0, x1, inner, outer }) ?? '';

      const midAngle = (x0 + x1) / 2 - Math.PI / 2;
      const midRadius = (inner + outer) / 2;
      const sweep = x1 - x0;
      const arcLen = sweep * midRadius;
      const showLabel = arcLen >= 38;

      const datum: SunburstArcDatum = {
        id: node.data.id,
        name: node.data.name,
        value,
        depth: relDepth,
        level: node.data.level,
        color,
        path,
        labelPath: path,
        parentId: node.parent && node.parent !== focus ? node.parent.data.id : focus.data.id,
        shareOfParent: shareOf(value, parentValue),
        shareOfFocus: shareOf(value, focusValue),
        x0,
        x1,
        y0: node.y0 - fy0,
        y1: node.y1 - fy0,
        childrenIds: (node.children ?? []).map((c) => c.data.id),
        midAngle,
        midRadius,
        showLabel,
      };
      arcs.push(datum);
      byId.set(datum.id, datum);
    });

    return { arcs, focusValue, outerRadius, centerR, band, ringCount, byId };
  }, [data, focusId, outerRadius]);
}
