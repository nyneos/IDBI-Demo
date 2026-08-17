export type BrandId = 'teal' | 'orange' | 'blue';
export type ThemeMode = 'light' | 'dark';
export type LightSurface = 'ghost-white' | 'light-gray' | 'warm-alabaster' | 'white-smoke';
export type DarkSurface = 'midnight' | 'charcoal' | 'onyx' | 'graphite';
export type SurfaceId = LightSurface | DarkSurface;
export type FontId = 'plus-jakarta-sans' | 'inter' | 'ibm-plex-sans' | 'manrope' | 'roboto';

export const FONT_STACKS: Record<FontId, string> = {
  'plus-jakarta-sans': '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", system-ui, sans-serif',
  inter: '"Inter Variable", Inter, system-ui, sans-serif',
  'ibm-plex-sans': '"IBM Plex Sans", system-ui, sans-serif',
  manrope: '"Manrope Variable", Manrope, system-ui, sans-serif',
  roboto: 'Roboto, system-ui, sans-serif',
};

export const FONT_LABELS: Record<FontId, string> = {
  'plus-jakarta-sans': 'Plus Jakarta Sans',
  inter: 'Inter',
  'ibm-plex-sans': 'IBM Plex Sans',
  manrope: 'Manrope',
  roboto: 'Roboto',
};

export const DEFAULT_PREFERENCES = {
  brand: 'teal' as BrandId,
  mode: 'light' as ThemeMode,
  surface: 'white-smoke' as SurfaceId,
  font: 'plus-jakarta-sans' as FontId,
};

export const LIGHT_SURFACES: { id: LightSurface; label: string; canvas: string }[] = [
  { id: 'ghost-white', label: 'Ghost White', canvas: '#F8F9FC' },
  { id: 'light-gray', label: 'Light Gray', canvas: '#F5F5F7' },
  { id: 'warm-alabaster', label: 'Warm Alabaster', canvas: '#FAF8F5' },
  { id: 'white-smoke', label: 'White Smoke', canvas: '#F5F5F4' },
];

export const DARK_SURFACES: { id: DarkSurface; label: string; canvas: string }[] = [
  { id: 'midnight', label: 'Midnight', canvas: '#0B0E1A' },
  { id: 'charcoal', label: 'Charcoal', canvas: '#121212' },
  { id: 'onyx', label: 'Onyx', canvas: '#080808' },
  { id: 'graphite', label: 'Graphite', canvas: '#161513' },
];

export const BRANDS: { id: BrandId; label: string; color: string }[] = [
  { id: 'teal', label: 'Teal', color: '#00846C' },
  { id: 'orange', label: 'Orange', color: '#F6821E' },
  { id: 'blue', label: 'Blue', color: '#1190C7' },
];
