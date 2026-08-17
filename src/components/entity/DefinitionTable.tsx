import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface DefinitionRow {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}

export interface DefinitionTableProps {
  rows: DefinitionRow[];
  className?: string;
}

export function DefinitionTable({ rows, className }: DefinitionTableProps) {
  return (
    <dl className={cn('flex flex-col', className)}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between gap-3 border-b border-hairline py-2 last:border-b-0"
        >
          <dt className="text-xs text-content-tertiary">{row.label}</dt>
          <dd
            className={cn(
              'text-right text-xs font-medium text-content-primary',
              row.valueClassName,
            )}
          >
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
