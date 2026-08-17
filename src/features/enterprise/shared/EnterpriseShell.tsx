import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { LineageSourceObserver } from '../lineage/LineageSourceObserver';
import { EnterpriseSidebar } from './EnterpriseSidebar';
import { EnterpriseTopBar } from './EnterpriseTopBar';

export function EnterpriseShell() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-canvas">
      <EnterpriseTopBar collapsed={collapsed} onToggleSidebar={() => setCollapsed((c) => !c)} />
      <div className="flex min-h-0 flex-1">
        <EnterpriseSidebar collapsed={collapsed} onCollapse={() => setCollapsed((c) => !c)} />
        <main className="min-h-0 min-w-0 flex-1 overflow-auto px-8 pb-6 pt-8">
          <LineageSourceObserver />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
