import { useCallback, useEffect, useState } from 'react';
import type { AuditAction, AuditEntry } from './types';

const KEY = 'enterprise.audit-log';
const EVENT = 'enterprise-audit';

function isNewEntry(row: unknown): row is AuditEntry {
  if (!row || typeof row !== 'object') return false;
  const e = row as AuditEntry;
  return Boolean(e.id && e.timestamp && e.actor && e.action && e.targetType);
}

function load(): AuditEntry[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as unknown[];
    return raw.filter(isNewEntry);
  } catch {
    return [];
  }
}

/** Single integration point for every Enterprise mutation. */
export function logAuditEntry(
  entry: Omit<AuditEntry, 'id' | 'timestamp'> & { id?: string; timestamp?: number },
) {
  const next: AuditEntry = {
    id: entry.id ?? `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: entry.timestamp ?? Date.now(),
    actor: entry.actor,
    action: entry.action,
    targetType: entry.targetType,
    targetId: entry.targetId,
    targetName: entry.targetName,
    details: entry.details,
  };
  const list = [next, ...load()].slice(0, 400);
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(EVENT));
  return next;
}

export function useAuditLog() {
  const [entries, setEntries] = useState<AuditEntry[]>(load);

  useEffect(() => {
    const on = () => setEntries(load());
    window.addEventListener(EVENT, on);
    window.addEventListener('storage', on);
    return () => {
      window.removeEventListener(EVENT, on);
      window.removeEventListener('storage', on);
    };
  }, []);

  const record = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp'> & { timestamp?: number }) => {
    logAuditEntry(entry);
    setEntries(load());
  }, []);

  return { entries, record };
}

export const AUDIT_FILTER_OPTIONS: { value: AuditAction | 'all'; label: string }[] = [
  { value: 'all', label: 'All actions' },
  { value: 'dashboard.created', label: 'Dashboard created' },
  { value: 'dashboard.edited', label: 'Dashboard edited' },
  { value: 'dashboard.published', label: 'Dashboard published' },
  { value: 'dashboard.deleted', label: 'Dashboard deleted' },
  { value: 'dashboard.submitted', label: 'Submitted for review' },
  { value: 'dashboard.restored', label: 'Version restored' },
  { value: 'measure.created', label: 'Measure created' },
  { value: 'measure.approved', label: 'Measure approved' },
  { value: 'dimension.created', label: 'Dimension created' },
  { value: 'dimension.approved', label: 'Dimension approved' },
  { value: 'schedule.created', label: 'Schedule created' },
  { value: 'schedule.run', label: 'Schedule run' },
  { value: 'schedule.deleted', label: 'Schedule deleted' },
  { value: 'report.generated', label: 'Report generated' },
];
