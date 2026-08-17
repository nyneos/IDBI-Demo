import { useCallback, useEffect, useState } from 'react';
import { applyCalculatedField } from '@/data/calculatedFields';
import {
  hydrateDataSource,
  persistDataSource,
} from '@/data/buildUploadedDataSource';
import type { DashboardDataSource, PersistedDataSource } from '@/components/dashboard-builder/types';

const INDEX_KEY = 'datacanvas.sources.index';
const sourceKey = (id: string) => `datacanvas.sources.${id}`;

function loadIndex(): string[] {
  try {
    return JSON.parse(localStorage.getItem(INDEX_KEY) ?? '[]') as string[];
  } catch {
    return [];
  }
}

function loadAll(): DashboardDataSource[] {
  return loadIndex()
    .map((id) => {
      try {
        const raw = localStorage.getItem(sourceKey(id));
        if (!raw) return null;
        return hydrateDataSource(JSON.parse(raw) as PersistedDataSource);
      } catch {
        return null;
      }
    })
    .filter((s): s is DashboardDataSource => s != null);
}

export function useDataSources() {
  const [sources, setSources] = useState<DashboardDataSource[]>(loadAll);

  const persistAll = useCallback((next: DashboardDataSource[]) => {
    localStorage.setItem(INDEX_KEY, JSON.stringify(next.map((s) => s.id)));
    for (const s of next) {
      localStorage.setItem(sourceKey(s.id), JSON.stringify(persistDataSource(s)));
    }
    setSources(next);
  }, []);

  useEffect(() => {
    const on = () => setSources(loadAll());
    window.addEventListener('storage', on);
    return () => window.removeEventListener('storage', on);
  }, []);

  const addSource = useCallback(
    (source: DashboardDataSource) => {
      persistAll([source]);
    },
    [persistAll],
  );

  const clearSources = useCallback(() => {
    for (const s of sources) localStorage.removeItem(sourceKey(s.id));
    persistAll([]);
  }, [persistAll, sources]);

  const renameSource = useCallback(
    (id: string, label: string) => {
      persistAll(sources.map((s) => (s.id === id ? { ...s, label } : s)));
    },
    [persistAll, sources],
  );

  const deleteSource = useCallback(
    (id: string) => {
      localStorage.removeItem(sourceKey(id));
      persistAll(sources.filter((s) => s.id !== id));
    },
    [persistAll, sources],
  );

  const replaceSource = useCallback(
    (id: string, source: DashboardDataSource) => {
      persistAll(sources.map((s) => (s.id === id ? { ...source, id, label: s.label } : s)));
    },
    [persistAll, sources],
  );

  const addCalculatedField = useCallback(
    (id: string, field: { name: string; formula: string; format: 'number' | 'percent' }) => {
      persistAll(
        sources.map((s) => {
          if (s.id !== id || !s.facts) return s;
          let facts = s.facts;
          try {
            facts = applyCalculatedField(s.facts, field.name, field.formula);
          } catch {
            return s;
          }
          const dim = {
            key: field.name,
            label: field.name,
            calculated: true,
            role: 'metric' as const,
            aggregate: () => [] as { label: string; value: number }[],
          };
          return {
            ...s,
            facts,
            calculatedFields: [...(s.calculatedFields ?? []), field],
            dimensions: [...s.dimensions, dim],
            metrics: [...(s.metrics ?? []), dim],
          };
        }),
      );
    },
    [persistAll, sources],
  );

  return {
    sources,
    addSource,
    clearSources,
    renameSource,
    deleteSource,
    replaceSource,
    addCalculatedField,
    latest: sources[0] ?? null,
  };
}
