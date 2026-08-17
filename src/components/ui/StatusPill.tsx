import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type PillTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type StatusTone = PillTone;

const TONE_BG: Record<PillTone, string> = {
  success: 'bg-[--status-success-pill]',
  warning: 'bg-[--status-warning-pill]',
  error: 'bg-[--status-error-pill]',
  info: 'bg-[--status-info-pill]',
  neutral: 'bg-content-tertiary',
};

export interface StatusPillProps {
  label: string;
  tone?: PillTone;
  /** Solid fill override (e.g. categorical entity colours). */
  color?: string;
  icon?: LucideIcon;
  className?: string;
}

export function StatusPill({ label, tone = 'neutral', color, icon: Icon, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5',
        'text-xs font-semibold tracking-[0.02em] text-white',
        !color && TONE_BG[tone],
        className,
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      {Icon ? <Icon size={12} strokeWidth={2.25} aria-hidden /> : null}
      {label}
    </span>
  );
}
