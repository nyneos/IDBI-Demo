import { TriangleAlert } from 'lucide-react';

export function GovernanceNotice({ className }: { className?: string }) {
  return (
    <p
      className={
        className ??
        'flex items-start gap-2 rounded-lg border border-status-warning bg-paper px-3 py-2 text-xs text-content-secondary'
      }
    >
      <TriangleAlert size={14} strokeWidth={1.75} className="mt-0.5 shrink-0 text-status-warning" aria-hidden />
      <span>
        This log is stored locally in this browser and is not tamper-evident. A production deployment
        would require server-side audit storage.
      </span>
    </p>
  );
}
