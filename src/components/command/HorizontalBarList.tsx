import { memo } from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrainFront } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatCount, formatPercent } from '@/lib/format';
import { Panel } from '@/components/ui/Panel';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { TrendIndicator } from '@/components/data/TrendIndicator';
import { EASE, MOTION, STAGGER, staggerDelay } from '@/motion/tokens';
import { useReducedMotion } from '@/motion/useReducedMotion';

export interface HorizontalBarItem {
  id: string;
  name: string;
  value: number;
  share: number;
  previous: number;
  color: string;
}

export interface HorizontalBarListProps {
  title: string;
  items: HorizontalBarItem[];
  icon?: LucideIcon;
  footerLabel?: string;
  onFooterClick?: () => void;
  className?: string;
}

export const HorizontalBarList = memo(function HorizontalBarList({
  title,
  items,
  icon: Icon = TrainFront,
  footerLabel,
  onFooterClick,
  className,
}: HorizontalBarListProps) {
  const reduced = useReducedMotion();
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <Panel className={cn('flex h-full flex-col', className)}>
      <PanelHeader title={title} actionLabel={footerLabel} onActionClick={onFooterClick} />
      <ul className="flex flex-1 flex-col justify-center gap-2.5">
        {items.map((item, index) => {
          const deltaPct =
            item.previous === 0 ? 0 : ((item.value - item.previous) / item.previous) * 100;
          const widthPct = (item.value / max) * 100;
          return (
            <li key={item.id} className="flex items-center gap-2">
              <Icon size={20} strokeWidth={1.75} className="shrink-0 text-content-tertiary" aria-hidden />
              <span className="w-24 shrink-0 truncate text-xs font-medium text-content-primary">
                {item.name}
              </span>
              <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-full bg-sunken">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                  initial={reduced ? false : { width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{
                    duration: MOTION.chart / 1000,
                    ease: EASE.enter,
                    delay: staggerDelay(index, STAGGER.row, STAGGER.rowCap) / 1000,
                  }}
                />
              </div>
              <span className="w-20 shrink-0 text-right text-xs tabular text-content-secondary">
                {formatCount(item.value)} ({formatPercent(item.share)})
              </span>
              {Math.abs(deltaPct) < 0.05 ? (
                <span className="w-14 shrink-0 text-right text-xs text-content-tertiary">—</span>
              ) : (
                <TrendIndicator
                  value={deltaPct}
                  higherIsBetter={false}
                  format="percent"
                  className="w-14 shrink-0 justify-end"
                  settled={false}
                />
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
});
