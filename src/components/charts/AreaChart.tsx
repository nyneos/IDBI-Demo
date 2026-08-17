import { LineChart, type LineChartProps } from './LineChart';

export type AreaChartProps = Omit<LineChartProps, 'fill'>;

/** LineChart with area fill enabled. */
export function AreaChart(props: AreaChartProps) {
  return <LineChart {...props} fill fillOpacity={props.fillOpacity ?? 0.18} />;
}
