import { useMemo, useState } from 'react';
import { linkRadial } from 'd3-shape';
import type { HierarchyCircularNode, HierarchyPointNode, HierarchyRectangularNode } from 'd3-hierarchy';
import type { HierarchyNode } from '@/data/types';
import { colorForLabel } from '@/components/dashboard-builder/dimensionRegistry';
import { formatCount } from '@/lib/format';
import { ChartTooltip } from './ChartTooltip';
import { useHierarchyLayout, type HierarchyKind } from './useHierarchyLayout';

export interface HierarchyProjectionProps {
  root: HierarchyNode;
  kind: HierarchyKind;
  width?: number;
  height?: number;
}

function findSubtree(root: HierarchyNode, id: string): HierarchyNode {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findSubtree(child, id);
    if (found) return found;
  }
  return root;
}

function ancestorsOf(root: HierarchyNode, id: string): Set<string> {
  const index = new Map<string, HierarchyNode>();
  const walk = (n: HierarchyNode) => {
    index.set(n.id, n);
    n.children?.forEach(walk);
  };
  walk(root);
  const out = new Set<string>();
  let cur: string | null = id;
  while (cur) {
    out.add(cur);
    const node = index.get(cur);
    if (!node) break;
    const parent = [...index.values()].find((p) => p.children?.some((c) => c.id === cur));
    cur = parent?.id ?? null;
  }
  return out;
}

export function HierarchyProjection({
  root,
  kind,
  width = 560,
  height = 280,
}: HierarchyProjectionProps) {
  const [focusId, setFocusId] = useState(root.id);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const tree = useMemo(() => findSubtree(root, focusId), [root, focusId]);
  const layout = useHierarchyLayout(tree, kind, width, height);
  const hoverPath = hoverId ? ancestorsOf(tree, hoverId) : null;

  const dim = (id: string) => (hoverPath && !hoverPath.has(id) ? 0.25 : 1);

  if (kind === 'radialTree') {
    const cx = width / 2;
    const cy = height / 2;
    const nodes = layout.descendants() as HierarchyPointNode<HierarchyNode>[];
    const links = (layout.links() as { source: HierarchyPointNode<HierarchyNode>; target: HierarchyPointNode<HierarchyNode> }[]);
    const radial = linkRadial<
      { source: HierarchyPointNode<HierarchyNode>; target: HierarchyPointNode<HierarchyNode> },
      HierarchyPointNode<HierarchyNode>
    >()
      .angle((d) => d.x)
      .radius((d) => d.y);
    return (
      <div className="relative h-full w-full">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
          <g transform={`translate(${cx},${cy})`}>
            {links.map((l, i) => (
              <path
                key={i}
                d={radial(l) ?? ''}
                fill="none"
                stroke="var(--border-strong)"
                strokeOpacity={0.6}
              />
            ))}
            {nodes.map((n) => {
              const a = n.x - Math.PI / 2;
              const x = Math.cos(a) * n.y;
              const y = Math.sin(a) * n.y;
              return (
                <g key={n.data.id}>
                  <circle
                    cx={x}
                    cy={y}
                    r={n.depth === 0 ? 6 : 4}
                    fill={colorForLabel(n.data.name)}
                    opacity={dim(n.data.id)}
                    style={{ cursor: 'pointer' }}
                    onPointerEnter={() => setHoverId(n.data.id)}
                    onPointerLeave={() => setHoverId(null)}
                    onClick={() => n.children && setFocusId(n.data.id)}
                  />
                  {(n.children?.length ?? 0) === 0 || n.depth < 2 ? (
                    <text
                      x={x}
                      y={y - 8}
                      textAnchor="middle"
                      className="fill-content-secondary text-xs"
                    >
                      {n.data.name.length > 12 ? `${n.data.name.slice(0, 11)}…` : n.data.name}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </g>
        </svg>
        {focusId !== root.id ? (
          <button
            type="button"
            className="absolute left-2 top-2 text-sm font-semibold text-content-secondary outline-none hover:text-content-primary"
            onClick={() => setFocusId(root.id)}
          >
            Reset
          </button>
        ) : null}
      </div>
    );
  }

  if (kind === 'pack') {
    const nodes = layout.descendants() as HierarchyCircularNode<HierarchyNode>[];
    return (
      <div className="relative h-full w-full">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
          {nodes.map((n) => {
            const showLabel = n.r > 18;
            return (
              <g key={n.data.id}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.r}
                  fill={colorForLabel(n.data.name)}
                  fillOpacity={n.children ? 0.18 : 0.85}
                  stroke="var(--border-hairline)"
                  opacity={dim(n.data.id)}
                  style={{ cursor: n.children ? 'pointer' : 'default' }}
                  onPointerEnter={() => setHoverId(n.data.id)}
                  onPointerLeave={() => setHoverId(null)}
                  onClick={() => n.children && setFocusId(n.data.id)}
                />
                {showLabel ? (
                  <text
                    x={n.x}
                    y={n.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-content-primary text-xs"
                  >
                    {n.data.name.length > 14 ? `${n.data.name.slice(0, 13)}…` : n.data.name}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
        {hoverId ? (
          <Tip root={tree} id={hoverId} />
        ) : null}
        {focusId !== root.id ? (
          <button
            type="button"
            className="absolute left-2 top-2 text-sm font-semibold text-content-secondary outline-none hover:text-content-primary"
            onClick={() => setFocusId(root.id)}
          >
            Reset
          </button>
        ) : null}
      </div>
    );
  }

  const nodes = layout.descendants() as HierarchyRectangularNode<HierarchyNode>[];
  return (
    <div className="relative h-full w-full">
      <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
        {nodes
          .filter((n) => n.depth > 0 || kind === 'icicle')
          .map((n) => {
            const w = Math.max(0, n.x1 - n.x0);
            const h = Math.max(0, n.y1 - n.y0);
            const showLabel = w > 36 && h > 14;
            return (
              <g key={n.data.id}>
                <rect
                  x={n.x0}
                  y={n.y0}
                  width={w}
                  height={h}
                  fill={colorForLabel(n.data.name)}
                  fillOpacity={kind === 'icicle' && n.children ? 0.7 : 0.9}
                  stroke="var(--bg-canvas)"
                  strokeWidth={1}
                  opacity={dim(n.data.id)}
                  style={{ cursor: n.children ? 'pointer' : 'default' }}
                  onPointerEnter={() => setHoverId(n.data.id)}
                  onPointerLeave={() => setHoverId(null)}
                  onClick={() => n.children && setFocusId(n.data.id)}
                />
                {showLabel ? (
                  <text
                    x={n.x0 + 4}
                    y={n.y0 + 12}
                    className="fill-content-primary text-xs"
                  >
                    {n.data.name.length > 18 ? `${n.data.name.slice(0, 17)}…` : n.data.name}
                  </text>
                ) : null}
              </g>
            );
          })}
      </svg>
      {hoverId ? <Tip root={tree} id={hoverId} /> : null}
      {focusId !== root.id ? (
        <button
          type="button"
          className="absolute left-2 top-2 text-sm font-semibold text-content-secondary outline-none hover:text-content-primary"
          onClick={() => setFocusId(root.id)}
        >
          Reset
        </button>
      ) : null}
    </div>
  );
}

function Tip({ root, id }: { root: HierarchyNode; id: string }) {
  const walk = (n: HierarchyNode): HierarchyNode | null => {
    if (n.id === id) return n;
    for (const c of n.children ?? []) {
      const f = walk(c);
      if (f) return f;
    }
    return null;
  };
  const node = walk(root);
  if (!node) return null;
  return (
    <div className="pointer-events-none absolute right-2 top-2">
      <ChartTooltip
        title={node.name}
        rows={[{ label: 'Count', value: formatCount(node.value) }]}
      />
    </div>
  );
}
