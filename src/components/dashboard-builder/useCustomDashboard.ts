import { useCallback, useEffect, useState } from 'react';
import { ALL_BLOCK_TYPES, DEFAULT_DASHBOARD_STATE, type CustomDashboardState, type DashboardBlock } from './types';

const DEFAULT_KEY = 'idbi.customDashboard.v1';

function isBlock(value: unknown): value is DashboardBlock {
  if (!value || typeof value !== 'object') return false;
  const row = value as DashboardBlock;
  return (
    typeof row.id === 'string' &&
    ALL_BLOCK_TYPES.includes(row.type) &&
    typeof row.dimensionKey === 'string' &&
    typeof row.title === 'string' &&
    Boolean(row.titleSettings)
  );
}

function loadFromStorage(key: string): CustomDashboardState | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CustomDashboardState;
    if (typeof parsed.sectionTitle !== 'string' || !Array.isArray(parsed.blocks)) return null;
    return {
      sectionTitle: parsed.sectionTitle || DEFAULT_DASHBOARD_STATE.sectionTitle,
      blocks: parsed.blocks.filter(isBlock),
    };
  } catch {
    return null;
  }
}

function saveToStorage(key: string, state: CustomDashboardState): void {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* private browsing / quota — stay in-memory */
  }
}

export function useCustomDashboard(
  storageKey = DEFAULT_KEY,
  options?: { autosave?: boolean; initial?: CustomDashboardState | null },
) {
  const autosave = options?.autosave ?? true;
  const [state, setState] = useState<CustomDashboardState>(
    () => options?.initial ?? loadFromStorage(storageKey) ?? DEFAULT_DASHBOARD_STATE,
  );

  useEffect(() => {
    if (!autosave) return;
    saveToStorage(storageKey, state);
  }, [state, storageKey, autosave]);

  const addBlock = useCallback((block: DashboardBlock) => {
    setState((s) => ({ ...s, blocks: [...s.blocks, block] }));
  }, []);

  const addBlocks = useCallback((blocks: DashboardBlock[]) => {
    setState((s) => ({ ...s, blocks: [...s.blocks, ...blocks] }));
  }, []);

  const updateBlock = useCallback((id: string, patch: Partial<DashboardBlock>) => {
    setState((s) => ({
      ...s,
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));
  }, []);

  const removeBlock = useCallback((id: string) => {
    setState((s) => ({ ...s, blocks: s.blocks.filter((b) => b.id !== id) }));
  }, []);

  const clearAll = useCallback(() => {
    setState((s) => ({ ...s, blocks: [] }));
  }, []);

  const setSectionTitle = useCallback((title: string) => {
    setState((s) => ({ ...s, sectionTitle: title }));
  }, []);

  const replaceState = useCallback((next: CustomDashboardState) => {
    setState(next);
  }, []);

  return {
    state,
    addBlock,
    addBlocks,
    updateBlock,
    removeBlock,
    clearAll,
    setSectionTitle,
    replaceState,
    persist: () => saveToStorage(storageKey, state),
  };
}
