import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { StatusPill, type StatusTone } from '@/components/ui/StatusPill';

export type SuggestionPriority =
  | 'HIGH PRIORITY'
  | 'MEDIUM PRIORITY'
  | 'OPPORTUNITY'
  | 'WATCHLIST'
  | 'Critical'
  | 'High'
  | 'Medium'
  | 'Low';

export interface ActionableSuggestionCardProps {
  index?: number;
  title: string;
  observation?: string;
  body?: string;
  action?: string;
  impact?: string;
  priority: SuggestionPriority | string;
  icon: LucideIcon;
  critical?: boolean;
  tint?: string;
  onCreateTask?: () => void;
  className?: string;
}

function priorityTone(priority: string): StatusTone {
  const p = priority.toUpperCase();
  if (p.includes('CRITICAL') || p.includes('HIGH')) return 'error';
  if (p.includes('MEDIUM') || p.includes('WATCH')) return 'warning';
  if (p.includes('OPPORTUNITY')) return 'success';
  return 'neutral';
}

export function ActionableSuggestionCard({
  title,
  observation,
  body,
  action,
  priority,
  icon: Icon,
  critical = false,
  tint,
  onCreateTask,
  className,
}: ActionableSuggestionCardProps) {
  const text = observation || body || action || '';
  const chip = tint ?? (critical ? 'var(--status-error)' : 'var(--brand-accent)');

  return (
    <li className={cn('flex items-start gap-3', className)}>
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
        style={{
          backgroundColor: chip,
          backgroundImage: 'var(--glass-highlight)',
        }}
        aria-hidden
      >
        <Icon size={22} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-content-primary">{title}</p>
          <StatusPill label={priority} tone={priorityTone(priority)} />
        </div>
        {text ? (
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-content-secondary">{text}</p>
        ) : null}
      </div>
      {onCreateTask ? (
        <Button variant="secondary" size="sm" className="mt-0.5 shrink-0" onClick={onCreateTask}>
          Take Action
        </Button>
      ) : null}
    </li>
  );
}
