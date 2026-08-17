import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'compact';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: LucideIcon;
  rightIcon?: LucideIcon;
  children?: ReactNode;
}

const box = 'h-10 rounded-full px-5 py-2.5 text-sm font-medium';

const variantClasses: Record<ButtonVariant, string> = {
  primary: `${box} bg-brand text-white hover:bg-brand-hover active:bg-brand-active shadow-xs`,
  secondary: `${box} border border-brand bg-white text-brand-text hover:bg-brand-tint`,
  danger: `${box} border border-status-error bg-white text-status-error hover:bg-[color-mix(in_srgb,var(--status-error)_10%,white)]`,
  ghost: `${box} bg-transparent text-content-secondary hover:bg-sunken hover:text-content-primary`,
  compact: `${box} bg-transparent text-content-secondary hover:bg-raised hover:text-content-primary`,
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size: _size = 'md',
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'pressable inline-flex items-center justify-center gap-2 whitespace-nowrap',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
        'outline-none',
        variantClasses[variant],
        disabled && variant === 'primary' && 'disabled:hover:bg-brand',
        disabled && (variant === 'secondary' || variant === 'danger') && 'disabled:hover:bg-white',
        className,
      )}
      {...props}
    >
      {LeftIcon ? <LeftIcon size={16} strokeWidth={1.75} aria-hidden /> : null}
      {children}
      {RightIcon ? <RightIcon size={16} strokeWidth={1.75} aria-hidden /> : null}
    </button>
  );
});
