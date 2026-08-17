/** Stable name → CSS colour token. Never assign by array index. */
export const CATEGORY_COLORS: Record<string, string> = {
  Success: 'var(--status-success)',
  Pending: 'var(--status-warning)',
  Failed: 'var(--status-error)',
  Reversed: 'var(--cat-4)',
  'Under Investigation': 'var(--cat-6)',
  Others: 'var(--cat-other)',
  Unclassified: 'var(--cat-other)',
};

export const ZONE_COLORS: Record<string, string> = {
  'North Zone': 'var(--cat-1)',
  'West Zone': 'var(--cat-2)',
  'South Zone': 'var(--cat-4)',
  'East Zone': '#E8833A',
  'Central Zone': 'var(--cat-3)',
  Others: 'var(--cat-other)',
};

/** Lighter fills for sunburst slices so dark labels stay readable. */
export const ZONE_SUNBURST_COLORS: Record<string, string> = {
  'North Zone': '#c7d2fe',
  'West Zone': '#5eead4',
  'South Zone': '#fcd34d',
  'East Zone': '#fdba74',
  'Central Zone': '#93c5fd',
  Others: '#cbd5e1',
  Other: '#cbd5e1',
};

export const ENTITY_TYPE_COLORS = {
  zone: 'var(--cat-1)',
  branch: 'var(--cat-2)',
  category: 'var(--cat-4)',
  segment: 'var(--status-warning)',
  mode: 'var(--cat-6)',
  status: 'var(--status-success)',
  account: 'var(--cat-3)',
} as const;

export const HEALTH_BANDS = {
  excellent: 85,
  good: 70,
  average: 55,
} as const;

export function healthBand(score: number): 'Excellent' | 'Good' | 'Average' | 'Poor' {
  if (score >= HEALTH_BANDS.excellent) return 'Excellent';
  if (score >= HEALTH_BANDS.good) return 'Good';
  if (score >= HEALTH_BANDS.average) return 'Average';
  return 'Poor';
}

export function healthColor(score: number): string {
  const band = healthBand(score);
  if (band === 'Excellent' || band === 'Good') return 'var(--status-success)';
  if (band === 'Average') return 'var(--status-warning)';
  return 'var(--status-error)';
}

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

export function colorForCategory(label: string, map?: Record<string, string>): string {
  if (map?.[label]) return map[label]!;
  if (CATEGORY_COLORS[label]) return CATEGORY_COLORS[label]!;
  if (ZONE_COLORS[label]) return ZONE_COLORS[label]!;
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) | 0;
  return CAT_CYCLE[Math.abs(h) % CAT_CYCLE.length]!;
}
