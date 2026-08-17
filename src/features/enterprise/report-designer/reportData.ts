import { factsOf, oneD } from '@/components/dashboard-builder/blockData';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import { seriesForGovernedMeasure } from '../semantic-layer/evaluateMeasure';
import type { GovernedMeasure, MeasureFormat, SemanticCatalog } from '../semantic-layer/types';
import type { ReportData, ReportSection, ReportTemplate, ResolvedMeasure } from './types';

function num(v: unknown): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v))) return Number(v);
  return NaN;
}

function formatValue(value: number, format?: MeasureFormat): string {
  if (!Number.isFinite(value)) return '—';
  if (format === 'currency-inr') return `₹${Math.round(value).toLocaleString('en-IN')}`;
  if (format === 'percent') return `${value.toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`;
  if (format === 'days') return `${value.toLocaleString('en-IN')} days`;
  return value.toLocaleString('en-IN');
}

export function buildPlaceholderMap(
  source: DashboardDataSource,
  burst?: { field: string; value: string },
): Record<string, string> {
  const rows = factsOf(source);
  const map: Record<string, string> = {
    Report_Date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  };

  if (burst?.value) {
    map[burst.field] = burst.value;
    if (burst.field === 'Branch_Name') map.Branch_Name = burst.value;
  }

  for (const row of rows.slice(0, 1)) {
    for (const [key, val] of Object.entries(row)) {
      if (val != null && val !== '') map[key] = String(val);
    }
  }

  if (!map.Branch_Name && rows.length) {
    const counts = new Map<string, number>();
    for (const row of rows) {
      const b = String(row.Branch_Name ?? '');
      if (b) counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) map.Branch_Name = top[0];
  }

  return map;
}

export function resolvePlaceholders(text: string, placeholders: Record<string, string>): string {
  return text.replace(/\{([^}]+)\}/g, (_, raw: string) => {
    const key = raw.trim();
    return placeholders[key] ?? `{${key}}`;
  });
}

function evaluateGoverned(source: DashboardDataSource, measure: GovernedMeasure): ResolvedMeasure {
  const series = seriesForGovernedMeasure(source, measure, null);
  const rawValue = series[0]?.value ?? 0;
  return {
    label: measure.name,
    rawValue,
    formattedValue: formatValue(rawValue, measure.format),
  };
}

const RAW_KPI: Record<string, { label: string; compute: (source: DashboardDataSource) => ResolvedMeasure }> = {
  'Total Transactions': {
    label: 'Total Transactions',
    compute: (source) => {
      const n = factsOf(source).length;
      return { label: 'Total Transactions', rawValue: n, formattedValue: n.toLocaleString('en-IN') };
    },
  },
  'Success Rate': {
    label: 'Success Rate',
    compute: (source) => {
      const rows = factsOf(source);
      const ok = rows.filter((r) => /success/i.test(String(r.Status ?? ''))).length;
      const pct = rows.length ? (ok / rows.length) * 100 : 0;
      return {
        label: 'Success Rate',
        rawValue: pct,
        formattedValue: `${pct.toLocaleString('en-IN', { maximumFractionDigits: 1 })}%`,
      };
    },
  },
  'Average Transaction Value': {
    label: 'Average Transaction Value',
    compute: (source) => {
      const amounts = factsOf(source).map((r) => num(r.Amount)).filter(Number.isFinite);
      const avg = amounts.length ? amounts.reduce((a, b) => a + b, 0) / amounts.length : 0;
      return {
        label: 'Average Transaction Value',
        rawValue: avg,
        formattedValue: formatValue(avg, 'currency-inr'),
      };
    },
  },
  'Branch Transaction Count': {
    label: 'Branch Transaction Count',
    compute: (source) => {
      const n = factsOf(source).length;
      return { label: 'Branch Transaction Count', rawValue: n, formattedValue: n.toLocaleString('en-IN') };
    },
  },
  'Branch Success Rate': {
    label: 'Branch Success Rate',
    compute: (source) => RAW_KPI['Success Rate']!.compute(source),
  },
};

export function resolveMeasureById(
  source: DashboardDataSource,
  catalog: SemanticCatalog,
  measureId: string,
): ResolvedMeasure | null {
  const measure = catalog.measures.find((m) => m.id === measureId);
  if (!measure) return null;
  return evaluateGoverned(source, measure);
}

export function resolveMeasureByName(
  source: DashboardDataSource,
  catalog: SemanticCatalog,
  name: string,
): ResolvedMeasure {
  const governed = catalog.measures.find((m) => m.name === name);
  if (governed) return evaluateGoverned(source, governed);
  const raw = RAW_KPI[name];
  if (raw) return raw.compute(source);
  return { label: name, rawValue: 0, formattedValue: '—' };
}

function columnValue(
  header: string,
  groupKey: string,
  groupRows: Record<string, string | number | null>[],
): string {
  if (header === groupKey || header.replace(/\s+/g, '_') === groupKey) {
    return String(groupRows[0]?.[groupKey] ?? '');
  }
  if (/count/i.test(header)) return String(groupRows.length);
  if (/amount|value/i.test(header)) {
    const sum = groupRows.reduce((s, r) => s + (num(r.Amount) || 0), 0);
    return `₹${Math.round(sum).toLocaleString('en-IN')}`;
  }
  const field = header.replace(/\s+/g, '_');
  const first = groupRows[0]?.[field];
  return first == null ? '' : String(first);
}

export function groupAndAggregate(
  source: DashboardDataSource,
  groupBy: string,
  columns: string[],
): string[][] {
  const rows = factsOf(source);
  const groups = new Map<string, Record<string, string | number | null>[]>();
  for (const row of rows) {
    const key = String(row[groupBy] ?? 'Unclassified');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }
  return [...groups.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .map(([, groupRows]) => columns.map((col) => columnValue(col, groupBy, groupRows)));
}

export function recordsTable(
  source: DashboardDataSource,
  columns: string[],
  cap = 200,
): string[][] {
  const keys = columns.length ? columns : Object.keys(factsOf(source)[0] ?? {}).slice(0, 6);
  return factsOf(source)
    .slice(0, cap)
    .map((row) => keys.map((col) => (row[col] == null || row[col] === '' ? '—' : String(row[col]))));
}

export function buildReportData(
  template: ReportTemplate,
  source: DashboardDataSource,
  catalog: SemanticCatalog,
  burst?: { field: string; value: string },
): ReportData {
  const placeholders = buildPlaceholderMap(source, burst);
  const measures = new Map<string, ResolvedMeasure>();
  const tableRows = new Map<string, string[][]>();
  const recordRows = new Map<string, string[][]>();
  const chartSeries = new Map<string, { label: string; value: number }[]>();

  for (const section of template.bodySections) {
    if (section.type === 'kpi-row') {
      for (const id of section.boundMeasures ?? []) {
        const m = resolveMeasureById(source, catalog, id);
        if (m) measures.set(id, m);
      }
      for (const name of section.measureNames ?? []) {
        measures.set(`name:${name}`, resolveMeasureByName(source, catalog, name));
      }
    }
    if (section.type === 'table' && section.boundTable) {
      tableRows.set(
        section.id,
        groupAndAggregate(source, section.boundTable.groupBy, section.boundTable.columns),
      );
    }
    if (section.type === 'records-table') {
      recordRows.set(section.id, recordsTable(source, section.recordColumns ?? []));
    }
    if (section.type === 'chart' && section.chart?.dimensionKey) {
      chartSeries.set(section.id, oneD(source, section.chart.dimensionKey).slice(0, 12));
    }
  }

  return { placeholders, measures, tableRows, recordRows, chartSeries };
}

export function sectionMeasureValues(section: ReportSection, data: ReportData): ResolvedMeasure[] {
  const out: ResolvedMeasure[] = [];
  for (const id of section.boundMeasures ?? []) {
    const m = data.measures.get(id);
    if (m) out.push(m);
  }
  for (const name of section.measureNames ?? []) {
    const m = data.measures.get(`name:${name}`);
    if (m) out.push(m);
  }
  return out;
}
