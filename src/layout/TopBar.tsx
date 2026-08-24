import { LogOut, Menu, User, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { IconButton } from '@/layout/ui';

export function TopBar({
  collapsed,
  onToggleSidebar,
  onOpenPreferences,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenPreferences: () => void;
}) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-hairline bg-paper px-4">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleSidebar}
        >
          {collapsed ? (
            <Menu size={18} strokeWidth={1.75} />
          ) : (
            <X size={18} strokeWidth={1.75} />
          )}
        </IconButton>
        <p className="truncate text-xl font-bold">
          <span className="text-brand-text">Dashboard</span>
        </p>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <IconButton
          aria-label="Open preferences"
          className="shrink-0 rounded-full"
          onClick={onOpenPreferences}
        >
          <User size={18} strokeWidth={1.75} />
        </IconButton>
        <Link
          to="/login"
          className="pressable inline-flex h-10 items-center justify-center gap-2 rounded-full border border-brand bg-white px-5 text-sm font-medium text-brand-text hover:bg-brand-tint"
        >
          <LogOut size={16} strokeWidth={1.75} aria-hidden />
          Logout
        </Link>
      </div>
    </header>
  );
}
