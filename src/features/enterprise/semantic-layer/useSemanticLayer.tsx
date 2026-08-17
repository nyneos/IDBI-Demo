import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { recordLineageTransform } from '../lineage/useLineage';
import {
  EMPTY_CATALOG,
  type BlockSemanticBinding,
  type GovernedDimension,
  type GovernedMeasure,
  type SemanticCatalog,
} from './types';

const KEY = 'enterprise.semantic-layer';

function load(): SemanticCatalog {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_CATALOG;
    const parsed = JSON.parse(raw) as Partial<SemanticCatalog>;
    if (!Array.isArray(parsed.measures)) return EMPTY_CATALOG;
    return {
      measures: parsed.measures,
      dimensions: parsed.dimensions ?? [],
      bindings: parsed.bindings ?? {},
      updatedAt: parsed.updatedAt ?? Date.now(),
    };
  } catch {
    return EMPTY_CATALOG;
  }
}

function persist(next: SemanticCatalog) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

interface SemanticLayerApi {
  catalog: SemanticCatalog;
  approvedMeasures: GovernedMeasure[];
  approvedDimensions: GovernedDimension[];
  upsertMeasure: (measure: GovernedMeasure) => void;
  upsertDimension: (dimension: GovernedDimension) => void;
  setBinding: (blockId: string, binding: BlockSemanticBinding | null) => void;
}

const SemanticLayerContext = createContext<SemanticLayerApi | null>(null);

export function SemanticLayerProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<SemanticCatalog>(load);

  const upsertMeasure = useCallback((measure: GovernedMeasure) => {
    setCatalog((c) => {
      const exists = c.measures.some((m) => m.id === measure.id);
      const measures = exists
        ? c.measures.map((m) => (m.id === measure.id ? { ...measure, updatedAt: Date.now() } : m))
        : [...c.measures, measure];
      const written = { ...c, measures, updatedAt: Date.now() };
      persist(written);
      return written;
    });
    recordLineageTransform(measure.id, measure.sourceField, measure.formula ?? '', measure.aggregation);
  }, []);

  const upsertDimension = useCallback((dimension: GovernedDimension) => {
    setCatalog((c) => {
      const exists = c.dimensions.some((d) => d.id === dimension.id);
      const dimensions = exists
        ? c.dimensions.map((d) => (d.id === dimension.id ? { ...dimension, updatedAt: Date.now() } : d))
        : [...c.dimensions, dimension];
      const written = { ...c, dimensions, updatedAt: Date.now() };
      persist(written);
      return written;
    });
  }, []);

  const setBinding = useCallback((blockId: string, binding: BlockSemanticBinding | null) => {
    setCatalog((c) => {
      const bindings = { ...c.bindings };
      if (!binding || (!binding.measureId && !binding.dimensionId)) delete bindings[blockId];
      else bindings[blockId] = binding;
      const written = { ...c, bindings, updatedAt: Date.now() };
      persist(written);
      return written;
    });
  }, []);

  const value = useMemo<SemanticLayerApi>(
    () => ({
      catalog,
      approvedMeasures: catalog.measures.filter((m) => m.status === 'approved'),
      approvedDimensions: catalog.dimensions.filter((d) => d.status === 'approved'),
      upsertMeasure,
      upsertDimension,
      setBinding,
    }),
    [catalog, upsertMeasure, upsertDimension, setBinding],
  );

  return <SemanticLayerContext.Provider value={value}>{children}</SemanticLayerContext.Provider>;
}

export function useSemanticLayer(): SemanticLayerApi {
  const ctx = useContext(SemanticLayerContext);
  if (!ctx) {
    throw new Error('useSemanticLayer must be used inside SemanticLayerProvider');
  }
  return ctx;
}

export function visibleMeasures(catalog: SemanticCatalog, owner: string): GovernedMeasure[] {
  return catalog.measures.filter((m) => m.status === 'approved' || m.owner === owner);
}

export function visibleDimensions(catalog: SemanticCatalog, owner: string): GovernedDimension[] {
  return catalog.dimensions.filter((d) => d.status === 'approved' || d.owner === owner);
}
