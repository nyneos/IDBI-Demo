import { withFacts } from '@/data/buildUploadedDataSource';
import { factsOf } from '@/components/dashboard-builder/blockData';
import type { DashboardDataSource, SlimRecord } from '@/components/dashboard-builder/types';
import type { GovernedDimension } from '../semantic-layer/types';

export function filterByGovernedDimension(
  source: DashboardDataSource,
  dimension: GovernedDimension,
  burstValue: string,
): DashboardDataSource {
  const facts = factsOf(source).filter((row) => String(row[dimension.sourceField] ?? '') === burstValue);
  return withFacts(source, facts as SlimRecord[]);
}

export function burstValuesFor(source: DashboardDataSource, dimension: GovernedDimension): string[] {
  const seen = new Set<string>();
  for (const row of factsOf(source)) {
    const v = row[dimension.sourceField];
    if (v == null || v === '') continue;
    seen.add(String(v));
  }
  return [...seen].sort();
}
