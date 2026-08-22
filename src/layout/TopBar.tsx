import { LogOut, Menu, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, IconButton } from '@/layout/ui';
import { useSession } from '@/session';

export function TopBar({
  collapsed,
  onToggleSidebar,
  onOpenPreferences,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenPreferences: () => void;
}) {
  const { logout } = useSession();
  const navigate = useNavigate();

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
          {/* <span className="ml-1 font-semibold text-content-secondary">Dashboard</span> */}
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
        <Button
          variant="secondary"
          leftIcon={LogOut}
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
