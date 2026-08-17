import type { ElementType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SectionSubheadProps {
  children: ReactNode;
  className?: string;
  as?: 'p' | 'h3' | 'h4';
}

export function SectionSubhead({
  children,
  className,
  as: Comp = 'p',
}: SectionSubheadProps) {
  const Tag: ElementType = Comp;
  return (
    <Tag className={cn('pt-10 text-base font-semibold text-content-primary', className)}>
      {children}
    </Tag>
  );
}
