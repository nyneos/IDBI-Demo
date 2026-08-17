export interface AnomalyPoint {
  date: string;
  value: number;
  isAnomaly: boolean;
  expectedRange: [number, number];
}

function computeQuartiles(values: number[]): { q1: number; q3: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = percentile(sorted, 0.25);
  const q3 = percentile(sorted, 0.75);
  return { q1, q3 };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo]!;
  return sorted[lo]! + (sorted[hi]! - sorted[lo]!) * (idx - lo);
}

export function detectAnomalies(
  series: { date: string; value: number }[],
  windowSize = 7,
): AnomalyPoint[] {
  return series.map((point, i) => {
    const window = series.slice(Math.max(0, i - windowSize), i);
    if (window.length < 4) {
      return { ...point, isAnomaly: false, expectedRange: [point.value, point.value] };
    }
    const { q1, q3 } = computeQuartiles(window.map((w) => w.value));
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;
    const isAnomaly = point.value < lower || point.value > upper;
    return { ...point, isAnomaly, expectedRange: [lower, upper] };
  });
}

export function anomalyTooltip(point: AnomalyPoint, formatValue: (v: number) => string): string {
  const [lo, hi] = point.expectedRange;
  return `Unusual: ${formatValue(point.value)} on ${point.date} — expected range ${formatValue(lo)}–${formatValue(hi)} based on the surrounding week`;
}
