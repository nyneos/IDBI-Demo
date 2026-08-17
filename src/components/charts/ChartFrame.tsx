import { useRef, type ReactNode, type RefObject } from 'react';
import { BarChart3, Unplug } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/Panel';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';

export interface ChartA11yRow {
  label: string;
  value: string | number;
}

export interface ChartFrameRenderProps {
  plotRef: RefObject<HTMLDivElement | null>;
}

export interface ChartFrameProps {
  title: ReactNode;
  ariaSummary: string;
  children: ReactNode | ((props: ChartFrameRenderProps) => ReactNode);
  footnote?: ReactNode;
  actionLabel?: string;
  onActionClick?: () => void;
  headerAction?: ReactNode;
  titleClassName?: string;
  infoLabel?: string;
  onInfoClick?: () => void;
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  unavailable?: boolean;
  unavailableMessage?: string;
  onEmptyAction?: () => void;
  a11yRows?: ChartA11yRow[];
  className?: string;
  plotClassName?: string;
}

export function ChartFrame({
  title,
  ariaSummary,
  children,
  footnote,
  actionLabel,
  onActionClick,
  headerAction,
  titleClassName,
  loading = false,
  empty = false,
  emptyMessage = 'No data available for this view',
  unavailable = false,
  unavailableMessage = 'This field is not present in the current data',
  onEmptyAction,
  a11yRows,
  className,
  plotClassName,
}: ChartFrameProps) {
  const plotRef = useRef<HTMLDivElement | null>(null);
  const slot: ChartFrameRenderProps = { plotRef };

  return (
    <Panel interactive className={cn('flex flex-col', className)}>
      <PanelHeader
        title={title}
        actionLabel={actionLabel}
        onActionClick={onActionClick}
        actions={headerAction}
        titleClassName={titleClassName}
      />

      <div
        ref={plotRef}
        className={cn('relative min-h-[180px] overflow-hidden', plotClassName)}
        aria-label={ariaSummary}
      >
        {loading ? (
          <div className="flex h-full min-h-40 flex-col gap-3 p-2" aria-busy>
            <Skeleton className="h-40 w-full" rounded="xl" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : unavailable ? (
          <EmptyState
            icon={Unplug}
            message={unavailableMessage}
            action={
              onEmptyAction ? { label: 'Edit', onClick: onEmptyAction } : undefined
            }
          />
        ) : empty ? (
          <EmptyState
            icon={BarChart3}
            message={emptyMessage}
            action={
              onEmptyAction
                ? { label: 'Reset filters', onClick: onEmptyAction }
                : undefined
            }
          />
        ) : typeof children === 'function' ? (
          children(slot)
        ) : (
          children
        )}
      </div>

      {footnote ? (
        <p className="mt-3 text-xs text-content-tertiary">{footnote}</p>
      ) : null}

      {a11yRows && a11yRows.length > 0 ? (
        <table className="sr-only">
          <caption>{ariaSummary}</caption>
          <thead>
            <tr>
              <th scope="col">Label</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {a11yRows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                <td>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </Panel>
  );
}
