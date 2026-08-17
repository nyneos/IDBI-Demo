import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { PreferencesModal } from '@/theme/PreferencesModal';
import { ModulesConfigModal } from './ModulesConfigModal';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const location = useLocation();
  const hideChrome = location.pathname.startsWith('/view');
  const calm =
    location.pathname.startsWith('/builder') ||
    location.pathname.startsWith('/upload') ||
    location.pathname.startsWith('/dashboard');

  if (hideChrome) return <Outlet />;

  return (
    <div className="flex h-screen flex-col bg-canvas">
      <TopBar
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed((c) => !c)}
        onOpenPreferences={() => setPrefsOpen(true)}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed((c) => !c)} />
        {/* calm = 24px padding (Custom Dashboard); dense ops screens use 24px page pad + 12px internal gaps */}
        <main className={cn('min-w-0 flex-1 overflow-auto', calm ? 'px-8 pt-8 pb-6' : 'px-6 pt-6 pb-6')}>
          <Outlet />
        </main>
      </div>
      <PreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
      <ModulesConfigModal />
    </div>
  );
}
