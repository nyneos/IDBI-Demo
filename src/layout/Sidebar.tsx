import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/cn';

export function Sidebar({
  collapsed,
  onCollapse,
}: {
  collapsed: boolean;
  onCollapse: () => void;
}) {
  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col text-[var(--sidebar-text)] transition-[width] duration-200',
        collapsed ? 'w-16' : 'w-[260px]',
      )}
      style={{ background: 'var(--sidebar-fill)' }}
    >
      <div className={cn('flex-1 overflow-y-auto py-5', collapsed ? 'px-2' : 'px-3')} />
      <div className="mt-auto p-0">
        <button
          type="button"
          onClick={onCollapse}
          className="flex h-10 w-full items-center justify-center text-white/70 hover:bg-white/10 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft size={18} className={cn(collapsed && 'rotate-180')} />
        </button>
      </div>
    </aside>
  );
}
