export const MOTION = {
  instant: 80,
  fast: 150,
  base: 220,
  slow: 320,
  drill: 600,
  chart: 700,
  count: 700,
  relayout: 700,
} as const;

export const EASE = {
  standard: [0.2, 0, 0, 1] as const,
  enter: [0, 0, 0.2, 1] as const,
  exit: [0.4, 0, 1, 1] as const,
  emphasis: [0.3, 0, 0, 1] as const,
};

export const STAGGER = {
  card: 50,
  row: 24,
  cardCap: 6,
  rowCap: 10,
} as const;

export function staggerDelay(index: number, step: number, cap: number): number {
  return Math.min(index, cap - 1) * step;
}
