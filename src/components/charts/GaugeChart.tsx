import { type ReactNode } from 'react';
import { Cell, Label, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/cn';
import { ChartFrame, type ChartFrameRenderProps } from './ChartFrame';

export type GaugeSegment = {
  /** Share of the arc, 0–100. Segments should sum to 100. */
  value: number;
  color: string;
};

export const DEFAULT_GAUGE_SEGMENTS: GaugeSegment[] = [
  { value: 25, color: 'var(--status-error)' },
  { value: 25, color: 'var(--status-warning)' },
  { value: 25, color: 'var(--status-success)' },
  { value: 25, color: '#7ee0c0' },
];

export interface GaugeChartProps {
  /** 0–100 */
  ratio?: number;
  value?: string | number;
  max?: string | number;
  height?: number;
  width?: number;
  color?: string;
  trackColor?: string;
  /** Colored zones drawn behind a needle instead of a single progress fill */
  segments?: GaugeSegment[];
  /** Draw a pointer needle at `ratio` instead of a simple progress arc */
  showNeedle?: boolean;
  title?: string;
  ariaSummary?: string;
  size?: number;
  label?: string;
  className?: string;
  framed?: boolean;
  slot?: ChartFrameRenderProps;
  headerAction?: ReactNode;
  titleClassName?: string;
  plotClassName?: string;
  displayValue?: string | number;
}

type PolarViewBox = {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
};

function GaugePlot({
  ratio = 0,
  value,
  max,
  height = 180,
  width = 220,
  color = 'var(--status-success)',
  trackColor = 'var(--bg-raised)',
  segments,
  showNeedle = false,
  label,
}: {
  ratio?: number;
  value?: string | number;
  max?: string | number;
  height?: number;
  width?: number;
  color?: string;
  trackColor?: string;
  segments?: GaugeSegment[];
  showNeedle?: boolean;
  label?: string;
}) {
  const fill = color;
  const clamped = Math.min(100, Math.max(0, ratio));
  const data = segments ?? [
    { value: clamped, color: fill },
    { value: 100 - clamped, color: trackColor },
  ];
  const display = value ?? `${Math.round(clamped)}%`;
  const needleAngle = 180 - (clamped / 100) * 180;

  const padTop = 4;
  const textHeight = showNeedle ? 40 : 30;
  const outerRadius = Math.max(
    28,
    Math.min(width / 2 - 4, height - padTop - textHeight),
  );
  const innerRadius = outerRadius * 0.67;
  const cx = width / 2;
  const cy = padTop + outerRadius;

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex justify-center" style={{ height, width }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="color"
              cx={cx}
              cy={cy}
              startAngle={180}
              endAngle={0}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
              <Label
                content={({ viewBox }) => {
                  const vb = viewBox as PolarViewBox;
                  if (vb.cx == null || vb.cy == null) return null;

                  const needle =
                    showNeedle && vb.outerRadius != null ? (
                      <g>
                        <line
                          x1={vb.cx}
                          y1={vb.cy}
                          x2={
                            vb.cx +
                            vb.outerRadius *
                              0.78 *
                              Math.cos((needleAngle * Math.PI) / 180)
                          }
                          y2={
                            vb.cy -
                            vb.outerRadius *
                              0.78 *
                              Math.sin((needleAngle * Math.PI) / 180)
                          }
                          stroke="var(--text-primary)"
                          strokeWidth={3}
                          strokeLinecap="round"
                        />
                        <circle cx={vb.cx} cy={vb.cy} r={5} fill="var(--text-primary)" />
                      </g>
                    ) : null;

                  return (
                    <g>
                      {needle}
                      <text
                        x={vb.cx}
                        y={vb.cy + (showNeedle ? 22 : 4)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={showNeedle ? 'var(--text-primary)' : fill}
                        style={{ fontWeight: 800, fontSize: showNeedle ? 22 : 20 }}
                      >
                        {display}
                        {max != null ? (
                          <tspan
                            fill="var(--text-tertiary)"
                            style={{ fontWeight: 600, fontSize: 13 }}
                          >
                            {' '}
                            /{max}
                          </tspan>
                        ) : null}
                      </text>
                    </g>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>
      {label ? (
        <p className="mt-1 text-center text-xs text-content-tertiary">{label}</p>
      ) : null}
    </div>
  );
}

export function GaugeChart({
  ratio,
  value,
  max,
  height,
  width,
  color,
  trackColor,
  segments = DEFAULT_GAUGE_SEGMENTS,
  showNeedle = true,
  title = 'Health',
  ariaSummary = 'Gauge chart',
  size = 180,
  label,
  className,
  framed = true,
  headerAction,
  titleClassName,
  plotClassName,
  displayValue,
}: GaugeChartProps) {
  const numeric = typeof value === 'number' ? value : 0;
  const clampedRatio = ratio ?? Math.min(100, Math.max(0, numeric));
  const display = displayValue ?? value ?? Math.round(clampedRatio);
  const plotW = width ?? size;
  const plotH = height ?? size;

  const plot = (
    <div className={cn('flex h-full items-center justify-center', !framed && className)}>
      <GaugePlot
        ratio={clampedRatio}
        value={display}
        max={max}
        height={plotH}
        width={plotW}
        color={color}
        trackColor={trackColor}
        segments={segments}
        showNeedle={showNeedle}
        label={label}
      />
    </div>
  );

  if (!framed) return plot;

  return (
    <ChartFrame
      title={title}
      ariaSummary={ariaSummary}
      className={className}
      headerAction={headerAction}
      titleClassName={titleClassName}
      plotClassName={plotClassName}
      a11yRows={[{ label: label ?? (typeof title === 'string' ? title : 'Gauge'), value: display }]}
    >
      {() => (
        <div className="flex h-full items-center justify-center">
          <GaugePlot
            ratio={clampedRatio}
            value={display}
            max={max}
            height={plotH}
            width={plotW}
            color={color}
            trackColor={trackColor}
            segments={segments}
            showNeedle={showNeedle}
            label={label}
          />
        </div>
      )}
    </ChartFrame>
  );
}
