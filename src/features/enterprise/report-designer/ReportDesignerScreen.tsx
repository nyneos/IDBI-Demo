import { filterDataSource } from '@/data/buildUploadedDataSource';
import { useMemo, useState } from 'react';
import { Eye, FileDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { useSemanticLayer } from '../semantic-layer/useSemanticLayer';
import { EnterprisePageHeader } from '../shared/EnterprisePageHeader';
import {
  ENTERPRISE_FIELD,
  ENTERPRISE_FIELD_AREA,
  EnterpriseField,
  EnterpriseSection,
} from '../shared/EnterpriseSection';
import { composeReport, downloadReport, previewReport } from './composePdf';
import {
  REPORT_CHART_VISUALS,
  chartVisualLabel,
  needsSecondaryField,
  sectionKindLabel,
  type ReportChartVisual,
} from './chartVisuals';
import { freshSection, STARTER_TEMPLATES } from './templates';
import type { ReportOrientation, ReportPageSize, ReportSection, ReportTemplate } from './types';
import { useReportTemplates } from './useReportTemplates';

const STARTER_FALLBACK = STARTER_TEMPLATES[0]!;

function fieldOptions(source: ReturnType<typeof useCustomDashboardDataSource>['dataSource']) {
  if (!source) return [];
  const keys = new Set<string>();
  for (const d of source.dimensions) keys.add(d.key);
  for (const d of source.metrics ?? []) keys.add(d.key);
  for (const d of source.dates ?? []) keys.add(d.key);
  for (const d of source.profile ?? []) keys.add(d.key);
  return [...keys].sort().map((k) => ({ value: k, label: k.replace(/_/g, ' ') }));
}

export function ReportDesignerScreen() {
  const { dataSource } = useCustomDashboardDataSource();
  const { approvedMeasures, approvedDimensions, catalog } = useSemanticLayer();
  const { templates, save } = useReportTemplates();

  const [activeId, setActiveId] = useState(() => templates[0]?.id ?? '');
  const [draft, setDraft] = useState<ReportTemplate>(() =>
    JSON.parse(JSON.stringify(templates[0] ?? STARTER_FALLBACK)) as ReportTemplate,
  );
  const [burstField, setBurstField] = useState('');
  const [burstValue, setBurstValue] = useState('');
  const [busy, setBusy] = useState(false);

  const fields = useMemo(() => fieldOptions(dataSource), [dataSource]);

  const burstDim = approvedDimensions.find((d) => d.sourceField === burstField);
  const burstValues = useMemo(() => {
    if (!dataSource || !burstField) return [];
    const seen = new Set<string>();
    for (const row of dataSource.facts ?? []) {
      const v = row[burstField];
      if (v != null && v !== '') seen.add(String(v));
    }
    return [...seen].sort();
  }, [dataSource, burstField]);

  const loadTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setActiveId(id);
    setDraft(JSON.parse(JSON.stringify(t)) as ReportTemplate);
  };

  const update = (patch: Partial<ReportTemplate>) => setDraft((d) => ({ ...d, ...patch }));

  const updateSection = (id: string, patch: Partial<ReportSection>) => {
    setDraft((d) => ({
      ...d,
      bodySections: d.bodySections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }));
  };

  const removeSection = (id: string) => {
    setDraft((d) => ({ ...d, bodySections: d.bodySections.filter((s) => s.id !== id) }));
  };

  const addSection = (type: ReportSection['type'], visual?: ReportChartVisual) => {
    const fieldKeys = fields.map((f) => f.value);
    setDraft((d) => ({
      ...d,
      bodySections: [...d.bodySections, freshSection(type, { visual, fields: fieldKeys })],
    }));
  };

  const persist = () => save(draft);

  const runExport = (mode: 'preview' | 'download') => {
    if (!dataSource) return;
    setBusy(true);
    try {
      persist();
      let source = dataSource;
      if (burstField && burstValue) {
        source = filterDataSource(source, { [burstField]: burstValue });
      }
      const pdf = composeReport(
        draft,
        source,
        catalog,
        burstField && burstValue ? { field: burstField, value: burstValue } : undefined,
      );
      if (mode === 'preview') previewReport(pdf);
      else downloadReport(pdf, `${draft.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <EnterprisePageHeader
        title="Report Designer"
        actions={
          <>
            <Button variant="secondary" leftIcon={Eye} disabled={!dataSource || busy} onClick={() => runExport('preview')}>
              Preview
            </Button>
            <Button variant="primary" leftIcon={FileDown} disabled={!dataSource || busy} onClick={() => runExport('download')}>
              Export PDF
            </Button>
          </>
        }
      />

      {!dataSource ? (
        <p className="rounded-xl border border-dashed border-hairline bg-paper px-5 py-8 text-sm text-content-secondary shadow-sm">
          Upload a file in Custom Dashboard first so report sections can bind to real fields and governed measures.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1 border-b border-hairline">
        {templates.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => loadTemplate(t.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium outline-none',
              activeId === t.id
                ? 'border-b-2 border-brand text-content-primary'
                : 'text-content-secondary hover:text-content-primary',
            )}
          >
            {t.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6">
          <EnterpriseSection title="Template">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <EnterpriseField label="Template name">
                <input
                  value={draft.name}
                  onChange={(e) => update({ name: e.target.value })}
                  className={ENTERPRISE_FIELD}
                />
              </EnterpriseField>
              <Select
                label="Page size"
                value={draft.pageSize}
                options={[
                  { value: 'A4', label: 'A4' },
                  { value: 'Letter', label: 'Letter' },
                ]}
                onChange={(e) => update({ pageSize: e.target.value as ReportPageSize })}
              />
              <Select
                label="Orientation"
                value={draft.orientation}
                options={[
                  { value: 'portrait', label: 'Portrait' },
                  { value: 'landscape', label: 'Landscape' },
                ]}
                onChange={(e) => update({ orientation: e.target.value as ReportOrientation })}
              />
            </div>
          </EnterpriseSection>

          <EnterpriseSection title="Data context (optional burst)">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Burst field"
                value={burstField}
                options={[{ value: '', label: 'No burst — all records' }, ...fields]}
                onChange={(e) => {
                  setBurstField(e.target.value);
                  setBurstValue('');
                }}
              />
              {burstField ? (
                <Select
                  label="Burst value"
                  value={burstValue}
                  options={[
                    { value: '', label: 'Select value' },
                    ...burstValues.map((v) => ({
                      value: v,
                      label: burstDim?.valueLabels?.[v] ?? v,
                    })),
                  ]}
                  onChange={(e) => setBurstValue(e.target.value)}
                />
              ) : null}
            </div>
          </EnterpriseSection>

          <EnterpriseSection title="Header">
            <label className="mb-3 flex items-center gap-2 text-sm text-content-primary">
              <input
                type="checkbox"
                checked={Boolean(draft.header.logo)}
                onChange={(e) => update({ header: { ...draft.header, logo: e.target.checked } })}
              />
              Show bank logo (vector mark)
            </label>
            <div className="grid grid-cols-1 gap-4">
              <EnterpriseField label="Title">
                <input
                  value={draft.header.title}
                  onChange={(e) => update({ header: { ...draft.header, title: e.target.value } })}
                  className={ENTERPRISE_FIELD}
                />
              </EnterpriseField>
              <EnterpriseField label="Subtitle">
                <input
                  value={draft.header.subtitle ?? ''}
                  onChange={(e) => update({ header: { ...draft.header, subtitle: e.target.value } })}
                  placeholder="{Branch_Name} — {Report_Date}"
                  className={ENTERPRISE_FIELD}
                />
              </EnterpriseField>
            </div>
          </EnterpriseSection>

          <EnterpriseSection
            title="Body sections"
            action={
              <div className="flex flex-wrap items-end gap-2">
                <Button variant="secondary" onClick={() => addSection('kpi-row')}>
                  + KPI row
                </Button>
                <Button variant="secondary" onClick={() => addSection('table')}>
                  + Table
                </Button>
                <Button variant="secondary" onClick={() => addSection('records-table')}>
                  + Records table
                </Button>
                <Button variant="secondary" onClick={() => addSection('text')}>
                  + Text
                </Button>
                <Select
                  label="Add chart"
                  hideLabel
                  className="w-[200px]"
                  value=""
                  options={[
                    { value: '', label: '+ Chart' },
                    ...REPORT_CHART_VISUALS.map((p) => ({ value: p.type, label: p.label })),
                  ]}
                  onChange={(e) => {
                    const visual = e.target.value as ReportChartVisual | '';
                    if (visual) addSection('chart', visual);
                  }}
                />
              </div>
            }
          >
            {draft.bodySections.length === 0 ? (
              <p className="text-sm text-content-tertiary">No sections yet.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {draft.bodySections.map((section, index) => (
                  <li key={section.id} className="rounded-xl border border-hairline bg-paper p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-content-primary">
                        {index + 1}. {sectionKindLabel(section.type, section.chart?.visual)}
                      </p>
                      <IconButton
                        aria-label="Remove section"
                        className="text-content-tertiary hover:text-status-error"
                        onClick={() => removeSection(section.id)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <EnterpriseField label="Section title">
                        <input
                          value={section.title ?? ''}
                          onChange={(e) => updateSection(section.id, { title: e.target.value })}
                          className={ENTERPRISE_FIELD}
                        />
                      </EnterpriseField>
                      {section.type === 'kpi-row' ? (
                        <>
                          <EnterpriseField label="Governed measures (approved)">
                            <select
                              multiple
                              value={section.boundMeasures ?? []}
                              onChange={(e) => {
                                const boundMeasures = [...e.target.selectedOptions].map((o) => o.value);
                                updateSection(section.id, { boundMeasures });
                              }}
                              className={`${ENTERPRISE_FIELD} min-h-[80px]`}
                            >
                              {approvedMeasures.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.name}
                                </option>
                              ))}
                            </select>
                          </EnterpriseField>
                          <EnterpriseField label="Fallback KPI names (comma-separated, used when measures are not defined)">
                            <input
                              value={(section.measureNames ?? []).join(', ')}
                              onChange={(e) =>
                                updateSection(section.id, {
                                  measureNames: e.target.value
                                    .split(',')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              className={ENTERPRISE_FIELD}
                            />
                          </EnterpriseField>
                        </>
                      ) : null}
                      {section.type === 'table' && section.boundTable ? (
                        <>
                          <Select
                            label="Group by"
                            value={section.boundTable.groupBy}
                            options={fields.length ? fields : [{ value: 'Transaction_Category', label: 'Transaction Category' }]}
                            onChange={(e) =>
                              updateSection(section.id, {
                                boundTable: { ...section.boundTable!, groupBy: e.target.value },
                              })
                            }
                          />
                          <EnterpriseField label="Columns (comma-separated headers)">
                            <input
                              value={section.boundTable.columns.join(', ')}
                              onChange={(e) =>
                                updateSection(section.id, {
                                  boundTable: {
                                    ...section.boundTable!,
                                    columns: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                                  },
                                })
                              }
                              className={ENTERPRISE_FIELD}
                            />
                          </EnterpriseField>
                        </>
                      ) : null}
                      {section.type === 'records-table' ? (
                        <EnterpriseField label="Columns (comma-separated field keys)">
                          <input
                            value={(section.recordColumns ?? []).join(', ')}
                            onChange={(e) =>
                              updateSection(section.id, {
                                recordColumns: e.target.value
                                  .split(',')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              })
                            }
                            className={ENTERPRISE_FIELD}
                          />
                        </EnterpriseField>
                      ) : null}
                      {section.type === 'chart' && section.chart ? (
                        <>
                          <Select
                            label="Chart type"
                            value={section.chart.visual}
                            options={REPORT_CHART_VISUALS.map((p) => ({ value: p.type, label: p.label }))}
                            onChange={(e) => {
                              const visual = e.target.value as ReportChartVisual;
                              updateSection(section.id, {
                                title: section.title || chartVisualLabel(visual),
                                chart: { ...section.chart!, visual },
                              });
                            }}
                          />
                          <Select
                            label="Category / axis field"
                            value={section.chart.dimensionKey}
                            options={fields.length ? fields : [{ value: 'Transaction_Category', label: 'Transaction Category' }]}
                            onChange={(e) =>
                              updateSection(section.id, {
                                chart: { ...section.chart!, dimensionKey: e.target.value },
                              })
                            }
                          />
                          {needsSecondaryField(section.chart.visual) ? (
                            <Select
                              label="Secondary field"
                              value={section.chart.secondaryKey ?? ''}
                              options={[{ value: '', label: 'None' }, ...fields]}
                              onChange={(e) =>
                                updateSection(section.id, {
                                  chart: { ...section.chart!, secondaryKey: e.target.value || undefined },
                                })
                              }
                            />
                          ) : null}
                        </>
                      ) : null}
                      {section.type === 'text' ? (
                        <EnterpriseField label="Body text">
                          <textarea
                            value={section.text ?? ''}
                            onChange={(e) => updateSection(section.id, { text: e.target.value })}
                            rows={3}
                            className={ENTERPRISE_FIELD_AREA}
                          />
                        </EnterpriseField>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </EnterpriseSection>

          <EnterpriseSection title="Footer">
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-content-primary">
                <input
                  type="checkbox"
                  checked={draft.footer.showPageNumbers}
                  onChange={(e) => update({ footer: { ...draft.footer, showPageNumbers: e.target.checked } })}
                />
                Page numbers
              </label>
              <label className="flex items-center gap-2 text-sm text-content-primary">
                <input
                  type="checkbox"
                  checked={draft.footer.showGeneratedDate}
                  onChange={(e) => update({ footer: { ...draft.footer, showGeneratedDate: e.target.checked } })}
                />
                Generated date
              </label>
            </div>
            <EnterpriseField label="Custom footer text">
              <input
                value={draft.footer.customText ?? ''}
                onChange={(e) => update({ footer: { ...draft.footer, customText: e.target.value } })}
                className={`${ENTERPRISE_FIELD} mt-3`}
              />
            </EnterpriseField>
          </EnterpriseSection>

          <EnterpriseSection title="Signature block">
            <EnterpriseField label="Lines (comma-separated labels)">
              <input
                value={(draft.signatureBlock?.lines ?? []).map((l) => l.label).join(', ')}
                onChange={(e) =>
                  update({
                    signatureBlock: {
                      lines: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((label) => ({ label })),
                    },
                  })
                }
                placeholder="Prepared By, Reviewed By, Approved By"
                className={ENTERPRISE_FIELD_AREA}
              />
            </EnterpriseField>
          </EnterpriseSection>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={persist}>
              Save template
            </Button>
          </div>
        </div>
    </div>
  );
}
