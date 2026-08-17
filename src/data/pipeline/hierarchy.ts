import type { HierarchyNode } from '@/data/types';
import { CATEGORY_COLORS, ZONE_COLORS } from '@/data/colors';
import { cellString } from './normalise';
import type { DimensionMeta, RawRecord } from './types';

const LEVELS: HierarchyNode['level'][] = ['root', 'l1', 'l2', 'l3', 'l4', 'l5'];

const CAT_CYCLE = [
  'var(--cat-1)',
  'var(--cat-2)',
  'var(--cat-3)',
  'var(--cat-4)',
  'var(--cat-5)',
  'var(--cat-6)',
  'var(--cat-7)',
  'var(--cat-8)',
];

function colorOf(name: string, i: number): string {
  return ZONE_COLORS[name] ?? CATEGORY_COLORS[name] ?? CAT_CYCLE[i % CAT_CYCLE.length]!;
}

/** ≥95% of finer values map to exactly one coarser value. */
export function hasContainment(records: RawRecord[], coarserKey: string, finerKey: string): boolean {
  const map = new Map<string, Set<string>>();
  for (const rec of records) {
    const fine = cellString(rec[finerKey]);
    const coarse = cellString(rec[coarserKey]);
    if (!fine || !coarse) continue;
    if (!map.has(fine)) map.set(fine, new Set());
    map.get(fine)!.add(coarse);
  }
  if (map.size === 0) return false;
  let unique = 0;
  for (const parents of map.values()) {
    if (parents.size === 1) unique += 1;
  }
  return unique / map.size >= 0.95;
}

export function hasContainmentChain(records: RawRecord[], dims: DimensionMeta[]): boolean {
  const cats = dims.filter((d) => d.role === 'dimension');
  for (let i = 0; i < cats.length; i++) {
    for (let j = i + 1; j < cats.length; j++) {
      const a = cats[i]!;
      const b = cats[j]!;
      const [coarse, fine] = a.cardinality <= b.cardinality ? [a, b] : [b, a];
      if (hasContainment(records, coarse.key, fine.key)) return true;
    }
  }
  return false;
}

export function proposeHierarchy(profile: DimensionMeta[], records: RawRecord[]): string[] {
  const byKey = new Map(profile.map((d) => [d.key, d]));
  const pick = (...candidates: string[]) =>
    candidates.find((k) => {
      const d = byKey.get(k);
      return d && d.role === 'dimension' && d.cardinality >= 2 && d.cardinality <= 80;
    });

  const preferred = [
    pick('Zone'),
    pick('Channel', 'Transaction_Mode'),
    pick('Transaction_Category', 'Transaction_Type'),
  ].filter((k): k is string => Boolean(k));

  if (preferred.length >= 2) return preferred.slice(0, 3);
  if (preferred.length === 1) {
    const extra = profile
      .filter((d) => d.role === 'dimension' && d.key !== preferred[0] && d.cardinality >= 2 && d.cardinality <= 40)
      .sort((a, b) => a.cardinality - b.cardinality)
      .map((d) => d.key);
    return [preferred[0]!, ...extra].slice(0, 3);
  }

  const dims = profile
    .filter((d) => d.role === 'dimension' && d.cardinality >= 2 && d.cardinality <= 80)
    .sort((a, b) => a.cardinality - b.cardinality);
  if (dims.length === 0) return [];
  if (dims.length === 1) return [dims[0]!.key];

  let best: string[] = [dims[0]!.key, dims[Math.min(1, dims.length - 1)]!.key];
  for (let i = 0; i < dims.length; i++) {
    const chain = [dims[i]!.key];
    for (let j = i + 1; j < dims.length && chain.length < 4; j++) {
      if (hasContainment(records, chain[chain.length - 1]!, dims[j]!.key)) {
        chain.push(dims[j]!.key);
      }
    }
    if (chain.length > best.length) best = chain;
  }
  if (best.length < 2 && dims.length >= 2) {
    best = dims.slice(0, Math.min(3, dims.length)).map((d) => d.key);
  }
  return best;
}

export function buildHierarchy(
  records: RawRecord[],
  keys: string[],
  rootLabel = 'All records',
): HierarchyNode {
  const used = keys.slice(0, 5);
  type Nest = { count: number; children: Map<string, Nest> };
  const rootNest: Nest = { count: 0, children: new Map() };

  for (const rec of records) {
    let cursor = rootNest;
    cursor.count += 1;
    for (const key of used) {
      const label = cellString(rec[key]) ?? 'Unclassified';
      if (!cursor.children.has(label)) cursor.children.set(label, { count: 0, children: new Map() });
      cursor = cursor.children.get(label)!;
      cursor.count += 1;
    }
  }

  const toNode = (name: string, nest: Nest, depth: number, path: string): HierarchyNode => {
    const children = [...nest.children.entries()]
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 12)
      .map(([label, child], i) => {
        const n = toNode(label, child, depth + 1, `${path}/${label}`);
        if (depth === 0) n.color = colorOf(label, i);
        return n;
      });
    return {
      id: path,
      name,
      level: LEVELS[Math.min(depth, LEVELS.length - 1)]!,
      value: nest.count,
      children: children.length ? children : undefined,
    };
  };

  const node = toNode(rootLabel, rootNest, 0, 'root');
  node.color = 'var(--cat-1)';
  return node;
}
