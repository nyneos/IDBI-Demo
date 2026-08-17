import { useMemo, useState } from 'react';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { ENTERPRISE_FIELD } from '../shared/EnterpriseSection';
import { EnterprisePageHeader } from '../shared/EnterprisePageHeader';
import { AUDIT_ACTION_LABEL, type AuditAction, type AuditEntry } from './types';
import { AUDIT_FILTER_OPTIONS, useAuditLog } from './useAuditLog';

export function AuditLogScreen() {
  const { entries } = useAuditLog();
  const [action, setAction] = useState<AuditAction | 'all'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const filtered = useMemo(
    () => entries.filter((e) => matchesFilters(e, action, from, to)),
    [entries, action, from, to],
  );

  return (
    <div className="flex flex-col gap-6">
      <EnterprisePageHeader
        title="Audit Log"
        actions={
          <>
            <Select
              label="Filter"
              value={action}
              options={AUDIT_FILTER_OPTIONS}
              onChange={(e) => setAction(e.target.value as AuditAction | 'all')}
            />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-content-primary">
              From
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className={ENTERPRISE_FIELD}
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-content-primary">
              To
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className={ENTERPRISE_FIELD}
              />
            </label>
          </>
        }
      />

      {filtered.length === 0 ? (
        <section className="rounded-xl border border-hairline bg-white px-5 py-10 shadow-sm">
          <p className="text-sm text-content-tertiary">
            {entries.length === 0 ? 'No events yet.' : 'No events match these filters.'}
          </p>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-hairline bg-white p-5 shadow-sm">
          <div className="overflow-x-auto rounded-lg border border-hairline">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="bg-brand">
                  <th className="select-none px-3 py-2 text-left text-base font-semibold uppercase tracking-wider text-white">
                    Actor
                  </th>
                  <th className="select-none px-3 py-2 text-left text-base font-semibold uppercase tracking-wider text-white">
                    Event
                  </th>
                  <th className="select-none px-3 py-2 text-left text-base font-semibold uppercase tracking-wider text-white">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr
                    key={e.id}
                    className={cn('border-t border-hairline', i % 2 === 1 ? 'bg-brand-tint' : 'bg-white')}
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-sm leading-tight text-content-secondary">
                      {e.actor}
                    </td>
                    <td className="px-3 py-2 text-sm leading-tight text-content-secondary">{formatEntry(e)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-sm leading-tight tabular-nums text-content-secondary">
                      {new Date(e.timestamp).toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}

function matchesFilters(
  e: AuditEntry,
  action: AuditAction | 'all',
  from: string,
  to: string,
) {
  if (action !== 'all' && e.action !== action) return false;
  if (from) {
    const start = new Date(`${from}T00:00:00`).getTime();
    if (e.timestamp < start) return false;
  }
  if (to) {
    const end = new Date(`${to}T23:59:59.999`).getTime();
    if (e.timestamp > end) return false;
  }
  return true;
}

function formatEntry(e: AuditEntry) {
  const verb = AUDIT_ACTION_LABEL[e.action] ?? e.action;
  const target = `"${e.targetName}"`;
  return e.details ? `${verb} ${target} — ${e.details}` : `${verb} ${target}`;
}
