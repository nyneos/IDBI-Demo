import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DateRangePickerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  label: string;
  value: string;
  hint?: string;
  hideLabel?: boolean;
}

export const DateRangePicker = forwardRef<HTMLButtonElement, DateRangePickerProps>(
  function DateRangePicker(
    { label, value, hint, className, disabled, id, hideLabel = false, ...props },
    ref,
  ) {
    const controlId = id ?? `daterange-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
      <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
        <label
          htmlFor={controlId}
          className={cn(
            'text-sm font-medium text-content-primary',
            hideLabel && 'sr-only',
          )}
        >
          {label}
        </label>
        <button
          ref={ref}
          id={controlId}
          type="button"
          disabled={disabled}
          aria-label={hideLabel ? `${label}: ${value}` : undefined}
          className={cn(
            'flex h-10 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-lg border border-strong bg-white px-3',
            'text-left text-sm font-normal text-content-primary',
            'hover:border-content-tertiary',
            'focus-visible:border-brand outline-none',
            'disabled:cursor-not-allowed disabled:opacity-40',
          )}
          {...props}
        >
          <span className="min-w-0 truncate">{value}</span>
          <Calendar size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-content-tertiary" />
        </button>
        {hint ? <span className="text-xs text-content-tertiary">{hint}</span> : null}
      </div>
    );
  },
);
