import { ArrowUpRight } from 'lucide-react';
import { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { cn } from '@/lib/cn';
import { useDashboardFilterState } from '@/state/useDashboardFilterState';
import { BlockCardMenu } from './BlockCardMenu';
import { blockKeys, fieldPresent, oneD } from './blockData';
import { renderBlockChart } from './renderBlockChart';
import {
  TITLE_ALIGN_CLASS,
  TITLE_SIZE_CLASS,
  TITLE_WEIGHT_CLASS,
  type DashboardBlock,
  type DashboardDataSource,
} from './types';

interface CustomBlockCardProps {
  block: DashboardBlock;
  dataSource: DashboardDataSource;
  onEdit?: (id: string) => void;
  onRemove?: (id: string) => void;
  onDrillThrough?: (id: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  readOnly?: boolean;
}

export function CustomBlockCard({
  block,
  dataSource,
  onEdit,
  onRemove,
  onDrillThrough,
  filterValue,
  onFilterChange,
  readOnly = false,
}: CustomBlockCardProps) {
  const keys = blockKeys(block);
  const navigate = useNavigate();
  const location = useLocation();
  const { applyFilter, setDrillFilter, setSlicer } = useDashboardFilterState();
  const markHandled = useRef(false);
  const drillable = Boolean(block.enableDrillThrough && block.drillThroughTargetId);

  const openDrill = (value?: string) => {
    if (!drillable || !block.drillThroughTargetId) return;
    const bound = block.drillThroughSourceField || keys[0] || block.dimensionKey;
    if (bound && value) {
      const targetField = block.drillThroughTargetField || bound;
      setDrillFilter({ sourceBlockId: block.id, field: targetField, value });
      setSlicer(block.id, targetField, [value]);
    }
    navigate(`/dashboard/${block.drillThroughTargetId}`, {
      state: {
        parentPath: location.pathname,
        parentTitle: block.title,
      },
    });
  };
  const missing = keys.filter((k) => k && !fieldPresent(dataSource, k));
  const unavailable = missing.length > 0;
  const data =
    block.type === 'gauge' || block.type === 'section-title' || block.type === 'div'
      ? []
      : oneD(dataSource, keys[0] ?? block.dimensionKey);
  const empty =
    !unavailable &&
    block.type !== 'gauge' &&
    block.type !== 'kpi' &&
    block.type !== 'section-title' &&
    block.type !== 'div' &&
    block.type !== 'slicer' &&
    block.type !== 'what-if' &&
    data.length === 0 &&
    !dataSource.hierarchy;

  if (block.type === 'section-title') {
    return (
      <div className="flex items-center justify-between gap-3 py-2">
        <h3
          className={cn(
            TITLE_SIZE_CLASS[block.titleSettings.size],
            TITLE_WEIGHT_CLASS[block.titleSettings.weight],
            TITLE_ALIGN_CLASS[block.titleSettings.align],
            'min-w-0 flex-1 text-content-primary',
          )}
        >
          {block.title}
        </h3>
        {readOnly ? null : (
          <BlockCardMenu
            onEdit={() => onEdit?.(block.id)}
            onRemove={() => onRemove?.(block.id)}
            onDrillThrough={onDrillThrough ? () => onDrillThrough(block.id) : undefined}
            drillThroughEnabled={block.enableDrillThrough}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn('relative h-full', drillable && 'cursor-pointer')}
      onClick={(e) => {
        if (!drillable) return;
        if ((e.target as HTMLElement).closest('button, a, input, select, textarea, [role="menu"]')) return;
        if (markHandled.current) {
          markHandled.current = false;
          return;
        }
        openDrill();
      }}
    >
      {block.enableDrillThrough ? (
        <div className="pointer-events-none absolute top-2 right-12 z-10 flex items-center gap-1 rounded-full bg-brand-tint px-1.5 py-0.5 text-xs text-brand-text">
          <ArrowUpRight size={12} aria-hidden /> Drill-through
        </div>
      ) : null}
    <ChartFrame
      className="h-full"
      title={block.title}
      ariaSummary={`${block.title} custom analysis block`}
      titleClassName={cn(
        TITLE_SIZE_CLASS[block.titleSettings.size],
        TITLE_WEIGHT_CLASS[block.titleSettings.weight],
        TITLE_ALIGN_CLASS[block.titleSettings.align],
      )}
      headerAction={
        readOnly ? null : (
          <BlockCardMenu
            onEdit={() => onEdit?.(block.id)}
            onRemove={() => onRemove?.(block.id)}
            onDrillThrough={onDrillThrough ? () => onDrillThrough(block.id) : undefined}
            drillThroughEnabled={block.enableDrillThrough}
          />
        )
      }
      empty={empty}
      unavailable={unavailable}
      unavailableMessage={`"${missing[0]}" is not present in the new file`}
      onEmptyAction={unavailable && !readOnly ? () => onEdit?.(block.id) : undefined}
      plotClassName={
        block.type === 'div'
          ? undefined
          : block.type === 'kpi' || block.type === 'filter'
            ? 'min-h-24'
            : undefined
      }
    >
      {(slot) =>
        renderBlockChart(block.type, data, slot, {
          dimensionKey: block.dimensionKey,
          block,
          source: dataSource,
          filterValue,
          onFilterChange,
          onMarkClick: (field, value) => {
            const bound =
              block.drillThroughSourceField ||
              field ||
              block.dimensionKeys?.[0] ||
              block.dimensionKey;
            if (drillable) {
              markHandled.current = true;
              openDrill(value);
              return;
            }
            if (bound && block.includeInCrossFilter !== false) applyFilter(block.id, bound, value);
          },
        })
      }
    </ChartFrame>
    </div>
  );
}
