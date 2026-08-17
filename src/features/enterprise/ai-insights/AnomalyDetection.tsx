import { useMemo } from 'react';
import { LineChart } from '@/components/charts/LineChart';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { Panel } from '@/components/ui/Panel';
import { formatINR } from '@/lib/format';
import { anomalyTooltip, detectAnomalies } from './detectAnomalies';

export function AnomalyDetection() {
  const { dataSource } = useCustomDashboardDataSource();

  const dateKey = dataSource?.dates?.[0]?.key ?? 'Transaction_Date';
  const series = useMemo(() => {
    if (!dataSource) return [];
    const dim = dataSource.dates?.find((d) => d.key === dateKey) ?? dataSource.dates?.[0];
    if (!dim) return [];
    return dim.aggregate().map((row) => ({ date: row.label, value: row.value }));
  }, [dataSource, dateKey]);

  const anomalies = useMemo(() => detectAnomalies(series), [series]);
  const anomalyMap = useMemo(() => {
    const m = new Map<number, (typeof anomalies)[0]>();
    anomalies.forEach((a, i) => {
      if (a.isAnomaly) m.set(i, a);
    });
    return m;
  }, [anomalies]);

  const lineData = series.map((row) => ({ x: row.date, records: row.value }));

  if (!dataSource) {
    return (
      <Panel interactive={false}>
        <h2 className="text-lg font-semibold text-content-primary">Anomaly detection</h2>
        <p className="mt-2 text-sm text-content-secondary">Upload time-series data to flag unusual points.</p>
      </Panel>
    );
  }

  return (
    <Panel interactive={false}>
      <h2 className="text-lg font-semibold text-content-primary">Anomaly detection</h2>
      <div className="relative mt-4">
        {series.length === 0 ? (
          <p className="text-sm text-content-secondary">No date field found in the uploaded register.</p>
        ) : (
          <>
            <LineChart
              framed={false}
              title=""
              ariaSummary="Transaction trend with anomaly overlay"
              data={lineData}
              series={[{ key: 'records', name: 'Daily volume', color: 'var(--cat-1)' }]}
              xKey="x"
              height={200}
              fill
              anomalies={anomalyMap}
              anomalyTooltip={(idx) => {
                const pt = anomalies[idx];
                return pt ? anomalyTooltip(pt, formatINR) : '';
              }}
            />
            {anomalies.filter((a) => a.isAnomaly).length === 0 ? (
              <p className="mt-2 text-xs text-content-tertiary">No anomalies detected in the current series.</p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1 text-xs text-content-secondary">
                {anomalies
                  .filter((a) => a.isAnomaly)
                  .map((a) => (
                    <li key={a.date}>{anomalyTooltip(a, formatINR)}</li>
                  ))}
              </ul>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
