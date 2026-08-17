import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { DashboardState } from '@/components/dashboard-builder/types';

const INDEX_KEY = 'datacanvas.templates.index';
const templateKey = (id: string) => `datacanvas.templates.${id}`;

function loadIndex(): string[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function loadOne(id: string): DashboardState | null {
  try {
    const raw = localStorage.getItem(templateKey(id));
    return raw ? (JSON.parse(raw) as DashboardState) : null;
  } catch {
    return null;
  }
}

function loadAllTemplates(): DashboardState[] {
  return loadIndex()
    .map(loadOne)
    .filter((t): t is DashboardState => t != null);
}

interface TemplatesContextValue {
  templates: DashboardState[];
  saveAsTemplate: (dashboard: DashboardState) => string;
  updateTemplate: (dashboard: DashboardState) => void;
  renameTemplate: (id: string, name: string) => void;
  duplicateTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;
  publishTemplate: (id: string, moduleId: string) => void;
  unpublishTemplate: (id: string) => void;
  byId: (id: string) => DashboardState | null;
}

const TemplatesContext = createContext<TemplatesContextValue | null>(null);

export function TemplatesProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<DashboardState[]>(loadAllTemplates);

  const write = useCallback((list: DashboardState[]) => {
    const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
    localStorage.setItem(INDEX_KEY, JSON.stringify(sorted.map((t) => t.id)));
    for (const t of sorted) localStorage.setItem(templateKey(t.id), JSON.stringify(t));
    setTemplates(sorted);
  }, []);

  const saveAsTemplate = useCallback(
    (dashboard: DashboardState) => {
      const id =
        dashboard.id && dashboard.isTemplate
          ? dashboard.id
          : `${dashboard.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}-${Date.now()}`;
      const next: DashboardState = {
        ...dashboard,
        id,
        isTemplate: true,
        updatedAt: Date.now(),
        createdAt: dashboard.createdAt || Date.now(),
      };
      const others = templates.filter((t) => t.id !== id);
      write([...others, next]);
      return id;
    },
    [templates, write],
  );

  const updateTemplate = useCallback(
    (dashboard: DashboardState) => {
      write(templates.map((t) => (t.id === dashboard.id ? { ...dashboard, updatedAt: Date.now() } : t)));
    },
    [templates, write],
  );

  const renameTemplate = useCallback(
    (id: string, name: string) => {
      write(templates.map((t) => (t.id === id ? { ...t, name, updatedAt: Date.now() } : t)));
    },
    [templates, write],
  );

  const duplicateTemplate = useCallback(
    (id: string) => {
      const orig = templates.find((t) => t.id === id);
      if (!orig) return;
      const copy: DashboardState = {
        ...(JSON.parse(JSON.stringify(orig)) as DashboardState),
        id: `${id}-copy-${Date.now()}`,
        name: `${orig.name} (Copy)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        published: false,
        moduleId: null,
      };
      write([...templates, copy]);
    },
    [templates, write],
  );

  const deleteTemplate = useCallback(
    (id: string) => {
      localStorage.removeItem(templateKey(id));
      write(templates.filter((t) => t.id !== id));
    },
    [templates, write],
  );

  const publishTemplate = useCallback(
    (id: string, moduleId: string) => {
      write(
        templates.map((t) =>
          t.id === id ? { ...t, published: true, moduleId, updatedAt: Date.now() } : t,
        ),
      );
    },
    [templates, write],
  );

  const unpublishTemplate = useCallback(
    (id: string) => {
      write(
        templates.map((t) =>
          t.id === id ? { ...t, published: false, moduleId: null, updatedAt: Date.now() } : t,
        ),
      );
    },
    [templates, write],
  );

  const byId = useCallback((id: string) => templates.find((t) => t.id === id) ?? loadOne(id), [templates]);

  const alphabetical = useMemo(
    () => [...templates].sort((a, b) => a.name.localeCompare(b.name)),
    [templates],
  );

  const value = useMemo(
    () => ({
      templates: alphabetical,
      saveAsTemplate,
      updateTemplate,
      renameTemplate,
      duplicateTemplate,
      deleteTemplate,
      publishTemplate,
      unpublishTemplate,
      byId,
    }),
    [
      alphabetical,
      saveAsTemplate,
      updateTemplate,
      renameTemplate,
      duplicateTemplate,
      deleteTemplate,
      publishTemplate,
      unpublishTemplate,
      byId,
    ],
  );

  return <TemplatesContext.Provider value={value}>{children}</TemplatesContext.Provider>;
}

export function useTemplates() {
  const ctx = useContext(TemplatesContext);
  if (!ctx) throw new Error('useTemplates must be used within TemplatesProvider');
  return ctx;
}
