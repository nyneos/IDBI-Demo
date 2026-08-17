import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { EASE, MOTION } from '@/motion/tokens';
import { useCountUp } from '@/motion/useCountUp';
import { useReducedMotion } from '@/motion/useReducedMotion';

export interface GaugeRingProps {
  label: string;
  value: number;
  target: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polar(cx, cy, r, startAngle);
  const end = polar(cx, cy, r, endAngle);
  const sweep = endAngle - startAngle;
  const large = sweep > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

function arcColor(value: number, target: number): string {
  const ratio = target === 0 ? 0 : value / target;
  if (ratio >= 1) return 'var(--status-success)';
  if (ratio >= 0.9) return 'var(--status-warning)';
  return 'var(--status-error)';
}

export function GaugeRing({
  label,
  value,
  target,
  size = 78,
  strokeWidth = 8,
  className,
}: GaugeRingProps) {
  const reduced = useReducedMotion();
  const counted = useCountUp(value);
  const color = arcColor(value, target);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - strokeWidth;
  const startAngle = 135;
  const sweep = 270;
  const t = Math.max(0, Math.min(1, value / 100));
  const valueEnd = startAngle + sweep * t;
  const targetT = Math.max(0, Math.min(1, target / 100));
  const targetAngle = startAngle + sweep * targetT;
  const tickInner = polar(cx, cy, r - 4, targetAngle);
  const tickOuter = polar(cx, cy, r + 4, targetAngle);

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {label ? (
        <span className="text-xs font-medium text-content-secondary">{label}</span>
      ) : null}
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <path
            d={describeArc(cx, cy, r, startAngle, startAngle + sweep)}
            fill="none"
            stroke="var(--bg-sunken)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <motion.path
            d={describeArc(cx, cy, r, startAngle, valueEnd)}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={reduced ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: MOTION.chart / 1000, ease: EASE.enter }}
          />
          <line
            x1={tickInner.x}
            y1={tickInner.y}
            x2={tickOuter.x}
            y2={tickOuter.y}
            stroke="var(--text-tertiary)"
            strokeWidth={2}
            strokeLinecap="round"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-extrabold tabular leading-none text-content-primary">
            {Math.round(counted)}%
          </span>
        </div>
      </div>
      <span className="text-xs text-content-tertiary">Target ≥ {target}%</span>
    </div>
  );
}
