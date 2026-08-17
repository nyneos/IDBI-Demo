export interface ReportSectionField<T> {
  key: keyof T | string;
  label?: string;
  formatter?: (value: unknown, row: T) => string;
}

export interface ReportSection<T> {
  title: string;
  fields: ReportSectionField<T>[] | ((row: T) => ReportSectionField<T>[]);
}
