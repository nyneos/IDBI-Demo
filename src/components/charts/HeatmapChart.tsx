import { useState } from 'react';
import { cn } from '@/lib/cn';
import { formatCount } from '@/lib/format';
import { ChartTooltip } from './ChartTooltip';

const SEQ = ['var(--seq-1)', 'var(--seq-2)', 'var(--seq-3)', 'var(--seq-4)', 'var(--seq-5)'];

export interface HeatmapChartProps {
  rows: string[];
  cols: string[];
  cells: number[][];
}

export function HeatmapChart({ rows, cols, cells }: HeatmapChartProps) {
  const [tip, setTip] = useState<{ r: string; c: string; v: number } | null>(null);
  const max = Math.max(1, ...cells.flat());

  const color = (v: number) => {
    if (v <= 0) return 'var(--bg-sunken)';
    const t = v / max;
    const i = Math.min(SEQ.length - 1, Math.floor(t * SEQ.length));
    return SEQ[i]!;
  };

  return (
    <div className="relative overflow-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="px-1 py-1 text-left text-xs text-content-tertiary" />
            {cols.map((c) => (
              <th key={c} className="px-1 py-1 text-xs font-medium text-content-tertiary">
                <span className="block max-w-16 truncate">{c}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={r}>
              <th scope="row" className="whitespace-nowrap px-1 py-1 text-left text-xs text-content-secondary">
                {r}
              </th>
              {(cells[ri] ?? []).map((v, ci) => (
                <td key={`${r}-${cols[ci]}`} className="p-0.5">
                  <button
                    type="button"
                    className={cn(
                      'block h-8 w-full rounded-sm outline-none',
                      'hover:opacity-90',
                    )}
                    style={{ backgroundColor: color(v) }}
                    aria-label={`${r} × ${cols[ci]}: ${formatCount(v)}`}
                    onPointerEnter={() => setTip({ r, c: cols[ci] ?? '', v })}
                    onPointerLeave={() => setTip(null)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {tip ? (
        <div className="pointer-events-none absolute right-2 top-2">
          <ChartTooltip
            title={`${tip.r} × ${tip.c}`}
            rows={[{ label: 'Count', value: formatCount(tip.v) }]}
          />
        </div>
      ) : null}
    </div>
  );
}
