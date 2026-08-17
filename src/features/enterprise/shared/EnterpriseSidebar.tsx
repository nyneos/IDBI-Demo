import { type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronLeft,
  GitBranch,
  LayoutDashboard,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const NAV = [
  { to: '/enterprise/builder', icon: LayoutDashboard, label: 'Dashboard Builder' },
] as const;

function NavRow({
  to,
  icon: Icon,
  label,
  collapsed,
  end,
}: {
  to: string;
  icon: LucideIcon;
  label: string;
  collapsed: boolean;
  end?: boolean;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        cn(
          'flex h-11 items-center gap-2 text-sm font-medium outline-none',
          collapsed ? 'mx-auto h-10 w-10 justify-center rounded-full px-0' : 'rounded-lg px-3',
          isActive
            ? 'bg-[var(--sidebar-item-active-bg)] font-semibold text-[var(--sidebar-text)]'
            : 'text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--sidebar-text)]',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60',
        )
      }
    >
      <Icon size={18} strokeWidth={1.75} aria-hidden />
      {collapsed ? null : <span className="truncate">{label}</span>}
    </NavLink>
  );
}

function SidebarSection({
  label,
  collapsed,
  children,
}: {
  label: string;
  collapsed: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <p
        className={cn(
          'px-2 text-xs font-semibold uppercase tracking-wider text-white/50',
          collapsed && 'sr-only',
        )}
      >
        {label}
      </p>
      <div className="mt-2 flex flex-col gap-1">{children}</div>
    </div>
  );
}

export function EnterpriseSidebar({
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
      <div className={cn('flex-1 overflow-y-auto py-5', collapsed ? 'px-2' : 'px-3')}>
        <SidebarSection label="Enterprise Suite" collapsed={collapsed}>
          {NAV.map((item) => (
            <NavRow key={item.to} to={item.to} icon={item.icon} label={item.label} collapsed={collapsed} />
          ))}
        </SidebarSection>
      </div>
      <div className="border-t border-white/10 p-0">
        <NavLink
          to="/builder"
          aria-label={collapsed ? 'Exit to DataCanvas' : undefined}
          className={({ isActive }) =>
            cn(
              'flex h-11 items-center gap-2 text-sm font-medium outline-none',
              collapsed ? 'mx-auto h-10 w-10 justify-center rounded-full px-0' : 'rounded-lg px-3',
              isActive
                ? 'bg-[var(--sidebar-item-active-bg)] text-[var(--sidebar-text)]'
                : 'text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-item-hover-bg)] hover:text-[var(--sidebar-text)]',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/60',
            )
          }
        >
          <GitBranch size={18} strokeWidth={1.75} aria-hidden />
          {collapsed ? null : <span className="truncate">Exit to DataCanvas</span>}
        </NavLink>
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
