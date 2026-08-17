import { colorForCategory } from '@/data/colors';
import type { DashboardDataSource } from './types';

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

export function colorForLabel(label: string, source?: DashboardDataSource): string {
  if (source?.categoryColors?.[label]) return source.categoryColors[label]!;
  return colorForCategory(label);
}

export function assignStableColors(labels: string[], existing: Record<string, string> = {}): Record<string, string> {
  const next = { ...existing };
  let i = Object.keys(next).length;
  for (const label of labels) {
    if (next[label]) continue;
    next[label] = CAT_CYCLE[i % CAT_CYCLE.length]!;
    i += 1;
  }
  return next;
}
