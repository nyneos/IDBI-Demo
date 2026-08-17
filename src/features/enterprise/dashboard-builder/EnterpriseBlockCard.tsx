import { ChartFrame } from '@/components/charts/ChartFrame';
import { BlockCardMenu } from '@/components/dashboard-builder/BlockCardMenu';
import { fieldPresent, oneD } from '@/components/dashboard-builder/blockData';
import { renderBlockChart } from '@/components/dashboard-builder/renderBlockChart';
import {
  TITLE_ALIGN_CLASS,
  TITLE_SIZE_CLASS,
  TITLE_WEIGHT_CLASS,
  type DashboardBlock,
  type DashboardDataSource,
} from '@/components/dashboard-builder/types';
import { cn } from '@/lib/cn';
import { StatusPill } from '@/components/ui/StatusPill';
import { LineageTraceButton } from '../lineage/LineageTraceButton';
import { EnterpriseBadge } from '../shared/EnterpriseBadge';
import { seriesForGovernedMeasure } from '../semantic-layer/evaluateMeasure';
import type { BlockSemanticBinding, SemanticCatalog } from '../semantic-layer/types';
import { generateNarrative } from '../ai-insights/generateNarrative';
import { InsightNarrativeList } from '../ai-insights/InsightNarrativeList';

export function EnterpriseBlockCard({
  block,
  dataSource,
  origin,
  dashboardName,
  catalog,
  onEdit,
  onRemove,
  readOnly = false,
}: {
  block: DashboardBlock;
  dataSource: DashboardDataSource;
  origin: DashboardDataSource;
  dashboardName: string;
  catalog: SemanticCatalog;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  readOnly?: boolean;
}) {
  const binding: BlockSemanticBinding | undefined = catalog.bindings[block.id];
  const measure = binding?.measureId
    ? catalog.measures.find((m) => m.id === binding.measureId)
    : undefined;
  const dimension = binding?.dimensionId
    ? catalog.dimensions.find((d) => d.id === binding.dimensionId)
    : undefined;
  const governed = Boolean(measure);

  const dimKey = dimension?.sourceField ?? block.dimensionKey;
  const missing =
    governed
      ? !measure || (dimension && !fieldPresent(dataSource, dimension.sourceField))
      : Boolean(dimKey && !fieldPresent(dataSource, dimKey));

  const data = resolveSeries(dataSource, block, catalog);

  const empty =
    !missing &&
    block.type !== 'gauge' &&
    block.type !== 'kpi' &&
    block.type !== 'section-title' &&
    block.type !== 'div' &&
    block.type !== 'key-influencers' &&
    block.type !== 'decomposition-tree' &&
    data.length === 0;

  const narrativeTypes = new Set(['bar', 'pie', 'line', 'table']);
  const showNarrative = narrativeTypes.has(block.type) && data.length > 0;
  const currencyNarrative = Boolean(measure?.format === 'currency-inr');
  const insights = showNarrative
    ? generateNarrative(data, { currency: currencyNarrative })
    : [];

  const isDateLine =
    block.type === 'line' &&
    Boolean(dataSource.dates?.some((d) => d.key === dimKey) || dimKey.toLowerCase().includes('date'));

  const badge = governed ? (
    <EnterpriseBadge label="Governed" />
  ) : (
    <StatusPill label="Ad hoc" tone="neutral" />
  );

  return (
    <div className="group relative h-full">
      <ChartFrame
      className="h-full"
      title={
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate">{block.title}</span>
          {badge}
        </span>
      }
      ariaSummary={`${block.title} enterprise analysis block`}
      titleClassName={cn(
        TITLE_SIZE_CLASS[block.titleSettings.size],
        TITLE_WEIGHT_CLASS[block.titleSettings.weight],
        TITLE_ALIGN_CLASS[block.titleSettings.align],
      )}
      headerAction={
        <>
          <LineageTraceButton
            block={block}
            dashboardName={dashboardName}
            catalog={catalog}
            origin={origin}
            viewSource={dataSource}
            series={data}
          />
          {readOnly ? null : (
            <BlockCardMenu
              onEdit={() => onEdit?.(block.id)}
              onRemove={() => onRemove?.(block.id)}
            />
          )}
        </>
      }
      empty={empty}
      unavailable={missing}
      unavailableMessage="This governed definition or field is not available"
      onEmptyAction={missing && !readOnly ? () => onEdit?.(block.id) : undefined}
      plotClassName={block.type === 'kpi' || block.type === 'filter' ? 'min-h-24' : undefined}
    >
      {(slot) => (
        <>
          {renderBlockChart(block.type, data, slot, {
            dimensionKey: dimKey,
            block: {
              ...block,
              dimensionKey: dimKey,
              kpiMode: governed ? 'top' : block.kpiMode,
            },
            source: dataSource,
            showAnomalies: isDateLine,
            catalog,
          })}
          {showNarrative ? <InsightNarrativeList insights={insights} /> : null}
        </>
      )}
    </ChartFrame>
    </div>
  );
}

function resolveSeries(
  source: DashboardDataSource,
  block: DashboardBlock,
  catalog: SemanticCatalog,
) {
  const binding = catalog.bindings[block.id];
  const measure = binding?.measureId
    ? catalog.measures.find((m) => m.id === binding.measureId)
    : undefined;
  const dimension = binding?.dimensionId
    ? catalog.dimensions.find((d) => d.id === binding.dimensionId)
    : undefined;
  if (measure) return seriesForGovernedMeasure(source, measure, dimension ?? null);
  return oneD(source, block.dimensionKeys?.[0] ?? block.dimensionKey);
}
