import { useCallback, useEffect, useState } from 'react';
import { cloneTemplate, STARTER_TEMPLATES } from './templates';
import type { ReportTemplate } from './types';

const KEY = 'enterprise.report-templates';

function load(): ReportTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return STARTER_TEMPLATES.map(cloneTemplate);
    const parsed = JSON.parse(raw) as ReportTemplate[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return STARTER_TEMPLATES.map(cloneTemplate);
    }
    return parsed;
  } catch {
    return STARTER_TEMPLATES.map(cloneTemplate);
  }
}

function persist(templates: ReportTemplate[]) {
  localStorage.setItem(KEY, JSON.stringify(templates));
}

export function useReportTemplates() {
  const [templates, setTemplates] = useState<ReportTemplate[]>(load);

  useEffect(() => {
    const on = () => setTemplates(load());
    window.addEventListener('storage', on);
    return () => window.removeEventListener('storage', on);
  }, []);

  const save = useCallback((template: ReportTemplate) => {
    setTemplates((prev) => {
      const next = prev.some((t) => t.id === template.id)
        ? prev.map((t) => (t.id === template.id ? template : t))
        : [...prev, template];
      persist(next);
      return next;
    });
  }, []);

  const resetStarters = useCallback(() => {
    const next = STARTER_TEMPLATES.map(cloneTemplate);
    persist(next);
    setTemplates(next);
    return next;
  }, []);

  return { templates, save, resetStarters };
}
