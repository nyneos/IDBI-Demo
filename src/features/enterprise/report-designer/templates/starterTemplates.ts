import type { ReportChartVisual, ReportSection, ReportTemplate } from '../types';
import { chartVisualLabel } from '../chartVisuals';

function sectionId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export const STARTER_TEMPLATES: ReportTemplate[] = [
  {
    id: 'daily-transaction-summary',
    name: 'Daily Transaction Summary Statement',
    pageSize: 'A4',
    orientation: 'portrait',
    header: {
      logo: true,
      title: 'IDBI Bank — Daily Transaction Summary',
      subtitle: '{Branch_Name} — {Report_Date}',
    },
    bodySections: [
      {
        id: 'daily-kpi',
        type: 'kpi-row',
        title: 'Summary',
        measureNames: ['Total Transactions', 'Success Rate', 'Average Transaction Value'],
      },
      {
        id: 'daily-table',
        type: 'table',
        title: 'Transactions by Category',
        boundTable: {
          groupBy: 'Transaction_Category',
          columns: ['Transaction_Category', 'Count', 'Total Amount'],
        },
      },
    ],
    footer: { showPageNumbers: true, showGeneratedDate: true },
    signatureBlock: {
      lines: [{ label: 'Prepared By' }, { label: 'Reviewed By' }, { label: 'Approved By' }],
    },
  },
  {
    id: 'branch-performance-certificate',
    name: 'Branch Performance Certificate',
    pageSize: 'A4',
    orientation: 'portrait',
    header: {
      logo: true,
      title: 'Branch Performance Certificate',
      subtitle: '{Branch_Name} · Certificate date {Report_Date}',
    },
    bodySections: [
      {
        id: 'branch-kpi',
        type: 'kpi-row',
        measureNames: ['Branch Transaction Count', 'Branch Success Rate', 'Average Transaction Value'],
      },
      {
        id: 'branch-text',
        type: 'text',
        text: 'This certifies that the branch named above has been reviewed against the uploaded transaction register for {Report_Date}. Figures are computed from the active data slice in Enterprise Suite.',
      },
    ],
    footer: {
      showPageNumbers: true,
      showGeneratedDate: true,
      customText: 'Statutory print output — vector text, not a dashboard screenshot.',
    },
    signatureBlock: {
      lines: [{ label: 'Prepared By' }, { label: 'Reviewed By' }, { label: 'Approved By' }],
    },
  },
];

export function cloneTemplate(template: ReportTemplate): ReportTemplate {
  return JSON.parse(JSON.stringify(template)) as ReportTemplate;
}

export function freshSection(
  type: ReportSection['type'],
  opts?: { visual?: ReportChartVisual; fields?: string[] },
): ReportSection {
  const fields = opts?.fields ?? [];
  const first = fields[0] ?? 'Transaction_Category';
  if (type === 'kpi-row') {
    return { id: sectionId('sec'), type, title: 'KPI row', measureNames: [], boundMeasures: [] };
  }
  if (type === 'table') {
    return {
      id: sectionId('sec'),
      type,
      title: 'Grouped table',
      boundTable: { groupBy: first, columns: [first, 'Count'] },
    };
  }
  if (type === 'records-table') {
    return {
      id: sectionId('sec'),
      type,
      title: 'Records',
      recordColumns: fields.slice(0, 6),
    };
  }
  if (type === 'chart') {
    const visual = opts?.visual ?? 'bar';
    return {
      id: sectionId('sec'),
      type,
      title: chartVisualLabel(visual),
      chart: { visual, dimensionKey: first, secondaryKey: fields[1] },
    };
  }
  return { id: sectionId('sec'), type: 'text', title: 'Notes', text: '' };
}
