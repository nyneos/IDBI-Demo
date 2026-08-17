import { useCallback, useEffect, useState } from 'react';
import type { DashboardState } from '@/components/dashboard-builder/types';
import {
  cloneDashboard,
  loadGovernance,
  saveGovernance,
  summarizeBlockDiff,
  type DashboardGovernance,
  type DashboardVersion,
} from './dashboardGovernance';
import type { PromotionStatus } from './types';

const EVENT = 'enterprise-dashboard-gov';

export function useDashboardGovernance(dashboardId: string) {
  const [gov, setGov] = useState<DashboardGovernance>(() => loadGovernance(dashboardId));

  useEffect(() => {
    setGov(loadGovernance(dashboardId));
    const on = () => setGov(loadGovernance(dashboardId));
    window.addEventListener(EVENT, on);
    window.addEventListener('storage', on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener('storage', on);
    };
  }, [dashboardId]);

  const persist = useCallback(
    (next: DashboardGovernance) => {
      saveGovernance(dashboardId, next);
      setGov(next);
      window.dispatchEvent(new Event(EVENT));
    },
    [dashboardId],
  );

  const appendVersion = useCallback(
    (
      snapshot: DashboardState,
      actor: string,
      opts?: { status?: PromotionStatus; changeSummary?: string },
    ): DashboardVersion => {
      const status = opts?.status ?? gov.status;
      const prev = gov.versions.reduce<DashboardVersion | null>(
        (best, v) => (!best || v.version > best.version ? v : best),
        null,
      );
      const version: DashboardVersion = {
        version: (prev?.version ?? 0) + 1,
        snapshot: cloneDashboard(snapshot),
        status,
        changedBy: actor,
        changedAt: Date.now(),
        changeSummary: opts?.changeSummary ?? summarizeBlockDiff(prev?.snapshot ?? null, snapshot),
      };
      persist({
        status,
        versions: [version, ...gov.versions],
      });
      return version;
    },
    [gov.status, gov.versions, persist],
  );

  const setStatus = useCallback(
    (status: PromotionStatus) => {
      persist({ ...gov, status });
    },
    [gov, persist],
  );

  return {
    status: gov.status,
    versions: gov.versions,
    appendVersion,
    setStatus,
  };
}
