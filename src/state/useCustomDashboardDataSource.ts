import { useDataSources } from '@/state/useDataSources';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';

/** One active uploaded source for Custom Dashboard (upload is Step 0 of the same route). */
export function useCustomDashboardDataSource() {
  const { latest, addSource, clearSources } = useDataSources();
  return {
    dataSource: latest,
    setDataSource: (ds: DashboardDataSource) => addSource(ds),
    clearDataSource: () => clearSources(),
  };
}
