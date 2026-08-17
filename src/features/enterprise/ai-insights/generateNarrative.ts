import { formatCount, formatINR, formatShare } from '@/lib/format';
import { guardInsights, registerNumeral, type Insight } from './insightProvenance';

export interface NarrativeInput {
  label: string;
  value: number;
}

function defaultFormat(value: number, currency = false): string {
  return currency ? formatINR(value) : formatCount(value);
}

export function generateNarrative(
  data: NarrativeInput[],
  opts?: { currency?: boolean; valueLabel?: string },
): Insight[] {
  if (data.length === 0) return [];

  const formatValue = (v: number) => defaultFormat(v, opts?.currency);
  const allowed: string[] = [];
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const total = sorted.reduce((s, r) => s + r.value, 0);
  const top = sorted[0]!;
  const insights: Insight[] = [];

  registerNumeral(allowed, top.value, formatValue(top.value));
  registerNumeral(allowed, total, formatValue(total));
  const share = total > 0 ? (top.value / total) * 100 : 0;
  registerNumeral(allowed, share, formatShare(top.value, total));

  insights.push({
    kind: 'observed',
    text: `${top.label} is the largest contributor at ${formatValue(top.value)}, ${formatShare(top.value, total)} of the total.`,
  });

  if (sorted.length > 1) {
    const second = sorted[1]!;
    registerNumeral(allowed, second.value, formatValue(second.value));
    const gap = top.value - second.value;
    registerNumeral(allowed, gap, formatValue(gap));
    const gapPct = second.value > 0 ? (gap / second.value) * 100 : 0;
    registerNumeral(allowed, gapPct, `${gapPct.toFixed(0)}%`);
    insights.push({
      kind: 'derived',
      text: `That's ${gapPct.toFixed(0)}% higher than the next largest, ${second.label}.`,
    });
  }

  return guardInsights(insights, allowed);
}
