import { Menu, User, X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { PRODUCT_SUFFIX, PRODUCT_WORDMARK } from '@/lib/product';
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
      </div>
    </header>
  );
}

