import { GitBranch } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { DashboardBlock, DashboardDataSource } from '@/components/dashboard-builder/types';
import { useDashboardFilterState } from '@/state/useDashboardFilterState';
import type { SemanticCatalog } from '../semantic-layer/types';
import { LineageTracePanel } from './LineageTracePanel';
import { buildLineageChain, captureFilters } from './useLineage';

const SKIP = new Set(['section-title', 'div', 'filter', 'slicer', 'what-if']);

export function LineageTraceButton({
  block,
  dashboardName,
  catalog,
  origin,
  viewSource,
  series,
}: {
  block: DashboardBlock;
  dashboardName: string;
  catalog: SemanticCatalog;
  origin: DashboardDataSource;
  viewSource: DashboardDataSource;
  series: { label: string; value: number }[];
}) {
  const [open, setOpen] = useState(false);
  const filters = useDashboardFilterState();
  if (SKIP.has(block.type)) return null;

  const chain = open
    ? buildLineageChain({
        block,
        dashboardName,
        catalog,
        origin,
        viewSource,
        series,
        filters: captureFilters({
          activeFilter: filters.activeFilter,
          drillFilter: filters.drillFilter,
          slicers: filters.slicers,
        }),
      })
    : null;

  return (
    <>
      <button
        type="button"
        aria-label="Trace lineage"
        title="Trace lineage"
        className="block-card-menu inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-status-success px-2.5 text-xs font-semibold text-white shadow-sm hover:brightness-95"
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <GitBranch size={12} strokeWidth={1.75} aria-hidden />
        Lineage
      </button>
      {open && chain
        ? createPortal(
            <LineageTracePanel title={block.title} chain={chain} onClose={() => setOpen(false)} />,
            document.body,
          )
        : null}
    </>
  );
}
