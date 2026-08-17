import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton({ className, children, disabled, type = 'button', ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          'pressable inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-content-secondary',
          'transition-colors duration-fast ease-standard',
          'hover:bg-raised hover:text-content-primary',
          'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-content-secondary',
          'outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
