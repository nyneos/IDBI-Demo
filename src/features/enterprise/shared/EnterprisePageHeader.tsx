import type { ReactNode } from 'react';

export function EnterprisePageTitle({ title }: { title: string }) {
  return <h1 className="text-3xl font-bold text-content-primary">{title}</h1>;
}

export function EnterprisePageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <EnterprisePageTitle title={title} />
        {description ? (
          <p className="mt-1 max-w-2xl text-sm text-content-secondary">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
