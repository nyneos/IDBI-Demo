import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface GlassSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function GlassSurface({ children, className, ...props }: GlassSurfaceProps) {
  return (
    <div className={cn('rounded-xl border border-hairline bg-paper', className)} {...props}>
      {children}
    </div>
  );
}
