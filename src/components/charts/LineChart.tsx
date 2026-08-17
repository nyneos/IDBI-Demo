import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';
import { CATEGORY_COLORS } from '@/data/colors';
import { EASE, MOTION } from '@/motion/tokens';
import { useReducedMotion } from '@/motion/useReducedMotion';
import { ChartFrame, type ChartFrameRenderProps } from './ChartFrame';
import { ChartTooltip } from './ChartTooltip';

export interface LinePoint {
  x: string | number;
  [seriesKey: string]: string | number;
}

export interface LineSeries {
  key: string;
  name: string;
  color?: string;
}

export interface LineChartProps {
  title: string;
  ariaSummary: string;
  data: LinePoint[];
  series: LineSeries[];
  xKey?: string;
  actionLabel?: string;
  onActionClick?: () => void;
  className?: string;
  height?: number;
  yDomain?: [number, number];
  xTicks?: Array<string | number>;
  /** Draw translucent area under each visible series. */
  fill?: boolean;
  fillOpacity?: number;
  headerAction?: ReactNode;
  titleClassName?: string;
  plotClassName?: string;
  framed?: boolean;
  slot?: ChartFrameRenderProps;
  /** Enterprise anomaly overlay — index → anomaly metadata */
  anomalies?: Map<number, { isAnomaly: boolean }>;
  anomalyTooltip?: (index: number) => string;
}

function pathFrom(points: Array<{ x: number; y: number; gapAfter?: boolean }>): string {
  if (points.length === 0) return '';
  const parts: string[] = [];
  let start = true;
  for (const p of points) {
    parts.push(`${start ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`);
    start = Boolean(p.gapAfter);
  }
  return parts.join(' ');
}

function parseTime(value: string | number): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const t = Date.parse(String(value));
  return Number.isNaN(t) ? null : t;
}

export function LineChart({
  title,
  ariaSummary,
  data,
  series,
  xKey = 'date',
  actionLabel,
  onActionClick,
  className,
  height = 220,
  yDomain,
  xTicks,
  fill = false,
  fillOpacity = 0.18,
  headerAction,
  titleClassName,
  plotClassName,
  framed = true,
  anomalies,
  anomalyTooltip,
}: LineChartProps) {
  const reduced = useReducedMotion();
  const [hidden, setHidden] = useState<Record<string, boolean>>({});
  const [cursor, setCursor] = useState<number | null>(null);
  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const uid = useId().replace(/:/g, '');

  const visible = series.filter((s) => !hidden[s.key]);
  const width = 560;
  const pad = { top: 16, right: 16, bottom: 32, left: 40 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const { yMin, yMax, xs, seriesPoints } = useMemo(() => {
    const vals: number[] = [];
    for (const s of visible) {
      for (const row of data) {
        const v = row[s.key];
        if (typeof v === 'number') vals.push(v);
      }
    }
    const lo = yDomain?.[0] ?? (vals.length ? Math.min(...vals, 0) : 0);
    const hi = yDomain?.[1] ?? (vals.length ? Math.max(...vals) : 1);
    const span = hi - lo || 1;
    const times = data.map((row) => parseTime(row[xKey] ?? ''));
    const dateAxis = times.every((t) => t != null) && times.length >= 2;
    const tMin = dateAxis ? Math.min(...(times as number[])) : 0;
    const tMax = dateAxis ? Math.max(...(times as number[])) : 1;
    const tSpan = tMax - tMin || 1;
    const xsLocal = data.map((_, i) => {
      if (data.length <= 1) return pad.left + plotW / 2;
      if (dateAxis) return pad.left + ((times[i]! - tMin) / tSpan) * plotW;
      return pad.left + (i / (data.length - 1)) * plotW;
    });
    const pts: Record<string, Array<{ x: number; y: number; value: number; gapAfter?: boolean }>> =
      {};
    for (const s of visible) {
      pts[s.key] = data.map((row, i) => {
        const value = typeof row[s.key] === 'number' ? (row[s.key] as number) : 0;
        const y = pad.top + plotH - ((value - lo) / span) * plotH;
        const gapAfter =
          dateAxis && i < data.length - 1
            ? (times[i + 1]! - times[i]!) / 86_400_000 > 45
            : false;
        return { x: xsLocal[i]!, y, value, gapAfter };
      });
    }
    return { yMin: lo, yMax: hi, xs: xsLocal, seriesPoints: pts };
  }, [data, visible, yDomain, pad.left, pad.top, plotW, plotH, xKey]);

  useEffect(() => {
    if (reduced) return;
    for (const s of visible) {
      const el = pathRefs.current[s.key];
      if (!el) continue;
      const len = el.getTotalLength();
      el.style.strokeDasharray = `${len}`;
      el.style.strokeDashoffset = `${len}`;
      el.getBoundingClientRect();
      el.style.transition = `stroke-dashoffset ${MOTION.chart}ms cubic-bezier(0,0,0.2,1)`;
      el.style.strokeDashoffset = '0';
    }
  }, [visible, data, reduced, seriesPoints]);

  const tickLabels =
    xTicks ??
    (data.length <= 7
      ? data.map((d) => d[xKey])
      : [data[0]?.[xKey], data[Math.floor(data.length / 2)]?.[xKey], data[data.length - 1]?.[xKey]]);

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => yMin + (yMax - yMin) * t);

  const plot = () => (
        <div className="flex h-full flex-col">
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
            {/* Grid + axes (unfiltered) */}
            <g>
              {yTicks.map((v) => {
                const y = pad.top + plotH - ((v - yMin) / (yMax - yMin || 1)) * plotH;
                return (
                  <g key={v}>
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
              {tickLabels.map((label, i) => {
                if (label === undefined) return null;
                const matchIdx = data.findIndex((d) => String(d[xKey]) === String(label));
                const idx =
                  matchIdx >= 0
                    ? matchIdx
                    : data.length <= 7
                      ? i
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
              {visible.map((s, si) => {
                const color = s.color ?? CATEGORY_COLORS[s.name] ?? `var(--cat-${(si % 6) + 1})`;
                const pts = seriesPoints[s.key] ?? [];
                const d = pathFrom(pts);
                const hasGap = pts.some((p) => p.gapAfter);
                const area =
                  pts.length > 1 && !hasGap
                    ? `${d} L${pts[pts.length - 1]!.x.toFixed(2)} ${(pad.top + plotH).toFixed(2)} L${pts[0]!.x.toFixed(2)} ${(pad.top + plotH).toFixed(2)} Z`
                    : '';
                return (
                  <g key={s.key}>
                    {fill && area ? (
                      <path d={area} fill={color} fillOpacity={fillOpacity} stroke="none" />
                    ) : null}
                    <path
                      ref={(el) => {
                        pathRefs.current[s.key] = el;
                      }}
                      d={d}
                      fill="none"
                      stroke={color}
                      strokeWidth={1.5}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                    {pts.map((p, i) => {
                      const anom = anomalies?.get(i)?.isAnomaly;
                      const dotColor = anom ? 'var(--status-error)' : color;
                      return (
                      <circle
                        key={`${s.key}-${i}`}
                        cx={p.x}
                        cy={p.y}
                        r={anom || cursor === i ? 3.5 : 2}
                        fill={dotColor}
                        opacity={reduced || cursor !== null || anom ? 1 : 0}
                        style={{
                          transition: `opacity ${MOTION.fast}ms`,
                        }}
                      />
                    );})}
                  </g>
                );
              })}
            </g>

            {cursor !== null && xs[cursor] !== undefined ? (
              <g pointerEvents="none">
                <line
                  x1={xs[cursor]}
                  x2={xs[cursor]}
                  y1={pad.top}
                  y2={pad.top + plotH}
                  stroke="var(--border-strong)"
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              </g>
            ) : null}
          </svg>

          {cursor !== null && data[cursor] ? (
            <div className="pointer-events-none absolute left-1/2 top-12 z-10 -translate-x-1/2">
              <ChartTooltip
                title={String(data[cursor]![xKey])}
                rows={
                  anomalies?.get(cursor)?.isAnomaly && anomalyTooltip?.(cursor)
                    ? [{ label: 'Anomaly', value: anomalyTooltip(cursor) }]
                    : visible.map((s, si) => ({
                        label: s.name,
                        value: formatCount(Number(data[cursor]![s.key] ?? 0)),
                        color: s.color ?? CATEGORY_COLORS[s.name] ?? `var(--cat-${(si % 6) + 1})`,
                      }))
                }
              />
            </div>
          ) : null}

          <ul className="mt-2 flex flex-wrap gap-2" id={`legend-${uid}`}>
            {series.map((s, si) => {
              const color = s.color ?? CATEGORY_COLORS[s.name] ?? `var(--cat-${(si % 6) + 1})`;
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
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                    {s.name}
                  </button>
                </li>
              );
            })}
          </ul>
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
      plotClassName={plotClassName}
      className={className}
      empty={data.length === 0 || visible.length === 0}
      a11yRows={series.map((s) => ({
        label: s.name,
        value: data.map((d) => d[s.key]).filter((v) => typeof v === 'number').join(', '),
      }))}
    >
      {plot}
    </ChartFrame>
  );
}
