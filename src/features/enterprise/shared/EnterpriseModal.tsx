import type { ReactNode } from 'react';

export function EnterpriseModal({
  title,
  subtitle,
  children,
  onDismiss,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Dismiss"
        onClick={onDismiss}
      />
      <div className="relative z-[1] max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-hairline bg-paper p-8 shadow-lg">
        <h2 className="text-xl font-bold text-content-primary">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-content-secondary">{subtitle}</p> : null}
        {children}
      </div>
    </div>
  );
}
