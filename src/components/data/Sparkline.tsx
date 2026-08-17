import { useId, useMemo } from 'react';
import { cn } from '@/lib/cn';

export interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
}

function buildPath(data: number[], width: number, height: number): { line: string; area: string } {
  if (data.length === 0) return { line: '', area: '' };
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const padY = 2;
  const usableH = height - padY * 2;
  const step = data.length <= 1 ? 0 : width / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = padY + usableH - ((v - min) / span) * usableH;
    return { x, y };
  });

  const line = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(' ');

  const first = points[0]!;
  const last = points[points.length - 1]!;
  const area = `${line} L${last.x.toFixed(2)} ${height} L${first.x.toFixed(2)} ${height} Z`;

  return { line, area };
}

export function Sparkline({
  data,
  color,
  width = 72,
  height = 24,
  fill = false,
  className,
}: SparklineProps) {
  const gid = useId().replace(/:/g, '');
  const { line, area } = useMemo(() => buildPath(data, width, height), [data, width, height]);

  if (data.length < 2) {
    return (
      <svg
        width={width}
        height={height}
        className={cn('pointer-events-none', className)}
        aria-hidden
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('pointer-events-none overflow-visible', className)}
      aria-hidden
    >
      {fill ? (
        <>
          <defs>
            <linearGradient id={`spark-fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#spark-fill-${gid})`} stroke="none" />
        </>
      ) : null}
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
