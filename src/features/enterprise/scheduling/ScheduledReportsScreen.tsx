import { FileText, TriangleAlert } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { logAuditEntry } from '../audit/useAuditLog';
import { useEnterpriseSession } from '../auth/useEnterpriseSession';
import { useEnterpriseCanvas } from '../dashboard-builder/useEnterpriseCanvas';
import { useSemanticLayer } from '../semantic-layer/useSemanticLayer';
import { EnterprisePageHeader } from '../shared/EnterprisePageHeader';
import { burstValuesFor } from './filterBurst';
import { nextRunAt, runSchedule } from './runSchedule';
import type { DeliverySimulationResult, ReportSchedule, ScheduleFormat, ScheduleRecipient, ScheduleRecurrence } from './types';
import { useScheduledReports } from './useScheduledReports';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `sch-${Date.now()}`;
}

function emptyRecipient(): ScheduleRecipient {
  return { name: '', email: '', burstValue: '' };
}

export function ScheduledReportsScreen() {
  const { user } = useEnterpriseSession();
  const actor = user?.email ?? 'unknown';
  const { dashboard } = useEnterpriseCanvas();
  const { dataSource } = useCustomDashboardDataSource();
  const { approvedDimensions } = useSemanticLayer();
  const { schedules, upsert, remove } = useScheduledReports();

  const [form, setForm] = useState<ReportSchedule | null>(null);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [results, setResults] = useState<DeliverySimulationResult[] | null>(null);
  const [resultName, setResultName] = useState('');

  const dashboards = [{ id: dashboard.id, name: dashboard.name }];

  const openNew = () => {
    const now = Date.now();
    setForm({
      id: newId(),
      dashboardId: dashboard.id,
      dashboardName: dashboard.name,
      name: '',
      recurrence: 'daily',
      time: '07:00',
      format: 'pdf',
      burstBy: '',
      recipients: [emptyRecipient()],
      createdBy: actor,
      createdAt: now,
    });
  };

  const burstDim = (id?: string) => approvedDimensions.find((d) => d.id === id);
  const burstOptions = useMemo(() => {
    if (!form?.burstBy || !dataSource) return [];
    const dim = burstDim(form.burstBy);
    if (!dim) return [];
    return burstValuesFor(dataSource, dim).map((v) => ({
      value: v,
      label: dim.valueLabels?.[v] ?? v,
    }));
  }, [form?.burstBy, dataSource, approvedDimensions]);

  const saveForm = () => {
    if (!form?.name.trim() || form.recipients.length === 0) return;
    const recipients = form.recipients.filter((r) => r.email.trim());
    if (recipients.length === 0) return;
    if (form.burstBy && recipients.some((r) => !r.burstValue)) return;
    const dash = dashboards.find((d) => d.id === form.dashboardId);
    const next: ReportSchedule = {
      ...form,
      name: form.name.trim(),
      dashboardName: dash?.name ?? form.dashboardName,
      burstBy: form.burstBy || undefined,
      recipients,
      createdBy: form.createdBy || actor,
    };
    const isNew = !schedules.some((s) => s.id === next.id);
    upsert(next);
    logAuditEntry({
      actor,
      action: 'schedule.created',
      targetType: 'schedule',
      targetId: next.id,
      targetName: next.name,
      details: isNew
        ? `${next.recurrence} @ ${next.time}`
        : `Updated · ${next.recurrence} @ ${next.time}`,
    });
    setForm(null);
  };

  const handleRun = async (schedule: ReportSchedule) => {
    if (!dataSource) return;
    setRunningId(schedule.id);
    setResults(null);
    try {
      const files = await runSchedule({
        schedule,
        source: dataSource,
        burstDimension: burstDim(schedule.burstBy),
        actor,
      });
      upsert({ ...schedule, lastRunAt: Date.now() });
      setResultName(schedule.name);
      setResults(files);
    } finally {
      setRunningId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <EnterprisePageHeader
        title="Scheduled Reports"
        actions={
          <Button variant="secondary" onClick={openNew}>
            + New Schedule
          </Button>
        }
      />

      {schedules.length === 0 ? (
        <p className="rounded-xl border border-dashed border-hairline bg-paper px-5 py-8 text-sm text-content-tertiary">
          No schedules yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {schedules.map((s) => {
            const dim = burstDim(s.burstBy);
            const next = nextRunAt(s.recurrence, s.time);
            return (
              <li key={s.id} className="rounded-xl border border-hairline bg-paper p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-content-primary">{s.name}</p>
                    <p className="mt-1 text-sm text-content-secondary">
                      {labelRecurrence(s.recurrence)} @ {s.time}
                      {' · '}
                      {s.recipients.length} recipient{s.recipients.length === 1 ? '' : 's'}
                      {' · '}
                      {s.format.toUpperCase()}
                    </p>
                    {dim ? (
                      <p className="mt-1 text-xs text-content-tertiary">Burst by: {dim.name}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-content-tertiary">
                      Last run:{' '}
                      {s.lastRunAt
                        ? `${new Date(s.lastRunAt).toLocaleString('en-IN')} (simulated)`
                        : 'Never'}
                      {' · '}
                      Next (informational): {next.toLocaleString('en-IN')}
                    </p>
                    <p className="mt-1 text-xs text-content-tertiary">Created by {s.createdBy}</p>
                    <p className="mt-2 text-xs text-content-tertiary">
                      Runs only while this schedule is manually triggered — automated firing requires a
                      backend scheduler.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      disabled={!dataSource || runningId === s.id}
                      onClick={() => void handleRun(s)}
                    >
                      {runningId === s.id ? 'Running…' : 'Run Now'}
                    </Button>
                    <Button variant="secondary" onClick={() => setForm(s)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => {
                        remove(s.id);
                        logAuditEntry({
                          actor,
                          action: 'schedule.deleted',
                          targetType: 'schedule',
                          targetId: s.id,
                          targetName: s.name,
                        });
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {results ? (
        <section className="rounded-xl border border-status-warning bg-paper p-5 shadow-sm">
          <div className="flex items-start gap-2">
            <TriangleAlert size={16} strokeWidth={1.75} className="mt-0.5 shrink-0 text-status-warning" aria-hidden />
            <p className="text-sm font-semibold text-status-warning">
              Simulated Delivery — files were generated but not sent
            </p>
          </div>
          <p className="mt-1 text-xs text-content-tertiary">
            {resultName} — this is not confirmation that email left the building.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
            {results.map((r) => (
              <li key={`${r.recipientEmail}-${r.fileName}`} className="text-sm">
                <p className="text-content-secondary">
                  Would send to: <span className="font-medium text-content-primary">{r.recipientEmail}</span>
                  {r.burstValue ? (
                    <span className="text-content-tertiary"> · slice {r.burstValue}</span>
                  ) : null}
                  <span className="text-content-tertiary"> · {r.recordCount} records</span>
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 text-content-primary">
                    <FileText size={14} strokeWidth={1.75} className="text-content-secondary" aria-hidden />
                    {r.fileName} ({r.fileSizeKB} KB)
                  </span>
                  <a
                    href={r.blobUrl}
                    download={r.fileName}
                    className="inline-flex h-10 items-center rounded-md border border-brand bg-white px-5 text-sm font-medium text-brand-text hover:bg-brand-tint"
                  >
                    Download
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {form ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Dismiss" onClick={() => setForm(null)} />
          <div className="relative z-[1] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-hairline bg-paper p-8 shadow-lg">
            <h2 className="text-xl font-bold text-content-primary">
              {schedules.some((s) => s.id === form.id) ? 'Edit schedule' : 'New schedule'}
            </h2>
            <p className="mt-1 text-sm text-content-secondary">
              Recurrence, recipients, and optional bursting for this report.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Field label="Name">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Select
                label="Dashboard"
                value={form.dashboardId}
                options={dashboards.map((d) => ({ value: d.id, label: d.name }))}
                onChange={(e) => setForm({ ...form, dashboardId: e.target.value })}
              />
              <Select
                label="Recurrence"
                value={form.recurrence}
                options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]}
                onChange={(e) => setForm({ ...form, recurrence: e.target.value as ScheduleRecurrence })}
              />
              <Field label="Time">
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-sm outline-none focus:border-brand"
                />
              </Field>
              <Select
                label="Format"
                value={form.format}
                options={[
                  { value: 'pdf', label: 'PDF' },
                  { value: 'excel', label: 'Excel' },
                  { value: 'pptx', label: 'PowerPoint' },
                ]}
                onChange={(e) => setForm({ ...form, format: e.target.value as ScheduleFormat })}
              />
              <Select
                label="Burst by (optional)"
                value={form.burstBy ?? ''}
                options={[
                  { value: '', label: 'No bursting — one file for all' },
                  ...approvedDimensions.map((d) => ({ value: d.id, label: d.name })),
                ]}
                onChange={(e) =>
                  setForm({
                    ...form,
                    burstBy: e.target.value,
                    recipients: form.recipients.map((r) => ({ ...r, burstValue: '' })),
                  })
                }
              />

              <p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Recipients</p>
              {form.recipients.map((r, i) => (
                <div key={i} className="rounded-lg border border-hairline bg-white p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Field label="Name">
                      <input
                        value={r.name}
                        onChange={(e) => {
                          const recipients = [...form.recipients];
                          recipients[i] = { ...r, name: e.target.value };
                          setForm({ ...form, recipients });
                        }}
                        className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-sm outline-none focus:border-brand"
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={r.email}
                        onChange={(e) => {
                          const recipients = [...form.recipients];
                          recipients[i] = { ...r, email: e.target.value };
                          setForm({ ...form, recipients });
                        }}
                        placeholder="name@idbibank.demo"
                        className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-sm outline-none focus:border-brand"
                      />
                    </Field>
                  </div>
                  {form.burstBy ? (
                    <div className="mt-2">
                      <Select
                        label="Burst value"
                        value={r.burstValue ?? ''}
                        options={[{ value: '', label: 'Select a value' }, ...burstOptions]}
                        onChange={(e) => {
                          const recipients = [...form.recipients];
                          recipients[i] = { ...r, burstValue: e.target.value };
                          setForm({ ...form, recipients });
                        }}
                      />
                    </div>
                  ) : null}
                </div>
              ))}
              <Button
                variant="secondary"
                onClick={() => setForm({ ...form, recipients: [...form.recipients, emptyRecipient()] })}
              >
                Add recipient
              </Button>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setForm(null)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={saveForm}>
                Save schedule
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function labelRecurrence(r: ScheduleRecurrence) {
  if (r === 'weekly') return 'Weekly';
  if (r === 'monthly') return 'Monthly';
  return 'Daily';
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-content-primary">
      {label}
      {children}
    </label>
  );
}
