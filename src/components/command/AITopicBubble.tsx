import { memo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { StatusPill, type PillTone } from '@/components/ui/StatusPill';
import { useReducedMotion } from '@/motion/useReducedMotion';

function topicTone(state: string): PillTone {
  const s = state.toLowerCase();
  if (s.includes('spike') || s.includes('critical')) return 'error';
  if (s.includes('rising') || s.includes('watch')) return 'warning';
  if (s.includes('stable') || s.includes('monitoring')) return 'info';
  return 'neutral';
}

export interface AITopicBubbleProps {
  name: string;
  state: string;
  icon: LucideIcon;
  color: string;
  pulse?: boolean;
  className?: string;
}

export const AITopicBubble = memo(function AITopicBubble({
  name,
  state,
  icon: Icon,
  color,
  pulse = false,
  className,
}: AITopicBubbleProps) {
  const reduced = useReducedMotion();

  return (
    <div className={cn('flex w-full max-w-none flex-col items-center gap-1.5', className)}>
      <div
        className={cn(
          'glass flex h-16 w-16 items-center justify-center rounded-full',
          pulse && !reduced && 'animate-live-pulse',
        )}
        style={{ borderColor: color, color }}
        aria-hidden
      >
        <Icon size={26} strokeWidth={1.75} />
      </div>
      <p className="text-center text-xs font-medium leading-tight text-content-primary">{name}</p>
      <StatusPill label={state} tone={topicTone(state)} />
    </div>
  );
});
