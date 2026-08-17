import type { HierarchyNode } from '@/data/types';
import type { DimensionMeta, LabelValue, RawRecord } from '@/data/pipeline/types';

export type WorkingBlockType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'gauge'
  | 'scatter'
  | 'radial'
  | 'double-bar'
  | 'stacked-bar'
  | 'heatmap'
  | 'kpi'
  | 'table'
  | 'reporting-table'
  | 'sunburst'
  | 'sankey'
  | 'network'
  | 'filter'
  | 'section-title'
  | 'div'
  | 'treemap'
  | 'icicle'
  | 'pack'
  | 'radial-tree'
  | 'chord'
  | 'hive'
  | 'parallel-sets'
  | 'combo'
  | 'slicer'
  | 'what-if'
  | 'key-influencers'
  | 'decomposition-tree';

export type TitleSize = 'small' | 'medium' | 'large';
export type TitleWeight = 'regular' | 'medium' | 'semibold' | 'bold';
export type TitleAlign = 'start' | 'center' | 'end';
export type KpiMode = 'count' | 'top' | 'rate';

export interface TitleSettings {
  size: TitleSize;
  weight: TitleWeight;
  align: TitleAlign;
}

export type ComboSeriesType = 'bar' | 'line' | 'area';
export type ComboAxis = 'left' | 'right';

export interface ComboSeries {
  type: ComboSeriesType;
  field: string;
  axis: ComboAxis;
  axisLabel?: string;
}

export interface GridLayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export type CondFormatType = 'color-scale' | 'data-bars' | 'icon-set' | 'threshold';

export interface CondFormatRule {
  type: CondFormatType;
  field: string;
  low?: string;
  high?: string;
  threshold?: number;
}

export interface DashboardBlock {
  id: string;
  type: WorkingBlockType;
  dimensionKey: string;
  dimensionKeys?: string[];
  kpiMode?: KpiMode;
  spacerHeight?: number;
  title: string;
  titleSettings: TitleSettings;
  axisLabels?: { x?: string; y?: string };
  combo?: { series1: ComboSeries; series2: ComboSeries; xField: string };
  sourceId?: string;
  includeInCrossFilter?: boolean;
  slicerStyle?: 'dropdown' | 'chips';
  whatIf?: { name: string; min: number; max: number; step: number; value: number };
  condFormat?: CondFormatRule;
  enableDrillThrough?: boolean;
  drillThroughTargetId?: string;
  drillThroughSourceField?: string;
  drillThroughTargetField?: string;
  reportingConfig?: {
    groupBy: string[];
    columns: string[];
    aggregatableColumns: string[];
    expandableFields: string[];
  };
  /** Enterprise AI blocks — target value for key influencers (field in dimensionKey). */
  aiConfig?: { targetValue?: string };
  layout?: GridLayoutItem;
}

export interface CustomDashboardState {
  sectionTitle: string;
  blocks: DashboardBlock[];
}

export interface DashboardState {
  id: string;
  name: string;
  blocks: DashboardBlock[];
  createdAt: number;
  updatedAt: number;
  isTemplate: boolean;
  published?: boolean;
  moduleId?: string | null;
  layout: GridLayoutItem[];
  drillThroughFields?: string[];
  isDrillThroughTarget?: boolean;
  parentDashboardId?: string | null;
  parentChartTitle?: string;
}

export interface ChartSuggestion {
  type: WorkingBlockType;
  reason: string;
  field?: string;
  fields?: string[];
}

export interface GaugeMetric {
  key: string;
  label: string;
  value: number;
  target: number;
  unit: string;
}

export interface DimensionOption {
  key: string;
  label: string;
  fillRate?: number;
  cardinality?: number;
  sparse?: boolean;
  role?: DimensionMeta['role'];
  calculated?: boolean;
  aggregate: () => LabelValue[];
}

export type SlimRecord = Record<string, string | number | null>;

export interface DashboardDataSource {
  id: string;
  label: string;
  dimensions: DimensionOption[];
  recordCount: number;
  suggestions: ChartSuggestion[];
  profile?: DimensionMeta[];
  excludedCount?: number;
  facts?: SlimRecord[];
  raw?: RawRecord[];
  hierarchy?: HierarchyNode;
  gauges?: GaugeMetric[];
  metrics?: DimensionOption[];
  dates?: DimensionOption[];
  categoryColors?: Record<string, string>;
  calculatedFields?: CalculatedFieldDef[];
}

export interface CalculatedFieldDef {
  name: string;
  formula: string;
  format: 'number' | 'percent';
}

export interface PersistedDimension {
  key: string;
  label: string;
  fillRate?: number;
  cardinality?: number;
  sparse?: boolean;
  role?: DimensionMeta['role'];
  calculated?: boolean;
  data: LabelValue[];
}

export interface PersistedDataSource {
  id: string;
  label: string;
  recordCount: number;
  dimensions: PersistedDimension[];
  excludedCount?: number;
  suggestions: ChartSuggestion[];
  facts?: SlimRecord[];
  hierarchy?: HierarchyNode;
  gauges?: GaugeMetric[];
  profile?: DimensionMeta[];
  categoryColors?: Record<string, string>;
  calculatedFields?: CalculatedFieldDef[];
  metrics?: PersistedDimension[];
}

export const DEFAULT_TITLE_SETTINGS: TitleSettings = {
  size: 'medium',
  weight: 'semibold',
  align: 'start',
};

export const DEFAULT_DASHBOARD_STATE: CustomDashboardState = {
  sectionTitle: 'Custom Analysis',
  blocks: [],
};

export const TITLE_SIZE_CLASS: Record<TitleSize, string> = {
  small: 'text-base',
  medium: 'text-lg',
  large: 'text-xl',
};

export const TITLE_WEIGHT_CLASS: Record<TitleWeight, string> = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const TITLE_ALIGN_CLASS: Record<TitleAlign, string> = {
  start: 'text-left',
  center: 'text-center',
  end: 'text-right',
};

export const BLOCK_SPAN_CLASS: Record<WorkingBlockType, string> = {
  pie: 'col-span-12 md:col-span-4',
  gauge: 'col-span-12 md:col-span-4',
  kpi: 'col-span-12 md:col-span-4',
  radial: 'col-span-12 md:col-span-4',
  scatter: 'col-span-12 md:col-span-6',
  bar: 'col-span-12 md:col-span-6',
  line: 'col-span-12 md:col-span-6',
  table: 'col-span-12 md:col-span-6',
  heatmap: 'col-span-12 md:col-span-6',
  'double-bar': 'col-span-12 md:col-span-6',
  'stacked-bar': 'col-span-12 md:col-span-6',
  filter: 'col-span-12 md:col-span-4',
  slicer: 'col-span-12 md:col-span-4',
  'what-if': 'col-span-12 md:col-span-4',
  combo: 'col-span-12 md:col-span-8',
  'section-title': 'col-span-12',
  div: 'col-span-12',
  'reporting-table': 'col-span-12',
  sunburst: 'col-span-12',
  sankey: 'col-span-12',
  network: 'col-span-12',
  treemap: 'col-span-12',
  icicle: 'col-span-12',
  pack: 'col-span-12',
  'radial-tree': 'col-span-12',
  chord: 'col-span-12',
  hive: 'col-span-12',
  'parallel-sets': 'col-span-12',
  'key-influencers': 'col-span-12 md:col-span-6',
  'decomposition-tree': 'col-span-12',
};

export const BLOCK_MIN_SIZE: Record<WorkingBlockType, { minW: number; minH: number; w: number; h: number }> = {
  bar: { minW: 4, minH: 6, w: 6, h: 8 },
  line: { minW: 4, minH: 6, w: 6, h: 8 },
  pie: { minW: 3, minH: 6, w: 4, h: 8 },
  gauge: { minW: 3, minH: 6, w: 4, h: 8 },
  scatter: { minW: 4, minH: 6, w: 6, h: 8 },
  radial: { minW: 3, minH: 6, w: 4, h: 8 },
  'double-bar': { minW: 4, minH: 6, w: 6, h: 8 },
  'stacked-bar': { minW: 4, minH: 6, w: 6, h: 8 },
  heatmap: { minW: 4, minH: 6, w: 6, h: 8 },
  kpi: { minW: 3, minH: 4, w: 4, h: 5 },
  table: { minW: 4, minH: 6, w: 6, h: 8 },
  'reporting-table': { minW: 6, minH: 10, w: 12, h: 12 },
  sunburst: { minW: 6, minH: 10, w: 12, h: 14 },
  sankey: { minW: 6, minH: 8, w: 12, h: 10 },
  network: { minW: 6, minH: 8, w: 12, h: 10 },
  filter: { minW: 3, minH: 4, w: 4, h: 5 },
  slicer: { minW: 3, minH: 4, w: 4, h: 6 },
  'what-if': { minW: 3, minH: 4, w: 4, h: 5 },
  'section-title': { minW: 12, minH: 2, w: 12, h: 2 },
  div: { minW: 12, minH: 2, w: 12, h: 3 },
  treemap: { minW: 6, minH: 8, w: 12, h: 10 },
  icicle: { minW: 6, minH: 8, w: 12, h: 10 },
  pack: { minW: 6, minH: 8, w: 12, h: 10 },
  'radial-tree': { minW: 6, minH: 8, w: 12, h: 10 },
  chord: { minW: 6, minH: 8, w: 12, h: 10 },
  hive: { minW: 6, minH: 8, w: 12, h: 10 },
  'parallel-sets': { minW: 6, minH: 8, w: 12, h: 10 },
  combo: { minW: 5, minH: 8, w: 8, h: 9 },
  'key-influencers': { minW: 4, minH: 8, w: 6, h: 10 },
  'decomposition-tree': { minW: 6, minH: 10, w: 12, h: 12 },
};

export const ALL_BLOCK_TYPES: WorkingBlockType[] = [
  'bar',
  'line',
  'pie',
  'gauge',
  'scatter',
  'radial',
  'double-bar',
  'stacked-bar',
  'heatmap',
  'kpi',
  'table',
  'reporting-table',
  'sunburst',
  'sankey',
  'network',
  'filter',
  'section-title',
  'div',
  'treemap',
  'icicle',
  'pack',
  'radial-tree',
  'chord',
  'hive',
  'parallel-sets',
  'combo',
  'slicer',
  'what-if',
  'key-influencers',
  'decomposition-tree',
];
