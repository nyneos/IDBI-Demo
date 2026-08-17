import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatCount, formatDays } from '@/lib/format';
import { EASE, MOTION } from '@/motion/tokens';
import { useReducedMotion } from '@/motion/useReducedMotion';
import { ChartFrame } from './ChartFrame';
import { ChartTooltip } from './ChartTooltip';

export interface DualAxisPoint {
  date: string;
  [key: string]: string | number;
}

export interface DualAxisSeries {
  key: string;
  name: string;
  color: string;
  axis: 'left' | 'right';
  unit?: 'count' | 'days';
}

export interface DualAxisLineChartProps {
  title: string;
  ariaSummary: string;
  data: DualAxisPoint[];
  series: DualAxisSeries[];
  xKey?: string;
  className?: string;
  height?: number;
  leftDomain?: [number, number];
  rightDomain?: [number, number];
  xTicks?: string[];
}

function pathFrom(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');
}

function formatSeriesValue(value: number, unit: DualAxisSeries['unit']): string {
  if (unit === 'days') return formatDays(value);
  return formatCount(value);
}

export function DualAxisLineChart({
  title,
  ariaSummary,
  data,
  series,
  xKey = 'date',
  className,
  height = 220,
  leftDomain = [0, 100],
  rightDomain = [0, 20],
  xTicks,
}: DualAxisLineChartProps) {
  const reduced = useReducedMotion();
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [cursor, setCursor] = useState<number | null>(null);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const uid = useId().replace(/:/g, '');

  const visible = series.filter((s) => !hidden[s.key]);
  const width = 560;
  const pad = { top: 16, right: 44, bottom: 32, left: 40 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const { xs, seriesPoints } = useMemo(() => {
    const xsLocal = data.map((_, i) =>
      data.length <= 1 ? pad.left + plotW / 2 : pad.left + (i / (data.length - 1)) * plotW,
    );
    const pts: Record<string, Array<{ x: number; y: number; value: number }>> = {};
    for (const s of visible) {
      const [lo, hi] = s.axis === 'left' ? leftDomain : rightDomain;
      const span = hi - lo || 1;
      pts[s.key] = data.map((row, i) => {
        const value = typeof row[s.key] === 'number' ? (row[s.key] as number) : 0;
        const y = pad.top + plotH - ((value - lo) / span) * plotH;
        return { x: xsLocal[i]!, y, value };
      });
    }
    return { xs: xsLocal, seriesPoints: pts };
  }, [data, visible, leftDomain, rightDomain, pad.left, pad.top, plotW, plotH]);

  useEffect(() => {
    if (reduced) return;
    visible.forEach((s, si) => {
      const el = pathRefs.current[s.key];
      if (!el) return;
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      el.getBoundingClientRect();
      const delay = si * 100;
      el.style.transition = `stroke-dashoffset ${MOTION.chart}ms cubic-bezier(0,0,0.2,1) ${delay}ms`;
      el.style.strokeDashoffset = '0';
    });
  }, [visible, data, reduced, seriesPoints]);

  const tickLabels =
    xTicks ??
    [data[0]?.[xKey], data[Math.floor(data.length / 2)]?.[xKey], data[data.length - 1]?.[xKey]];

  const leftTicks = [0, 0.25, 0.5, 0.75, 1].map(
    (t) => leftDomain[0] + (leftDomain[1] - leftDomain[0]) * t,
  );
  const rightTicks = [0, 0.25, 0.5, 0.75, 1].map(
    (t) => rightDomain[0] + (rightDomain[1] - rightDomain[0]) * t,
  );

  return (
    <ChartFrame
      title={title}
      ariaSummary={ariaSummary}
      className={className}
      empty={data.length === 0 || visible.length === 0}
      a11yRows={series.map((s) => ({
        label: s.name,
        value: data.map((d) => d[s.key]).filter((v) => typeof v === 'number').join(', '),
      }))}
    >
      {() => (
        <div className="flex h-full flex-col">
          <ul className="mb-2 flex flex-wrap gap-2" id={`legend-${uid}`}>
            {series.map((s) => {
              const isHidden = Boolean(hidden[s.key]);
              return (
                <li key={s.key}>
                  <button
                    type="button"
                    aria-pressed={!isHidden}
                    onClick={() =>
                      setHidden((prev) => ({ ...prev, [s.key]: !prev[s.key] }))
                    }
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs',
                      'transition-colors duration-fast ease-standard hover:bg-raised',
                      'outline-none',
                      isHidden && 'opacity-40',
                    )}
                    style={{
                      transitionDuration: `${MOTION.slow}ms`,
                      transitionTimingFunction: `cubic-bezier(${EASE.standard.join(',')})`,
                    }}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                      aria-hidden
                    />
                    {s.name}
                  </button>
                </li>
              );
            })}
          </ul>

          <svg
            width="100%"
            viewBox={`0 0 ${width} ${height}`}
            className="overflow-visible"
            onPointerLeave={() => setCursor(null)}
            onPointerMove={(e) => {
              const svg = e.currentTarget;
              const rect = svg.getBoundingClientRect();
              const x = ((e.clientX - rect.left) / rect.width) * width;
              if (xs.length === 0) return;
              let best = 0;
              let bestDist = Infinity;
              xs.forEach((px, i) => {
                const d = Math.abs(px - x);
                if (d < bestDist) {
                  bestDist = d;
                  best = i;
                }
              });
              setCursor(best);
            }}
          >
            <g>
              {leftTicks.map((v) => {
                const y =
                  pad.top +
                  plotH -
                  ((v - leftDomain[0]) / (leftDomain[1] - leftDomain[0] || 1)) * plotH;
                return (
                  <g key={`l-${v}`}>
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
                      fill="var(--text-tertiary)"
                      fontSize={7}
                    >
                      {formatCount(Math.round(v))}
                    </text>
                  </g>
                );
              })}
              {rightTicks.map((v) => {
                const y =
                  pad.top +
                  plotH -
                  ((v - rightDomain[0]) / (rightDomain[1] - rightDomain[0] || 1)) * plotH;
                return (
                  <text
                    key={`r-${v}`}
                    x={pad.left + plotW + 6}
                    y={y}
                    textAnchor="start"
                    dominantBaseline="middle"
                    fill="var(--text-tertiary)"
                    fontSize={7}
                  >
                    {v.toFixed(0)}
                  </text>
                );
              })}
              {tickLabels.map((label, i) => {
                if (label === undefined) return null;
                const matchIdx = data.findIndex((d) => String(d[xKey]) === String(label));
                const idx =
                  matchIdx >= 0
                    ? matchIdx
                    : xTicks && xTicks.length > 0
                      ? Math.min(
                          data.length - 1,
                          Math.round((i / Math.max(1, tickLabels.length - 1)) * (data.length - 1)),
                        )
                      : i === 0
                        ? 0
                        : i === 1
                          ? Math.floor(data.length / 2)
                          : data.length - 1;
                const x = xs[idx] ?? pad.left;
                return (
                  <text
                    key={`${String(label)}-${i}`}
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    fill="var(--text-tertiary)"
                    fontSize={7}
                  >
                    {String(label)}
                  </text>
                );
              })}
            </g>

            <g>
              {visible.map((s) => {
                const pts = seriesPoints[s.key] ?? [];
                const d = pathFrom(pts);
                return (
                  <g key={s.key}>
                    <path
                      ref={(el) => {
                        pathRefs.current[s.key] = el;
                      }}
                      d={d}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {pts.map((p, i) => (
                      <circle
                        key={`${s.key}-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={cursor === i ? 3.5 : 2}
                        fill={s.color}
                        opacity={reduced || cursor !== null ? 1 : 0}
                      />
                    ))}
                  </g>
                );
              })}
            </g>

            {cursor !== null && xs[cursor] !== undefined ? (
              <line
                x1={xs[cursor]}
                x2={xs[cursor]}
                y1={pad.top}
                y2={pad.top + plotH}
                stroke="var(--border-strong)"
                strokeWidth={1}
                strokeDasharray="4 4"
                pointerEvents="none"
              />
            ) : null}
          </svg>

          {cursor !== null && data[cursor] ? (
            <div className="pointer-events-none absolute left-1/2 top-16 z-10 -translate-x-1/2">
              <ChartTooltip
                title={String(data[cursor]![xKey])}
                rows={visible.map((s) => ({
                  label: s.name,
                  value: formatSeriesValue(Number(data[cursor]![s.key] ?? 0), s.unit),
                  color: s.color,
                }))}
              />
            </div>
          ) : null}
        </div>
      )}
    </ChartFrame>
  );
}
