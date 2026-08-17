import { PICKER_ITEMS } from '@/components/dashboard-builder/chartRegistry';
import type { WorkingBlockType } from '@/components/dashboard-builder/types';

const SKIP = new Set<WorkingBlockType>([
  'filter',
  'section-title',
  'div',
  'slicer',
  'what-if',
  'table',
  'kpi',
  'reporting-table',
]);

export type ReportChartVisual = Exclude<
  WorkingBlockType,
  'filter' | 'section-title' | 'div' | 'slicer' | 'what-if' | 'table' | 'kpi' | 'reporting-table' | 'key-influencers' | 'decomposition-tree'
>;

export const REPORT_CHART_VISUALS = PICKER_ITEMS.filter((p) => !SKIP.has(p.type)).map((p) => ({
  type: p.type as ReportChartVisual,
  label: p.label,
}));

export function chartVisualLabel(visual: ReportChartVisual): string {
  return REPORT_CHART_VISUALS.find((p) => p.type === visual)?.label ?? visual;
}

export function needsSecondaryField(visual: ReportChartVisual): boolean {
  return (
    visual === 'heatmap' ||
    visual === 'scatter' ||
    visual === 'double-bar' ||
    visual === 'stacked-bar' ||
    visual === 'combo' ||
    visual === 'sankey' ||
    visual === 'network' ||
    visual === 'chord' ||
    visual === 'parallel-sets'
  );
}

export function sectionKindLabel(type: string, visual?: ReportChartVisual): string {
  if (type === 'kpi-row') return 'KPI row';
  if (type === 'table') return 'Grouped table';
  if (type === 'records-table') return 'Records table';
  if (type === 'text') return 'Text';
  if (type === 'chart' && visual) return chartVisualLabel(visual);
  return type;
}
