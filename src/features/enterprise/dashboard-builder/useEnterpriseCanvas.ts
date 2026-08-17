import { useCallback, useState } from 'react';
import type { DashboardBlock, DashboardState, GridLayoutItem } from '@/components/dashboard-builder/types';

const KEY = 'enterprise.canvas';

function emptyCanvas(): DashboardState {
  return {
    id: 'enterprise-canvas',
    name: 'Enterprise Dashboard',
    blocks: [],
    layout: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isTemplate: false,
  };
}

function load(): DashboardState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyCanvas();
    return JSON.parse(raw) as DashboardState;
  } catch {
    return emptyCanvas();
  }
}

function persist(next: DashboardState) {
  localStorage.setItem(KEY, JSON.stringify(next));
}

/** Isolated canvas — never writes to datacanvas.scratch. */
export function useEnterpriseCanvas() {
  const [dashboard, setDashboard] = useState<DashboardState>(load);

  const commit = useCallback((next: DashboardState) => {
    persist(next);
    setDashboard(next);
  }, []);

  const addBlocks = useCallback((blocks: DashboardBlock[]) => {
    setDashboard((d) => {
      let nextY = d.layout.reduce((m, l) => Math.max(m, (Number.isFinite(l.y) ? l.y : 0) + l.h), 0);
      const extra = blocks.map((b) => {
        const layout = b.layout
          ? { ...b.layout, i: b.id, y: Number.isFinite(b.layout.y) ? b.layout.y : nextY }
          : { i: b.id, x: 0, y: nextY, w: 6, h: 8 };
        nextY = layout.y + layout.h;
        return { ...b, layout };
      });
      const next = {
        ...d,
        blocks: [...d.blocks, ...extra],
        layout: [...d.layout, ...extra.map((b) => b.layout!)],
        updatedAt: Date.now(),
      };
      persist(next);
      return next;
    });
  }, []);

  const updateBlock = useCallback((id: string, patch: Partial<DashboardBlock>) => {
    setDashboard((d) => {
      const next = {
        ...d,
        blocks: d.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)),
        updatedAt: Date.now(),
      };
      persist(next);
      return next;
    });
  }, []);

  const removeBlock = useCallback((id: string) => {
    setDashboard((d) => {
      const next = {
        ...d,
        blocks: d.blocks.filter((b) => b.id !== id),
        layout: d.layout.filter((l) => l.i !== id),
        updatedAt: Date.now(),
      };
      persist(next);
      return next;
    });
  }, []);

  const setLayout = useCallback((layout: GridLayoutItem[]) => {
    setDashboard((d) => {
      const next = { ...d, layout, updatedAt: Date.now() };
      persist(next);
      return next;
    });
  }, []);

  const setName = useCallback((name: string) => {
    setDashboard((d) => {
      const next = { ...d, name, updatedAt: Date.now() };
      persist(next);
      return next;
    });
  }, []);

  const replace = useCallback((next: DashboardState) => commit(next), [commit]);

  return { dashboard, addBlocks, updateBlock, removeBlock, setLayout, setName, replace };
}
