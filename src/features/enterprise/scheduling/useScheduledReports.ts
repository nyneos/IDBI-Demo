import { useCallback, useState } from 'react';
import type { ReportSchedule } from './types';

const KEY = 'enterprise.scheduled-reports';

function load(): ReportSchedule[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '[]') as ReportSchedule[];
    return Array.isArray(parsed) ? parsed.filter((s) => s && s.id && s.name) : [];
  } catch {
    return [];
  }
}

function persist(next: ReportSchedule[]) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function useScheduledReports() {
  const [schedules, setSchedules] = useState<ReportSchedule[]>(load);

  const upsert = useCallback((schedule: ReportSchedule) => {
    setSchedules((list) => {
      const exists = list.some((s) => s.id === schedule.id);
      const next = exists ? list.map((s) => (s.id === schedule.id ? schedule : s)) : [...list, schedule];
      persist(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setSchedules((list) => {
      const next = list.filter((s) => s.id !== id);
      persist(next);
      return next;
    });
  }, []);

  return { schedules, upsert, remove };
}
