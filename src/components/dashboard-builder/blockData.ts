import {
  aggregateColumn,
  coOccurrenceMatrix,
  crossTab,
  numericPairs,
  seriesBySecondary,
} from '@/data/pipeline/aggregate';
import { buildHierarchy, proposeHierarchy } from '@/data/pipeline/hierarchy';
import type { RawRecord } from '@/data/pipeline/types';
import type { GraphEdge, GraphNode, HierarchyNode } from '@/data/types';
import type { DashboardBlock, DashboardDataSource } from './types';

export function blockKeys(block: Pick<DashboardBlock, 'dimensionKey' | 'dimensionKeys'>): string[] {
  if (block.dimensionKeys && block.dimensionKeys.length > 0) return block.dimensionKeys;
  return block.dimensionKey ? [block.dimensionKey] : [];
}

export function dimOf(source: DashboardDataSource, key: string) {
  return (
    source.dimensions.find((d) => d.key === key) ??
    source.metrics?.find((d) => d.key === key) ??
    source.dates?.find((d) => d.key === key) ??
    source.gauges?.find((g) => g.key === key)
  );
}

export function fieldPresent(source: DashboardDataSource, key: string): boolean {
  if (!key) return true;
  if (source.gauges?.some((g) => g.key === key)) return true;
  if (source.dimensions.some((d) => d.key === key)) return true;
  if (source.metrics?.some((d) => d.key === key)) return true;
  if (source.dates?.some((d) => d.key === key)) return true;
  return false;
}

export function oneD(source: DashboardDataSource, key: string) {
  if (!key) return [];
  const dim =
    source.dimensions.find((d) => d.key === key) ??
    source.metrics?.find((d) => d.key === key) ??
    source.dates?.find((d) => d.key === key);
  if (!dim || !('aggregate' in dim) || typeof dim.aggregate !== 'function') return [];
  return dim.aggregate();
}

export function factsOf(source: DashboardDataSource): RawRecord[] {
  return (source.raw ?? source.facts ?? []) as RawRecord[];
}

export function hierarchyFor(
  source: DashboardDataSource,
  keys: string[],
): HierarchyNode | undefined {
  if (source.hierarchy && keys.length === 0) return source.hierarchy;
  const facts = factsOf(source);
  if (facts.length && keys.length) return buildHierarchy(facts, keys, source.label);
  if (source.hierarchy) return source.hierarchy;
  if (source.profile && facts.length) {
    const proposed = proposeHierarchy(source.profile, facts);
    if (proposed.length) return buildHierarchy(facts, proposed, source.label);
  }
  return source.hierarchy;
}

export function heatmapFor(source: DashboardDataSource, a: string, b: string) {
  const facts = factsOf(source);
  if (facts.length) return crossTab(facts, a, b);
  const rows = oneD(source, a);
  const cols = oneD(source, b);
  const total = source.recordCount || 1;
  return {
    rows: rows.map((r) => r.label),
    cols: cols.map((c) => c.label),
    cells: rows.map((r) => cols.map((c) => Math.round((r.value * c.value) / total))),
  };
}

export function seriesFor(source: DashboardDataSource, a: string, b: string) {
  const facts = factsOf(source);
  if (facts.length) return seriesBySecondary(facts, a, b);
  const cats = oneD(source, a);
  const sec = oneD(source, b).slice(0, 2);
  const total = source.recordCount || 1;
  return {
    categories: cats.map((c) => c.label),
    series: sec.map((s) => ({
      key: s.label,
      name: s.label,
      values: cats.map((c) => Math.round((c.value * s.value) / total)),
    })),
  };
}

export function sankeyFor(source: DashboardDataSource, keys: string[]) {
  const used = keys.slice(0, 4);
  const facts = factsOf(source);
  const stages = used.map((key, stage) => {
    const rows = facts.length ? aggregateColumn(facts, key, 8) : oneD(source, key);
    return rows.map((r) => ({
      id: `${stage}:${r.label}`,
      name: r.label,
      value: r.value,
      color: undefined as string | undefined,
    }));
  });
  const links: { source: string; target: string; value: number }[] = [];
  if (facts.length) {
    for (let i = 0; i < used.length - 1; i++) {
      const a = used[i]!;
      const b = used[i + 1]!;
      const counts = new Map<string, number>();
      const aTop = new Set(stages[i]!.map((n) => n.name));
      const bTop = new Set(stages[i + 1]!.map((n) => n.name));
      for (const rec of facts) {
        let av = String(rec[a] ?? 'Unclassified');
        let bv = String(rec[b] ?? 'Unclassified');
        if (!aTop.has(av)) av = 'Others';
        if (!bTop.has(bv)) bv = 'Others';
        const k = `${av}\t${bv}`;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      for (const [k, value] of counts) {
        const [av, bv] = k.split('\t');
        links.push({ source: `${i}:${av}`, target: `${i + 1}:${bv}`, value });
      }
    }
  }
  return { stages, links };
}

export function networkFor(source: DashboardDataSource, a: string, b: string): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const facts = factsOf(source);
  const aRows = facts.length ? aggregateColumn(facts, a, 12) : oneD(source, a);
  const bRows = facts.length ? aggregateColumn(facts, b, 12) : oneD(source, b);
  const nodes: GraphNode[] = [
    ...aRows.map((r) => ({
      id: `a:${r.label}`,
      label: r.label,
      type: 'branch' as const,
      value: r.value,
    })),
    ...bRows.map((r) => ({
      id: `b:${r.label}`,
      label: r.label,
      type: 'category' as const,
      value: r.value,
    })),
  ];
  const aSet = new Set(aRows.map((r) => r.label));
  const bSet = new Set(bRows.map((r) => r.label));
  const edgeMap = new Map<string, number>();
  for (const rec of facts) {
    let av = String(rec[a] ?? '');
    let bv = String(rec[b] ?? '');
    if (!av || !bv) continue;
    if (!aSet.has(av)) av = 'Others';
    if (!bSet.has(bv)) bv = 'Others';
    const k = `a:${av}|b:${bv}`;
    edgeMap.set(k, (edgeMap.get(k) ?? 0) + 1);
  }
  const edges: GraphEdge[] = [...edgeMap.entries()].map(([k, value]) => {
    const [s, t] = k.split('|');
    return { source: s!, target: t!, value, kind: 'related' as const };
  });
  return { nodes, edges };
}

export function chordFor(source: DashboardDataSource, a: string, b: string) {
  const facts = factsOf(source);
  if (facts.length) return coOccurrenceMatrix(facts, a, b);
  const { nodes, edges } = networkFor(source, a, b);
  const labels = nodes.slice(0, 12).map((n) => n.label);
  const index = new Map(labels.map((l, i) => [l, i]));
  const matrix = labels.map(() => labels.map(() => 0));
  for (const e of edges) {
    const s = nodes.find((n) => n.id === e.source)?.label;
    const t = nodes.find((n) => n.id === e.target)?.label;
    if (!s || !t) continue;
    const i = index.get(s);
    const j = index.get(t);
    if (i == null || j == null) continue;
    matrix[i]![j]! += e.value;
    if (i !== j) matrix[j]![i]! += e.value;
  }
  return { labels, matrix };
}

export function hiveFor(source: DashboardDataSource, keys: string[]) {
  const used = keys.slice(0, 3);
  const facts = factsOf(source);
  const axes = used.map((key) => {
    const dim = source.dimensions.find((d) => d.key === key);
    const nodes = (facts.length ? aggregateColumn(facts, key, 10) : oneD(source, key)).map(
      (r) => ({ id: `${key}:${r.label}`, label: r.label, value: r.value }),
    );
    return { key, label: dim?.label ?? key, nodes };
  });
  const edges: { source: string; target: string; value: number }[] = [];
  if (facts.length) {
    for (let i = 0; i < used.length - 1; i++) {
      const a = used[i]!;
      const b = used[i + 1]!;
      const counts = new Map<string, number>();
      for (const rec of facts) {
        const av = String(rec[a] ?? '');
        const bv = String(rec[b] ?? '');
        if (!av || !bv) continue;
        const k = `${a}:${av}|${b}:${bv}`;
        counts.set(k, (counts.get(k) ?? 0) + 1);
      }
      for (const [k, value] of counts) {
        const [s, t] = k.split('|');
        edges.push({ source: s!, target: t!, value });
      }
    }
  }
  return { axes, edges };
}

export function scatterFor(source: DashboardDataSource, a: string, b: string) {
  const facts = factsOf(source);
  const pairs = facts.length ? numericPairs(facts, a, b) : [];
  if (pairs.length) return { points: pairs.map((p) => ({ ...p })), xLabel: a, yLabel: b };
  const rows = oneD(source, a);
  return {
    points: rows.map((r, i) => ({ x: i + 1, y: r.value, name: r.label })),
    xLabel: 'Rank',
    yLabel: source.dimensions.find((d) => d.key === a)?.label ?? a,
  };
}

export function groupedRows(source: DashboardDataSource, a: string, b: string) {
  const heat = heatmapFor(source, a, b);
  return heat.rows.map((label) => {
    const ri = heat.rows.indexOf(label);
    const counts = heat.cols.map((col, ci) => ({ col, value: heat.cells[ri]?.[ci] ?? 0 }));
    const total = counts.reduce((s, c) => s + c.value, 0);
    return { label, total, counts };
  });
}
