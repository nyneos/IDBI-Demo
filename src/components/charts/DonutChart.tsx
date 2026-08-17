import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { formatCount, formatPercent, shareOf } from '@/lib/format';
import { CATEGORY_COLORS } from '@/data/colors';
import { EASE, MOTION } from '@/motion/tokens';
import { useCountUp } from '@/motion/useCountUp';
import { useReducedMotion } from '@/motion/useReducedMotion';
import { subscribe } from '@/motion/scheduler';
import { ChartFrame, type ChartFrameRenderProps } from './ChartFrame';
import { ChartTooltip } from './ChartTooltip';

export interface DonutSlice {
  id: string;
  name: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  title: string;
  ariaSummary: string;
  data: DonutSlice[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: number;
  showLegend?: boolean;
  onSliceClick?: (slice: DonutSlice, rect: DOMRect) => void;
  actionLabel?: string;
  onActionClick?: () => void;
  footnote?: ReactNode;
  className?: string;
  legendAside?: boolean;
  headerAction?: ReactNode;
  titleClassName?: string;
  plotClassName?: string;
  framed?: boolean;
  slot?: ChartFrameRenderProps;
}

interface ArcGeom {
  slice: DonutSlice;
  color: string;
  path: string;
  startAngle: number;
  endAngle: number;
}

function polar(cx: number, cy: number, r: number, angle: number) {
  const a = angle - Math.PI / 2;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function arcPath(
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  start: number,
  end: number,
): string {
  const sweep = Math.max(0, end - start);
  if (sweep <= 0.0001) return '';
  const large = sweep > Math.PI ? 1 : 0;
  const os = polar(cx, cy, outer, start);
  const oe = polar(cx, cy, outer, end);
  const is = polar(cx, cy, inner, end);
  const ie = polar(cx, cy, inner, start);
  return [
    `M ${os.x} ${os.y}`,
    `A ${outer} ${outer} 0 ${large} 1 ${oe.x} ${oe.y}`,
    `L ${is.x} ${is.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${ie.x} ${ie.y}`,
    'Z',
  ].join(' ');
}

function buildArcs(
  data: DonutSlice[],
  cx: number,
  cy: number,
  outer: number,
  inner: number,
  reveal = 1,
): ArcGeom[] {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const maxAngle = Math.PI * 2 * reveal;
  let angle = 0;
  return data.map((slice) => {
    const fullSweep = (slice.value / total) * Math.PI * 2;
    const start = angle;
    const naturalEnd = angle + fullSweep;
    const end = Math.min(naturalEnd, maxAngle);
    angle = naturalEnd;
    const color = slice.color ?? CATEGORY_COLORS[slice.name] ?? 'var(--cat-other)';
    return {
      slice,
      color,
      path: end > start ? arcPath(cx, cy, outer, inner, start, end) : '',
      startAngle: start,
      endAngle: naturalEnd,
    };
  });
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function DonutPlot({
  data,
  size,
  thickness,
  centerLabel,
  centerValue,
  showLegend,
  legendAside,
  onSliceClick,
}: {
  data: DonutSlice[];
  size: number;
  thickness: number;
  centerLabel: string;
  centerValue: number;
  showLegend: boolean;
  legendAside: boolean;
  onSliceClick?: (slice: DonutSlice, rect: DOMRect) => void;
}) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; slice: DonutSlice } | null>(null);
  const [reveal, setReveal] = useState(reduced ? 1 : 0);
  const total = data.reduce((s, d) => s + d.value, 0);
  const counted = useCountUp(centerValue);
  const pad = 4;
  const outer = size / 2 - pad;
  const inner = outer - thickness;
  const cx = size / 2;
  const cy = size / 2;

  const dataKey = data.map((d) => `${d.id}:${d.value}`).join('|');

  useEffect(() => {
    if (reduced) {
      setReveal(1);
      return;
    }
    setReveal(0);
    const start = performance.now();
    const unsub = subscribe((now) => {
      const t = Math.min(1, (now - start) / MOTION.chart);
      setReveal(easeOutCubic(t));
      if (t >= 1) unsub();
    });
    return unsub;
  }, [dataKey, reduced]);

  const arcs = useMemo(
    () => buildArcs(data, cx, cy, outer, inner, reveal),
    [data, cx, cy, outer, inner, reveal],
  );

  return (
    <div className={cn('flex h-full gap-4', legendAside ? 'flex-row items-center' : 'flex-col')}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <g>
            {arcs.map((arc) => {
              if (!arc.path) return null;
              const active = hovered === null || hovered === arc.slice.id;
              const expand = hovered === arc.slice.id ? 2 : 0;
              const visibleEnd = Math.min(arc.endAngle, Math.PI * 2 * reveal);
              const d =
                expand > 0
                  ? arcPath(cx, cy, outer + expand, inner, arc.startAngle, visibleEnd)
                  : arc.path;
              return (
                <path
                  key={arc.slice.id}
                  d={d}
                  fill={arc.color}
                  opacity={active ? 1 : 0.5}
                  style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
                  onPointerEnter={(e) => {
                    setHovered(arc.slice.id);
                    const rect = (e.currentTarget as SVGPathElement).ownerSVGElement?.getBoundingClientRect();
                    if (rect) {
                      setTip({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        slice: arc.slice,
                      });
                    }
                  }}
                  onPointerMove={(e) => {
                    const rect = (e.currentTarget as SVGPathElement).ownerSVGElement?.getBoundingClientRect();
                    if (rect) {
                      setTip({
                        x: e.clientX - rect.left,
                        y: e.clientY - rect.top,
                        slice: arc.slice,
                      });
                    }
                  }}
                  onPointerLeave={() => {
                    setHovered(null);
                    setTip(null);
                  }}
                  onClick={(e) => {
                    if (!onSliceClick) return;
                    onSliceClick(arc.slice, (e.currentTarget as SVGPathElement).getBoundingClientRect());
                  }}
                />
              );
            })}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold tabular leading-none text-content-primary">
            {formatCount(counted)}
          </span>
          <span className="mt-1 text-xs text-content-tertiary">{centerLabel}</span>
        </div>

        {tip ? (
          <div
            className="pointer-events-none absolute left-0 top-0"
            style={{ transform: `translate(${tip.x + 12}px, ${tip.y + 12}px)` }}
          >
            <ChartTooltip
              title={tip.slice.name}
              rows={[
                {
                  label: 'Count',
                  value: formatCount(tip.slice.value),
                  color: tip.slice.color ?? CATEGORY_COLORS[tip.slice.name],
                },
                { label: 'Share', value: formatPercent(shareOf(tip.slice.value, total)) },
              ]}
            />
          </div>
        ) : null}
      </div>

      {showLegend ? (
        <motion.ul
          className={cn('flex min-w-0 flex-1 flex-col gap-1.5', !legendAside && 'mt-2')}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: MOTION.fast / 1000, ease: EASE.enter, delay: MOTION.chart / 1000 }}
        >
          {data.map((slice) => {
            const color = slice.color ?? CATEGORY_COLORS[slice.name] ?? 'var(--cat-other)';
            const dimmed = hovered !== null && hovered !== slice.id;
            return (
              <li key={slice.id}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left',
                    'transition-colors duration-fast ease-standard hover:bg-raised',
                    'outline-none',
                    dimmed && 'opacity-50',
                  )}
                  onPointerEnter={() => setHovered(slice.id)}
                  onPointerLeave={() => setHovered(null)}
                  onClick={(e) => {
                    if (!onSliceClick) return;
                    onSliceClick(slice, e.currentTarget.getBoundingClientRect());
                  }}
                >
                  <span className="h-2 w-2 shrink-0 rounded-sm" style={{ backgroundColor: color }} aria-hidden />
                  <span className="min-w-0 flex-1 truncate text-sm text-content-primary">{slice.name}</span>
                  <span className="shrink-0 text-xs tabular text-content-secondary">
                    {formatCount(slice.value)} ({formatPercent(shareOf(slice.value, total))})
                  </span>
                </button>
              </li>
            );
          })}
        </motion.ul>
      ) : null}
    </div>
  );
}

export function DonutChart({
  title,
  ariaSummary,
  data,
  size = 132,
  thickness = 26,
  centerLabel = 'Total',
  centerValue,
  showLegend = true,
  onSliceClick,
  actionLabel,
  onActionClick,
  footnote,
  className,
  legendAside = true,
  headerAction,
  titleClassName,
  plotClassName,
  framed = true,
}: DonutChartProps) {
  const total = centerValue ?? data.reduce((s, d) => s + d.value, 0);

  const plot = () => (
        <DonutPlot
          data={data}
          size={size}
          thickness={thickness}
          centerLabel={centerLabel}
          centerValue={total}
          showLegend={showLegend}
          legendAside={legendAside}
          onSliceClick={onSliceClick}
        />
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
      plotClassName={plotClassName}
      footnote={footnote}
      className={className}
      empty={data.length === 0}
      a11yRows={data.map((d) => ({ label: d.name, value: d.value }))}
    >
      {plot}
    </ChartFrame>
  );
}
