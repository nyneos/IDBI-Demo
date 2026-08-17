import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface PanelHeaderProps {
  title: ReactNode;
  /** @deprecated Icons are not shown in titles — ignored. */
  infoLabel?: string;
  /** @deprecated Icons are not shown in titles — ignored. */
  onInfoClick?: () => void;
  actionLabel?: string;
  onActionClick?: () => void;
  actions?: ReactNode;
  titleClassName?: string;
  className?: string;
}

export function PanelHeader({
  title,
  actionLabel,
  onActionClick,
  actions,
  titleClassName,
  className,
}: PanelHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-center justify-between gap-3', className)}>
      {title ? (
        <h3
          className={cn(
            'min-w-0 flex-1 truncate text-2xl font-semibold text-content-primary',
            titleClassName,
          )}
        >
          {title}
        </h3>
      ) : (
        <span />
      )}
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {actionLabel && onActionClick ? (
          <button
            type="button"
            onClick={onActionClick}
            className={cn(
              'inline-flex shrink-0 items-center gap-1 rounded-lg px-1.5 py-1',
              'text-sm font-semibold text-content-secondary',
              'transition-colors duration-fast ease-standard',
              'hover:bg-raised hover:text-content-primary',
              'outline-none',
            )}
          >
            {actionLabel}
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
