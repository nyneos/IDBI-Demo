export type ColumnRole = 'dimension' | 'date' | 'metric' | 'ignored';

export type RawValue = string | number | boolean | Date | null;

export type RawRecord = Record<string, RawValue>;

export interface DimensionMeta {
  key: string;
  label: string;
  role: ColumnRole;
  fillRate: number;
  cardinality: number;
  filled: number;
  sparse?: boolean;
  nearCeiling?: boolean;
  reason?: string;
}

export interface LabelValue {
  label: string;
  value: number;
}
