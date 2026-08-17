import type { ReportChartVisual } from './chartVisuals';

export type ReportPageSize = 'A4' | 'Letter';
export type ReportOrientation = 'portrait' | 'landscape';
export type { ReportChartVisual };

export interface ReportTemplate {
  id: string;
  name: string;
  pageSize: ReportPageSize;
  orientation: ReportOrientation;
  header: { logo?: boolean; title: string; subtitle?: string };
  bodySections: ReportSection[];
  footer: { showPageNumbers: boolean; showGeneratedDate: boolean; customText?: string };
  signatureBlock?: { lines: { label: string }[] };
}

export interface ReportChartBinding {
  visual: ReportChartVisual;
  dimensionKey: string;
  secondaryKey?: string;
}

export interface ReportSection {
  id: string;
  type: 'kpi-row' | 'table' | 'records-table' | 'text' | 'chart';
  title?: string;
  /** Governed measure ids (preferred). */
  boundMeasures?: string[];
  /** Resolved at export when ids are not yet bound — matches semantic catalog by name. */
  measureNames?: string[];
  boundTable?: { groupBy: string; columns: string[] };
  /** Column keys for a records (fact) table. */
  recordColumns?: string[];
  chart?: ReportChartBinding;
  text?: string;
}

export interface ResolvedMeasure {
  label: string;
  formattedValue: string;
  rawValue: number;
}

export interface ChartSeriesPoint {
  label: string;
  value: number;
}

export interface ReportData {
  placeholders: Record<string, string>;
  measures: Map<string, ResolvedMeasure>;
  tableRows: Map<string, string[][]>;
  recordRows: Map<string, string[][]>;
  chartSeries: Map<string, ChartSeriesPoint[]>;
}
