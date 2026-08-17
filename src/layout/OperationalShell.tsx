import type { ReactNode } from 'react';

/** Dense operational screens — 12px gaps. Do not use 24px here. */
export function OperationalShell({
  topBar,
  drillBar,
  sidebar,
  children,
}: {
  topBar: {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
    filters?: ReactNode;
    titleAsParticle?: boolean;
  };
  drillBar?: ReactNode;
  sidebar?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div data-density="dense" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-content-primary">{topBar.title}</h1>
          {topBar.subtitle ? (
            <p className="mt-1 text-sm text-content-secondary">{topBar.subtitle}</p>
          ) : null}
        </div>
        {topBar.actions ? (
          <div className="flex flex-wrap items-center gap-2">{topBar.actions}</div>
        ) : null}
        {topBar.filters ? <div className="w-full">{topBar.filters}</div> : null}
      </div>
      <div className="flex min-h-0 gap-3">
        {sidebar ? <div className="w-60 shrink-0">{sidebar}</div> : null}
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
      </div>
      {drillBar ? <div className="shrink-0">{drillBar}</div> : null}
    </div>
  );
}
