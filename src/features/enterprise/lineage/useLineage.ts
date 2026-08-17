import { collectFields, parse, tokenize } from '@/data/calculatedFields';
import type { DashboardBlock, DashboardDataSource } from '@/components/dashboard-builder/types';
import { pickerByType } from '@/components/dashboard-builder/chartRegistry';
import { measureExpression } from '../semantic-layer/evaluateMeasure';
import type { GovernedMeasure, MeasureFormat, SemanticCatalog } from '../semantic-layer/types';
import {
  EMPTY_LINEAGE_STORE,
  sourceKey,
  type FilterState,
  type LineageBlockRecord,
  type LineageChain,
  type LineageEdge,
  type LineageNode,
  type LineageSourceRecord,
  type LineageStore,
  type LineageTransformRecord,
} from './types';

const KEY = 'enterprise.lineage';
const EVENT = 'enterprise-lineage';

function loadStore(): LineageStore {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<LineageStore>;
    return {
      sources: raw.sources ?? {},
      transforms: raw.transforms ?? {},
      blocks: raw.blocks ?? {},
    };
  } catch {
    return { ...EMPTY_LINEAGE_STORE, sources: {}, transforms: {}, blocks: {} };
  }
}

function persist(store: LineageStore) {
  localStorage.setItem(KEY, JSON.stringify(store));
  window.dispatchEvent(new Event(EVENT));
}

/** Called once per uploaded file, from the Enterprise surface that consumes it. */
export function recordLineageSource(
  fileName: string,
  uploadedBy: string,
  rowCount: number,
  uploadedAt: number,
) {
  const store = loadStore();
  const id = sourceKey(fileName, rowCount);
  const existing = store.sources[id];
  if (existing) return;
  store.sources[id] = { fileName, uploadedBy, rowCount, uploadedAt };
  persist(store);
}

/** Called when a calculated field or governed measure is defined. */
export function recordLineageTransform(
  measureId: string,
  sourceField: string,
  formula: string,
  aggregation: string,
) {
  const store = loadStore();
  const existing = store.transforms[measureId];
  const next: LineageTransformRecord = { measureId, sourceField, formula, aggregation };
  if (
    existing &&
    existing.sourceField === next.sourceField &&
    existing.formula === next.formula &&
    existing.aggregation === next.aggregation
  ) {
    return;
  }
  store.transforms[measureId] = next;
  persist(store);
}

/** Called when a block is configured with a field/measure/active filters. */
export function recordLineageBlock(
  blockId: string,
  measureId: string | null,
  rawField: string | null,
  activeFilters: FilterState,
) {
  const store = loadStore();
  const next: LineageBlockRecord = { blockId, measureId, rawField, activeFilters };
  const existing = store.blocks[blockId];
  if (
    existing &&
    existing.measureId === next.measureId &&
    existing.rawField === next.rawField &&
    JSON.stringify(existing.activeFilters) === JSON.stringify(next.activeFilters)
  ) {
    return;
  }
  store.blocks[blockId] = next;
  persist(store);
}

export function readLineageStore(): LineageStore {
  return loadStore();
}

export function captureFilters(opts: {
  activeFilter?: { field: string; value: string } | null;
  drillFilter?: { field: string; value: string } | null;
  slicers?: Record<string, string[]>;
}): FilterState {
  const entries: FilterState['entries'] = [];
  if (opts.activeFilter?.field) {
    entries.push({ field: opts.activeFilter.field, value: opts.activeFilter.value });
  }
  if (opts.drillFilter?.field) {
    entries.push({ field: opts.drillFilter.field, value: opts.drillFilter.value });
  }
  for (const [field, values] of Object.entries(opts.slicers ?? {})) {
    if (field && values.length > 0) entries.push({ field, value: values.join(', ') });
  }
  return { entries };
}

export function fieldsInFormula(formula: string): string[] {
  try {
    return [...collectFields(parse(tokenize(formula)))];
  } catch {
    return [];
  }
}

function lookupSource(
  store: LineageStore,
  origin: DashboardDataSource,
): LineageSourceRecord | null {
  const exact = store.sources[sourceKey(origin.label, origin.recordCount)];
  if (exact) return exact;
  return Object.values(store.sources).find((s) => s.fileName === origin.label) ?? null;
}

function columnLabel(origin: DashboardDataSource, key: string, catalog: SemanticCatalog): string {
  const governed = catalog.dimensions.find((d) => d.sourceField === key);
  if (governed) return governed.name;
  const dim = origin.dimensions.find((d) => d.key === key);
  if (dim) return dim.label;
  const profile = origin.profile?.find((p) => p.key === key);
  if (profile) return profile.label;
  const metric = origin.metrics?.find((d) => d.key === key);
  if (metric) return metric.label;
  return key;
}

function columnDetail(origin: DashboardDataSource, key: string): string {
  const profile = origin.profile?.find((p) => p.key === key);
  const parts = ['Raw field'];
  if (profile?.role === 'metric') parts.push('numeric measure');
  else if (profile?.role === 'date') parts.push('date');
  else if (profile?.role === 'dimension') parts.push('dimension');
  else if (profile?.reason) parts.push(profile.reason);
  else parts.push('no transformation');
  if (!parts.includes('no transformation')) parts.push('no transformation');
  if (profile && Number.isFinite(profile.fillRate)) {
    parts.push(`${Math.round(profile.fillRate * 100)}% filled`);
  }
  return parts.join(', ');
}

function formatValue(value: number, format?: MeasureFormat): string {
  if (!Number.isFinite(value)) return '—';
  if (format === 'currency-inr') return `₹${Math.round(value).toLocaleString('en-IN')}`;
  if (format === 'percent') return `${value.toLocaleString('en-IN')}%`;
  if (format === 'days') return `${value.toLocaleString('en-IN')} days`;
  return value.toLocaleString('en-IN');
}

export function resultAtView(opts: {
  block: DashboardBlock;
  series: { label: string; value: number }[];
  viewSource: DashboardDataSource;
  measure?: GovernedMeasure;
}): string {
  const { block, series, viewSource, measure } = opts;
  const format = measure?.format;
  if (block.type === 'kpi') {
    const mode = measure ? 'top' : (block.kpiMode ?? 'count');
    const total = viewSource.recordCount || series.reduce((s, r) => s + r.value, 0);
    const top = series[0];
    const value =
      mode === 'top' && top
        ? top.value
        : mode === 'rate' && top && total
          ? Math.round((top.value / total) * 1000) / 10
          : total;
    return formatValue(value, mode === 'rate' ? 'percent' : format);
  }
  if (series.length === 1 && series[0]) {
    return `${series[0].label}: ${formatValue(series[0].value, format)}`;
  }
  if (series[0]) {
    return `${series.length} groups · top ${series[0].label} = ${formatValue(series[0].value, format)}`;
  }
  return `${viewSource.recordCount.toLocaleString('en-IN')} rows in view`;
}

function filterTransform(filters: FilterState, origin: DashboardDataSource, catalog: SemanticCatalog): string | undefined {
  if (filters.entries.length === 0) return undefined;
  const parts = filters.entries.map((e) => `${columnLabel(origin, e.field, catalog)} = ${e.value}`);
  return `filtered: ${parts.join(', ')}`;
}

export function buildLineageChain(opts: {
  block: DashboardBlock;
  dashboardName: string;
  catalog: SemanticCatalog;
  origin: DashboardDataSource;
  viewSource: DashboardDataSource;
  series: { label: string; value: number }[];
  filters: FilterState;
}): LineageChain {
  const store = loadStore();
  const recordedBlock: LineageBlockRecord | undefined = store.blocks[opts.block.id];
  const binding = opts.catalog.bindings[opts.block.id];
  const measureId = binding?.measureId ?? recordedBlock?.measureId ?? null;
  const measure = measureId
    ? opts.catalog.measures.find((m) => m.id === measureId)
    : undefined;
  const recordedTx: LineageTransformRecord | undefined = measureId
    ? store.transforms[measureId]
    : undefined;

  const sourceField =
    recordedTx?.sourceField ||
    measure?.sourceField ||
    recordedBlock?.rawField ||
    opts.block.dimensionKeys?.[0] ||
    opts.block.dimensionKey ||
    '';

  const formula = (recordedTx?.formula || measure?.formula || '').trim();
  const aggregation = recordedTx?.aggregation || measure?.aggregation || '';
  const calcOnSource = opts.origin.calculatedFields?.find((c) => c.name === sourceField);

  const nodes: LineageNode[] = [];
  const edges: LineageEdge[] = [];
  const src = lookupSource(store, opts.origin);
  const sourceId = 'source';
  nodes.push({
    id: sourceId,
    type: 'source',
    label: src?.fileName ?? opts.origin.label ?? 'Uploaded file',
    detail: src
      ? `Uploaded ${new Date(src.uploadedAt).toLocaleString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })} by ${src.uploadedBy} · ${src.rowCount.toLocaleString('en-IN')} rows`
      : `${opts.origin.recordCount.toLocaleString('en-IN')} rows currently loaded`,
    timestamp: src?.uploadedAt,
  });

  let prev = sourceId;
  const formulaFields = formula ? fieldsInFormula(formula) : calcOnSource ? fieldsInFormula(calcOnSource.formula) : [];
  const columnKey = formulaFields[0] || sourceField;

  if (columnKey) {
    const colId = `column:${columnKey}`;
    nodes.push({
      id: colId,
      type: 'column',
      label: columnLabel(opts.origin, columnKey, opts.catalog),
      detail: columnDetail(opts.origin, columnKey),
    });
    edges.push({ from: prev, to: colId });
    prev = colId;
  }

  const calcFormula = formula || calcOnSource?.formula;
  if (calcFormula) {
    const calcId = `calc:${measure?.id ?? calcOnSource?.name ?? 'field'}`;
    const extraFields = formulaFields.filter((f) => f !== columnKey);
    nodes.push({
      id: calcId,
      type: 'calculated-field',
      label: measure?.name ? `${measure.name} formula` : calcOnSource?.name ?? 'Calculated field',
      detail: extraFields.length
        ? `${calcFormula} · also uses ${extraFields.map((f) => columnLabel(opts.origin, f, opts.catalog)).join(', ')}`
        : calcFormula,
    });
    edges.push({ from: prev, to: calcId, transform: calcFormula });
    prev = calcId;
  }

  if (measure) {
    const mId = `measure:${measure.id}`;
    const expr = formula ? `${aggregation || measure.aggregation} of formula` : measureExpression(measure);
    const when = new Date(measure.updatedAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    nodes.push({
      id: mId,
      type: 'governed-measure',
      label: measure.name,
      detail: `${measureExpression(measure)} · ${measure.status === 'approved' ? 'Approved' : 'Draft'} by ${measure.owner}, ${when}`,
      timestamp: measure.updatedAt,
    });
    edges.push({
      from: prev,
      to: mId,
      transform: formula ? `${aggregation || measure.aggregation}(${sourceField || 'formula'})` : expr,
    });
    prev = mId;
  }

  const blockId = `block:${opts.block.id}`;
  const result = resultAtView({
    block: opts.block,
    series: opts.series,
    viewSource: opts.viewSource,
    measure,
  });
  nodes.push({
    id: blockId,
    type: 'block',
    label: `${opts.dashboardName} → ${pickerByType(opts.block.type).label}`,
    detail: `Result at time of view: ${result}`,
    timestamp: Date.now(),
  });
  const filtered = filterTransform(opts.filters, opts.origin, opts.catalog);
  edges.push({
    from: prev,
    to: blockId,
    transform: filtered,
  });

  return { targetBlockId: opts.block.id, nodes, edges };
}
