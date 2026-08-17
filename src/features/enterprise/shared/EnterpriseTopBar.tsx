import { LogOut, Menu, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { IconButton } from '@/components/ui/IconButton';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { PRODUCT_SUFFIX, PRODUCT_WORDMARK } from '@/lib/product';
import { ROLE_LABEL } from '../auth/types';
import { useEnterpriseSession } from '../auth/useEnterpriseSession';

export function EnterpriseTopBar({
  collapsed,
  onToggleSidebar,
}: {
  collapsed: boolean;
  onToggleSidebar: () => void;
}) {
  const { user, logout } = useEnterpriseSession();
  const navigate = useNavigate();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-hairline bg-paper px-4">
      <div className="flex min-w-0 items-center gap-3">
        <IconButton
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggleSidebar}
        >
          {collapsed ? <Menu size={18} strokeWidth={1.75} /> : <X size={18} strokeWidth={1.75} />}
        </IconButton>
        <p className="truncate text-xl font-bold">
          <span className="text-brand-text">{PRODUCT_WORDMARK}</span>
          <span className="ml-1 font-semibold text-content-secondary">{PRODUCT_SUFFIX}</span>
        </p>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        {user ? (
          <>
            <span className="hidden truncate text-sm text-content-secondary sm:inline">{user.name}</span>
            <StatusPill label={ROLE_LABEL[user.role]} tone="info" className="hidden sm:inline-flex" />
          </>
        ) : null}
        <IconButton aria-label="Account" className="shrink-0 rounded-full">
          <User size={18} strokeWidth={1.75} />
        </IconButton>
        <Button
          variant="secondary"
          leftIcon={LogOut}
          className="hidden sm:inline-flex"
          onClick={() => {
            logout();
            navigate('/enterprise/login');
          }}
        >
          Logout
        </Button>
      </div>
    </header>
  );
}
