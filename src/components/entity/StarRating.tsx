import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface StarRatingProps {
  value: number;
  max?: number;
  size?: number;
  className?: string;
}

export function StarRating({ value, max = 5, size = 18, className }: StarRatingProps) {
  const clamped = Math.max(0, Math.min(max, value));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.25 && clamped - full < 0.75;
  const roundedHalf = clamped - full >= 0.75;
  const filled = full + (roundedHalf ? 1 : 0);

  return (
    <div
      className={cn('inline-flex items-center gap-0.5', className)}
      role="img"
      aria-label={`${clamped.toFixed(1)} out of ${max} stars`}
    >
      {Array.from({ length: max }, (_, i) => {
        if (i < filled) {
          return (
            <Star
              key={i}
              size={size}
              strokeWidth={0}
              className="fill-status-warning text-status-warning"
              aria-hidden
            />
          );
        }
        if (i === filled && hasHalf) {
          return (
            <span key={i} className="relative inline-flex" aria-hidden>
              <Star size={size} strokeWidth={1.5} className="text-border-strong" />
              <StarHalf
                size={size}
                strokeWidth={0}
                className="absolute inset-0 fill-status-warning text-status-warning"
              />
            </span>
          );
        }
        return (
          <Star
            key={i}
            size={size}
            strokeWidth={1.5}
            className="text-border-strong"
            aria-hidden
          />
        );
      })}
    </div>
  );
}
