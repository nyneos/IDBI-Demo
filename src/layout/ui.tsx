import { forwardRef, type ButtonHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'compact';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
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
  { className, variant = 'primary', leftIcon: LeftIcon, rightIcon: RightIcon, children, disabled, type = 'button', ...props },
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

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  children: ReactNode;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, children, disabled, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={cn(
        'pressable inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-content-secondary',
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
});

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: SelectOption[];
  hint?: ReactNode;
  hideLabel?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, hint, className, id, disabled, hideLabel = false, ...props },
  ref,
) {
  const selectId = id ?? `select-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)} htmlFor={selectId}>
      <span className={cn('text-sm font-medium text-content-primary', hideLabel && 'sr-only')}>{label}</span>
      <div className="relative min-w-0">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          aria-label={hideLabel ? label : undefined}
          className={cn(
            'h-10 w-full min-w-0 max-w-full appearance-none rounded-md border border-strong bg-white px-3 pr-9',
            'text-sm font-normal text-content-primary',
            'hover:border-content-tertiary',
            'focus:border-brand outline-none',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-content-tertiary"
        />
      </div>
      {hint ? <span className="text-xs text-content-tertiary">{hint}</span> : null}
    </label>
  );
});
