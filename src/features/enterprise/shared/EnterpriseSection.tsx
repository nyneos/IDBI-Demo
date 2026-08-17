import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const ENTERPRISE_FIELD =
  'h-10 w-full rounded-md border border-hairline bg-white px-3 text-sm outline-none focus:border-brand';

export const ENTERPRISE_FIELD_AREA =
  'w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none focus:border-brand';

/** Section card matching §8.2 — title row, optional trailing action. */
export function EnterpriseSection({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-xl border border-hairline bg-paper p-5 shadow-sm', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EnterpriseField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-content-primary">
      {label}
      {children}
    </label>
  );
}
