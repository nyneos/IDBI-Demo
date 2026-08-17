import { memo } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface GraphSearchProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const GraphSearch = memo(function GraphSearch({
  value,
  onChange,
  className,
}: GraphSearchProps) {
  return (
    <label className={cn('relative right-6 block w-60', className)}>
      <span className="sr-only">Search in graph</span>
      <Search
        size={16}
        strokeWidth={1.75}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-content-tertiary"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search in graph..."
        className={cn(
          'h-10 w-full rounded-lg border border-strong bg-white pl-9 pr-3',
          'text-sm text-content-primary placeholder:text-content-tertiary',
          'hover:border-content-tertiary',
          'focus:border-brand outline-none',
        )}
      />
    </label>
  );
});
