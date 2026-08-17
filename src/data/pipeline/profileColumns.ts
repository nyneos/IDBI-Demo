import { cellString } from './normalise';
import type { DimensionMeta, RawRecord, RawValue } from './types';

const DATE_HINT = /date|time|on\b|at\b/i;
const ID_HINT = /^(id|uid|uuid|sr\.? ?no|s\.?no|transaction ?id|ticket|ref(erence)?)$/i;
const METRIC_HINT = /amount|fine|score|rate|%|count|qty|quantity|days|duration|value/i;
const IGNORE_HINT = /atr\b|remark|comment|description|narrative|free ?text|kitchen station/i;

const HARD_CARDINALITY_CAP = 80;
const NEAR_CEILING = 50;
const UNIQUE_ID_RATIO = 0.85;
const MIN_FILL_FOR_DIM = 0.05;

function parseDate(value: RawValue | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'number' && value > 20000 && value < 80000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + value);
    return epoch;
  }
  if (typeof value === 'string') {
    const t = Date.parse(value);
    if (!Number.isNaN(t)) return new Date(t);
  }
  return null;
}

function isNumeric(value: RawValue): boolean {
  if (typeof value === 'number' && Number.isFinite(value)) return true;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return true;
  return false;
}

function distinctStrings(records: RawRecord[], key: string): string[] {
  const set = new Set<string>();
  for (const row of records) {
    const s = cellString(row[key]);
    if (s != null) set.add(s);
  }
  return [...set];
}

function dateSparse(records: RawRecord[], key: string): boolean {
  const times = records
    .map((row) => parseDate(row[key]))
    .filter((d): d is Date => d != null)
    .map((d) => d.getTime())
    .sort((a, b) => a - b);
  const uniq = [...new Set(times)];
  if (uniq.length < 2) return false;
  let clusters = 1;
  for (let i = 1; i < uniq.length; i++) {
    const gapDays = (uniq[i]! - uniq[i - 1]!) / 86_400_000;
    if (gapDays > 45) clusters += 1;
  }
  return clusters >= 2;
}

function looksLikeDateColumn(_records: RawRecord[], key: string, filled: RawValue[]): boolean {
  const sample = filled.slice(0, 80);
  if (sample.length === 0) return false;
  const parsed = sample.filter((v) => parseDate(v) != null).length;
  if (parsed / sample.length >= 0.7) return true;
  if (DATE_HINT.test(key) && parsed / sample.length >= 0.4) return true;
  return false;
}

function avgStringLen(values: RawValue[]): number {
  const strs = values.map((v) => cellString(v)).filter((s): s is string => s != null);
  if (strs.length === 0) return 0;
  return strs.reduce((s, v) => s + v.length, 0) / strs.length;
}

export function profileColumns(records: RawRecord[]): DimensionMeta[] {
  if (records.length === 0) return [];
  const keys = [...new Set(records.flatMap((row) => Object.keys(row)))];
  const n = records.length;

  return keys.map((key) => {
    const filledVals: RawValue[] = records
      .map((r) => r[key])
      .filter((v): v is RawValue => v != null && v !== '');
    const filled = filledVals.length;
    const fillRate = filled / n;
    const distinct = distinctStrings(records, key);
    const cardinality = distinct.length;
    const label = key;
    const numericShare =
      filled === 0 ? 0 : filledVals.filter((v) => isNumeric(v)).length / filled;

    const base = {
      key,
      label,
      fillRate,
      cardinality,
      filled,
    };

    if (fillRate < MIN_FILL_FOR_DIM) {
      return { ...base, role: 'ignored' as const, reason: 'empty or nearly empty' };
    }
    if (ID_HINT.test(key) || (cardinality >= Math.max(40, n * UNIQUE_ID_RATIO) && fillRate > 0.8)) {
      return { ...base, role: 'ignored' as const, reason: 'unique identifier' };
    }
    if (IGNORE_HINT.test(key) || (avgStringLen(filledVals) > 48 && cardinality > 30)) {
      return { ...base, role: 'ignored' as const, reason: 'free text' };
    }
    if (looksLikeDateColumn(records, key, filledVals)) {
      return {
        ...base,
        role: 'date' as const,
        sparse: dateSparse(records, key),
        reason: dateSparse(records, key) ? 'date with clustered gaps' : 'date',
      };
    }
    if (numericShare >= 0.85 && (cardinality > 20 || METRIC_HINT.test(key))) {
      return { ...base, role: 'metric' as const, reason: 'numeric measure' };
    }
    if (cardinality < 2) {
      return { ...base, role: 'ignored' as const, reason: 'single value' };
    }
    if (cardinality > HARD_CARDINALITY_CAP) {
      return {
        ...base,
        role: 'ignored' as const,
        nearCeiling: true,
        reason: 'cardinality above usable ceiling',
      };
    }

    return {
      ...base,
      role: 'dimension' as const,
      nearCeiling: cardinality > NEAR_CEILING,
      reason: cardinality > NEAR_CEILING ? 'near cardinality ceiling' : undefined,
    };
  });
}

export function eligibleDimensions(profile: DimensionMeta[]): DimensionMeta[] {
  return profile.filter(
    (d) =>
      d.role === 'dimension' &&
      d.fillRate >= 0.6 &&
      d.cardinality >= 2 &&
      d.cardinality <= HARD_CARDINALITY_CAP,
  );
}
