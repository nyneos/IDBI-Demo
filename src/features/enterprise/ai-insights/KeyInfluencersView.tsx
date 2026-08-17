import { useMemo } from 'react';
import { factsOf } from '@/components/dashboard-builder/blockData';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import { Select } from '@/components/ui/Select';
import { InfluenceStrengthDots } from './InfluenceStrengthDots';
import {
  candidateInfluenceFields,
  computeInfluence,
  MIN_INFLUENCE_SAMPLE,
  targetValuesForField,
} from './computeInfluence';

export function KeyInfluencersView({
  source,
  targetField,
  targetValue,
  onTargetFieldChange,
  onTargetValueChange,
  compact = false,
}: {
  source: DashboardDataSource;
  targetField: string;
  targetValue: string;
  onTargetFieldChange?: (field: string) => void;
  onTargetValueChange?: (value: string) => void;
  compact?: boolean;
}) {
  const records = factsOf(source);
  const profileKeys = (source.profile ?? []).map((d) => d.key);
  const targetFields = useMemo(() => {
    const keys = new Set<string>(['Status', 'Transaction_Category']);
    for (const d of source.dimensions) keys.add(d.key);
    for (const k of profileKeys) keys.add(k);
    return [...keys].sort();
  }, [source, profileKeys]);

  const targetValues = useMemo(
    () => (targetField ? targetValuesForField(records, targetField) : []),
    [records, targetField],
  );

  const results = useMemo(() => {
    if (!targetField || !targetValue) return [];
    const candidates = candidateInfluenceFields(records, targetField, profileKeys);
    return computeInfluence(records, targetField, targetValue, candidates);
  }, [records, targetField, targetValue, profileKeys]);

  const tooSmall = records.length < MIN_INFLUENCE_SAMPLE;

  return (
    <div className="flex flex-col gap-4">
      {!compact ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {onTargetFieldChange ? (
            <Select
              label="What influences"
              value={targetField}
              options={targetFields.map((f) => ({ value: f, label: f.replace(/_/g, ' ') }))}
              onChange={(e) => onTargetFieldChange(e.target.value)}
            />
          ) : null}
          {onTargetValueChange && targetField ? (
            <Select
              label="Target value"
              value={targetValue}
              options={targetValues.map((v) => ({ value: v, label: v }))}
              onChange={(e) => onTargetValueChange(e.target.value)}
            />
          ) : null}
        </div>
      ) : (
        <p className="text-xs text-content-tertiary">
          What influences: <span className="font-medium text-content-primary">{targetField} = {targetValue}</span>
        </p>
      )}

      {tooSmall ? (
        <p className="text-sm text-content-secondary">
          Not enough data for reliable influence analysis (fewer than {MIN_INFLUENCE_SAMPLE} records).
        </p>
      ) : results.length === 0 ? (
        <p className="text-sm text-content-secondary">Select a target field and value to analyze.</p>
      ) : (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Top factors</p>
          <ul className="mt-2 flex flex-col gap-3">
            {results.map((row) => (
              <li key={row.field} className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-content-primary">
                    {row.field.replace(/_/g, ' ')}
                  </span>
                  <div className="flex items-center gap-2">
                    <InfluenceStrengthDots influence={row.influence} />
                    <span className="text-xs text-content-tertiary">{row.strength}</span>
                  </div>
                </div>
                <p className="text-xs text-content-secondary">{row.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function KeyInfluencersBlock({
  source,
  targetField,
  targetValue,
}: {
  source: DashboardDataSource;
  targetField: string;
  targetValue: string;
}) {
  return (
    <KeyInfluencersView
      source={source}
      targetField={targetField}
      targetValue={targetValue}
      compact
    />
  );
}

/** Config inputs for builder drawer */
export function KeyInfluencerConfig({
  source,
  targetField,
  targetValue,
  onTargetFieldChange,
  onTargetValueChange,
}: {
  source: DashboardDataSource;
  targetField: string;
  targetValue: string;
  onTargetFieldChange: (f: string) => void;
  onTargetValueChange: (v: string) => void;
}) {
  const records = factsOf(source);
  const values = targetField ? targetValuesForField(records, targetField) : [];
  const fields = (source.dimensions ?? []).map((d) => d.key);
  return (
    <div className="flex flex-col gap-3">
      <Select
        label="Target field"
        value={targetField}
        options={fields.map((f) => ({ value: f, label: f.replace(/_/g, ' ') }))}
        onChange={(e) => onTargetFieldChange(e.target.value)}
      />
      <Select
        label="Target value"
        value={targetValue}
        options={values.map((v) => ({ value: v, label: v }))}
        onChange={(e) => onTargetValueChange(e.target.value)}
      />
    </div>
  );
}
