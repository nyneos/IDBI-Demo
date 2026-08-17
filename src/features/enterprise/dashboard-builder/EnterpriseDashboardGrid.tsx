import { useMemo } from 'react';
import GridLayout, { WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { BLOCK_MIN_SIZE, type DashboardBlock, type DashboardDataSource, type GridLayoutItem } from '@/components/dashboard-builder/types';
import { filterDataSource, withFacts } from '@/data/buildUploadedDataSource';
import { applyCalculatedField } from '@/data/calculatedFields';
import { useDashboardFilterState } from '@/state/useDashboardFilterState';
import type { SemanticCatalog } from '../semantic-layer/types';
import { EnterpriseBlockCard } from './EnterpriseBlockCard';

const ResponsiveGrid = WidthProvider(GridLayout);

function sanitize(item: GridLayoutItem): GridLayoutItem {
  return {
    ...item,
    x: Number.isFinite(item.x) ? item.x : 0,
    y: Number.isFinite(item.y) ? item.y : 0,
    w: Number.isFinite(item.w) ? item.w : 6,
    h: Number.isFinite(item.h) ? item.h : 8,
  };
}

export function EnterpriseDashboardGrid({
  blocks,
  layout,
  dataSource,
  catalog,
  mode,
  dashboardName,
  onLayoutChange,
  onEdit,
  onRemove,
}: {
  blocks: DashboardBlock[];
  layout: GridLayoutItem[];
  dataSource: DashboardDataSource | null;
  catalog: SemanticCatalog;
  mode: 'edit' | 'view';
  dashboardName: string;
  onLayoutChange?: (layout: GridLayoutItem[]) => void;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const { activeFilter, slicers, drillFilter, whatIf } = useDashboardFilterState();

  const viewSource = useMemo(() => {
    if (!dataSource) return null;
    let next = dataSource;
    const map: Record<string, string | string[]> = {};
    if (activeFilter?.field) map[activeFilter.field] = activeFilter.value;
    if (drillFilter?.field) map[drillFilter.field] = drillFilter.value;
    for (const [field, values] of Object.entries(slicers)) {
      if (field && values.length > 0) map[field] = values;
    }
    next = filterDataSource(next, map);
    if (next.facts && next.calculatedFields?.length) {
      let facts = next.facts;
      for (const field of next.calculatedFields) {
        try {
          facts = applyCalculatedField(facts, field.name, field.formula, whatIf);
        } catch {
          /* keep last facts */
        }
      }
      next = withFacts(next, facts);
    }
    return next;
  }, [dataSource, activeFilter, slicers, drillFilter, whatIf]);

  const items: GridLayoutItem[] = blocks.map((b, i) => {
    const size = BLOCK_MIN_SIZE[b.type];
    const existing = layout.find((l) => l.i === b.id) ?? b.layout;
    return sanitize(
      existing ?? {
        i: b.id,
        x: (i * 4) % 12,
        y: Math.floor(i / 3) * size.h,
        w: size.w,
        h: size.h,
        minW: size.minW,
        minH: size.minH,
      },
    );
  });

  if (!viewSource) {
    return (
      <p className="p-8 text-sm text-content-secondary">Upload a spreadsheet to bind charts to data.</p>
    );
  }

  return (
    <ResponsiveGrid
      className="layout"
      cols={12}
      rowHeight={32}
      margin={[16, 16]}
      containerPadding={[0, 0]}
      layout={items}
      isDraggable={mode === 'edit'}
      isResizable={mode === 'edit'}
      draggableCancel=".block-card-menu"
      onLayoutChange={(next) =>
        onLayoutChange?.(
          next.map((n) =>
            sanitize({
              i: n.i,
              x: n.x,
              y: n.y,
              w: n.w,
              h: n.h,
              minW: n.minW,
              minH: n.minH,
            }),
          ),
        )
      }
      compactType="vertical"
    >
      {blocks.map((block) => (
        <div key={block.id} className="h-full overflow-hidden">
          <div className="h-full min-h-[240px]">
            <EnterpriseBlockCard
              block={block}
              dataSource={viewSource}
              origin={dataSource ?? viewSource}
              dashboardName={dashboardName}
              catalog={catalog}
              readOnly={mode === 'view'}
              onEdit={mode === 'edit' ? onEdit : undefined}
              onRemove={mode === 'edit' ? onRemove : undefined}
            />
          </div>
        </div>
      ))}
    </ResponsiveGrid>
  );
}
