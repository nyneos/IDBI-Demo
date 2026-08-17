import { applyCalculatedField } from '@/data/calculatedFields';
import { factsOf } from '@/components/dashboard-builder/blockData';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import type { GovernedDimension, GovernedMeasure, MeasureAggregation } from './types';

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return NaN;
}

function reduce(values: number[], aggregation: MeasureAggregation): number {
  const nums = values.filter((n) => Number.isFinite(n));
  if (aggregation === 'COUNT') return values.length;
  if (nums.length === 0) return 0;
  if (aggregation === 'SUM') return nums.reduce((a, b) => a + b, 0);
  if (aggregation === 'AVG') return nums.reduce((a, b) => a + b, 0) / nums.length;
  if (aggregation === 'MIN') return Math.min(...nums);
  return Math.max(...nums);
}

const CALC_COL = '__enterprise_measure';

function withMeasureColumn(source: DashboardDataSource, measure: GovernedMeasure) {
  const facts = factsOf(source).map((r) => ({ ...r }));
  if (measure.formula?.trim()) {
    return applyCalculatedField(facts, CALC_COL, measure.formula);
  }
  return facts;
}

function valueOf(row: Record<string, string | number | null>, measure: GovernedMeasure): number {
  if (measure.formula?.trim()) return num(row[CALC_COL]);
  return num(row[measure.sourceField]);
}

export function seriesForGovernedMeasure(
  source: DashboardDataSource,
  measure: GovernedMeasure,
  dimension: GovernedDimension | null,
): { label: string; value: number }[] {
  let rows: Record<string, string | number | null>[];
  try {
    rows = withMeasureColumn(source, measure);
  } catch {
    return [];
  }

  if (!dimension) {
    const values = rows.map((r) => valueOf(r, measure));
    return [{ label: measure.name, value: reduce(values, measure.aggregation) }];
  }

  const groups = new Map<string, number[]>();
  for (const row of rows) {
    const raw = row[dimension.sourceField];
    const key = raw == null || raw === '' ? 'Unclassified' : String(raw);
    const label = dimension.valueLabels?.[key] ?? key;
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(valueOf(row, measure));
  }

  return [...groups.entries()]
    .map(([label, values]) => ({ label, value: reduce(values, measure.aggregation) }))
    .sort((a, b) => b.value - a.value);
}

export function measureExpression(measure: GovernedMeasure): string {
  if (measure.formula?.trim()) return measure.formula.trim();
  return `${measure.aggregation}(${measure.sourceField || '*'})`;
}
