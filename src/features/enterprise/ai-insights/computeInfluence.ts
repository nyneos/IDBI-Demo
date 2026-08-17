import type { RawRecord } from '@/data/pipeline/types';

export const MIN_INFLUENCE_SAMPLE = 30;

export interface InfluenceResult {
  field: string;
  influence: number;
  strength: 'Strong' | 'Moderate' | 'Weak';
  topCategory: string;
  topCategoryRate: number;
  baselineRate: number;
  summary: string;
}

function contingencyTable(
  records: RawRecord[],
  fieldKey: string,
  targetKey: string,
): Map<string, Map<string, number>> {
  const table = new Map<string, Map<string, number>>();
  for (const row of records) {
    const a = String(row[fieldKey] ?? 'Unclassified');
    const b = String(row[targetKey] ?? 'Unclassified');
    if (!table.has(a)) table.set(a, new Map());
    const inner = table.get(a)!;
    inner.set(b, (inner.get(b) ?? 0) + 1);
  }
  return table;
}

function chiSquare(table: Map<string, Map<string, number>>): number {
  const rowTotals = new Map<string, number>();
  const colTotals = new Map<string, number>();
  let n = 0;
  for (const [row, cols] of table) {
    for (const [col, count] of cols) {
      rowTotals.set(row, (rowTotals.get(row) ?? 0) + count);
      colTotals.set(col, (colTotals.get(col) ?? 0) + count);
      n += count;
    }
  }
  if (n === 0) return 0;
  let chi2 = 0;
  for (const [row, cols] of table) {
    for (const [col, observed] of cols) {
      const expected = ((rowTotals.get(row) ?? 0) * (colTotals.get(col) ?? 0)) / n;
      if (expected > 0) chi2 += ((observed - expected) ** 2) / expected;
    }
  }
  return chi2;
}

function cramersV(table: Map<string, Map<string, number>>): number {
  const rows = table.size;
  const cols = new Set<string>();
  for (const inner of table.values()) {
    for (const c of inner.keys()) cols.add(c);
  }
  const k = Math.min(rows - 1, cols.size - 1);
  if (k <= 0) return 0;
  let n = 0;
  for (const inner of table.values()) {
    for (const count of inner.values()) n += count;
  }
  if (n === 0) return 0;
  return Math.sqrt(chiSquare(table) / (n * k));
}

function strongestCategory(
  records: RawRecord[],
  fieldKey: string,
  targetKey: string,
  targetValue: string,
): { value: string; rate: number } {
  const groups = new Map<string, { match: number; total: number }>();
  for (const row of records) {
    const cat = String(row[fieldKey] ?? 'Unclassified');
    if (!groups.has(cat)) groups.set(cat, { match: 0, total: 0 });
    const g = groups.get(cat)!;
    g.total += 1;
    if (String(row[targetKey] ?? '') === targetValue) g.match += 1;
  }
  let best = { value: '', rate: 0 };
  for (const [cat, { match, total }] of groups) {
    if (total === 0) continue;
    const rate = (match / total) * 100;
    if (rate > best.rate) best = { value: cat, rate };
  }
  return best;
}

function strengthLabel(v: number): InfluenceResult['strength'] {
  if (v >= 0.25) return 'Strong';
  if (v >= 0.12) return 'Moderate';
  return 'Weak';
}

function fieldLabel(key: string): string {
  return key.replace(/_/g, ' ');
}

export function candidateInfluenceFields(
  records: RawRecord[],
  targetField: string,
  profileKeys?: string[],
): string[] {
  const keys = new Set<string>();
  if (profileKeys?.length) {
    for (const k of profileKeys) if (k !== targetField) keys.add(k);
  }
  for (const row of records.slice(0, 200)) {
    for (const k of Object.keys(row)) {
      if (k !== targetField) keys.add(k);
    }
  }
  return [...keys].filter((k) => {
    const vals = new Set(records.map((r) => String(r[k] ?? '')));
    return vals.size >= 2 && vals.size <= 40;
  });
}

export function targetValuesForField(records: RawRecord[], targetField: string): string[] {
  const seen = new Set<string>();
  for (const row of records) {
    const v = row[targetField];
    if (v != null && v !== '') seen.add(String(v));
  }
  return [...seen].sort();
}

export function computeInfluence(
  records: RawRecord[],
  targetField: string,
  targetValue: string,
  candidateFields: string[],
): InfluenceResult[] {
  if (records.length < MIN_INFLUENCE_SAMPLE) return [];

  const baseline =
    records.filter((r) => String(r[targetField] ?? '') === targetValue).length / records.length;

  return candidateFields
    .map((field) => {
      const table = contingencyTable(records, field, targetField);
      const influence = cramersV(table);
      const top = strongestCategory(records, field, targetField, targetValue);
      const baselinePct = baseline * 100;
      const strength = strengthLabel(influence);
      const summary =
        top.value && top.rate > 0
          ? `"${top.value}" ${fieldLabel(targetField).toLowerCase()} = ${targetValue} at ${top.rate.toFixed(1)}% vs ${baselinePct.toFixed(1)}% average`
          : `No dominant category for ${fieldLabel(field)}`;

      return {
        field,
        influence,
        strength,
        topCategory: top.value,
        topCategoryRate: top.rate,
        baselineRate: baselinePct,
        summary,
      };
    })
    .sort((a, b) => b.influence - a.influence)
    .slice(0, 5);
}

export function influenceDots(influence: number): number {
  return Math.max(1, Math.min(5, Math.round(influence * 20)));
}
