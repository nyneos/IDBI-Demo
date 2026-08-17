import { memo, useState } from 'react';
import { Bell, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { StatusPill } from '@/components/ui/StatusPill';
import { useReducedMotion } from '@/motion/useReducedMotion';

export interface AlertItem {
  text: string;
  time: string;
  severity: 'error' | 'warning' | 'info';
}

export interface AlertTickerProps {
  alerts: AlertItem[];
  activeAlerts: number;
  onViewAll?: () => void;
  className?: string;
}

const SEVERITY_COLOR: Record<AlertItem['severity'], string> = {
  error: 'var(--status-error)',
  warning: 'var(--status-warning)',
  info: 'var(--status-info)',
};

export const AlertTicker = memo(function AlertTicker({
  alerts,
  activeAlerts,
  onViewAll,
  className,
}: AlertTickerProps) {
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);

  const empty = alerts.length === 0;

  return (
    <div
      className={cn(
        'glass z-20 flex h-12 w-full items-center gap-3 border-t border-hairline px-3',
        className,
      )}
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div className="flex h-full shrink-0 items-center gap-2 bg-status-error/15 px-3 text-status-error">
        <Bell size={16} strokeWidth={1.75} aria-hidden />
        <span className="text-xs font-bold uppercase tracking-wider">Live Alerts</span>
      </div>

      <div className="relative min-w-0 flex-1 overflow-hidden">
        {empty ? (
          <p className="text-center text-xs text-content-tertiary">No active alerts</p>
        ) : reduced ? (
          <ul className="flex max-h-10 flex-col gap-1 overflow-y-auto">
            {alerts.map((a) => (
              <li key={`${a.text}-${a.time}`} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLOR[a.severity] }}
                  aria-hidden
                />
                <span className="truncate text-content-primary">{a.text}</span>
                <span className="shrink-0 tabular text-content-tertiary">{a.time}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div
            className={cn('flex w-max gap-8', !paused && 'animate-ticker')}
            style={{ animationPlayState: paused ? 'paused' : 'running' }}
          >
            {[...alerts, ...alerts].map((a, i) => (
              <div key={`${a.text}-${i}`} className="flex items-center gap-2 whitespace-nowrap text-xs">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: SEVERITY_COLOR[a.severity] }}
                  aria-hidden
                />
                <span className="text-content-primary">{a.text}</span>
                <span className="tabular text-content-tertiary">{a.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatusPill label={`Total Active Alerts: ${activeAlerts}`} tone="warning" />
        {onViewAll ? (
          <button
            type="button"
            onClick={onViewAll}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg px-2 py-1',
              'text-sm font-semibold text-content-secondary',
              'transition-colors duration-fast ease-standard',
              'hover:bg-raised hover:text-content-primary',
              'outline-none',
            )}
          >
            View All Alerts
            <ArrowRight size={14} strokeWidth={1.75} aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
});
