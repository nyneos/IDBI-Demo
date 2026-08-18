import { LogOut, Menu, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { useEnterpriseSession } from '@/features/enterprise/auth/useEnterpriseSession';
import { PRODUCT_SUFFIX, PRODUCT_WORDMARK } from '@/lib/product';
import { ROUTES } from '@/lib/routes';
import { ModuleSwitcher } from './ModuleSwitcher';

export function TopBar({
  collapsed,
  onToggleSidebar,
  onOpenPreferences,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenPreferences: () => void;
}) {
  const { logout } = useEnterpriseSession();
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
          <span className="text-brand-text">{PRODUCT_WORDMARK}</span>
          <span className="ml-1 font-semibold text-content-secondary">{PRODUCT_SUFFIX}</span>
        </p>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <ModuleSwitcher />
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
            navigate(ROUTES.login);
          }}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}

