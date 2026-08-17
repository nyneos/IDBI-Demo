import { cn } from '@/lib/cn';

export function EnterpriseBadge({
  label = 'Enterprise',
  className,
}: {
  label?: 'Enterprise' | 'Governed';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full bg-brand-tint px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand-text',
        className,
      )}
    >
      {label}
    </span>
  );
}
