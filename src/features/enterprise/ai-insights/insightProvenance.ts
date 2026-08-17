export type InsightKind = 'observed' | 'derived' | 'interpretation' | 'recommendation';

export interface Insight {
  kind: InsightKind;
  text: string;
}

const KIND_LABEL: Record<InsightKind, string> = {
  observed: 'Observed',
  derived: 'Derived',
  interpretation: 'Interpretation',
  recommendation: 'Recommendation',
};

export function insightKindLabel(kind: InsightKind): string {
  return KIND_LABEL[kind];
}

/** Strip formatting so guards compare numeric content, not locale punctuation. */
function normalizeNumeral(raw: string): string {
  return raw.replace(/[₹,\s%]/g, '').replace(/\.(?=\d{3}\b)/g, '');
}

function extractNumerals(text: string): string[] {
  const matches = text.match(/[\d]+(?:[.,]\d+)*/g) ?? [];
  return matches.map(normalizeNumeral).filter(Boolean);
}

/**
 * Reject insights whose numerals are not traceable to computed facts.
 * Returns only guarded insights; drops any that fail validation.
 */
export function guardInsights(insights: Insight[], allowedNumerals: string[]): Insight[] {
  const allowed = new Set(allowedNumerals.map(normalizeNumeral));
  return insights.filter((insight) => {
    if (insight.kind === 'interpretation' || insight.kind === 'recommendation') return false;
    const nums = extractNumerals(insight.text);
    if (nums.length === 0) return true;
    return nums.every((n) => allowed.has(n) || allowedHasPrefix(allowed, n));
  });
}

function allowedHasPrefix(allowed: Set<string>, n: string): boolean {
  for (const a of allowed) {
    if (a.startsWith(n) || n.startsWith(a)) return true;
  }
  return false;
}

export function registerNumeral(allowed: string[], value: number, formatted: string): void {
  allowed.push(String(value));
  allowed.push(normalizeNumeral(formatted));
  allowed.push(String(Math.round(value)));
  if (Number.isFinite(value)) {
    allowed.push(value.toFixed(1));
    allowed.push(value.toFixed(2));
  }
}
