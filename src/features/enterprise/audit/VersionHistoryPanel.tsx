import { useMemo, useState } from 'react';
import { pickerByType } from '@/components/dashboard-builder/chartRegistry';
import type { DashboardState } from '@/components/dashboard-builder/types';
import { Button } from '@/components/ui/Button';
import { StatusPill, type PillTone } from '@/components/ui/StatusPill';
import { EnterpriseModal } from '../shared/EnterpriseModal';
import { PROMOTION_LABEL, type PromotionStatus } from './types';
import type { DashboardVersion } from './dashboardGovernance';

const STATUS_TONE: Record<PromotionStatus, PillTone> = {
  draft: 'neutral',
  'in-review': 'warning',
  approved: 'info',
  published: 'success',
};

export function VersionHistoryPanel({
  dashboardName,
  versions,
  onRestore,
}: {
  dashboardName: string;
  versions: DashboardVersion[];
  onRestore: (version: DashboardVersion) => void;
}) {
  const [viewing, setViewing] = useState<DashboardVersion | null>(null);
  const ordered = useMemo(
    () => [...versions].sort((a, b) => b.version - a.version),
    [versions],
  );

  return (
    <section className="rounded-xl border border-hairline bg-paper p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-content-primary">
        Version History — {dashboardName}
      </h2>
      {ordered.length === 0 ? (
        <p className="mt-4 text-sm text-content-tertiary">
          No versions yet. Save this dashboard to append the first snapshot.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-hairline">
          {ordered.map((v) => (
            <li key={v.version} className="py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="text-sm font-semibold text-content-primary">v{v.version}</p>
                <p className="text-xs text-content-tertiary">
                  {new Date(v.changedAt).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-xs text-content-secondary">{v.changedBy}</p>
                <StatusPill label={PROMOTION_LABEL[v.status]} tone={STATUS_TONE[v.status]} />
              </div>
              <p className="mt-1 text-sm text-content-secondary">{v.changeSummary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={() => setViewing(v)}>
                  View
                </Button>
                <Button variant="secondary" onClick={() => onRestore(v)}>
                  Restore this version
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viewing ? (
        <ViewVersionDialog version={viewing} onClose={() => setViewing(null)} />
      ) : null}
    </section>
  );
}

function ViewVersionDialog({
  version,
  onClose,
}: {
  version: DashboardVersion;
  onClose: () => void;
}) {
  const snapshot: DashboardState = version.snapshot;
  return (
    <EnterpriseModal
      title={`v${version.version} — ${snapshot.name}`}
      subtitle={`${PROMOTION_LABEL[version.status]} · ${version.changedBy} · ${new Date(version.changedAt).toLocaleString('en-IN')}`}
      onDismiss={onClose}
    >
      <p className="mt-4 text-sm text-content-secondary">{version.changeSummary}</p>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-content-tertiary">
        Blocks in this snapshot
      </p>
      {snapshot.blocks.length === 0 ? (
        <p className="mt-2 text-sm text-content-tertiary">Empty canvas.</p>
      ) : (
        <ul className="mt-2 divide-y divide-hairline">
          {snapshot.blocks.map((b) => (
            <li key={b.id} className="py-2 text-sm text-content-primary">
              {pickerByType(b.type).label}
              {b.title ? <span className="text-content-tertiary"> · {b.title}</span> : null}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-content-tertiary">
        Restore loads this snapshot as the current draft. Saving afterwards appends a new version —
        history is not rewritten.
      </p>
      <div className="mt-6 flex justify-end">
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </EnterpriseModal>
  );
}
