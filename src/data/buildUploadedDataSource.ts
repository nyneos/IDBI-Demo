import { assignStableColors } from '@/components/dashboard-builder/dimensionRegistry';
import { buildSuggestions } from './buildSuggestions';
import { aggregateColumn, aggregateDateSeries } from './pipeline/aggregate';
import { eligibleDimensions, profileColumns } from './pipeline/profileColumns';
import { buildHierarchy, proposeHierarchy } from './pipeline/hierarchy';
import { cellString } from './pipeline/normalise';
import type { ChartSuggestion } from '@/components/dashboard-builder/types';
import type { DimensionMeta, RawRecord } from './pipeline/types';
import type {
  DashboardDataSource,
  DimensionOption,
  GaugeMetric,
  PersistedDataSource,
  SlimRecord,
} from '@/components/dashboard-builder/types';

function hashFile(fileName: string, recordCount: number): string {
  let h = 2166136261;
  const s = `${fileName}:${recordCount}`;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function toSlim(records: RawRecord[], keys: string[]): SlimRecord[] {
  return records.map((row) => {
    const slim: SlimRecord = {};
    for (const key of keys) {
      const v = row[key];
      if (typeof v === 'number') slim[key] = v;
      else slim[key] = cellString(v ?? null);
    }
    return slim;
  });
}

function dimOption(
  key: string,
  label: string,
  records: RawRecord[],
  extra?: Partial<DimensionOption>,
): DimensionOption {
  const data = extra?.role === 'date' ? aggregateDateSeries(records, key) : aggregateColumn(records, key);
  return {
    key,
    label,
    ...extra,
    aggregate: () => data,
  };
}

function buildGauges(source: DashboardDataSource): GaugeMetric[] {
  const dims = source.dimensions;
  const top = dims[0]?.aggregate()[0];
  const total = source.recordCount || 1;
  const gauges: GaugeMetric[] = [];
  if (top) {
    gauges.push({
      key: `share:${dims[0]!.key}`,
      label: `Share of ${top.label}`,
      value: Math.round((top.value / total) * 1000) / 10,
      target: 25,
      unit: dims[0]!.label,
    });
  }
  const rateDim = dims.find((d) => /rate|score|%|compliance/i.test(d.label));
  if (rateDim) {
    const rows = rateDim.aggregate();
    const named = rows.find((r) => /yes|pass|compliant|resolved/i.test(r.label)) ?? rows[0];
    if (named) {
      gauges.push({
        key: rateDim.key,
        label: rateDim.label,
        value: Math.round((named.value / total) * 1000) / 10,
        target: 90,
        unit: '% of records',
      });
    }
  }
  if (gauges.length === 0) {
    gauges.push({
      key: 'fill',
      label: 'Records loaded',
      value: 100,
      target: 100,
      unit: `${total} rows`,
    });
  }
  return gauges;
}

export function buildUploadedDataSource(
  records: RawRecord[],
  fileName: string,
  precomputed?: { profile?: DimensionMeta[]; suggestions?: ChartSuggestion[] },
): DashboardDataSource {
  const profile = precomputed?.profile ?? profileColumns(records);
  const eligible = eligibleDimensions(profile);
  const dates = profile.filter((d) => d.role === 'date');
  const metrics = profile.filter((d) => d.role === 'metric');
  const slimKeys = [
    ...eligible.map((d) => d.key),
    ...dates.map((d) => d.key),
    ...metrics.map((d) => d.key),
  ];

  const dimensions: DimensionOption[] = [
    ...eligible.map((d) =>
      dimOption(d.key, d.label, records, {
        fillRate: d.fillRate,
        cardinality: d.cardinality,
        sparse: d.sparse,
        role: d.role,
      }),
    ),
    ...dates.map((d) =>
      dimOption(d.key, d.label, records, {
        fillRate: d.fillRate,
        cardinality: d.cardinality,
        sparse: true,
        role: 'date',
      }),
    ),
  ];

  const hierarchyKeys = proposeHierarchy(profile, records);
  const source: DashboardDataSource = {
    id: `uploaded:${hashFile(fileName, records.length)}`,
    label: fileName,
    dimensions,
    recordCount: records.length,
    suggestions: precomputed?.suggestions ?? buildSuggestions(profile, records),
    profile,
    excludedCount: profile.filter((d) => d.role === 'ignored').length,
    facts: toSlim(records, slimKeys),
    raw: records,
    hierarchy: hierarchyKeys.length
      ? buildHierarchy(records, hierarchyKeys, 'IDBI transactions')
      : undefined,
    metrics: metrics.map((d) => dimOption(d.key, d.label, records, { role: 'metric' })),
    dates: dates.map((d) =>
      dimOption(d.key, d.label, records, { role: 'date', sparse: d.sparse }),
    ),
  };
  source.gauges = buildGauges(source);
  const labels = source.dimensions.flatMap((d) => d.aggregate().map((r) => r.label));
  source.categoryColors = assignStableColors(labels);
  return source;
}

export function persistDataSource(source: DashboardDataSource): PersistedDataSource {
  return {
    id: source.id,
    label: source.label,
    recordCount: source.recordCount,
    excludedCount: source.excludedCount,
    suggestions: source.suggestions,
    profile: source.profile,
    gauges: source.gauges,
    hierarchy: source.hierarchy,
    facts: source.facts,
    categoryColors: source.categoryColors,
    calculatedFields: source.calculatedFields,
    dimensions: source.dimensions.map((d) => ({
      key: d.key,
      label: d.label,
      fillRate: d.fillRate,
      cardinality: d.cardinality,
      sparse: d.sparse,
      role: d.role,
      data: d.aggregate(),
    })),
    metrics: source.metrics?.map((d) => ({
      key: d.key,
      label: d.label,
      fillRate: d.fillRate,
      cardinality: d.cardinality,
      sparse: d.sparse,
      role: d.role,
      data: d.aggregate(),
    })),
  };
}

export function hydrateDataSource(persisted: PersistedDataSource): DashboardDataSource {
  const facts = persisted.facts;
  return {
    id: persisted.id,
    label: persisted.label,
    recordCount: persisted.recordCount,
    excludedCount: persisted.excludedCount,
    suggestions: persisted.suggestions,
    profile: persisted.profile,
    gauges: persisted.gauges,
    hierarchy: persisted.hierarchy,
    facts,
    categoryColors: persisted.categoryColors,
    calculatedFields: persisted.calculatedFields,
    dimensions: persisted.dimensions.map((d) => ({
      key: d.key,
      label: d.label,
      fillRate: d.fillRate,
      cardinality: d.cardinality,
      sparse: d.sparse,
      role: d.role,
      aggregate: () => {
        const fromFacts =
          facts && facts.length > 0
            ? d.role === 'date'
              ? aggregateDateSeries(facts as RawRecord[], d.key)
              : aggregateColumn(facts as RawRecord[], d.key)
            : [];
        return fromFacts.length ? fromFacts : d.data;
      },
    })),
    metrics: (persisted.metrics ?? []).map((d) => ({
      key: d.key,
      label: d.label,
      fillRate: d.fillRate,
      cardinality: d.cardinality,
      sparse: d.sparse,
      role: d.role,
      aggregate: () => d.data,
    })),
  };
}

export function withFacts(
  source: DashboardDataSource,
  facts: SlimRecord[],
): DashboardDataSource {
  const asRaw = facts as RawRecord[];
  return {
    ...source,
    recordCount: facts.length,
    facts,
    dimensions: source.dimensions.map((d) => ({
      ...d,
      aggregate: () =>
        d.role === 'date' ? aggregateDateSeries(asRaw, d.key) : aggregateColumn(asRaw, d.key),
    })),
    hierarchy: source.hierarchy && source.profile
      ? buildHierarchy(asRaw, proposeHierarchy(source.profile, asRaw), 'IDBI transactions')
      : source.hierarchy,
  };
}

export function filterDataSource(
  source: DashboardDataSource,
  filters: Record<string, string | string[]>,
): DashboardDataSource {
  const entries = Object.entries(filters).filter(([key, v]) => {
    if (!key) return false;
    if (Array.isArray(v)) return v.length > 0;
    return Boolean(v) && v !== '__all__';
  });
  if (entries.length === 0 || !source.facts?.length) return source;
  const keys = new Set(Object.keys(source.facts[0] ?? {}));
  const usable = entries.filter(([key]) => keys.has(key));
  if (usable.length === 0) return source;
  const facts = source.facts.filter((row) =>
    usable.every(([key, value]) => {
      const cell = String(row[key] ?? '');
      if (Array.isArray(value)) return value.includes(cell);
      return cell === value;
    }),
  );
  return withFacts(source, facts);
}
