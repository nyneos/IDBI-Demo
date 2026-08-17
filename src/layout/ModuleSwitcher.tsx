import { Settings } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import { moduleIcon } from '@/lib/moduleIcons';
import { useModules } from '@/state/useModules';

export function ModuleSwitcher() {
  const { modules, activeModuleId, setActiveModule, setConfigOpen } = useModules();

  return (
    <nav className="flex min-w-0 items-center gap-1">
      <div className="flex min-w-0 max-w-[min(52vw,40rem)] items-center gap-1 overflow-x-auto">
        {modules.length === 0 ? (
          <p className="hidden px-2 text-xs text-content-tertiary sm:block">No modules</p>
        ) : (
          modules.map((m) => {
            const Icon = moduleIcon(m.icon);
            const active = activeModuleId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setActiveModule(m.id)}
                className={cn(
                  'flex shrink-0 items-center gap-2 border-b-2 px-2 py-1 text-sm font-medium outline-none transition-colors',
                  active
                    ? 'border-brand text-brand-text'
                    : 'border-transparent text-content-secondary hover:text-content-primary',
                )}
              >
                <Icon size={16} strokeWidth={1.75} aria-hidden />
                {m.name}
              </button>
            );
          })
        )}
      </div>
      <IconButton aria-label="Configure modules" onClick={() => setConfigOpen(true)}>
        <Settings size={18} strokeWidth={1.75} />
      </IconButton>
    </nav>
  );
}
