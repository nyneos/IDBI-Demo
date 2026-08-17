import { Select } from '@/components/ui/Select';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { EnterprisePageHeader } from '../shared/EnterprisePageHeader';
import { AnomalyDetection } from './AnomalyDetection';
import { DecompositionTree } from './DecompositionTree';
import { KeyInfluencers } from './KeyInfluencers';
import { SmartNarrative } from './SmartNarrative';

export function AiInsightsScreen() {
  const { dataSource } = useCustomDashboardDataSource();
  const dataValue = dataSource?.id ?? 'none';
  const dataOptions = dataSource
    ? [{ value: dataSource.id, label: dataSource.label }]
    : [{ value: 'none', label: 'Select data' }];

  return (
    <div className="flex flex-col gap-6">
      <EnterprisePageHeader
        title="AI Insights"
        actions={
          <Select
            label="Data"
            className="w-64"
            value={dataValue}
            options={dataOptions}
            onChange={() => undefined}
          />
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <KeyInfluencers />
        <DecompositionTree />
        <SmartNarrative />
        <AnomalyDetection />
      </div>
    </div>
  );
}
