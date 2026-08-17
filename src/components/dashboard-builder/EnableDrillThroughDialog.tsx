import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import type { DashboardBlock, DashboardState } from '@/components/dashboard-builder/types';
import { blockKeys } from '@/components/dashboard-builder/blockData';

export function EnableDrillThroughDialog({
  open,
  block,
  targets,
  onClose,
  onEnable,
  onConfigureTargets,
}: {
  open: boolean;
  block: DashboardBlock | null;
  targets: DashboardState[];
  onClose: () => void;
  onEnable: (config: {
    targetId: string;
    sourceField: string;
    targetField: string;
  }) => void;
  onConfigureTargets: () => void;
}) {
  const sourceField = block ? (blockKeys(block)[0] || block.dimensionKey) : '';
  const [targetId, setTargetId] = useState('');
  const [targetField, setTargetField] = useState('');

  const target = useMemo(() => targets.find((t) => t.id === targetId), [targets, targetId]);
  const targetFields = target?.drillThroughFields ?? [];
  const autoMatched = Boolean(sourceField && targetFields.includes(sourceField));

  useEffect(() => {
    if (!open || !block) return;
    const initialTarget = block.drillThroughTargetId && targets.some((t) => t.id === block.drillThroughTargetId)
      ? block.drillThroughTargetId
      : '';
    setTargetId(initialTarget);
    const t = targets.find((x) => x.id === initialTarget);
    const src = blockKeys(block)[0] || block.dimensionKey;
    const saved = block.drillThroughTargetField;
    if (saved && t?.drillThroughFields?.includes(saved)) setTargetField(saved);
    else if (t?.drillThroughFields?.includes(src)) setTargetField(src);
    else setTargetField('');
  }, [open, block, targets]);

  useEffect(() => {
    if (!target) {
      setTargetField('');
      return;
    }
    if (sourceField && targetFields.includes(sourceField)) {
      setTargetField(sourceField);
    } else if (targetField && !targetFields.includes(targetField)) {
      setTargetField('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- remap when target changes
  }, [targetId]);

  if (!open || !block) return null;

  const mapped = targetField || (autoMatched ? sourceField : '');
  const canEnable = Boolean(targetId && mapped);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Dismiss" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drill-title"
        className="relative z-[1] w-full max-w-lg rounded-2xl border border-hairline bg-paper p-6 shadow-lg"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="drill-title" className="text-xl font-semibold text-content-primary">
            Drill-Through: {block.title}
          </h2>
          <IconButton aria-label="Close" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>

        {targets.length === 0 ? (
          <p className="mt-4 rounded-lg border border-hairline bg-sunken px-3 py-2 text-sm text-content-secondary">
            No drill-through targets configured yet.{' '}
            <button type="button" className="font-semibold text-brand-text" onClick={onConfigureTargets}>
              Drillable Navigation
            </button>{' '}
            on a saved template to accept incoming filters.
          </p>
        ) : (
          <div className="mt-4">
            <Select
              label="When clicked, go to"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              hint="Only dashboards marked as drill-through targets appear here."
              options={[
                { value: '', label: 'Select a dashboard' },
                ...targets.map((t) => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>
        )}

        {target ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-content-primary">Pass this block's field</p>
            <p className="mt-1 text-sm text-content-secondary">
              <span className="font-medium text-content-primary">{sourceField || '(none)'}</span>
              {' → '}
              target's field
            </p>
            <div className="mt-3">
              <Select
                label="Target field"
                value={mapped}
                onChange={(e) => setTargetField(e.target.value)}
                hint={
                  autoMatched && mapped === sourceField
                    ? 'Auto-matched by name. Change if the target uses a different field.'
                    : 'No identically named field on the target — pick the correct field.'
                }
                options={[
                  { value: '', label: 'Select target field' },
                  ...targetFields.map((f) => ({ value: f, label: f })),
                ]}
              />
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!canEnable} onClick={() => onEnable({ targetId, sourceField, targetField: mapped })}>
            Enable
          </Button>
        </div>
      </div>
    </div>
  );
}
