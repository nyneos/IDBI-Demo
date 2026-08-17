import { useMemo, useState } from 'react';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { Panel } from '@/components/ui/Panel';
import { Select } from '@/components/ui/Select';
import { useSemanticLayer } from '../semantic-layer/useSemanticLayer';
import { DecompositionTreeView } from './DecompositionTreeView';

export function DecompositionTree() {
  const { dataSource } = useCustomDashboardDataSource();
  const { approvedMeasures } = useSemanticLayer();
  const [measureId, setMeasureId] = useState(() => approvedMeasures[0]?.id ?? '');

  const measure = useMemo(
    () => approvedMeasures.find((m) => m.id === measureId) ?? approvedMeasures[0],
    [approvedMeasures, measureId],
  );

  if (!dataSource) {
    return (
      <Panel interactive={false}>
        <h2 className="text-lg font-semibold text-content-primary">Decomposition tree</h2>
        <p className="mt-2 text-sm text-content-secondary">Upload data to drill metrics across dimensions.</p>
      </Panel>
    );
  }

  return (
    <Panel interactive={false} className="h-fit">
      <h2 className="text-lg font-semibold text-content-primary">Decomposition tree</h2>
      <div className="mt-4 flex flex-col gap-4">
        {approvedMeasures.length ? (
          <Select
            label="Measure"
            value={measure?.id ?? ''}
            options={approvedMeasures.map((m) => ({ value: m.id, label: m.name }))}
            onChange={(e) => setMeasureId(e.target.value)}
          />
        ) : (
          <p className="text-sm text-content-secondary">
            Approve a governed measure in the Semantic Layer, or use the dashboard builder block with a custom field.
          </p>
        )}
        {measure ? <DecompositionTreeView source={dataSource} measure={measure} /> : null}
      </div>
    </Panel>
  );
}
