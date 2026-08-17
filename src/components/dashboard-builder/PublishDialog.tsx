import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useModules } from '@/state/useModules';

export function PublishDialog({
  open,
  templateName,
  initialModuleId,
  onCancel,
  onPublish,
}: {
  open: boolean;
  templateName: string;
  initialModuleId?: string | null;
  onCancel: () => void;
  onPublish: (moduleId: string) => void;
}) {
  const { modules, setConfigOpen } = useModules();
  const [moduleId, setModuleId] = useState(initialModuleId ?? modules[0]?.id ?? '');

  useEffect(() => {
    if (!open) return;
    setModuleId(initialModuleId ?? modules[0]?.id ?? '');
  }, [open, initialModuleId, modules]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Dismiss" onClick={onCancel} />
      <div className="relative z-[1] w-full max-w-md rounded-2xl border border-hairline bg-paper p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-content-primary">Publish “{templateName}”</h2>
        <p className="mt-2 text-sm text-content-secondary">Add this dashboard to your sidebar.</p>
        {modules.length === 0 ? (
          <p className="mt-4 rounded-lg border border-hairline bg-sunken px-3 py-2 text-sm text-content-secondary">
            No modules yet — create one first.{' '}
            <button
              type="button"
              className="font-semibold text-brand-text"
              onClick={() => {
                onCancel();
                setConfigOpen(true);
              }}
            >
              Open Modules
            </button>
          </p>
        ) : (
          <div className="mt-4">
            <Select
              label="Module"
              value={moduleId}
              onChange={(e) => setModuleId(e.target.value)}
              options={modules.map((m) => ({ value: m.id, label: m.name }))}
            />
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={modules.length === 0 || !moduleId}
            onClick={() => onPublish(moduleId)}
          >
            Publish
          </Button>
        </div>
      </div>
    </div>
  );
}
