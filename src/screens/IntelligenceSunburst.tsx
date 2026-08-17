import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import type { HierarchyNode } from '@/data/types';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import { DonutChart } from '@/components/charts/DonutChart';
import { ShareBar } from '@/components/data/ShareBar';
import { SunburstChart } from '@/components/sunburst/SunburstChart';
import type { SunburstArcDatum } from '@/components/sunburst/useSunburstLayout';
import { LiveKPICard } from '@/components/command/LiveKPICard';
import { Button } from '@/components/ui/Button';
import { Panel } from '@/components/ui/Panel';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { OperationalShell as AppShell } from '@/layout/OperationalShell';
import { formatCount, formatShare, shareOf } from '@/lib/format';
import { cn } from '@/lib/cn';
import { CustomDashboardSection } from '@/components/dashboard-builder/CustomDashboardSection';
import { loadSampleTransactions } from '@/data/loadSampleTransactions';
import { colorForCategory, ZONE_SUNBURST_COLORS } from '@/data/colors';

const STATUS_COLORS: Record<string, string> = {
  Success: 'var(--status-success)',
  Pending: 'var(--status-warning)',
  Failed: 'var(--status-error)',
  Reversed: 'var(--cat-4)',
  'Under Investigation': 'var(--cat-6)',
};

function findNode(id: string, root: HierarchyNode): HierarchyNode | null {
  if (root.id === id) return root;
  for (const child of root.children ?? []) {
    const found = findNode(id, child);
    if (found) return found;
  }
  return null;
}

function dimRows(source: DashboardDataSource, key: string) {
  return (
    source.dimensions.find((d) => d.key === key)?.aggregate() ??
    source.metrics?.find((d) => d.key === key)?.aggregate() ??
    []
  );
}

function statusCount(source: DashboardDataSource, label: string) {
  const row = dimRows(source, 'Status').find((r) => r.label === label);
  return row?.value ?? 0;
}

function avgAmount(source: DashboardDataSource) {
  const rows = source.raw ?? source.facts ?? [];
  const nums = rows
    .map((r) => Number(r.Amount))
    .filter((n) => Number.isFinite(n));
  if (nums.length === 0) return 0;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100;
}

function dailyCounts(source: DashboardDataSource) {
  const series = source.dates?.find((d) => d.key === 'Transaction_Date')?.aggregate() ?? [];
  return series.map((r) => r.value);
}

export default function IntelligenceSunburst() {
  const [source, setSource] = useState<DashboardDataSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addDashboardRef = useRef<HTMLButtonElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [focusId, setFocusId] = useState('root');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSampleTransactions()
      .then((ds) => {
        if (cancelled) return;
        setSource(ds);
        if (ds.hierarchy) setFocusId(ds.hierarchy.id);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load sample data');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hierarchy = source?.hierarchy;
  const total = source?.recordCount ?? 0;
  const selectedNode = selectedId && hierarchy ? findNode(selectedId, hierarchy) : null;
  const focusedNode = hierarchy ? findNode(focusId, hierarchy) : null;
  const focusLabel = focusedNode?.name ?? hierarchy?.name ?? 'Transactions';

  const statusRows = useMemo(() => (source ? dimRows(source, 'Status') : []), [source]);
  const categoryRows = useMemo(() => (source ? dimRows(source, 'Transaction_Category') : []), [source]);
  const channelRows = useMemo(() => (source ? dimRows(source, 'Channel') : []), [source]);
  const spark = useMemo(() => {
    const d = source ? dailyCounts(source) : [];
    return d.length ? d : [0];
  }, [source]);

  const meanAmount = source ? avgAmount(source) : 0;
  const success = source ? statusCount(source, 'Success') : 0;
  const pending = source ? statusCount(source, 'Pending') : 0;
  const failed = source ? statusCount(source, 'Failed') : 0;

  const categoryShares = useMemo(
    () =>
      categoryRows.slice(0, 5).map((n) => ({
        id: n.label,
        name: n.label,
        value: n.value,
        share: shareOf(n.value, total),
        color: colorForCategory(n.label, source?.categoryColors),
      })),
    [categoryRows, total, source?.categoryColors],
  );

  const insights = useMemo(() => {
    if (!source || !hierarchy) return [] as string[];
    const topCat = categoryRows[0];
    const topZone = hierarchy.children?.[0];
    const out: string[] = [];
    if (topCat) {
      out.push(
        `${topCat.label} is the largest category (${formatShare(topCat.value, total)} of ${formatCount(total)} transactions)`,
      );
    }
    if (topZone) {
      out.push(`${topZone.name} accounts for ${formatShare(topZone.value, total)} of volume`);
    }
    if (total > 0) {
      out.push(`${formatShare(success, total)} of transactions completed successfully`);
    }
    out.push(`Average transaction value is ₹${meanAmount.toLocaleString('en-IN')}`);
    return out;
  }, [source, hierarchy, categoryRows, total, success, meanAmount]);

  const kpiCards = source
    ? [
        {
          id: 'total',
          label: 'Total Transactions',
          value: total,
          format: 'count' as const,
          tint: 'var(--cat-1)',
        },
        {
          id: 'success',
          label: 'Success',
          value: success,
          format: 'count' as const,
          tint: 'var(--status-success)',
        },
        {
          id: 'pending',
          label: 'Pending',
          value: pending,
          format: 'count' as const,
          tint: 'var(--status-warning)',
        },
        {
          id: 'failed',
          label: 'Failed',
          value: failed,
          format: 'count' as const,
          tint: 'var(--status-error)',
        },
        {
          id: 'avg',
          label: 'Avg. Transaction Value',
          value: meanAmount,
          format: 'inr' as const,
          tint: 'var(--cat-3)',
        },
      ]
    : [];

  const handleArcActivate = (arc: SunburstArcDatum) => {
    setSelectedId(arc.id);
  };

  return (
    <AppShell
      topBar={{
        title: 'Daily Transactions Overview',
        titleAsParticle: true,
        actions: (
          <Button
            ref={addDashboardRef}
            variant="secondary"
            leftIcon={Plus}
            onClick={() => setDrawerOpen(true)}
          >
            Add Dashboard
          </Button>
        ),
      }}
    >
      {error ? (
        <p className="text-sm text-status-error">{error}</p>
      ) : !source || !hierarchy ? (
        <p className="text-sm text-content-secondary">Loading sample transactions…</p>
      ) : (
        <div className="flex flex-col gap-6 px-2">
          <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {kpiCards.map((kpi) => (
              <LiveKPICard
                key={kpi.id}
                label={kpi.label}
                value={kpi.value}
                format={kpi.format}
                tint={kpi.tint}
                sparkline={spark}
              />
            ))}
          </div>

          <div className="grid grid-cols-12 items-start gap-6">
            <Panel className="col-span-12 flex flex-col xl:col-span-8">
              <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-content-primary">Transaction Hierarchy</h2>
                  <p className="mt-1 text-sm text-content-secondary">
                    {focusId === hierarchy.id
                      ? 'Zone → channel. Click a slice to open that branch.'
                      : `${focusLabel} — click a slice to go deeper, or use Home to return.`}
                  </p>
                </div>
              </div>

              <div className="flex w-full justify-center">
                <SunburstChart
                  data={hierarchy}
                  focusId={focusId}
                  focusLabel={focusLabel}
                  selectedId={selectedId}
                  onFocusChange={setFocusId}
                  onArcActivate={handleArcActivate}
                />
              </div>

              <div className="mt-3 flex flex-wrap gap-3 border-t border-hairline pt-3">
                {(hierarchy.children ?? []).map((zone) => (
                  <button
                    key={zone.id}
                    type="button"
                    onClick={() => {
                      setFocusId(zone.id);
                      setSelectedId(zone.id);
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs',
                      'transition-colors duration-fast ease-standard hover:bg-raised',
                      'outline-none',
                      (focusId === zone.id || selectedId === zone.id) && 'bg-raised',
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-sm"
                      style={{
                        backgroundColor:
                          ZONE_SUNBURST_COLORS[zone.name] ?? 'var(--cat-other)',
                      }}
                      aria-hidden
                    />
                    <span className="text-content-primary">{zone.name}</span>
                    <span className="tabular text-content-tertiary">
                      {formatShare(zone.value, total)}
                    </span>
                  </button>
                ))}
              </div>
            </Panel>

            <div className="col-span-12 flex flex-col gap-6 xl:col-span-4">
              <DonutChart
                title="Status Mix"
                ariaSummary={`Status mix across ${formatCount(total)} transactions`}
                data={statusRows.map((s) => ({
                  id: s.label,
                  name: s.label,
                  value: s.value,
                  color: STATUS_COLORS[s.label] ?? 'var(--cat-other)',
                }))}
                size={168}
                thickness={28}
                centerLabel="Total"
                centerValue={total}
                legendAside={false}
              />

              <DonutChart
                title="Channel Mix"
                ariaSummary={`Channels across ${formatCount(total)} transactions`}
                data={channelRows.map((o) => ({
                  id: o.label,
                  name: o.label,
                  value: o.value,
                  color: colorForCategory(o.label, source.categoryColors),
                }))}
                size={168}
                thickness={28}
                centerLabel="Total"
                centerValue={total}
                legendAside={false}
              />
            </div>

            <Panel className="col-span-12 flex flex-col gap-3 xl:col-span-8">
              <h2 className="text-2xl font-semibold text-content-primary">
                {selectedNode ? `Selected: ${selectedNode.name}` : 'Selection Details'}
              </h2>
              {selectedNode ? (
                <p className="text-sm text-content-secondary">
                  {formatCount(selectedNode.value)} transactions · {selectedNode.level} ·{' '}
                  {formatShare(selectedNode.value, total)} of total
                </p>
              ) : (
                <p className="text-sm text-content-tertiary">
                  Click a sunburst arc to pin its stats here. Click again to deselect.
                </p>
              )}
              <PanelHeader
                title={
                  selectedNode?.children?.length
                    ? `Children of ${selectedNode.name}`
                    : 'Top transaction categories'
                }
              />
              <ul className="flex flex-col gap-2.5">
                {(selectedNode?.children?.length
                  ? selectedNode.children.map((c) => ({
                      ...c,
                      share: shareOf(c.value, selectedNode.value),
                      color: c.color ?? colorForCategory(c.name, source.categoryColors),
                    }))
                  : categoryShares
                ).map((n, i) => (
                  <li key={n.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-content-primary">{n.name}</span>
                      <span className="shrink-0 text-xs tabular text-content-secondary">
                        {formatCount(n.value)} (
                        {formatShare(
                          n.value,
                          selectedNode?.children?.length ? selectedNode.value : total,
                        )}
                        )
                      </span>
                    </div>
                    <ShareBar share={n.share} color={n.color} index={i} />
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel className="col-span-12 flex flex-col xl:col-span-4">
              <PanelHeader title="Quick Insights" />
              <ul className="flex flex-col gap-2">
                {insights.map((text) => (
                  <li
                    key={text}
                    className="rounded-lg border border-hairline bg-sunken px-3 py-2 text-sm leading-relaxed text-content-secondary"
                  >
                    {text}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </div>
      )}
      {source ? (
        <CustomDashboardSection
          dataSource={source}
          addDashboardRef={addDashboardRef}
          drawerOpen={drawerOpen}
          onDrawerOpenChange={setDrawerOpen}
          storageKey="daily-transactions-overview-custom"
        />
      ) : null}
    </AppShell>
  );
}
