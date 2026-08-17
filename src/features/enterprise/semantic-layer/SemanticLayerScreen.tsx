import { Check, Circle } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { StatusPill } from '@/components/ui/StatusPill';
import { validateFormula } from '@/data/calculatedFields';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import { useEnterpriseSession } from '../auth/useEnterpriseSession';
import { logAuditEntry } from '../audit/useAuditLog';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { EnterprisePageHeader } from '../shared/EnterprisePageHeader';
import { measureExpression } from './evaluateMeasure';
import {
  type GovernedDimension,
  type GovernedMeasure,
  type GovernanceStatus,
  type MeasureAggregation,
  type MeasureFormat,
} from './types';
import { useSemanticLayer, visibleDimensions, visibleMeasures } from './useSemanticLayer';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `sem-${Date.now()}`;
}

function sourceFields(source: DashboardDataSource | null): { value: string; label: string }[] {
  if (!source) return [];
  const seen = new Set<string>();
  const out: { value: string; label: string }[] = [];
  const add = (value: string, label: string) => {
    if (!value || seen.has(value)) return;
    seen.add(value);
    out.push({ value, label });
  };
  for (const d of source.profile ?? []) add(d.key, d.label || d.key);
  for (const d of source.dimensions) add(d.key, d.label);
  for (const d of source.metrics ?? []) add(d.key, d.label);
  for (const d of source.dates ?? []) add(d.key, d.label);
  return out;
}

const AGG: MeasureAggregation[] = ['SUM', 'AVG', 'COUNT', 'MIN', 'MAX'];
const FMT: { value: MeasureFormat; label: string }[] = [
  { value: 'currency-inr', label: 'Currency (INR)' },
  { value: 'number', label: 'Number' },
  { value: 'percent', label: 'Percent' },
  { value: 'days', label: 'Days' },
];

export function SemanticLayerScreen() {
  const { dataSource } = useCustomDashboardDataSource();
  const { user } = useEnterpriseSession();
  const owner = user?.email ?? 'unknown';
  const { catalog, upsertMeasure, upsertDimension } = useSemanticLayer();
  const fields = useMemo(() => sourceFields(dataSource), [dataSource]);
  const measures = visibleMeasures(catalog, owner);
  const dimensions = visibleDimensions(catalog, owner);

  const [measureForm, setMeasureForm] = useState<GovernedMeasure | null>(null);
  const [dimensionForm, setDimensionForm] = useState<GovernedDimension | null>(null);
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [labelsDraft, setLabelsDraft] = useState('');
  const [labelsError, setLabelsError] = useState<string | null>(null);

  useEffect(() => {
    if (!dimensionForm) {
      setLabelsDraft('');
      setLabelsError(null);
      return;
    }
    setLabelsDraft(
      dimensionForm.valueLabels ? JSON.stringify(dimensionForm.valueLabels, null, 2) : '',
    );
    setLabelsError(null);
  }, [dimensionForm?.id]);

  const known = fields.map((f) => f.value);

  const openNewMeasure = () => {
    const now = Date.now();
    setMeasureForm({
      id: newId(),
      name: '',
      description: '',
      sourceField: fields[0]?.value ?? '',
      aggregation: 'SUM',
      format: 'number',
      formula: '',
      owner,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
    setFormulaError(null);
  };

  const openNewDimension = () => {
    const now = Date.now();
    setDimensionForm({
      id: newId(),
      name: '',
      description: '',
      sourceField: fields[0]?.value ?? '',
      owner,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    });
  };

  const saveMeasure = (status: GovernanceStatus) => {
    if (!measureForm?.name.trim()) return;
    if (measureForm.formula?.trim()) {
      const check = validateFormula(measureForm.formula, known);
      if (!check.ok) {
        setFormulaError(check.error);
        return;
      }
    }
    const existed = catalog.measures.some((m) => m.id === measureForm.id);
    upsertMeasure({
      ...measureForm,
      name: measureForm.name.trim(),
      owner,
      status,
      formula: measureForm.formula?.trim() || undefined,
      updatedAt: Date.now(),
    });
    if (!existed) {
      logAuditEntry({
        actor: owner,
        action: 'measure.created',
        targetType: 'measure',
        targetId: measureForm.id,
        targetName: measureForm.name.trim(),
        details: status === 'draft' ? 'Saved as draft' : undefined,
      });
    }
    if (status === 'approved') {
      logAuditEntry({
        actor: owner,
        action: 'measure.approved',
        targetType: 'measure',
        targetId: measureForm.id,
        targetName: measureForm.name.trim(),
      });
    }
    setMeasureForm(null);
    setFormulaError(null);
  };

  const saveDimension = (status: GovernanceStatus) => {
    if (!dimensionForm?.name.trim()) return;
    const labels = parseValueLabels(labelsDraft);
    if (!labels.ok) {
      setLabelsError(labels.error);
      return;
    }
    const existed = catalog.dimensions.some((d) => d.id === dimensionForm.id);
    upsertDimension({
      ...dimensionForm,
      name: dimensionForm.name.trim(),
      owner,
      status,
      valueLabels: labels.value,
      updatedAt: Date.now(),
    });
    if (!existed) {
      logAuditEntry({
        actor: owner,
        action: 'dimension.created',
        targetType: 'dimension',
        targetId: dimensionForm.id,
        targetName: dimensionForm.name.trim(),
        details: status === 'draft' ? 'Saved as draft' : undefined,
      });
    }
    if (status === 'approved') {
      logAuditEntry({
        actor: owner,
        action: 'dimension.approved',
        targetType: 'dimension',
        targetId: dimensionForm.id,
        targetName: dimensionForm.name.trim(),
      });
    }
    setDimensionForm(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <EnterprisePageHeader
        title="Semantic Layer"
        actions={
          <>
            <Button variant="secondary" onClick={openNewMeasure} disabled={fields.length === 0}>
              + New Measure
            </Button>
            <Button variant="secondary" onClick={openNewDimension} disabled={fields.length === 0}>
              + New Dimension
            </Button>
          </>
        }
      />

      {fields.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hairline bg-paper px-5 py-8 text-sm text-content-secondary">
          Upload a file in Custom Dashboard first so source fields can be governed here.
        </p>
      ) : null}

      <section className="rounded-xl border border-hairline bg-paper p-5 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Measures</h2>
        {measures.length === 0 ? (
          <p className="mt-3 text-sm text-content-tertiary">No measures yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-hairline">
            {measures.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => {
                    setMeasureForm(m);
                    setFormulaError(null);
                  }}
                >
                  <p className="truncate text-sm font-semibold text-content-primary">{m.name}</p>
                  <p className="truncate text-xs text-content-tertiary">
                    {measureExpression(m)} · {m.owner}
                  </p>
                </button>
                <StatusMark status={m.status} />
                {m.status === 'draft' && m.owner === owner ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      upsertMeasure({ ...m, status: 'approved', updatedAt: Date.now() });
                      logAuditEntry({
                        actor: owner,
                        action: 'measure.approved',
                        targetType: 'measure',
                        targetId: m.id,
                        targetName: m.name,
                      });
                    }}
                  >
                    Approve
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-hairline bg-paper p-5 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Dimensions</h2>
        {dimensions.length === 0 ? (
          <p className="mt-3 text-sm text-content-tertiary">No dimensions yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-hairline">
            {dimensions.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => setDimensionForm(d)}
                >
                  <p className="truncate text-sm font-semibold text-content-primary">{d.name}</p>
                  <p className="truncate text-xs text-content-tertiary">
                    {d.sourceField} · {d.owner}
                  </p>
                </button>
                <StatusMark status={d.status} />
                {d.status === 'draft' && d.owner === owner ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      upsertDimension({ ...d, status: 'approved', updatedAt: Date.now() });
                      logAuditEntry({
                        actor: owner,
                        action: 'dimension.approved',
                        targetType: 'dimension',
                        targetId: d.id,
                        targetName: d.name,
                      });
                    }}
                  >
                    Approve
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {measureForm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Dismiss" onClick={() => setMeasureForm(null)} />
          <div className="relative z-[1] w-full max-w-lg rounded-2xl border border-hairline bg-paper p-8 shadow-lg">
            <h2 className="text-xl font-bold text-content-primary">
              {catalog.measures.some((m) => m.id === measureForm.id) ? 'Edit measure' : 'New measure'}
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              <Field label="Name">
                <input
                  value={measureForm.name}
                  onChange={(e) => setMeasureForm({ ...measureForm, name: e.target.value })}
                  className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={measureForm.description}
                  onChange={(e) => setMeasureForm({ ...measureForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Select
                label="Source field"
                value={measureForm.sourceField}
                options={fields}
                onChange={(e) => setMeasureForm({ ...measureForm, sourceField: e.target.value })}
              />
              <Select
                label="Aggregation"
                value={measureForm.aggregation}
                options={AGG.map((a) => ({ value: a, label: a }))}
                onChange={(e) =>
                  setMeasureForm({ ...measureForm, aggregation: e.target.value as MeasureAggregation })
                }
              />
              <Select
                label="Format"
                value={measureForm.format}
                options={FMT}
                onChange={(e) => setMeasureForm({ ...measureForm, format: e.target.value as MeasureFormat })}
              />
              <Field label="Formula (optional)">
                <input
                  value={measureForm.formula ?? ''}
                  onChange={(e) => {
                    setMeasureForm({ ...measureForm, formula: e.target.value });
                    setFormulaError(null);
                  }}
                  onBlur={() => {
                    if (!measureForm.formula?.trim()) return;
                    const check = validateFormula(measureForm.formula, known);
                    setFormulaError(check.ok ? null : check.error);
                  }}
                  placeholder="Uses the calculated-fields engine, e.g. [Amount] * 1.18"
                  className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-sm outline-none focus:border-brand"
                />
                {formulaError ? <p className="mt-1 text-xs text-status-error">{formulaError}</p> : null}
              </Field>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => setMeasureForm(null)}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => saveMeasure('draft')}>
                Save draft
              </Button>
              <Button variant="primary" onClick={() => saveMeasure('approved')}>
                Save & approve
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {dimensionForm ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Dismiss" onClick={() => setDimensionForm(null)} />
          <div className="relative z-[1] w-full max-w-lg rounded-2xl border border-hairline bg-paper p-8 shadow-lg">
            <h2 className="text-xl font-bold text-content-primary">
              {catalog.dimensions.some((d) => d.id === dimensionForm.id) ? 'Edit dimension' : 'New dimension'}
            </h2>
            <div className="mt-4 flex flex-col gap-3">
              <Field label="Name">
                <input
                  value={dimensionForm.name}
                  onChange={(e) => setDimensionForm({ ...dimensionForm, name: e.target.value })}
                  className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Field label="Description">
                <textarea
                  value={dimensionForm.description}
                  onChange={(e) => setDimensionForm({ ...dimensionForm, description: e.target.value })}
                  rows={2}
                  className="w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Select
                label="Source field"
                value={dimensionForm.sourceField}
                options={fields}
                onChange={(e) => setDimensionForm({ ...dimensionForm, sourceField: e.target.value })}
              />
              <Field label="Value labels (optional, JSON)">
                <textarea
                  value={labelsDraft}
                  onChange={(e) => {
                    const text = e.target.value;
                    setLabelsDraft(text);
                    const trimmed = text.trim();
                    if (!trimmed) {
                      setLabelsError(null);
                      return;
                    }
                    const parsed = parseValueLabels(text);
                    setLabelsError(parsed.ok ? null : parsed.error);
                  }}
                  rows={3}
                  placeholder='{"N":"North Zone"}'
                  className="w-full rounded-md border border-hairline bg-white px-3 py-2 font-mono text-sm outline-none focus:border-brand"
                />
                {labelsError ? (
                  <p className="text-xs font-medium text-status-error">{labelsError}</p>
                ) : null}
              </Field>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" onClick={() => setDimensionForm(null)}>
                Cancel
              </Button>
              <Button variant="secondary" onClick={() => saveDimension('draft')}>
                Save draft
              </Button>
              <Button variant="primary" onClick={() => saveDimension('approved')}>
                Save & approve
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function parseValueLabels(
  text: string,
): { ok: true; value?: Record<string, string> } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: true, value: undefined };
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ok: false, error: 'Use a JSON object, e.g. {"N":"North Zone"}' };
    }
    const value: Record<string, string> = {};
    for (const [key, val] of Object.entries(parsed as Record<string, unknown>)) {
      value[key] = String(val);
    }
    return { ok: true, value };
  } catch {
    return { ok: false, error: 'Invalid JSON' };
  }
}

function StatusMark({ status }: { status: GovernanceStatus }) {
  return status === 'approved' ? (
    <StatusPill label="Approved" tone="success" icon={Check} />
  ) : (
    <StatusPill label="Draft" tone="neutral" icon={Circle} />
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-content-primary">
      {label}
      {children}
    </label>
  );
}
