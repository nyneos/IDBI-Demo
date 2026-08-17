import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardBlock, DashboardDataSource } from '@/components/dashboard-builder/types';
import { oneD } from '@/components/dashboard-builder/blockData';
import { colorForLabel } from '@/components/dashboard-builder/dimensionRegistry';

export function comboWarning(block: DashboardBlock, source: DashboardDataSource): string | null {
  const combo = block.combo;
  if (!combo) return null;
  const a = new Set(oneD(source, combo.xField).map((r) => r.label));
  if (a.size === 0) return 'These fields don\'t share common categories — the combo chart may show gaps';
  return null;
}

export function ComboChart({
  block,
  source,
  onMarkClick,
}: {
  block: DashboardBlock;
  source: DashboardDataSource;
  onMarkClick?: (field: string, value: string) => void;
}) {
  const combo = block.combo;
  if (!combo) return <p className="p-4 text-sm text-content-secondary">Configure both series to render a combo chart.</p>;

  const xRows = oneD(source, combo.xField);
  const s1 = oneD(source, combo.series1.field);
  const s2 = oneD(source, combo.series2.field);
  const s1Map = new Map(s1.map((r) => [r.label, r.value]));
  const s2Map = new Map(s2.map((r) => [r.label, r.value]));
  const labels = [...new Set([...xRows.map((r) => r.label), ...s1.map((r) => r.label), ...s2.map((r) => r.label)])];
  const data = labels.map((x) => ({
    x,
    series1: s1Map.get(x) ?? 0,
    series2: s2Map.get(x) ?? 0,
  }));

  const mark = (type: string, yAxisId: string, dataKey: 'series1' | 'series2', field: string) => {
    const color = colorForLabel(field, source);
    if (type === 'bar') {
      return (
        <Bar
          key={dataKey}
          yAxisId={yAxisId}
          dataKey={dataKey}
          fill={color}
          onClick={(d) => onMarkClick?.(combo.xField, String((d as { x?: string }).x ?? ''))}
        />
      );
    }
    if (type === 'area') {
      return <Area key={dataKey} yAxisId={yAxisId} dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.2} />;
    }
    return <Line key={dataKey} yAxisId={yAxisId} dataKey={dataKey} stroke={color} dot={false} />;
  };

  return (
    <div className="h-full min-h-[240px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 8, right: 12, left: 4, bottom: 16 }}>
        <CartesianGrid stroke="var(--border-default)" vertical={false} />
        <XAxis
          dataKey="x"
          tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
          label={{ value: block.axisLabels?.x ?? combo.xField, position: 'insideBottom', offset: -4 }}
        />
        <YAxis
          yAxisId="left"
          tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
          label={{ value: combo.series1.axisLabel ?? combo.series1.field, angle: -90, position: 'insideLeft' }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
          label={{ value: combo.series2.axisLabel ?? combo.series2.field, angle: 90, position: 'insideRight' }}
        />
        <Tooltip />
        <Legend />
        {mark(combo.series1.type, combo.series1.axis, 'series1', combo.series1.field)}
        {mark(combo.series2.type, combo.series2.axis, 'series2', combo.series2.field)}
      </ComposedChart>
    </ResponsiveContainer>
    </div>
  );
}
