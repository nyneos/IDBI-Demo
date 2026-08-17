import { useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';
import { CATEGORY_COLORS } from '@/data/colors';
import { EASE, MOTION, STAGGER, staggerDelay } from '@/motion/tokens';
import { useReducedMotion } from '@/motion/useReducedMotion';
import { ChartFrame, type ChartFrameRenderProps } from './ChartFrame';
import { ChartTooltip } from './ChartTooltip';

export interface BarSeries {
  key: string;
  name: string;
  color?: string;
}

export interface BarDatum {
  id: string;
  name: string;
  value: number;
  color?: string;
  [seriesKey: string]: string | number | undefined;
}

export interface BarChartProps {
  title: string;
  ariaSummary: string;
  data: BarDatum[];
  orientation?: 'horizontal' | 'vertical';
  actionLabel?: string;
  onActionClick?: () => void;
  onBarClick?: (bar: BarDatum, rect: DOMRect) => void;
  className?: string;
  maxBars?: number;
  headerAction?: ReactNode;
  titleClassName?: string;
  plotClassName?: string;
  framed?: boolean;
  slot?: ChartFrameRenderProps;
  /** Second (or N) numeric series — grouped by default, stacked when `stacked`. */
  series?: BarSeries[];
  stacked?: boolean;
}

export function BarChart({
  title,
  ariaSummary,
  data,
  orientation = 'horizontal',
  actionLabel,
  onActionClick,
  onBarClick,
  className,
  maxBars = 10,
  headerAction,
  titleClassName,
  plotClassName,
  framed = true,
  series,
  stacked = false,
}: BarChartProps) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState<string | null>(null);
  const rows = data.slice(0, maxBars);
  const max = Math.max(...rows.map((d) => d.value), 1);

  const wrap = (inner: () => ReactNode) => {
    if (!framed) return inner();
    return (
      <ChartFrame
        title={title}
        ariaSummary={ariaSummary}
        actionLabel={actionLabel}
        onActionClick={onActionClick}
        headerAction={headerAction}
        titleClassName={titleClassName}
        plotClassName={plotClassName}
        className={className}
        empty={rows.length === 0}
        a11yRows={rows.map((r) => ({ label: r.name, value: r.value }))}
      >
        {inner}
      </ChartFrame>
    );
  };

  const extraSeries = (series ?? []).filter((s) => s.key !== 'value');
  if (extraSeries.length > 0) {
    const keys = extraSeries;
    const palette = ['var(--cat-1)', 'var(--cat-4)', 'var(--cat-3)', 'var(--cat-6)'];
    const width = 360;
    const height = 180;
    const pad = { top: 12, right: 8, bottom: 36, left: 36 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const maxVal = Math.max(
      1,
      ...rows.flatMap((row) =>
        stacked
          ? [keys.reduce((sum, s) => sum + Number(row[s.key] ?? 0), 0)]
          : keys.map((s) => Number(row[s.key] ?? 0)),
      ),
    );
    const groupW = plotW / Math.max(rows.length, 1);
    const barW = stacked
      ? Math.max(8, groupW * 0.6)
      : Math.max(6, (groupW * 0.7) / keys.length);

    return wrap(() => (
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="h-full min-h-[180px] overflow-visible">
        <g>
          {[0, 0.5, 1].map((t) => {
            const y = pad.top + plotH * (1 - t);
            return (
              <g key={t}>
                <line
                  x1={pad.left}
                  x2={pad.left + plotW}
                  y1={y}
                  y2={y}
                  stroke="var(--border-hairline)"
                  strokeWidth={1}
                />
                <text
                  x={pad.left - 6}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-content-tertiary"
                  fontSize={7}
                >
                  {formatCount(Math.round(maxVal * t))}
                </text>
              </g>
            );
          })}
        </g>
        <g>
          {rows.map((row, i) => {
            const gx = pad.left + i * groupW + groupW / 2;
            if (stacked) {
              let acc = 0;
              return keys.map((s, si) => {
                const v = Number(row[s.key] ?? 0);
                const h = (v / maxVal) * plotH;
                const y = pad.top + plotH - acc - h;
                acc += h;
                return (
                  <rect
                    key={`${row.id}-${s.key}`}
                    x={gx - barW / 2}
                    y={y}
                    width={barW}
                    height={h}
                    rx={2}
                    fill={s.color ?? palette[si % palette.length]}
                  />
                );
              });
            }
            return keys.map((s, si) => {
              const v = Number(row[s.key] ?? 0);
              const h = (v / maxVal) * plotH;
              const x = gx - (keys.length * barW) / 2 + si * barW;
              return (
                <rect
                  key={`${row.id}-${s.key}`}
                  x={x}
                  y={pad.top + plotH - h}
                  width={barW}
                  height={h}
                  rx={2}
                  fill={s.color ?? palette[si % palette.length]}
                />
              );
            });
          })}
        </g>
        <g>
          {rows.map((row, i) => (
            <text
              key={row.id}
              x={pad.left + i * groupW + groupW / 2}
              y={height - 10}
              textAnchor="middle"
              className="fill-content-tertiary"
              fontSize={7}
            >
              {row.name.length > 8 ? `${row.name.slice(0, 7)}…` : row.name}
            </text>
          ))}
        </g>
      </svg>
    ));
  }

  if (orientation === 'horizontal') {
    return wrap(() => (
          <div className="flex flex-col gap-2 py-1">
            {rows.map((row, i) => {
              const color = row.color ?? CATEGORY_COLORS[row.name] ?? 'var(--cat-1)';
              const pct = (row.value / max) * 100;
              const delay = staggerDelay(i, STAGGER.row, STAGGER.rowCap) / 1000;
              return (
                <button
                  key={row.id}
                  type="button"
                  className={cn(
                    'group grid w-full grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] items-center gap-2 rounded-md px-1 py-0.5 text-left',
                    'transition-colors duration-fast ease-standard hover:bg-raised',
                    'outline-none',
                    hovered !== null && hovered !== row.id && 'opacity-50',
                  )}
                  onPointerEnter={() => setHovered(row.id)}
                  onPointerLeave={() => setHovered(null)}
                  onClick={(e) => onBarClick?.(row, e.currentTarget.getBoundingClientRect())}
                >
                  <span className="truncate text-xs text-content-secondary">{row.name}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-sunken">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: color }}
                      initial={reduced ? false : { width: '0%' }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: MOTION.chart / 1000,
                        ease: EASE.enter,
                        delay: reduced ? 0 : delay,
                      }}
                    />
                  </div>
                  <span className="text-xs tabular text-content-primary">{formatCount(row.value)}</span>
                </button>
              );
            })}
          </div>
    ));
  }

  const width = 320;
  const height = 180;
  const pad = { top: 12, right: 8, bottom: 36, left: 36 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;
  const gap = 8;
  const barW = Math.max(8, (plotW - gap * (rows.length - 1)) / Math.max(rows.length, 1));

  return wrap(() => (
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="h-full min-h-[180px] overflow-visible">
          {/* Axis labels unfiltered */}
          <g>
            {[0, 0.5, 1].map((t) => {
              const y = pad.top + plotH * (1 - t);
              return (
                <g key={t}>
                  <line
                    x1={pad.left}
                    x2={pad.left + plotW}
                    y1={y}
                    y2={y}
                    stroke="var(--border-hairline)"
                    strokeWidth={1}
                  />
                  <text
                    x={pad.left - 6}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-content-tertiary"
                  fontSize={7}
                  >
                    {formatCount(Math.round(max * t))}
                  </text>
                </g>
              );
            })}
          </g>

          <g>
            {rows.map((row, i) => {
              const color = row.color ?? CATEGORY_COLORS[row.name] ?? 'var(--cat-1)';
              const h = (row.value / max) * plotH;
              const x = pad.left + i * (barW + gap);
              const y = pad.top + plotH - h;
              const delay = staggerDelay(i, STAGGER.row, STAGGER.rowCap) / 1000;
              return (
                <motion.rect
                  key={row.id}
                  x={x}
                  width={barW}
                  fill={color}
                  rx={4}
                  initial={reduced ? false : { y: pad.top + plotH, height: 0 }}
                  animate={{ y, height: h }}
                  transition={{
                    duration: MOTION.chart / 1000,
                    ease: EASE.enter,
                    delay: reduced ? 0 : delay,
                  }}
                  style={{
                    cursor: onBarClick ? 'pointer' : 'default',
                    opacity: hovered !== null && hovered !== row.id ? 0.5 : 1,
                  }}
                  onPointerEnter={() => setHovered(row.id)}
                  onPointerLeave={() => setHovered(null)}
                  onClick={(e) =>
                    onBarClick?.(row, (e.currentTarget as SVGRectElement).getBoundingClientRect())
                  }
                />
              );
            })}
          </g>

          <g>
            {rows.map((row, i) => {
              const x = pad.left + i * (barW + gap) + barW / 2;
              return (
                <text
                  key={row.id}
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-content-tertiary"
                  fontSize={7}
                >
                  {row.name.length > 8 ? `${row.name.slice(0, 7)}…` : row.name}
                </text>
              );
            })}
          </g>

          {hovered ? (
            <foreignObject x={0} y={0} width={width} height={height} className="pointer-events-none overflow-visible">
              <div className="relative h-full w-full">
                {(() => {
                  const row = rows.find((r) => r.id === hovered);
                  if (!row) return null;
                  return (
                    <div className="absolute left-1/2 top-2 -translate-x-1/2">
                      <ChartTooltip
                        title={row.name}
                        rows={[{ label: 'Value', value: formatCount(row.value) }]}
                      />
                    </div>
                  );
                })()}
              </div>
            </foreignObject>
          ) : null}
        </svg>
  ));
}

/** Lightweight list used when ChartFrame wrapping is not needed. */
export function HorizontalBarMarks({
  data,
  className,
}: {
  data: BarDatum[];
  className?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const reduced = useReducedMotion();
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {data.map((row, i) => {
        const color = row.color ?? CATEGORY_COLORS[row.name] ?? 'var(--cat-1)';
        return (
          <div key={row.id} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
            <span className="truncate text-xs text-content-secondary">{row.name}</span>
            <div className="h-2 overflow-hidden rounded-full bg-sunken">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={reduced ? false : { width: '0%' }}
                animate={{ width: `${(row.value / max) * 100}%` }}
                transition={{
                  duration: MOTION.chart / 1000,
                  ease: EASE.enter,
                  delay: reduced ? 0 : staggerDelay(i, STAGGER.row, STAGGER.rowCap) / 1000,
                }}
              />
            </div>
            <span className="text-xs tabular">{formatCount(row.value)}</span>
          </div>
        );
      })}
    </div>
  );
}
