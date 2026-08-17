import { useEffect, type ReactNode } from 'react';
import { FONT_STACKS } from './themeTokens';
import { usePreferences } from './usePreferences';

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
