import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { isModuleIconId, type ModuleIconId } from '@/lib/moduleIcons';

export interface NavModule {
  id: string;
  name: string;
  icon: ModuleIconId;
  createdAt: number;
}

const KEY = 'datacanvas.modules';
const DEFAULT_MAX = 8;

interface ModulesStore {
  modules: NavModule[];
  maxModules: number;
  activeModuleId: string | null;
}

function migrateModule(raw: unknown): NavModule | null {
  if (!raw || typeof raw !== 'object') return null;
  const m = raw as Partial<NavModule> & { id?: string; name?: string };
  if (!m.id || !m.name) return null;
  return {
    id: m.id,
    name: m.name,
    icon: m.icon && isModuleIconId(m.icon) ? m.icon : 'Home',
    createdAt: typeof m.createdAt === 'number' ? m.createdAt : Date.now(),
  };
}

function loadStore(): ModulesStore {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { modules: [], maxModules: DEFAULT_MAX, activeModuleId: null };
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      const modules = parsed.map(migrateModule).filter((m): m is NavModule => m != null);
      return { modules, maxModules: DEFAULT_MAX, activeModuleId: modules[0]?.id ?? null };
    }
    const obj = parsed as Partial<ModulesStore>;
    const modules = (obj.modules ?? []).map(migrateModule).filter((m): m is NavModule => m != null);
    const maxModules =
      typeof obj.maxModules === 'number' && obj.maxModules >= 1 ? Math.round(obj.maxModules) : DEFAULT_MAX;
    const active =
      obj.activeModuleId && modules.some((m) => m.id === obj.activeModuleId)
        ? obj.activeModuleId
        : (modules[0]?.id ?? null);
    return { modules, maxModules, activeModuleId: active };
  } catch {
    return { modules: [], maxModules: DEFAULT_MAX, activeModuleId: null };
  }
}

interface ModulesContextValue {
  modules: NavModule[];
  maxModules: number;
  activeModuleId: string | null;
  activeModule: NavModule | undefined;
  atCap: boolean;
  configOpen: boolean;
  setConfigOpen: (open: boolean) => void;
  setActiveModule: (id: string) => void;
  setMaxModules: (n: number) => void;
  addModule: (name: string, icon: ModuleIconId) => NavModule | null;
  renameModule: (id: string, name: string) => void;
  setModuleIcon: (id: string, icon: ModuleIconId) => void;
  reorderModules: (orderedIds: string[]) => void;
  deleteModule: (id: string) => void;
  byId: (id: string) => NavModule | undefined;
}

const ModulesContext = createContext<ModulesContextValue | null>(null);

export function ModulesProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<ModulesStore>(loadStore);
  const [configOpen, setConfigOpen] = useState(false);
  const { modules, maxModules, activeModuleId } = store;

  const persist = useCallback((patch: Partial<ModulesStore>) => {
    setStore((prev) => {
      const next: ModulesStore = { ...prev, ...patch };
      if (!next.modules.some((m) => m.id === next.activeModuleId)) {
        next.activeModuleId = next.modules[0]?.id ?? null;
      }
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const setActiveModule = useCallback(
    (id: string) => {
      persist({ activeModuleId: id });
    },
    [persist],
  );

  const setMaxModules = useCallback(
    (n: number) => {
      persist({ maxModules: Math.max(1, Math.min(20, Math.round(n))) });
    },
    [persist],
  );

  const addModule = useCallback(
    (name: string, icon: ModuleIconId) => {
      let created: NavModule | null = null;
      setStore((prev) => {
        if (prev.modules.length >= prev.maxModules) return prev;
        created = {
          id: `mod-${Date.now()}`,
          name: name.trim() || 'Untitled module',
          icon,
          createdAt: Date.now(),
        };
        const next: ModulesStore = {
          ...prev,
          modules: [...prev.modules, created as NavModule],
          activeModuleId: prev.activeModuleId ?? (created as NavModule).id,
        };
        localStorage.setItem(KEY, JSON.stringify(next));
        return next;
      });
      return created;
    },
    [],
  );

  const renameModule = useCallback(
    (id: string, name: string) => {
      persist({
        modules: modules.map((m) => (m.id === id ? { ...m, name: name.trim() || m.name } : m)),
      });
    },
    [modules, persist],
  );

  const setModuleIcon = useCallback(
    (id: string, icon: ModuleIconId) => {
      persist({ modules: modules.map((m) => (m.id === id ? { ...m, icon } : m)) });
    },
    [modules, persist],
  );

  const reorderModules = useCallback(
    (orderedIds: string[]) => {
      const map = new Map(modules.map((m) => [m.id, m]));
      persist({
        modules: orderedIds.map((id) => map.get(id)).filter((m): m is NavModule => m != null),
      });
    },
    [modules, persist],
  );

  const deleteModule = useCallback(
    (id: string) => {
      persist({ modules: modules.filter((m) => m.id !== id) });
    },
    [modules, persist],
  );

  const byId = useCallback((id: string) => modules.find((m) => m.id === id), [modules]);

  const activeModule = modules.find((m) => m.id === activeModuleId);

  const value = useMemo(
    () => ({
      modules,
      maxModules,
      activeModuleId,
      activeModule,
      atCap: modules.length >= maxModules,
      configOpen,
      setConfigOpen,
      setActiveModule,
      setMaxModules,
      addModule,
      renameModule,
      setModuleIcon,
      reorderModules,
      deleteModule,
      byId,
    }),
    [
      modules,
      maxModules,
      activeModuleId,
      activeModule,
      configOpen,
      setActiveModule,
      setMaxModules,
      addModule,
      renameModule,
      setModuleIcon,
      reorderModules,
      deleteModule,
      byId,
    ],
  );

  return <ModulesContext.Provider value={value}>{children}</ModulesContext.Provider>;
}

export function useModules() {
  const ctx = useContext(ModulesContext);
  if (!ctx) throw new Error('useModules must be used within ModulesProvider');
  return ctx;
}
