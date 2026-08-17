import { type ElementType, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  interactive?: boolean;
  as?: 'div' | 'section' | 'article';
  children: ReactNode;
  className?: string;
}

export function Panel({
  interactive = true,
  as = 'div',
  children,
  className,
  ...props
}: PanelProps) {
  const Comp: ElementType = as;

  return (
    <Comp
      className={cn(
        'rounded-xl border border-hairline bg-paper p-5 shadow-sm',
        interactive &&
          'transition-[border-color,box-shadow] duration-fast ease-standard hover:border-brand hover:shadow-md',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
