import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart as RScatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartFrame, type ChartFrameRenderProps } from './ChartFrame';

export interface ScatterPoint {
  x: number;
  y: number;
  name?: string;
}

export interface ScatterPlotProps {
  title: string;
  ariaSummary: string;
  data: ScatterPoint[];
  xLabel?: string;
  yLabel?: string;
  framed?: boolean;
  slot?: ChartFrameRenderProps;
  compact?: boolean;
}

export function ScatterPlot({
  title,
  ariaSummary,
  data,
  xLabel = 'X',
  yLabel = 'Y',
  framed = true,
  compact = false,
}: ScatterPlotProps) {
  const plot = (
    <div className="h-full min-h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
      <RScatter margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="var(--border-hairline)" />
        <XAxis
          dataKey="x"
          type="number"
          name={xLabel}
          tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
          stroke="var(--border-strong)"
        />
        <YAxis
          dataKey="y"
          type="number"
          name={yLabel}
          tick={{ fill: 'var(--text-tertiary)', fontSize: 10 }}
          stroke="var(--border-strong)"
        />
        <Tooltip
          cursor={{ stroke: 'var(--border-strong)' }}
          contentStyle={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-hairline)',
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Scatter data={data} fill="var(--cat-1)" />
      </RScatter>
    </ResponsiveContainer>
    </div>
  );

  if (!framed) return plot;
  return (
    <ChartFrame
      title={title}
      ariaSummary={ariaSummary}
      plotClassName={compact ? 'h-44 min-h-44 flex-none' : undefined}
    >
      {plot}
    </ChartFrame>
  );
}
