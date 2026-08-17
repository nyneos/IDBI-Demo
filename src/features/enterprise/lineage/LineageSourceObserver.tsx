import { useEffect } from 'react';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { useEnterpriseSession } from '../auth/useEnterpriseSession';
import { useSemanticLayer } from '../semantic-layer/useSemanticLayer';
import { recordLineageSource, recordLineageTransform } from './useLineage';

/** Records the current upload and existing measures into the lineage store. */
export function LineageSourceObserver() {
  const { dataSource } = useCustomDashboardDataSource();
  const { user } = useEnterpriseSession();
  const { catalog } = useSemanticLayer();

  useEffect(() => {
    if (!dataSource) return;
    recordLineageSource(
      dataSource.label,
      user?.name ?? user?.email ?? 'unknown',
      dataSource.recordCount,
      Date.now(),
    );
  }, [dataSource, user?.name, user?.email]);

  useEffect(() => {
    for (const m of catalog.measures) {
      recordLineageTransform(m.id, m.sourceField, m.formula ?? '', m.aggregation);
    }
  }, [catalog.measures]);

  return null;
}
