import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface CrossFilter {
  sourceBlockId: string;
  field: string;
  value: string;
}

export interface Bookmark {
  id: string;
  name: string;
  dashboardId: string;
  slicerState: Record<string, string[]>;
  crossFilter: CrossFilter | null;
  whatIfValues: Record<string, number>;
  createdAt: number;
}

interface FilterApi {
  activeFilter: CrossFilter | null;
  applyFilter: (sourceBlockId: string, field: string, value: string) => void;
  clearFilter: () => void;
  slicers: Record<string, string[]>;
  setSlicer: (blockId: string, field: string, values: string[]) => void;
  clearSlicers: () => void;
  whatIf: Record<string, number>;
  setWhatIf: (name: string, value: number) => void;
  bookmarks: Bookmark[];
  addBookmark: (name: string, dashboardId: string) => void;
  applyBookmark: (id: string) => void;
  drillFilter: CrossFilter | null;
  setDrillFilter: (f: CrossFilter | null) => void;
}

const Ctx = createContext<FilterApi | null>(null);
const BM_KEY = 'datacanvas.bookmarks';

function loadBookmarks(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem(BM_KEY) ?? '[]') as Bookmark[];
  } catch {
    return [];
  }
}

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [activeFilter, setActiveFilter] = useState<CrossFilter | null>(null);
  const [slicers, setSlicers] = useState<Record<string, string[]>>({});
  const [whatIf, setWhatIfState] = useState<Record<string, number>>({});
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(loadBookmarks);
  const [drillFilter, setDrillFilter] = useState<CrossFilter | null>(null);

  const applyFilter = useCallback((sourceBlockId: string, field: string, value: string) => {
    setActiveFilter((prev) =>
      prev?.sourceBlockId === sourceBlockId && prev.value === value
        ? null
        : { sourceBlockId, field, value },
    );
  }, []);

  const value = useMemo<FilterApi>(
    () => ({
      activeFilter,
      applyFilter,
      clearFilter: () => setActiveFilter(null),
      slicers,
      setSlicer: (_blockId, field, values) => {
        if (!field) return;
        setSlicers((s) => ({ ...s, [field]: values }));
      },
      clearSlicers: () => setSlicers({}),
      whatIf,
      setWhatIf: (name, v) => setWhatIfState((s) => ({ ...s, [name]: v })),
      bookmarks,
      addBookmark: (name, dashboardId) =>
        setBookmarks((b) => {
          const next = [
            ...b,
            {
              id: `bm-${Date.now()}`,
              name,
              dashboardId,
              slicerState: slicers,
              crossFilter: activeFilter,
              whatIfValues: whatIf,
              createdAt: Date.now(),
            },
          ];
          try {
            localStorage.setItem(BM_KEY, JSON.stringify(next));
          } catch {
            /* quota */
          }
          return next;
        }),
      applyBookmark: (id) => {
        const bm = bookmarks.find((x) => x.id === id);
        if (!bm) return;
        setSlicers(bm.slicerState);
        setActiveFilter(bm.crossFilter);
        setWhatIfState(bm.whatIfValues);
      },
      drillFilter,
      setDrillFilter,
    }),
    [activeFilter, applyFilter, slicers, whatIf, bookmarks, drillFilter],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDashboardFilterState(): FilterApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDashboardFilterState requires provider');
  return ctx;
}
