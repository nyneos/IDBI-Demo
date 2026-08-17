/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--surface-canvas)',
        paper: 'var(--surface-paper)',
        surface: 'var(--surface-paper)',
        raised: 'var(--surface-raised)',
        sunken: 'var(--surface-sunken)',
        brand: {
          DEFAULT: 'var(--brand-accent)',
          hover: 'var(--brand-accent-hover)',
          active: 'var(--brand-accent-active)',
          text: 'var(--brand-accent-text)',
          tint: 'var(--brand-tint)',
        },
        hairline: 'var(--border-default)',
        strong: 'var(--border-strong)',
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        status: {
          success: 'var(--status-success)',
          warning: 'var(--status-warning)',
          error: 'var(--status-error)',
          info: 'var(--status-info)',
        },
      },
      fontFamily: {
        sans: ['var(--font-family)'],
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glow: '0 0 0 1px color-mix(in srgb, var(--brand-accent) 40%, transparent), 0 0 16px color-mix(in srgb, var(--brand-accent) 18%, transparent)',
      },
      spacing: {
        topbar: '64px',
        drillbar: '56px',
      },
      transitionDuration: {
        fast: '150ms',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};
