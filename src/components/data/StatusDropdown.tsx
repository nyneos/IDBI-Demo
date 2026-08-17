import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export type RecordStatus = 'Active' | 'Under Review';

export interface StatusDropdownProps {
  value: RecordStatus;
  onChange?: (value: RecordStatus) => void;
  className?: string;
  disabled?: boolean;
}

const OPTIONS: RecordStatus[] = ['Active', 'Under Review'];

const TONE_BG: Record<RecordStatus, string> = {
  Active: 'bg-[--status-success-pill]',
  'Under Review': 'bg-content-tertiary',
};

export function StatusDropdown({
  value,
  onChange,
  className,
  disabled = false,
}: StatusDropdownProps) {
  return (
    <div className={cn('relative inline-flex', className)} onClick={(e) => e.stopPropagation()}>
      <select
        value={value}
        disabled={disabled}
        aria-label="Record status"
        onChange={(e) => onChange?.(e.target.value as RecordStatus)}
        className={cn(
          'h-8 appearance-none rounded-full py-0.5 pl-2.5 pr-7',
          'text-xs font-semibold tracking-[0.02em] text-white',
          'transition-[box-shadow] duration-fast ease-standard',
          'outline-none',
          'disabled:cursor-not-allowed disabled:opacity-40',
          TONE_BG[value],
        )}
      >
        {OPTIONS.map((opt) => (
          <option key={opt} value={opt} className="bg-surface text-content-primary">
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={2}
        aria-hidden
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-white opacity-90"
      />
    </div>
  );
}
