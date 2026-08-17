import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Search, Sparkles, X } from 'lucide-react';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import { oneD } from './blockData';
import { pickerByType } from './chartRegistry';
import { recToBlock, type DrillChartRec } from './recommendDrillCharts';
import { askExamples, recommendAskCharts } from './recommendAskCharts';
import { renderBlockChart } from './renderBlockChart';
import { DEFAULT_TITLE_SETTINGS, type DashboardBlock, type DashboardDataSource } from './types';

export function NyneOsMark({ className }: { className?: string }) {
  return (
    <img
      src="/Image.png"
      alt=""
      className={cn('h-5 w-5 shrink-0 rounded-sm object-cover', className)}
      aria-hidden
    />
  );
}

export function JustAskDialog({
  open,
  dataSource,
  onClose,
  onAdd,
}: {
  open: boolean;
  dataSource: DashboardDataSource | null;
  onClose: () => void;
  onAdd: (blocks: Omit<DashboardBlock, 'id'>[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const [added, setAdded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setActive(0);
    setAdded(new Set());
    const t = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  const examples = useMemo(() => (dataSource ? askExamples(dataSource) : []), [dataSource]);
  const recs = useMemo(
    () => (dataSource && query.trim() ? recommendAskCharts(query, dataSource) : []),
    [dataSource, query],
  );
  const payloads = useMemo(
    () => (dataSource ? recs.map((r) => recToBlock(r, dataSource)) : []),
    [recs, dataSource],
  );

  const listLen = recs.length > 0 ? recs.length : examples.length;

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const recKey = (rec: DrillChartRec, i: number) => `${rec.type}-${rec.dimensionKeys.join('-')}-${i}`;

  const addOne = (i: number) => {
    const payload = payloads[i];
    if (!payload) return;
    onAdd([payload]);
    setAdded((prev) => new Set(prev).add(recKey(recs[i]!, i)));
  };

  const addAll = () => {
    const leftover = payloads.filter((_, i) => !added.has(recKey(recs[i]!, i)));
    if (leftover.length === 0) return;
    onAdd(leftover);
    setAdded(new Set(recs.map((r, i) => recKey(r, i))));
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((n) => (listLen === 0 ? 0 : (n + 1) % listLen));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((n) => (listLen === 0 ? 0 : (n - 1 + listLen) % listLen));
      return;
    }
    if (e.key === 'Enter') {
      if (recs.length > 0) {
        e.preventDefault();
        addOne(active);
      } else if (examples[active]) {
        e.preventDefault();
        setQuery(examples[active]!);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Dismiss" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="just-ask-title"
        className={cn(
          'relative z-[1] flex w-full flex-col overflow-hidden rounded-2xl border border-hairline bg-white shadow-lg',
          recs.length > 0 ? 'max-w-4xl' : 'max-w-2xl',
        )}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
          <NyneOsMark className="h-9 w-9 rounded-lg" />
          <Search size={18} className="shrink-0 text-content-tertiary" aria-hidden />
          <input
            ref={inputRef}
            id="just-ask-title"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question, or describe the chart you want…"
            className="h-10 min-w-0 flex-1 border-0 bg-white text-sm text-content-primary outline-none placeholder:text-content-tertiary"
          />
          <IconButton aria-label="Close" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>

        <div className="min-h-[280px] max-h-[min(70vh,560px)] overflow-y-auto px-5 py-4">
          {!dataSource ? (
            <p className="py-10 text-center text-sm text-content-secondary">Upload data first, then ask a question.</p>
          ) : recs.length === 0 ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-content-tertiary">Try asking</p>
              <ul className="mt-2 flex flex-col">
                {examples.map((text, i) => (
                  <li key={text}>
                    <button
                      type="button"
                      onClick={() => setQuery(text)}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm outline-none',
                        active === i ? 'bg-raised text-content-primary' : 'text-content-secondary hover:bg-raised',
                      )}
                    >
                      <Sparkles size={14} strokeWidth={1.75} className="shrink-0 text-content-tertiary" aria-hidden />
                      <span>{text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {payloads.map((payload, i) => {
                const rec = recs[i]!;
                const item = pickerByType(payload.type);
                const key = recKey(rec, i);
                const already = added.has(key);
                const preview: DashboardBlock = {
                  id: `ask-${i}`,
                  ...payload,
                  titleSettings: payload.titleSettings ?? DEFAULT_TITLE_SETTINGS,
                };
                const plot = dataSource ? oneD(dataSource, payload.dimensionKey) : [];
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex flex-col rounded-xl border bg-canvas p-3',
                      active === i ? 'border-brand' : 'border-hairline',
                    )}
                    onMouseEnter={() => setActive(i)}
                  >
                    <p className="text-sm font-semibold text-content-primary">{item.label}</p>
                    <p className="mt-1 text-xs text-content-secondary">{rec.reason}</p>
                    {payload.type === 'reporting-table' ? (
                      <div className="mt-3 flex h-[140px] items-center justify-center rounded-lg bg-white px-4 text-center text-sm text-content-secondary">
                        Group Table — adds a grouped report of matching rows.
                      </div>
                    ) : (
                      <div className="mt-3 overflow-hidden rounded-lg bg-white">
                        <ChartFrame
                          title=""
                          ariaSummary={rec.reason}
                          plotClassName="h-[140px] min-h-[140px] flex-none overflow-hidden"
                          empty={false}
                        >
                          {(slot) =>
                            renderBlockChart(payload.type, plot, slot, {
                              compact: true,
                              dimensionKey: payload.dimensionKey,
                              block: preview,
                              source: dataSource,
                            })
                          }
                        </ChartFrame>
                      </div>
                    )}
                    <Button
                      variant={already ? 'ghost' : 'secondary'}
                      className="mt-3 w-full"
                      disabled={already}
                      onClick={() => addOne(i)}
                    >
                      {already ? 'Added' : 'Add to dashboard'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-hairline px-5 py-3">
          <p className="text-xs text-content-tertiary">
            Enter to {recs.length ? 'add' : 'open'} · ↑ ↓ to move · Esc to close
          </p>
          <div className="flex items-center gap-2">
            {recs.length > 0 ? (
              <Button variant="primary" onClick={addAll} disabled={added.size === recs.length}>
                Add all to dashboard
              </Button>
            ) : null}
            <span className="text-xs font-medium text-content-tertiary">NyneOS</span>
          </div>
        </div>
      </div>
    </div>
  );
}
