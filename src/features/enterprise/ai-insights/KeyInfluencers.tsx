import { useEffect, useState } from 'react';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { Panel } from '@/components/ui/Panel';
import { KeyInfluencersView } from './KeyInfluencersView';
import { targetValuesForField } from './computeInfluence';
import { factsOf } from '@/components/dashboard-builder/blockData';

export function KeyInfluencers() {
  const { dataSource } = useCustomDashboardDataSource();
  const [targetField, setTargetField] = useState('Status');
  const [targetValue, setTargetValue] = useState('');

  useEffect(() => {
    if (!dataSource || !targetField || targetValue) return;
    const vals = targetValuesForField(factsOf(dataSource), targetField);
    const failed = vals.find((v) => /fail/i.test(v));
    if (failed) setTargetValue(failed);
    else if (vals[0]) setTargetValue(vals[0]);
  }, [dataSource, targetField, targetValue]);

  if (!dataSource) {
    return (
      <Panel interactive={false}>
        <h2 className="text-lg font-semibold text-content-primary">Key influencers</h2>
        <p className="mt-2 text-sm text-content-secondary">
          Upload transaction data in Custom Dashboard first.
        </p>
      </Panel>
    );
  }

  return (
    <Panel interactive={false}>
      <h2 className="text-lg font-semibold text-content-primary">Key influencers</h2>
      <div className="mt-4">
        <KeyInfluencersView
          source={dataSource}
          targetField={targetField}
          targetValue={targetValue}
          onTargetFieldChange={(f) => {
            setTargetField(f);
            setTargetValue('');
          }}
          onTargetValueChange={setTargetValue}
        />
      </div>
    </Panel>
  );
}
