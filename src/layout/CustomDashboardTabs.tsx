import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { ROUTES } from '@/lib/routes';

const tabs = [
  { to: ROUTES.customDashboard, label: 'Canvas', end: true },
  { to: ROUTES.myTemplates, label: 'My Templates', end: true },
];

export function CustomDashboardTabs() {
  return (
    <div className="mb-6 flex gap-1 border-b border-hairline">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              'px-4 py-2 text-sm font-medium outline-none',
              isActive
                ? 'border-b-2 border-brand text-content-primary'
                : 'text-content-secondary hover:text-content-primary',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
