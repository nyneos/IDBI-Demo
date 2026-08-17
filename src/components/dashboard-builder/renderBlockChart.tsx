import { useEffect, useMemo, useState } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { ComboChart } from '@/components/charts/ComboChart';
import { SlicerBlock, WhatIfBlock } from '@/components/bi/SlicerBlock';
import { ChordDiagram } from '@/components/charts/ChordDiagram';
import { DonutChart } from '@/components/charts/DonutChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { HeatmapChart } from '@/components/charts/HeatmapChart';
import { HierarchyProjection } from '@/components/charts/HierarchyProjection';
import { HivePlot } from '@/components/charts/HivePlot';
import { LineChart } from '@/components/charts/LineChart';
import { RadialBarPlot } from '@/components/charts/RadialBarPlot';
import { SankeyChart } from '@/components/charts/SankeyChart';
import { ScatterPlot } from '@/components/charts/ScatterPlot';
import type { ChartFrameRenderProps } from '@/components/charts/ChartFrame';
import { KPICard } from '@/components/data/KPICard';
import { RankingTable } from '@/components/data/RankingTable';
import { defaultReportingConfig, ReportingTableBlock } from '@/components/table/ReportingTableBlock';
import { ForceGraph } from '@/components/network/ForceGraph';
import { SunburstChart } from '@/components/sunburst/SunburstChart';
import { Select } from '@/components/ui/Select';
import { colorForLabel } from './dimensionRegistry';
import {
  blockKeys,
  chordFor,
  heatmapFor,
  hierarchyFor,
  hiveFor,
  networkFor,
  oneD,
  sankeyFor,
  scatterFor,
  seriesFor,
} from './blockData';
import { DEFAULT_TITLE_SETTINGS, type DashboardBlock, type DashboardDataSource, type WorkingBlockType } from './types';

const SAMPLE_SERIES = [
  { label: 'Northern', value: 42 },
  { label: 'Western', value: 31 },
  { label: 'Southern', value: 24 },
  { label: 'Eastern', value: 18 },
  { label: 'Others', value: 8 },
];

export function toChartRows(data: { label: string; value: number }[]) {
  return data.map((row) => ({
    id: row.label,
    name: row.label,
    value: row.value,
    color: colorForLabel(row.label),
  }));
}

function BlockSunburst({ source, keys }: { source: DashboardDataSource; keys: string[] }) {
  const tree = hierarchyFor(source, keys);
  const [focusId, setFocusId] = useState(tree?.id ?? 'root');
  useEffect(() => {
    if (tree) setFocusId(tree.id);
  }, [tree?.id]);
  if (!tree) return null;
  return (
    <SunburstChart
      data={tree}
      focusId={focusId}
      focusLabel={tree.name}
      onFocusChange={setFocusId}
      onArcActivate={(arc) => {
        if (arc.childrenIds.length > 0) setFocusId(arc.id);
      }}
    />
  );
}

function BlockNetwork({ source, keys }: { source: DashboardDataSource; keys: string[] }) {
  const { nodes, edges } = useMemo(
    () => networkFor(source, keys[0] ?? '', keys[1] ?? keys[0] ?? ''),
    [source, keys],
  );
  const [selected, setSelected] = useState<string | null>(nodes[0]?.id ?? null);
  const types = useMemo(() => new Set(nodes.map((n) => n.type)), [nodes]);
  if (nodes.length === 0) return null;
  return (
    <div className="h-[280px]">
      <ForceGraph
        nodes={nodes}
        edges={edges}
        selectedId={selected}
        activeTypes={types}
        searchQuery=""
        onSelect={(node) => setSelected(node.id)}
      />
    </div>
  );
}

export function renderBlockChart(
  type: WorkingBlockType,
  data: { label: string; value: number }[],
  slot: ChartFrameRenderProps,
  opts?: {
    compact?: boolean;
    dimensionKey?: string;
    block?: DashboardBlock;
    source?: DashboardDataSource;
    filterValue?: string;
    onFilterChange?: (value: string) => void;
    onMarkClick?: (field: string, value: string) => void;
  },
) {
  const compact = opts?.compact ?? false;
  const source = opts?.source;
  const block = opts?.block;
  const keys = block ? blockKeys(block) : opts?.dimensionKey ? [opts.dimensionKey] : [];
  const useSample = data.length === 0 && !source?.recordCount;
  const rows = toChartRows(data.length ? data : useSample ? SAMPLE_SERIES : []);
  const plotData = data.length ? data : useSample ? SAMPLE_SERIES : [];

  if (type === 'combo' && source && block) {
    const withCombo =
      block.combo ??
      ({
        xField: keys[0] ?? '',
        series1: { type: 'bar' as const, field: keys[1] ?? keys[0] ?? '', axis: 'left' as const },
        series2: { type: 'line' as const, field: keys[2] ?? keys[1] ?? keys[0] ?? '', axis: 'right' as const },
      } as DashboardBlock['combo']);
    return <ComboChart block={{ ...block, combo: withCombo }} source={source} onMarkClick={opts?.onMarkClick} />;
  }
  if (type === 'slicer' && source && block) {
    return <SlicerBlock block={block} source={source} />;
  }
  if (type === 'what-if' && block) {
    return <WhatIfBlock block={block} />;
  }

  if (type === 'bar') {
    return (
      <div className="flex h-full flex-col">
        {block?.axisLabels?.y ? (
          <p className="mb-1 text-xs text-content-tertiary">{block.axisLabels.y}</p>
        ) : null}
        <BarChart
          framed={false}
          slot={slot}
          title=""
          ariaSummary="Bar chart of selected field"
          data={rows}
          orientation={compact ? 'vertical' : 'horizontal'}
          maxBars={8}
          onBarClick={(bar) => opts?.onMarkClick?.(keys[0] ?? block?.dimensionKey ?? '', bar.name)}
        />
        {block?.axisLabels?.x ? (
          <p className="mt-1 text-center text-xs text-content-tertiary">{block.axisLabels.x}</p>
        ) : null}
      </div>
    );
  }

  if (type === 'pie') {
    return (
      <DonutChart
        framed={false}
        slot={slot}
        title=""
        ariaSummary="Pie chart of selected field"
        data={rows}
        size={compact ? 96 : 120}
        thickness={compact ? 18 : 22}
        legendAside={!compact}
        showLegend
        onSliceClick={(slice) => opts?.onMarkClick?.(keys[0] ?? '', slice.name)}
      />
    );
  }

  if (type === 'line') {
    return (
      <LineChart
        framed={false}
        slot={slot}
        title=""
        ariaSummary="Line graph of the selected field"
        data={plotData.map((row) => ({ x: row.label, records: row.value }))}
        series={[{ key: 'records', name: block?.axisLabels?.y || 'Records', color: 'var(--cat-1)' }]}
        xKey="x"
        height={compact ? 140 : 180}
        fill
      />
    );
  }

  if (type === 'radial') {
    return <RadialBarPlot title="" ariaSummary="Radial bar" data={plotData} framed={false} />;
  }

  if (type === 'double-bar' || type === 'stacked-bar') {
    const series =
      source && keys[0] && keys[1]
        ? seriesFor(source, keys[0], keys[1])
        : {
            categories: plotData.map((d) => d.label),
            series: [
              { key: 'value', name: 'Count', values: plotData.map((d) => d.value) },
              {
                key: 'rest',
                name: 'Remainder',
                values: plotData.map((d) => Math.max(8, 50 - d.value)),
              },
            ],
          };
    const barData = series.categories.map((name, i) => {
      const row: { id: string; name: string; value: number; [k: string]: string | number } = {
        id: name,
        name,
        value: series.series[0]?.values[i] ?? 0,
      };
      for (const s of series.series) row[s.key] = s.values[i] ?? 0;
      return row;
    });
    return (
      <BarChart
        framed={false}
        slot={slot}
        title=""
        ariaSummary={type}
        data={barData}
        series={series.series.map((s, i) => ({
          key: s.key,
          name: s.name,
          color: `var(--cat-${(i % 6) + 1})`,
        }))}
        stacked={type === 'stacked-bar'}
      />
    );
  }

  if (type === 'heatmap') {
    if (source && keys[0] && keys[1]) {
      const heat = heatmapFor(source, keys[0], keys[1]);
      return <HeatmapChart rows={heat.rows} cols={heat.cols} cells={heat.cells} />;
    }
    return <p className="p-4 text-sm text-content-secondary">Bind two category fields for a heatmap.</p>;
  }

  if (type === 'scatter' && source) {
    const sc = scatterFor(source, keys[0] ?? '', keys[1] ?? keys[0] ?? '');
    return (
      <ScatterPlot
        title=""
        ariaSummary="Scatter"
        data={sc.points}
        xLabel={sc.xLabel}
        yLabel={sc.yLabel}
        framed={false}
        compact={compact}
      />
    );
  }

  if (type === 'table') {
    const total = plotData.reduce((s, r) => s + r.value, 0) || 1;
    return (
      <RankingTable
        title=""
        rows={plotData.map((r) => ({
          id: r.label,
          label: r.label,
          value: r.value,
          share: (r.value / total) * 100,
          color: colorForLabel(r.label),
        }))}
        showBars
      />
    );
  }

  if (type === 'reporting-table') {
    if (!source) return <p className="p-4 text-sm text-content-secondary">Upload data to bind this table.</p>;
    const bound: DashboardBlock = block ?? {
      id: 'preview',
      type: 'reporting-table',
      dimensionKey: '',
      title: 'Reporting Table',
      titleSettings: DEFAULT_TITLE_SETTINGS,
      reportingConfig: defaultReportingConfig(source),
    };
    return <ReportingTableBlock block={bound} source={source} compact={compact} />;
  }

  if (type === 'kpi') {
    const mode = block?.kpiMode ?? 'count';
    const total = source?.recordCount ?? data.reduce((s, r) => s + r.value, 0);
    const top = data[0];
    const value =
      mode === 'top' && top
        ? top.value
        : mode === 'rate' && top && total
          ? Math.round((top.value / total) * 1000) / 10
          : total;
    const over =
      block?.condFormat?.type === 'threshold' &&
      block.condFormat.threshold != null &&
      value >= block.condFormat.threshold;
    return (
      <KPICard
        label={mode === 'top' ? top?.label ?? 'Top value' : mode === 'rate' ? 'Share' : 'Records'}
        value={value}
        type={mode === 'rate' ? 'percent' : 'count'}
        tint={over ? 'var(--status-error)' : 'var(--cat-1)'}
      />
    );
  }

  if (type === 'filter' && source && keys[0]) {
    const options = [
      { value: '__all__', label: 'All' },
      ...oneD(source, keys[0]).map((r) => ({ value: r.label, label: r.label })),
    ];
    return (
      <Select
        label="Filter value"
        hideLabel
        value={opts?.filterValue ?? '__all__'}
        options={options}
        onChange={(e) => opts?.onFilterChange?.(e.target.value)}
      />
    );
  }

  if (type === 'section-title') {
    return null;
  }

  if (type === 'div') {
    return <div className="h-full min-h-16" />;
  }

  if (type === 'sunburst' && source) {
    return <BlockSunburst source={source} keys={keys} />;
  }

  if (
    (type === 'treemap' || type === 'icicle' || type === 'pack' || type === 'radial-tree') &&
    source
  ) {
    const tree = hierarchyFor(source, keys);
    if (!tree) return null;
    const kind =
      type === 'treemap' ? 'treemap' : type === 'icicle' ? 'icicle' : type === 'pack' ? 'pack' : 'radialTree';
    return <HierarchyProjection root={tree} kind={kind} />;
  }

  if ((type === 'sankey' || type === 'parallel-sets') && source) {
    const flow = sankeyFor(source, keys.length >= 2 ? keys : source.dimensions.slice(0, 4).map((d) => d.key));
    return (
      <SankeyChart
        framed={false}
        slot={slot}
        title=""
        ariaSummary="Flow"
        stages={flow.stages}
        links={flow.links}
        height={compact ? 180 : 260}
      />
    );
  }

  if (type === 'network' && source) {
    return <BlockNetwork source={source} keys={keys} />;
  }

  if (type === 'chord') {
    if (source && keys[0] && keys[1]) {
      const chord = chordFor(source, keys[0], keys[1]);
      return <ChordDiagram labels={chord.labels} matrix={chord.matrix} />;
    }
    return <p className="p-4 text-sm text-content-secondary">Bind two fields for a chord diagram.</p>;
  }

  if (type === 'hive' && source) {
    const hive = hiveFor(
      source,
      keys.length >= 3 ? keys : source.dimensions.slice(0, 3).map((d) => d.key),
    );
    return <HivePlot axes={hive.axes} edges={hive.edges} />;
  }

  if (type !== 'gauge') return null;

  const metric =
    source?.gauges?.find((m) => m.key === opts?.dimensionKey) ?? source?.gauges?.[0];
  if (!metric) return null;

  return (
    <GaugeChart
      framed={false}
      slot={slot}
      title=""
      ariaSummary={`${metric.label} gauge`}
      ratio={metric.value}
      value={metric.value}
      label={metric.unit}
      width={compact ? 140 : 180}
      height={compact ? 140 : 180}
      showNeedle
    />
  );
}
