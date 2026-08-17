import { hasContainmentChain } from './pipeline/hierarchy';
import type { DimensionMeta, RawRecord } from './pipeline/types';
import type { ChartSuggestion } from '@/components/dashboard-builder/types';

export function buildSuggestions(
  profile: DimensionMeta[],
  records: RawRecord[],
): ChartSuggestion[] {
  const suggestions: ChartSuggestion[] = [];
  const dims = profile.filter((d) => d.role === 'dimension');
  const dates = profile.filter((d) => d.role === 'date');
  const rates = dims.filter((d) => /rate|score|%|compliance/i.test(d.label));
  const clean = [...dims].sort((a, b) => b.cardinality - a.cardinality);

  if (dates.length > 0) {
    suggestions.push({
      type: 'line',
      reason: `Trend over ${dates[0]!.label}`,
      field: dates[0]!.key,
    });
  }
  if (dims.length >= 2 && hasContainmentChain(records, dims)) {
    suggestions.push({
      type: 'sunburst',
      reason: 'Clean category hierarchy detected',
    });
  }
  if (dims.length >= 3) {
    suggestions.push({
      type: 'sankey',
      reason: `${dims.length} categorical fields — flow view available`,
      fields: dims.slice(0, 3).map((d) => d.key),
    });
  }
  if (rates.length > 0) {
    suggestions.push({
      type: 'gauge',
      reason: `${rates[0]!.label} looks like a rate metric`,
      field: rates[0]!.key,
    });
  }
  if (clean.length >= 1) {
    suggestions.push({
      type: 'bar',
      reason: `${clean[0]!.label} is your highest-cardinality clean field`,
      field: clean[0]!.key,
    });
  }

  return suggestions.slice(0, 4);
}
