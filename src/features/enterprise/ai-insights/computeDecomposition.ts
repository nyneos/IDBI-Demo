import { factsOf } from '@/components/dashboard-builder/blockData';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import type { GovernedMeasure } from '../semantic-layer/types';
import { seriesForGovernedMeasure } from '../semantic-layer/evaluateMeasure';

export interface DecompositionNode {
  id: string;
  label: string;
  value: number;
  depth: number;
  children?: DecompositionNode[];
  expanded?: boolean;
}

export interface DimensionSuggestion {
  field: string;
  label: string;
  varianceExplained: number;
}

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return 0;
}

function rowIndices(source: DashboardDataSource): number[] {
  return factsOf(source).map((_, i) => i);
}

function filterIndices(source: DashboardDataSource, indices: number[], filters: Record<string, string>): number[] {
  const rows = factsOf(source);
  return indices.filter((i) => {
    const row = rows[i];
    if (!row) return false;
    return Object.entries(filters).every(([k, v]) => String(row[k] ?? '') === v);
  });
}

export function totalMeasureValue(
  source: DashboardDataSource,
  measure: GovernedMeasure,
  indices?: number[],
): number {
  const series = seriesForGovernedMeasure(source, measure, null);
  if (!indices) return series[0]?.value ?? 0;
  const rows = factsOf(source);
  const vals = indices.map((i) => {
    const row = rows[i];
    if (!row) return 0;
    if (measure.formula?.trim()) return num(row.Amount);
    return num(row[measure.sourceField]);
  });
  if (measure.aggregation === 'COUNT') return indices.length;
  if (measure.aggregation === 'AVG') return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  if (measure.aggregation === 'SUM') return vals.reduce((a, b) => a + b, 0);
  if (measure.aggregation === 'MIN') return vals.length ? Math.min(...vals) : 0;
  return vals.length ? Math.max(...vals) : 0;
}

export function suggestNextDimension(
  source: DashboardDataSource,
  measure: GovernedMeasure,
  usedDimensions: string[],
  candidateDimensions: string[],
  activeIndices: number[],
): DimensionSuggestion | null {
  const rows = factsOf(source);
  const idx = activeIndices.length ? activeIndices : rows.map((_, i) => i);
  const rowValues = idx.map((i) => {
    const row = rows[i];
    if (!row) return 0;
    if (measure.formula?.trim()) return num(row.Amount);
    return num(row[measure.sourceField]);
  });
  const mean = rowValues.length ? rowValues.reduce((a, b) => a + b, 0) / rowValues.length : 0;
  const totalVar =
    rowValues.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(rowValues.length, 1);

  let best: DimensionSuggestion | null = null;
  for (const field of candidateDimensions) {
    if (usedDimensions.includes(field)) continue;
    const groups = new Map<string, number[]>();
    for (let j = 0; j < idx.length; j++) {
      const row = rows[idx[j]!];
      if (!row) continue;
      const key = String(row[field] ?? 'Unclassified');
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(rowValues[j] ?? 0);
    }
    if (groups.size < 2) continue;
    let between = 0;
    for (const vals of groups.values()) {
      const gMean = vals.reduce((a, b) => a + b, 0) / vals.length;
      between += vals.length * (gMean - mean) ** 2;
    }
    between /= Math.max(idx.length, 1);
    const ratio = totalVar > 0 ? between / totalVar : 0;
    const label = field.replace(/_/g, ' ');
    if (!best || ratio > best.varianceExplained) {
      best = { field, label, varianceExplained: ratio };
    }
  }
  return best;
}

export function splitByDimension(
  source: DashboardDataSource,
  measure: GovernedMeasure,
  field: string,
  activeIndices: number[],
  depth: number,
  pathPrefix: string,
): DecompositionNode[] {
  const rows = factsOf(source);
  const groups = new Map<string, number[]>();
  for (const i of activeIndices) {
    const row = rows[i];
    if (!row) continue;
    const key = String(row[field] ?? 'Unclassified');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(i);
  }

  return [...groups.entries()]
    .map(([label, indices]) => ({
      id: `${pathPrefix}/${field}/${label}`,
      label,
      value: totalMeasureValue(source, measure, indices),
      depth,
      children: undefined,
      expanded: false,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12);
}

export function candidateDimensions(source: DashboardDataSource, exclude: string[] = []): string[] {
  const keys = new Set<string>();
  for (const d of source.dimensions) if (!exclude.includes(d.key)) keys.add(d.key);
  for (const d of source.profile ?? []) {
    if (d.role === 'dimension' && !exclude.includes(d.key)) keys.add(d.key);
  }
  return [...keys];
}

export function rootIndices(source: DashboardDataSource): number[] {
  return rowIndices(source);
}

export function indicesForPath(
  source: DashboardDataSource,
  path: Array<{ field: string; value: string }>,
): number[] {
  let indices = rootIndices(source);
  for (const seg of path) {
    indices = filterIndices(source, indices, { [seg.field]: seg.value });
  }
  return indices;
}
