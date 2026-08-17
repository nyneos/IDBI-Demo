import { cellString } from './normalise';
import type { LabelValue, RawRecord } from './types';

const MAX_CATEGORIES = 8;
const HEATMAP_CAP = 8;
const CHORD_CAP = 12;

export function collapseTail(rows: LabelValue[], cap = MAX_CATEGORIES): LabelValue[] {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  if (sorted.length <= cap) return sorted;
  const head = sorted.slice(0, cap - 1);
  const rest = sorted.slice(cap - 1).reduce((sum, row) => sum + row.value, 0);
  return [...head, { label: 'Others', value: rest }];
}

export function aggregateColumn(records: RawRecord[], key: string, cap = MAX_CATEGORIES): LabelValue[] {
  const counts = new Map<string, number>();
  for (const row of records) {
    const label = cellString(row[key]) ?? 'Unclassified';
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return collapseTail(
    [...counts.entries()].map(([label, value]) => ({ label, value })),
    cap,
  );
}

export function aggregateDateSeries(records: RawRecord[], key: string): LabelValue[] {
  const counts = new Map<string, number>();
  for (const row of records) {
    const label = cellString(row[key]);
    if (label == null) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export function crossTab(
  records: RawRecord[],
  rowKey: string,
  colKey: string,
  cap = HEATMAP_CAP,
): { rows: string[]; cols: string[]; cells: number[][] } {
  const rowCounts = new Map<string, number>();
  const colCounts = new Map<string, number>();
  for (const rec of records) {
    const r = cellString(rec[rowKey]) ?? 'Unclassified';
    const c = cellString(rec[colKey]) ?? 'Unclassified';
    rowCounts.set(r, (rowCounts.get(r) ?? 0) + 1);
    colCounts.set(c, (colCounts.get(c) ?? 0) + 1);
  }
  const rows = collapseTail(
    [...rowCounts.entries()].map(([label, value]) => ({ label, value })),
    cap,
  ).map((r) => r.label);
  const cols = collapseTail(
    [...colCounts.entries()].map(([label, value]) => ({ label, value })),
    cap,
  ).map((r) => r.label);
  const rowSet = new Set(rows);
  const colSet = new Set(cols);
  const matrix = new Map<string, number>();
  for (const rec of records) {
    let r = cellString(rec[rowKey]) ?? 'Unclassified';
    let c = cellString(rec[colKey]) ?? 'Unclassified';
    if (!rowSet.has(r)) r = 'Others';
    if (!colSet.has(c)) c = 'Others';
    const k = `${r}\t${c}`;
    matrix.set(k, (matrix.get(k) ?? 0) + 1);
  }
  const cells = rows.map((r) => cols.map((c) => matrix.get(`${r}\t${c}`) ?? 0));
  return { rows, cols, cells };
}

export function coOccurrenceMatrix(
  records: RawRecord[],
  aKey: string,
  bKey: string,
  cap = CHORD_CAP,
): { labels: string[]; matrix: number[][] } {
  const counts = new Map<string, number>();
  for (const rec of records) {
    const a = cellString(rec[aKey]);
    const b = cellString(rec[bKey]);
    if (a) counts.set(`A:${a}`, (counts.get(`A:${a}`) ?? 0) + 1);
    if (b) counts.set(`B:${b}`, (counts.get(`B:${b}`) ?? 0) + 1);
  }
  const topA = collapseTail(
    [...counts.entries()]
      .filter(([k]) => k.startsWith('A:'))
      .map(([k, value]) => ({ label: k.slice(2), value })),
    cap,
  ).map((r) => r.label);
  const topB = collapseTail(
    [...counts.entries()]
      .filter(([k]) => k.startsWith('B:'))
      .map(([k, value]) => ({ label: k.slice(2), value })),
    cap,
  ).map((r) => r.label);
  const labels = [...new Set([...topA, ...topB])];
  const index = new Map(labels.map((l, i) => [l, i]));
  const n = labels.length;
  const matrix = Array.from({ length: n }, () => Array.from({ length: n }, () => 0));
  const aSet = new Set(topA);
  const bSet = new Set(topB);
  for (const rec of records) {
    let a = cellString(rec[aKey]);
    let b = cellString(rec[bKey]);
    if (!a || !b) continue;
    if (!aSet.has(a)) a = 'Others';
    if (!bSet.has(b)) b = 'Others';
    const i = index.get(a);
    const j = index.get(b);
    if (i == null || j == null) continue;
    matrix[i]![j]! += 1;
    if (i !== j) matrix[j]![i]! += 1;
  }
  return { labels, matrix };
}

export function seriesBySecondary(
  records: RawRecord[],
  primaryKey: string,
  secondaryKey: string,
  seriesCap = 3,
): { categories: string[]; series: { key: string; name: string; values: number[] }[] } {
  const primary = aggregateColumn(records, primaryKey, 8).map((r) => r.label);
  const secondary = aggregateColumn(records, secondaryKey, seriesCap + 1).map((r) => r.label);
  const seriesNames = secondary.slice(0, seriesCap);
  const pSet = new Set(primary);
  const sSet = new Set(seriesNames);
  const counts = new Map<string, number>();
  for (const rec of records) {
    let p = cellString(rec[primaryKey]) ?? 'Unclassified';
    let s = cellString(rec[secondaryKey]) ?? 'Unclassified';
    if (!pSet.has(p)) p = 'Others';
    if (!sSet.has(s)) continue;
    const k = `${p}\t${s}`;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return {
    categories: primary,
    series: seriesNames.map((name) => ({
      key: name,
      name,
      values: primary.map((p) => counts.get(`${p}\t${name}`) ?? 0),
    })),
  };
}

export function numericPairs(
  records: RawRecord[],
  xKey: string,
  yKey: string,
  limit = 200,
): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  for (const rec of records) {
    const x = Number(rec[xKey]);
    const y = Number(rec[yKey]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    out.push({ x, y });
    if (out.length >= limit) break;
  }
  return out;
}
