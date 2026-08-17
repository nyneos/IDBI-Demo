import type { LucideIcon } from 'lucide-react';
import {
  AlignEndHorizontal,
  BarChart2,
  BarChart3,
  CircleDot,
  Gauge,
  GitBranch,
  Grid3x3,
  Heading2,
  Hexagon,
  LayoutGrid,
  LineChart as LineChartIcon,
  Rows3,
  Network,
  PieChart,
  ScatterChart,
  Share2,
  SlidersHorizontal,
  SlidersVertical,
  Square,
  Table,
  Target,
  TrendingUp,
  Workflow,
} from 'lucide-react';
import type { WorkingBlockType } from './types';

export interface PickerItem {
  type: WorkingBlockType;
  label: string;
  icon: LucideIcon;
  group: 'tier1' | 'tier2' | 'tier3' | 'utility' | 'report';
}

export const PICKER_ITEMS: PickerItem[] = [
  { type: 'bar', label: 'Bar Chart', icon: BarChart3, group: 'tier1' },
  { type: 'line', label: 'Line Graph', icon: LineChartIcon, group: 'tier1' },
  { type: 'pie', label: 'Pie Chart', icon: PieChart, group: 'tier1' },
  { type: 'heatmap', label: 'Heatmap', icon: Grid3x3, group: 'tier1' },
  { type: 'scatter', label: 'Scatter Chart', icon: ScatterChart, group: 'tier1' },
  { type: 'radial', label: 'Radial Bar', icon: CircleDot, group: 'tier1' },
  { type: 'gauge', label: 'Gauge', icon: Gauge, group: 'tier1' },
  { type: 'double-bar', label: 'Double Bar', icon: BarChart2, group: 'tier1' },
  { type: 'stacked-bar', label: 'Stacked Bar', icon: AlignEndHorizontal, group: 'tier1' },
  { type: 'kpi', label: 'KPI', icon: TrendingUp, group: 'tier1' },
  { type: 'table', label: 'Table', icon: Table, group: 'tier1' },
  { type: 'reporting-table', label: 'Group Table', icon: Rows3, group: 'report' },
  { type: 'filter', label: 'Filter', icon: SlidersHorizontal, group: 'utility' },
  { type: 'section-title', label: 'H2 Section Title', icon: Heading2, group: 'utility' },
  { type: 'div', label: 'Div Container', icon: Square, group: 'utility' },
  { type: 'sunburst', label: 'Sunburst Chart', icon: Target, group: 'tier1' },
  { type: 'sankey', label: 'Sankey Diagram', icon: Share2, group: 'tier1' },
  { type: 'network', label: 'Network Graph', icon: Network, group: 'tier1' },
  { type: 'treemap', label: 'Treemap', icon: LayoutGrid, group: 'tier2' },
  { type: 'icicle', label: 'Icicle Chart', icon: AlignEndHorizontal, group: 'tier2' },
  { type: 'pack', label: 'Circle Packing', icon: CircleDot, group: 'tier2' },
  { type: 'radial-tree', label: 'Radial Tree', icon: GitBranch, group: 'tier2' },
  { type: 'chord', label: 'Chord Diagram', icon: Workflow, group: 'tier3' },
  { type: 'hive', label: 'Hive Plot', icon: Hexagon, group: 'tier3' },
  { type: 'parallel-sets', label: 'Parallel Sets', icon: Share2, group: 'tier3' },
  { type: 'combo', label: 'Combo Chart', icon: BarChart2, group: 'tier1' },
  { type: 'slicer', label: 'Slicer', icon: SlidersHorizontal, group: 'utility' },
  { type: 'what-if', label: 'What-If Parameter', icon: SlidersVertical, group: 'utility' },
];

export function pickerByType(type: WorkingBlockType): PickerItem {
  return PICKER_ITEMS.find((p) => p.type === type) ?? PICKER_ITEMS[0]!;
}

export function needsNoField(type: WorkingBlockType): boolean {
  return type === 'section-title' || type === 'div' || type === 'what-if';
}

export function fieldArity(type: WorkingBlockType): { min: number; max: number } {
  switch (type) {
    case 'section-title':
    case 'div':
    case 'reporting-table':
      return { min: 0, max: 0 };
    case 'heatmap':
    case 'scatter':
    case 'double-bar':
    case 'stacked-bar':
    case 'network':
    case 'chord':
      return { min: 2, max: 2 };
    case 'hive':
      return { min: 3, max: 3 };
    case 'sankey':
    case 'parallel-sets':
      return { min: 2, max: 4 };
    case 'sunburst':
    case 'treemap':
    case 'icicle':
    case 'pack':
    case 'radial-tree':
      return { min: 1, max: 4 };
    case 'combo':
      return { min: 2, max: 3 };
    case 'slicer':
    case 'what-if':
      return { min: 1, max: 1 };
    default:
      return { min: 1, max: 1 };
  }
}

export function autoTitle(type: WorkingBlockType, fieldLabel: string): string {
  if (type === 'gauge') return fieldLabel || 'Gauge';
  if (type === 'kpi') return fieldLabel || 'KPI';
  if (type === 'filter') return `Filter · ${fieldLabel}`;
  if (type === 'section-title') return 'Section';
  if (type === 'div') return 'Spacer';
  if (type === 'reporting-table') return 'Group Table';
  if (!fieldLabel) return pickerByType(type).label;
  if (type === 'sunburst' || type === 'treemap' || type === 'icicle' || type === 'pack' || type === 'radial-tree') {
    return `${pickerByType(type).label}`;
  }
  return `${fieldLabel}`;
}
