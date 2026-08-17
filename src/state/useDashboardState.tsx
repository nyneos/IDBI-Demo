import { useCallback, useEffect, useState } from 'react';
import type { DashboardBlock, DashboardState, GridLayoutItem } from '@/components/dashboard-builder/types';

const SCRATCH_KEY = 'datacanvas.scratch';

export function emptyDashboard(name = 'New Dashboard'): DashboardState {
  return {
    id: 'scratch',
    name,
    blocks: [],
    layout: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isTemplate: false,
  };
}

function loadScratch(): DashboardState {
  try {
    const raw = localStorage.getItem(SCRATCH_KEY);
    if (!raw) return emptyDashboard();
    return JSON.parse(raw) as DashboardState;
  } catch {
    return emptyDashboard();
  }
}

export function useDashboardState(initial?: DashboardState | null, persistScratch = true) {
  const [dashboard, setDashboard] = useState<DashboardState>(initial ?? loadScratch);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (initial) {
      setDashboard(initial);
      setDirty(false);
    }
  }, [initial?.id]);

  useEffect(() => {
    if (!persistScratch) return;
    localStorage.setItem(SCRATCH_KEY, JSON.stringify(dashboard));
  }, [dashboard, persistScratch]);

  const setBlocks = useCallback((blocks: DashboardBlock[]) => {
    setDashboard((d) => ({ ...d, blocks, updatedAt: Date.now() }));
    setDirty(true);
  }, []);

  const addBlocks = useCallback((blocks: DashboardBlock[]) => {
    setDashboard((d) => {
      let nextY = d.layout.reduce((m, l) => Math.max(m, (Number.isFinite(l.y) ? l.y : 0) + l.h), 0);
      const extra = blocks.map((b) => {
        const layout = b.layout
          ? {
              ...b.layout,
              i: b.id,
              y: Number.isFinite(b.layout.y) ? b.layout.y : nextY,
            }
          : { i: b.id, x: 0, y: nextY, w: 6, h: 8 };
        nextY = layout.y + layout.h;
        return { ...b, layout };
      });
      return {
        ...d,
        blocks: [...d.blocks, ...extra],
        layout: [...d.layout, ...extra.map((b) => b.layout!)],
        updatedAt: Date.now(),
      };
    });
    setDirty(true);
  }, []);

  const updateBlock = useCallback((id: string, patch: Partial<DashboardBlock>) => {
    setDashboard((d) => ({
      ...d,
      blocks: d.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
      updatedAt: Date.now(),
    }));
    setDirty(true);
  }, []);

  const removeBlock = useCallback((id: string) => {
    setDashboard((d) => ({
      ...d,
      blocks: d.blocks.filter((b) => b.id !== id),
      layout: d.layout.filter((l) => l.i !== id),
      updatedAt: Date.now(),
    }));
    setDirty(true);
  }, []);

  const setLayout = useCallback((layout: GridLayoutItem[]) => {
    setDashboard((d) => ({ ...d, layout, updatedAt: Date.now() }));
    setDirty(true);
  }, []);

  const setName = useCallback((name: string) => {
    setDashboard((d) => ({ ...d, name, updatedAt: Date.now() }));
    setDirty(true);
  }, []);

  const replace = useCallback((next: DashboardState) => {
    setDashboard(next);
    setDirty(false);
    if (persistScratch) localStorage.setItem(SCRATCH_KEY, JSON.stringify(next));
  }, [persistScratch]);

  const patchDashboard = useCallback((patch: Partial<DashboardState>) => {
    setDashboard((d) => ({ ...d, ...patch, updatedAt: Date.now() }));
    setDirty(true);
  }, []);

  const markSaved = useCallback(() => setDirty(false), []);

  return {
    dashboard,
    dirty,
    setBlocks,
    addBlocks,
    updateBlock,
    removeBlock,
    setLayout,
    setName,
    replace,
    patchDashboard,
    markSaved,
  };
}
