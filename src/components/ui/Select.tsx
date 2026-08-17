import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label: string;
  options: SelectOption[];
  hint?: ReactNode;
  /** Hide the visible label (still available to a11y via aria-label). */
  hideLabel?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, hint, className, id, disabled, hideLabel = false, ...props },
  ref,
) {
  const selectId = id ?? `select-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)} htmlFor={selectId}>
      <span
        className={cn(
          'text-sm font-medium text-content-primary',
          hideLabel && 'sr-only',
        )}
      >
        {label}
      </span>
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
