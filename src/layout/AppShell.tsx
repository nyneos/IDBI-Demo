import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PreferencesModal } from '@/theme/PreferencesModal';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      <TopBar
        collapsed={collapsed}
        onToggleSidebar={() => setCollapsed((c) => !c)}
        onOpenPreferences={() => setPrefsOpen(true)}
      />
      <div className="flex min-h-0 flex-1">
        <Sidebar collapsed={collapsed} onCollapse={() => setCollapsed((c) => !c)} />
        <main className="min-h-0 min-w-0 flex-1 overflow-auto px-6 pt-6 pb-6">
          <Outlet />
        </main>
      </div>
      <PreferencesModal open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </div>
  );
}
