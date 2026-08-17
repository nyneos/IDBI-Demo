import { autoTitle, pickerByType } from './chartRegistry';
import { defaultReportingConfig } from '@/components/table/ReportingTableBlock';
import {
  BLOCK_MIN_SIZE,
  DEFAULT_TITLE_SETTINGS,
  type DashboardBlock,
  type DashboardDataSource,
  type WorkingBlockType,
} from './types';

export interface DrillChartRec {
  type: WorkingBlockType;
  reason: string;
  dimensionKeys: string[];
}

export function recommendDrillCharts(
  block: DashboardBlock,
  source: DashboardDataSource,
): DrillChartRec[] {
  const field = block.dimensionKeys?.[0] || block.dimensionKey;
  const dims = source.dimensions.map((d) => d.key);
  const dates = (source.dates ?? []).map((d) => d.key);
  const nextDim = dims.find((k) => k && k !== field) ?? field;
  const dateKey = dates[0];

  const recs: DrillChartRec[] = [];
  const add = (type: WorkingBlockType, reason: string, keys: string[]) => {
    if (recs.some((r) => r.type === type)) return;
    recs.push({ type, reason, dimensionKeys: keys.filter(Boolean) });
  };

  if (field) {
    if (block.type !== 'kpi') add('kpi', 'Headline count for the value you clicked', [field]);
    if (block.type !== 'pie') add('pie', `Share breakdown of ${field.replace(/_/g, ' ')}`, [field]);
    if (block.type !== 'bar') add('bar', `Ranked values for ${field.replace(/_/g, ' ')}`, [field]);
    if (block.type !== 'table') add('table', 'Row-level list for this slice', [field]);
  }
  if (nextDim && nextDim !== field) {
    add('stacked-bar', `How ${nextDim.replace(/_/g, ' ')} splits inside this card`, [field, nextDim]);
  }
  if (dateKey) {
    add('line', 'Trend of this slice over time', [dateKey]);
  }
  add('reporting-table', 'Grouped report you can filter after the drill', field ? [field] : []);

  return recs.slice(0, 4);
}

export function recToBlock(
  rec: DrillChartRec,
  source: DashboardDataSource,
): Omit<DashboardBlock, 'id'> {
  const size = BLOCK_MIN_SIZE[rec.type];
  const label = rec.dimensionKeys[0] ?? '';
  return {
    type: rec.type,
    dimensionKey: rec.dimensionKeys[0] ?? '',
    dimensionKeys: rec.dimensionKeys,
    title: rec.type === 'reporting-table' ? 'Group Table' : autoTitle(rec.type, label) || pickerByType(rec.type).label,
    titleSettings: { ...DEFAULT_TITLE_SETTINGS },
    includeInCrossFilter: true,
    reportingConfig: rec.type === 'reporting-table' ? defaultReportingConfig(source) : undefined,
    layout: { i: '', x: 0, y: 0, w: size.w, h: size.h, minW: size.minW, minH: size.minH },
  };
}
