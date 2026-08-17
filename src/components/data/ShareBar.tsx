import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { EASE, MOTION, STAGGER, staggerDelay } from '@/motion/tokens';
import { useReducedMotion } from '@/motion/useReducedMotion';

export interface ShareBarProps {
  /** 0–100 */
  share: number;
  color: string;
  index?: number;
  className?: string;
}

export function ShareBar({ share, color, index = 0, className }: ShareBarProps) {
  const reduced = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, share));
  const delay = staggerDelay(index, STAGGER.row, STAGGER.rowCap) / 1000;

  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-sunken', className)}
      role="meter"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={reduced ? false : { width: '0%' }}
        animate={{ width: `${clamped}%` }}
        transition={
          reduced
            ? { duration: MOTION.fast / 1000, ease: EASE.enter }
            : {
                duration: MOTION.chart / 1000,
                ease: EASE.enter,
                delay,
              }
        }
      />
    </div>
  );
}
