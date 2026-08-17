import { cn } from '@/lib/cn';
import { useReducedMotion } from '@/motion/useReducedMotion';

export interface AlertPanelProps {
  headline: string;
  body: string;
  footer?: string;
  className?: string;
  /** Soft border pulse — only for genuine threshold breaches. */
  pulse?: boolean;
}

export function AlertPanel({
  headline,
  body,
  footer = 'Immediate attention recommended.',
  className,
  pulse = true,
}: AlertPanelProps) {
  const reduced = useReducedMotion();

  return (
    <aside
      role="alert"
      className={cn(
        'rounded-xl border border-status-error/30 p-4',
        pulse && !reduced && 'animate-alert-pulse',
        className,
      )}
      style={{ backgroundColor: 'var(--status-error-bg)' }}
    >
      <h3 className="mb-2 text-2xl font-semibold text-status-error">{headline}</h3>
      <p className="text-sm leading-relaxed text-content-secondary">{body}</p>
      {footer ? (
        <p className="mt-3 text-xs font-semibold text-status-error">{footer}</p>
      ) : null}
    </aside>
  );
}
