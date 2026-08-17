import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from 'recharts';
import { ChartFrame } from './ChartFrame';
import { colorForLabel } from '@/components/dashboard-builder/dimensionRegistry';

export interface RadialBarPlotProps {
  title: string;
  ariaSummary: string;
  data: { label: string; value: number }[];
  framed?: boolean;
}

export function RadialBarPlot({ title, ariaSummary, data, framed = true }: RadialBarPlotProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const rows = data.map((d) => ({
    name: d.label,
    value: d.value,
    fill: colorForLabel(d.label),
    pct: (d.value / max) * 100,
  }));

  const plot = (
    <div className="h-full min-h-[240px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <RadialBarChart
        data={rows}
        innerRadius="20%"
        outerRadius="95%"
        startAngle={90}
        endAngle={-270}
      >
        <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
        <RadialBar dataKey="pct" background={{ fill: 'var(--bg-sunken)' }} cornerRadius={4} />
      </RadialBarChart>
    </ResponsiveContainer>
    </div>
  );

  if (!framed) return plot;
  return (
    <ChartFrame title={title} ariaSummary={ariaSummary}>
      {plot}
    </ChartFrame>
  );
}
