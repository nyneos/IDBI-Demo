import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { GlassSurface } from '@/components/ui/GlassSurface';

export interface ChartTooltipProps {
  active?: boolean;
  title?: ReactNode;
  rows?: Array<{ label: string; value: string; color?: string }>;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function ChartTooltip({
  active = true,
  title,
  rows,
  children,
  className,
  style,
}: ChartTooltipProps) {
  if (!active) return null;

  return (
    <GlassSurface
      className={cn(
        'pointer-events-none z-50 min-w-32 rounded-md px-2.5 py-2 shadow-md',
        className,
      )}
      style={style}
      role="tooltip"
    >
      {title ? (
        <div className="mb-1 text-sm font-semibold text-content-primary">{title}</div>
      ) : null}
      {rows?.map((row) => (
        <div key={row.label} className="flex items-center justify-between gap-4 text-xs">
          <span className="inline-flex items-center gap-1.5 text-content-secondary">
            {row.color ? (
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{ backgroundColor: row.color }}
                aria-hidden
              />
            ) : null}
            {row.label}
          </span>
          <span className="tabular font-medium text-content-primary">{row.value}</span>
        </div>
      ))}
      {children}
    </GlassSurface>
  );
}
