import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { formatCount, formatPercent } from '@/lib/format';
import { rowEnter, rowEnterReduced } from '@/motion/variants';
import { useReducedMotion } from '@/motion/useReducedMotion';
import { ShareBar } from './ShareBar';

export interface RankingRowProps {
  rank: number;
  label: string;
  value: number;
  share?: number;
  color?: string;
  index?: number;
  onClick?: () => void;
  className?: string;
  showBar?: boolean;
}

export function RankingRow({
  rank,
  label,
  value,
  share,
  color = 'var(--brand-accent)',
  index = 0,
  onClick,
  className,
  showBar = true,
}: RankingRowProps) {
  const reduced = useReducedMotion();
  const variants = reduced ? rowEnterReduced : rowEnter;
  const sharedClass = cn(
    'flex w-full items-center gap-3 py-2 text-left',
    onClick &&
      'rounded-lg px-1 transition-colors duration-fast ease-standard hover:bg-raised outline-none',
    className,
  );

  const body = (
    <>
      <span className="w-4 shrink-0 text-xs font-semibold tabular text-content-tertiary">
        {rank}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-xs font-medium text-content-primary">{label}</span>
          <span className="shrink-0 text-xs tabular text-content-secondary">
            {formatCount(value)}
            {share !== undefined ? (
              <span className="ml-1.5 text-content-tertiary">{formatPercent(share)}</span>
            ) : null}
          </span>
        </div>
        {showBar && share !== undefined ? (
          <ShareBar share={share} color={color} index={index} className="mt-1.5" />
        ) : null}
      </div>
    </>
  );

  if (onClick) {
    return (
      <motion.button
        type="button"
        custom={index}
        variants={variants}
        initial="hidden"
        animate="show"
        onClick={onClick}
        className={sharedClass}
      >
        {body}
      </motion.button>
    );
  }

  return (
    <motion.div custom={index} variants={variants} initial="hidden" animate="show" className={sharedClass}>
      {body}
    </motion.div>
  );
}
