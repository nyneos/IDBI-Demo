import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface BreadcrumbSegment {
  id: string;
  label: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  segments: BreadcrumbSegment[];
  className?: string;
}

export function Breadcrumb({ segments, className }: BreadcrumbProps) {
  if (segments.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex flex-wrap items-center gap-1', className)}>
      {segments.map((segment, index) => {
        const isCurrent = index === segments.length - 1;

        return (
          <span key={segment.id} className="inline-flex items-center gap-1">
            {index > 0 ? (
              <ChevronRight size={14} strokeWidth={1.75} aria-hidden className="text-content-tertiary" />
            ) : null}
            {isCurrent ? (
              <span
                aria-current="page"
                className="text-sm font-medium text-content-primary"
              >
                {segment.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={segment.onClick}
                className={cn(
                  'rounded-md px-1 py-0.5 text-sm text-content-secondary',
                  'transition-colors duration-fast ease-standard',
                  'hover:text-content-primary',
                  'outline-none',
                )}
              >
                {segment.label}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}
