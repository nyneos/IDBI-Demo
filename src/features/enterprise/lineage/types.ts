export type LineageNodeType =
  | 'source'
  | 'column'
  | 'calculated-field'
  | 'governed-measure'
  | 'filter'
  | 'block';

export interface LineageNode {
  id: string;
  type: LineageNodeType;
  label: string;
  detail: string;
  timestamp?: number;
}

export interface LineageEdge {
  from: string;
  to: string;
  transform?: string;
}

export interface LineageChain {
  targetBlockId: string;
  nodes: LineageNode[];
  edges: LineageEdge[];
}

export interface FilterState {
  entries: { field: string; value: string }[];
}

export interface LineageSourceRecord {
  fileName: string;
  uploadedBy: string;
  rowCount: number;
  uploadedAt: number;
}

export interface LineageTransformRecord {
  measureId: string;
  sourceField: string;
  formula: string;
  aggregation: string;
}

export interface LineageBlockRecord {
  blockId: string;
  measureId: string | null;
  rawField: string | null;
  activeFilters: FilterState;
}

export interface LineageStore {
  sources: Record<string, LineageSourceRecord>;
  transforms: Record<string, LineageTransformRecord>;
  blocks: Record<string, LineageBlockRecord>;
}

export const EMPTY_LINEAGE_STORE: LineageStore = {
  sources: {},
  transforms: {},
  blocks: {},
};

export function sourceKey(fileName: string, rowCount: number) {
  return `${fileName}::${rowCount}`;
}
