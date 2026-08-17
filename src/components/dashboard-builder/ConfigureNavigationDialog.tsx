import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';

export function ConfigureNavigationDialog({
  open,
  dashboardName,
  accept,
  fields,
  dataSource,
  onClose,
  onSave,
}: {
  open: boolean;
  dashboardName: string;
  accept: boolean;
  fields: string[];
  dataSource: DashboardDataSource | null;
  onClose: () => void;
  onSave: (next: { accept: boolean; fields: string[] }) => void;
}) {
  const [enabled, setEnabled] = useState(accept);
  const [selected, setSelected] = useState<string[]>(fields);
  const [adding, setAdding] = useState('');

  useEffect(() => {
    if (!open) return;
    setEnabled(accept);
    setSelected(fields);
    setAdding('');
  }, [open, accept, fields]);

  if (!open) return null;

  const dimOptions = (dataSource?.dimensions ?? []).filter((d) => !selected.includes(d.key));

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Dismiss" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-config-title"
        className="relative z-[1] w-full max-w-lg rounded-2xl border border-hairline bg-paper p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="nav-config-title" className="text-xl font-semibold text-content-primary">
              Drillable Navigation
            </h2>
            <p className="mt-1 text-sm text-content-secondary">{dashboardName}</p>
          </div>
          <IconButton aria-label="Close" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>

        <label className="mt-6 flex items-start gap-3 text-sm text-content-primary">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand"
          />
          <span>Accept drill-through navigation to this dashboard</span>
        </label>

        {enabled ? (
          <div className="mt-5">
            <p className="text-sm font-medium text-content-primary">
              Fields this dashboard can be filtered by
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {selected.map((key) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 rounded-full bg-sunken px-2.5 py-1 text-xs font-medium text-content-secondary"
                >
                  {key}
                  <button
                    type="button"
                    aria-label={`Remove ${key}`}
                    className="outline-none"
                    onClick={() => setSelected((s) => s.filter((k) => k !== key))}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            {dimOptions.length > 0 ? (
              <div className="mt-3 flex items-end gap-2">
                <Select
                  label="Add field"
                  hideLabel
                  value={adding}
                  onChange={(e) => setAdding(e.target.value)}
                  options={[
                    { value: '', label: '+ Add field' },
                    ...dimOptions.map((d) => ({ value: d.key, label: d.label || d.key })),
                  ]}
                />
                <Button
                  variant="secondary"
                  disabled={!adding}
                  onClick={() => {
                    if (!adding) return;
                    setSelected((s) => [...s, adding]);
                    setAdding('');
                  }}
                >
                  Add
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-content-tertiary">All available fields are already listed.</p>
            )}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <Button
            variant="primary"
            onClick={() =>
              onSave({ accept: enabled, fields: enabled ? selected : [] })
            }
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
