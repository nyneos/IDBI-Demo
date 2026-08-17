export type MeasureAggregation = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
export type MeasureFormat = 'currency-inr' | 'percent' | 'number' | 'days';
export type GovernanceStatus = 'draft' | 'approved';

export interface GovernedMeasure {
  id: string;
  name: string;
  description: string;
  sourceField: string;
  aggregation: MeasureAggregation;
  format: MeasureFormat;
  formula?: string;
  owner: string;
  status: GovernanceStatus;
  createdAt: number;
  updatedAt: number;
}

export interface GovernedDimension {
  id: string;
  name: string;
  description: string;
  sourceField: string;
  valueLabels?: Record<string, string>;
  owner: string;
  status: GovernanceStatus;
  createdAt: number;
  updatedAt: number;
}

export interface BlockSemanticBinding {
  measureId?: string;
  dimensionId?: string;
}

export interface SemanticCatalog {
  measures: GovernedMeasure[];
  dimensions: GovernedDimension[];
  bindings: Record<string, BlockSemanticBinding>;
  updatedAt: number;
}

export const EMPTY_CATALOG: SemanticCatalog = {
  measures: [],
  dimensions: [],
  bindings: {},
  updatedAt: 0,
};
