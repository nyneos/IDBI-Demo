import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const COLS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

export interface KPIStripProps {
  cols?: 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
  className?: string;
}

export function KPIStrip({ cols = 5, children, className }: KPIStripProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 items-stretch gap-3 md:grid-cols-3',
        cols === 5 ? 'xl:grid-cols-5' : COLS[cols],
        className,
      )}
    >
      {children}
    </div>
  );
}
