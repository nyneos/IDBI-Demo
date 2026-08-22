import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  DEFAULT_PREFERENCES,
  FONT_STACKS,
  type BrandId,
  type FontId,
  type SurfaceId,
  type ThemeMode,
} from './themeTokens';

const STORAGE_KEY = 'datacanvas.preferences';

export interface Preferences {
  brand: BrandId;
  mode: ThemeMode;
  surface: SurfaceId;
  font: FontId;
}

interface PreferencesContextValue extends Preferences {
  setBrand: (brand: BrandId) => void;
  setLightSurface: (surface: SurfaceId) => void;
  setDarkSurface: (surface: SurfaceId) => void;
  setFont: (font: FontId) => void;
  restoreDefaults: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function load(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw) as { brand?: string; mode?: ThemeMode; surface?: SurfaceId; font?: FontId };
    const rawBrand = parsed.brand;
    const migratedBrand: BrandId =
      rawBrand === 'teal' || rawBrand === 'violet' || rawBrand === 'emerald' || rawBrand === 'indigo' || rawBrand === 'teal-ops'
        ? 'teal'
        : rawBrand === 'orange' || rawBrand === 'amber' || rawBrand === 'slate'
          ? 'orange'
          : rawBrand === 'blue'
            ? 'blue'
            : DEFAULT_PREFERENCES.brand;
    return {
      brand: migratedBrand,
      mode: parsed.mode ?? DEFAULT_PREFERENCES.mode,
      surface: parsed.surface ?? DEFAULT_PREFERENCES.surface,
      font: parsed.font ?? DEFAULT_PREFERENCES.font,
    };
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>(load);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persist = useCallback((next: Preferences) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* quota */
      }
    }, 200);
  }, []);

  const update = useCallback(
    (patch: Partial<Preferences>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch };
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      ...prefs,
      setBrand: (brand) => update({ brand }),
      setLightSurface: (surface) => update({ mode: 'light', surface }),
      setDarkSurface: (surface) => update({ mode: 'dark', surface }),
      setFont: (font) => update({ font }),
      restoreDefaults: () => {
        const next = { ...DEFAULT_PREFERENCES };
        setPrefs(next);
        persist(next);
      },
    }),
    [prefs, persist, update],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { brand, mode, surface, font } = usePreferences();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.brand = brand;
    root.dataset.mode = mode;
    root.dataset.surface = surface;
    root.style.setProperty('--font-family', FONT_STACKS[font]);
  }, [brand, mode, surface, font]);

  return <>{children}</>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
