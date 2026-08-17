import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  GraduationCap,
  IndianRupee,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Panel } from '@/components/ui/Panel';
import { PanelHeader } from '@/components/ui/PanelHeader';

export type ActionSeverity = 'error' | 'warning' | 'info' | 'success';

export interface ActionTimelineItem {
  date: string;
  title: string;
  reason?: string;
  severity: ActionSeverity;
  icon?: string;
}

export interface ActionTimelineProps {
  title?: string;
  items: ActionTimelineItem[];
  className?: string;
}

const SEVERITY_ICON: Record<ActionSeverity, LucideIcon> = {
  error: AlertTriangle,
  warning: FileWarning,
  info: Info,
  success: CheckCircle2,
};

const NAMED_ICONS: Record<string, LucideIcon> = {
  AlertTriangle,
  ClipboardCheck,
  IndianRupee,
  FileWarning,
  GraduationCap,
  Info,
  CheckCircle2,
};

const SEVERITY_TONE: Record<ActionSeverity, string> = {
  error: 'text-status-error bg-status-error/10',
  warning: 'text-status-warning bg-status-warning/10',
  info: 'text-status-info bg-status-info/10',
  success: 'text-status-success bg-status-success/10',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

function formatActionDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]} ${y}`;
}

export function ActionTimeline({
  title = 'Recent Actions',
  items,
  className,
}: ActionTimelineProps) {
  return (
    <Panel className={cn('flex h-full flex-col', className)}>
      <PanelHeader title={title} />
      <ol className="flex flex-col gap-0">
        {items.map((item, i) => {
          const Icon =
            (item.icon ? NAMED_ICONS[item.icon] : undefined) ?? SEVERITY_ICON[item.severity];
          return (
            <li key={`${item.date}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
              {i < items.length - 1 ? (
                <span
                  className="absolute left-3.5 top-8 h-[calc(100%-20px)] w-px bg-hairline"
                  aria-hidden
                />
              ) : null}
              <span
                className={cn(
                  'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
                  SEVERITY_TONE[item.severity],
                )}
                aria-hidden
              >
                <Icon size={14} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <time className="text-xs font-medium text-content-tertiary">
                  {formatActionDate(item.date)}
                </time>
                <p className="mt-0.5 text-sm leading-snug text-content-primary">{item.title}</p>
                {item.reason ? (
                  <p className="mt-0.5 text-sm text-content-tertiary">{item.reason}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </Panel>
  );
}
