import type { KeyboardEvent, MouseEvent, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  render: (row: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  onRowClick?: (row: T, event: MouseEvent<HTMLTableRowElement>) => void;
  className?: string;
  rowClassName?: (row: T, index: number) => string | undefined;
  empty?: ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  className,
  rowClassName,
  empty,
}: DataTableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-lg border border-hairline', className)}>
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr className="bg-raised">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-content-tertiary',
                  col.align === 'right' && 'text-right',
                  col.align === 'center' && 'text-center',
                  (!col.align || col.align === 'left') && 'text-left',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-3 py-8 text-center text-sm text-content-tertiary">
                {empty ?? 'No data'}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={rowKey(row, index)}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? 'button' : undefined}
                onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
                onKeyDown={
                  onRowClick
                    ? (e: KeyboardEvent<HTMLTableRowElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row, e as unknown as MouseEvent<HTMLTableRowElement>);
                        }
                      }
                    : undefined
                }
                className={cn(
                  'h-11 border-t border-hairline',
                  onRowClick &&
                    'cursor-pointer transition-colors duration-fast ease-standard hover:bg-raised focus-visible:bg-raised focus-visible:outline-none',
                  rowClassName?.(row, index),
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3 py-2 text-xs leading-tight text-content-secondary',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.className,
                    )}
                  >
                    {col.render(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
