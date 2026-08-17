import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { sankey, sankeyLinkHorizontal, type SankeyGraph, type SankeyNode as D3SankeyNode } from 'd3-sankey';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';
import { EASE, MOTION } from '@/motion/tokens';
import { useReducedMotion } from '@/motion/useReducedMotion';
import { ChartFrame, type ChartFrameRenderProps } from './ChartFrame';
import { ChartTooltip } from './ChartTooltip';

export interface SankeyNodeDatum {
  id: string;
  name: string;
  value?: number;
  color?: string;
}

export interface SankeyLinkDatum {
  source: string;
  target: string;
  value: number;
}

export interface SankeyChartProps {
  title: string;
  ariaSummary: string;
  stages: SankeyNodeDatum[][];
  links: SankeyLinkDatum[];
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
  height?: number;
  framed?: boolean;
  headerAction?: ReactNode;
  titleClassName?: string;
  plotClassName?: string;
  onNodeClick?: (
    node: { id: string; name: string; color: string; stage: number },
    rect: DOMRect,
  ) => void;
}

type NodeExtra = SankeyNodeDatum & { stage: number };
type GraphNode = D3SankeyNode<NodeExtra, { value: number }>;
type GraphLink = {
  source: GraphNode | number;
  target: GraphNode | number;
  value: number;
  width?: number;
  y0?: number;
  y1?: number;
};

const STAGE_COLORS = [
  'var(--cat-1)',
  'var(--cat-5)',
  'var(--cat-3)',
  'var(--status-success)',
] as const;

export function SankeyChart({
  title,
  ariaSummary,
  stages,
  links,
  actionLabel,
  onActionClick,
  className,
  height = 420,
  framed = true,
  headerAction,
  titleClassName,
  plotClassName,
  onNodeClick,
}: SankeyChartProps & { slot?: ChartFrameRenderProps }) {
  const reduced = useReducedMotion();
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [hoverLink, setHoverLink] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 720, h: height });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (!cr) return;
      const w = Math.max(240, cr.width);
      const h = Math.max(160, cr.height || height);
      setSize((prev) => (Math.abs(prev.w - w) < 1 && Math.abs(prev.h - h) < 1 ? prev : { w, h }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [height]);

  const graph = useMemo(() => {
    const nodes: NodeExtra[] = stages.flatMap((stageNodes, stage) =>
      stageNodes.map((n) => ({ ...n, stage })),
    );
    const known = new Set(nodes.map((n) => n.id));
    const graphLinks = links
      .filter((link) => known.has(link.source) && known.has(link.target) && link.value > 0)
      .map((link) => ({
        source: link.source,
        target: link.target,
        value: link.value,
      }));

    if (nodes.length === 0 || graphLinks.length === 0) {
      return { nodes: [] as GraphNode[], links: [] as GraphLink[] };
    }

    const padX = 96;
    const padY = 16;
    try {
      const layout = sankey<NodeExtra, { value: number }>()
        .nodeId((d) => d.id)
        .nodeWidth(14)
        .nodePadding(14)
        .extent([
          [padX, padY],
          [Math.max(padX + 40, size.w - padX), Math.max(padY + 40, size.h - padY)],
        ]);

      return layout({
        nodes: nodes.map((n) => ({ ...n })),
        links: graphLinks,
      }) as SankeyGraph<NodeExtra, { value: number }>;
    } catch {
      return { nodes: [] as GraphNode[], links: [] as GraphLink[] };
    }
  }, [stages, links, size.w, size.h]);

  const linkPath = sankeyLinkHorizontal();

  const related = useMemo(() => {
    if (!hoverNode && !hoverLink) return null;
    const nodeIds = new Set<string>();
    const linkKeys = new Set<string>();
    if (hoverLink) linkKeys.add(hoverLink);
    if (hoverNode) nodeIds.add(hoverNode);

    const walk = () => {
      for (const link of graph.links as GraphLink[]) {
        const s = link.source as GraphNode;
        const t = link.target as GraphNode;
        const key = `${s.id}->${t.id}`;
        if (nodeIds.has(s.id) || nodeIds.has(t.id) || linkKeys.has(key)) {
          nodeIds.add(s.id);
          nodeIds.add(t.id);
          linkKeys.add(key);
        }
      }
    };
    walk();
    walk();
    return { nodeIds, linkKeys };
  }, [graph.links, hoverNode, hoverLink]);

  const plot = () => (
        <div ref={wrapRef} className="relative h-full w-full overflow-hidden">
          <svg width="100%" height="100%" viewBox={`0 0 ${size.w} ${size.h}`} preserveAspectRatio="xMidYMid meet">
            <g>
              {(graph.links as GraphLink[]).map((link, i) => {
                const s = link.source as GraphNode;
                const t = link.target as GraphNode;
                const key = `${s.id}->${t.id}`;
                const active = !related || related.linkKeys.has(key);
                const d = linkPath(link as never) ?? '';
                return (
                  <motion.path
                    key={key}
                    d={d}
                    fill="none"
                    stroke={s.color ?? STAGE_COLORS[s.stage ?? 0] ?? 'var(--cat-1)'}
                    strokeOpacity={active ? 0.45 : 0.08}
                    strokeWidth={Math.max(1, link.width ?? 1)}
                    initial={reduced ? false : { pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{
                      duration: MOTION.chart / 1000,
                      ease: EASE.enter,
                      delay: reduced ? 0 : 0.12 + i * 0.02,
                    }}
                    onPointerEnter={() => {
                      setHoverLink(key);
                      setHoverNode(null);
                    }}
                    onPointerLeave={() => setHoverLink(null)}
                    style={{ cursor: 'pointer' }}
                  />
                );
              })}

              {(graph.nodes as GraphNode[]).map((node, i) => {
                const x0 = node.x0 ?? 0;
                const x1 = node.x1 ?? 0;
                const y0 = node.y0 ?? 0;
                const y1 = node.y1 ?? 0;
                const active = !related || related.nodeIds.has(node.id);
                const fill = node.color ?? STAGE_COLORS[node.stage ?? 0] ?? 'var(--cat-1)';
                const drillable = Boolean(onNodeClick);
                return (
                  <motion.rect
                    key={node.id}
                    x={x0}
                    y={y0}
                    width={Math.max(1, x1 - x0)}
                    height={Math.max(1, y1 - y0)}
                    rx={3}
                    fill={fill}
                    opacity={active ? 1 : 0.25}
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: active ? 1 : 0.25 }}
                    transition={{
                      duration: MOTION.base / 1000,
                      ease: EASE.enter,
                      delay: reduced ? 0 : i * 0.02,
                    }}
                    onPointerEnter={() => {
                      setHoverNode(node.id);
                      setHoverLink(null);
                    }}
                    onPointerLeave={() => setHoverNode(null)}
                    onClick={(e) => {
                      if (!onNodeClick) return;
                      onNodeClick(
                        {
                          id: node.id,
                          name: node.name,
                          color: fill,
                          stage: node.stage ?? 0,
                        },
                        (e.currentTarget as SVGRectElement).getBoundingClientRect(),
                      );
                    }}
                    style={{ cursor: drillable ? 'pointer' : 'default' }}
                  />
                );
              })}
            </g>

            {(graph.nodes as GraphNode[]).map((node) => {
              const x0 = node.x0 ?? 0;
              const x1 = node.x1 ?? 0;
              const y0 = node.y0 ?? 0;
              const y1 = node.y1 ?? 0;
              const midY = (y0 + y1) / 2;
              const right = (node.stage ?? 0) >= Math.max(1, stages.length - 2);
              return (
                <text
                  key={`label-${node.id}`}
                  x={right ? x0 - 6 : x1 + 6}
                  y={midY}
                  textAnchor={right ? 'end' : 'start'}
                  dominantBaseline="middle"
                  fill="var(--text-secondary)"
                  fontSize={12}
                  className={cn(!related || related.nodeIds.has(node.id) ? 'opacity-100' : 'opacity-40')}
                >
                  {node.name}
                </text>
              );
            })}
          </svg>

          {(hoverNode || hoverLink) && (
            <div className="pointer-events-none absolute right-2 top-2">
              <ChartTooltip
                title={hoverNode ?? hoverLink ?? ''}
                rows={
                  hoverNode
                    ? [
                        {
                          label: 'Value',
                          value: formatCount(
                            (graph.nodes as GraphNode[]).find((n) => n.id === hoverNode)?.value ?? 0,
                          ),
                        },
                      ]
                    : [
                        {
                          label: 'Flow',
                          value: formatCount(
                            (graph.links as GraphLink[]).find((l) => {
                              const s = l.source as GraphNode;
                              const t = l.target as GraphNode;
                              return `${s.id}->${t.id}` === hoverLink;
                            })?.value ?? 0,
                          ),
                        },
                      ]
                }
              />
            </div>
          )}
        </div>
  );

  if (!framed) return plot();

  return (
    <ChartFrame
      title={title}
      ariaSummary={ariaSummary}
      actionLabel={actionLabel}
      onActionClick={onActionClick}
      headerAction={headerAction}
      titleClassName={titleClassName}
      plotClassName={cn('overflow-hidden', plotClassName)}
      className={className}
      empty={links.length === 0}
      a11yRows={links.map((l) => ({
        label: `${l.source} to ${l.target}`,
        value: l.value,
      }))}
    >
      {plot}
    </ChartFrame>
  );
}
