import type { RawRecord, RawValue } from './types';

function cellValue(value: unknown): RawValue {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'string') {
    const trimmed = value.replace(/\u00a0/g, ' ').trim();
    return trimmed === '' ? null : trimmed;
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  return String(value);
}

/** Trim, collapse whitespace/tabs on headers, drop blank header keys. */
export function normaliseHeaders(rows: Record<string, unknown>[]): RawRecord[] {
  return rows.map((row) => {
    const out: RawRecord = {};
    for (const [rawKey, rawVal] of Object.entries(row)) {
      const key = rawKey.replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
      if (!key) continue;
      const existing = out[key];
      const next = cellValue(rawVal);
      if (existing == null) out[key] = next;
    }
    return out;
  });
}

export function cellString(value: RawValue | undefined): string | null {
  if (value == null) return null;
  if (typeof value === 'string') {
    const t = value.trim();
    return t === '' ? null : t;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}
