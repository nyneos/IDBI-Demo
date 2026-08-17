import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { EASE, MOTION } from '@/motion/tokens';

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  contentClassName?: string;
}

const sideOffset: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

const riseFrom: Record<NonNullable<TooltipProps['side']>, { x: number; y: number }> = {
  top: { x: 0, y: 4 },
  bottom: { x: 0, y: -4 },
  left: { x: 4, y: 0 },
  right: { x: -4, y: 0 },
};

export function Tooltip({
  content,
  children,
  side = 'top',
  className,
  contentClassName,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const tipId = useId();
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  useEffect(() => () => clearClose(), [clearClose]);

  const show = () => {
    clearClose();
    setOpen(true);
  };

  const hide = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setOpen(false), MOTION.instant);
  };

  const origin = riseFrom[side];

  return (
    <span
      className={cn('relative inline-flex', className)}
      onPointerEnter={show}
      onPointerLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <span aria-describedby={open ? tipId : undefined} className="inline-flex">
        {children}
      </span>
      <AnimatePresence>
        {open ? (
          <motion.span
            id={tipId}
            role="tooltip"
            initial={{ opacity: 0, x: origin.x, y: origin.y }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: origin.x, y: origin.y }}
            transition={{
              duration: MOTION.fast / 1000,
              ease: EASE.enter,
            }}
            className={cn(
              'pointer-events-none absolute z-50 whitespace-nowrap rounded-md border border-hairline bg-raised px-2 py-1',
              'text-xs font-medium text-content-primary shadow-md',
              sideOffset[side],
              contentClassName,
            )}
          >
            {content}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </span>
  );
}
