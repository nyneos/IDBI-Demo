import { useMemo } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { oneD } from '@/components/dashboard-builder/blockData';
import { toChartRows } from '@/components/dashboard-builder/renderBlockChart';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { Panel } from '@/components/ui/Panel';
import { generateNarrative } from './generateNarrative';
import { InsightNarrativeList } from './InsightNarrativeList';

export function SmartNarrative() {
  const { dataSource } = useCustomDashboardDataSource();

  const field = 'Branch_Name';
  const data = useMemo(() => (dataSource ? oneD(dataSource, field) : []), [dataSource]);
  const rows = toChartRows(data);
  const insights = useMemo(
    () => generateNarrative(data, { currency: true }),
    [data],
  );

  if (!dataSource) {
    return (
      <Panel interactive={false}>
        <h2 className="text-lg font-semibold text-content-primary">Smart narrative</h2>
        <p className="mt-2 text-sm text-content-secondary">Upload data to generate guarded plain-language summaries.</p>
      </Panel>
    );
  }

  return (
    <Panel interactive={false}>
      <h2 className="text-lg font-semibold text-content-primary">Smart narrative</h2>
      <div className="mt-4">
        <BarChart
          framed={false}
          title=""
          ariaSummary="Branch breakdown for narrative demo"
          data={rows}
          orientation="horizontal"
          maxBars={6}
        />
        <InsightNarrativeList insights={insights} />
      </div>
    </Panel>
  );
}
