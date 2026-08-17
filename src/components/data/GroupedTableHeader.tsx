import { cn } from '@/lib/cn';

export interface GroupedHeaderLeaf {
  key: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface GroupedHeaderGroup {
  key: string;
  label: string;
  columns: GroupedHeaderLeaf[];
}

export interface GroupedTableHeaderProps {
  groups: GroupedHeaderGroup[];
  className?: string;
}

export function GroupedTableHeader({ groups, className }: GroupedTableHeaderProps) {
  return (
    <thead className={className}>
      <tr className="bg-raised">
        {groups.map((group, gi) => (
          <th
            key={group.key}
            colSpan={group.columns.length}
            scope="colgroup"
            className={cn(
              'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-content-tertiary',
              gi < groups.length - 1 && 'border-r border-hairline',
            )}
          >
            {group.label}
          </th>
        ))}
      </tr>
      <tr className="bg-raised">
        {groups.flatMap((group, gi) =>
          group.columns.map((col, ci) => (
            <th
              key={col.key}
              scope="col"
              className={cn(
                'px-3 py-2 text-xs font-semibold uppercase tracking-wider text-content-tertiary',
                col.align === 'right' && 'text-right',
                col.align === 'center' && 'text-center',
                (!col.align || col.align === 'left') && 'text-left',
                gi < groups.length - 1 && ci === group.columns.length - 1 && 'border-r border-hairline',
                col.className,
              )}
            >
              {col.label}
            </th>
          )),
        )}
      </tr>
    </thead>
  );
}
