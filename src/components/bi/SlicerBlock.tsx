import { useDashboardFilterState } from '@/state/useDashboardFilterState';
import { oneD } from '@/components/dashboard-builder/blockData';
import type { DashboardBlock, DashboardDataSource } from '@/components/dashboard-builder/types';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';

export function SlicerBlock({ block, source }: { block: DashboardBlock; source: DashboardDataSource }) {
  const { slicers, setSlicer } = useDashboardFilterState();
  const field = block.dimensionKey;
  const options = oneD(source, field);
  const selected = slicers[field] ?? options.map((o) => o.label);
  const style = block.slicerStyle ?? (options.length <= 8 ? 'chips' : 'dropdown');

  if (style === 'dropdown') {
    return (
      <Select
        label={block.title}
        value={selected[0] ?? ''}
        options={[{ value: '', label: 'All' }, ...options.map((o) => ({ value: o.label, label: o.label }))]}
        onChange={(e) => setSlicer(block.id, field, e.target.value ? [e.target.value] : [])}
      />
    );
  }

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-content-tertiary">{block.title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o.label);
          return (
            <button
              key={o.label}
              type="button"
              onClick={() => {
                const next = on ? selected.filter((v) => v !== o.label) : [...selected, o.label];
                setSlicer(block.id, field, next);
              }}
              className={cn(
                'rounded-lg border px-3 py-1.5 text-sm font-medium',
                on ? 'border-brand bg-brand-tint text-brand-text' : 'border-hairline text-content-secondary',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WhatIfBlock({ block }: { block: DashboardBlock }) {
  const cfg = block.whatIf ?? { name: block.title, min: 0, max: 50, step: 1, value: 10 };
  const { whatIf, setWhatIf } = useDashboardFilterState();
  const value = whatIf[cfg.name] ?? cfg.value;
  const pct = ((value - cfg.min) / (cfg.max - cfg.min || 1)) * 100;

  return (
    <label className="block">
      <span className="text-sm font-medium text-content-primary">
        {cfg.name} · {value}
      </span>
      <input
        type="range"
        className="theme-slider mt-3 w-full"
        min={cfg.min}
        max={cfg.max}
        step={cfg.step}
        value={value}
        style={{ ['--pct' as string]: `${pct}%` }}
        onChange={(e) => setWhatIf(cfg.name, Number(e.target.value))}
      />
    </label>
  );
}
