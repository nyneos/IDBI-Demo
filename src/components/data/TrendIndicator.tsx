import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCount, formatDays, formatINR, formatPercent } from '@/lib/format';
import { MOTION } from '@/motion/tokens';
import { useReducedMotion } from '@/motion/useReducedMotion';

export type TrendFormat = 'percent' | 'count' | 'inr' | 'days';

export interface TrendIndicatorProps {
  /** Signed delta (positive = up). */
  value: number;
  higherIsBetter: boolean | 'neutral';
  format?: TrendFormat;
  label?: string;
  className?: string;
  /** When false, hides until count-up settles (80ms fade). */
  settled?: boolean;
}

function formatDelta(value: number, format: TrendFormat): string {
  const abs = Math.abs(value);
  switch (format) {
    case 'inr':
      return formatINR(abs);
    case 'days':
      return formatDays(abs);
    case 'count':
      return formatCount(abs);
    case 'percent':
    default:
      return formatPercent(abs);
  }
}

function toneClass(value: number, higherIsBetter: boolean | 'neutral'): string {
  if (higherIsBetter === 'neutral') return 'text-status-warning';
  const rising = value > 0;
  const good = higherIsBetter ? rising : !rising;
  if (Math.abs(value) < 0.0001) return 'text-content-tertiary';
  return good ? 'text-status-success' : 'text-status-error';
}

export function TrendIndicator({
  value,
  higherIsBetter,
  format = 'percent',
  label,
  className,
  settled = true,
}: TrendIndicatorProps) {
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(settled || reduced);

  useEffect(() => {
    if (settled || reduced) {
      setVisible(true);
      return;
    }
    setVisible(false);
    const t = window.setTimeout(() => setVisible(true), MOTION.count + MOTION.instant);
    return () => window.clearTimeout(t);
  }, [settled, reduced, value]);

  const Icon =
    Math.abs(value) < 0.0001 ? Minus : value > 0 ? ArrowUp : ArrowDown;
  const color = toneClass(value, higherIsBetter);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs font-medium',
        color,
        'transition-opacity duration-instant ease-enter',
        visible ? 'opacity-100' : 'opacity-0',
        className,
      )}
    >
      <Icon size={12} strokeWidth={2.25} aria-hidden />
      <span className="tabular">{formatDelta(value, format)}</span>
      {label ? <span className="font-normal text-content-tertiary">{label}</span> : null}
    </span>
  );
}
