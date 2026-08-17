import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';
import { oneD } from './blockData';
import { pickerByType } from './chartRegistry';
import { recToBlock, recommendDrillCharts } from './recommendDrillCharts';
import { renderBlockChart } from './renderBlockChart';
import {
  DEFAULT_TITLE_SETTINGS,
  type DashboardBlock,
  type DashboardDataSource,
} from './types';

type Step = 'pick' | 'recommend';

export function DrillableNavigationWizard({
  open,
  blocks,
  dataSource,
  onClose,
  onChooseRecommended,
  onChooseManual,
}: {
  open: boolean;
  blocks: DashboardBlock[];
  dataSource: DashboardDataSource | null;
  onClose: () => void;
  onChooseRecommended: (sourceBlock: DashboardBlock, extras: Omit<DashboardBlock, 'id'>[]) => void;
  onChooseManual: (sourceBlock: DashboardBlock) => void;
}) {
  const [step, setStep] = useState<Step>('pick');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setStep('pick');
    setSelectedId(null);
  }, [open]);

  const selected = blocks.find((b) => b.id === selectedId) ?? null;
  const recs = useMemo(
    () => (selected && dataSource ? recommendDrillCharts(selected, dataSource) : []),
    [selected, dataSource],
  );
  const payloads = useMemo(
    () => (dataSource ? recs.map((r) => recToBlock(r, dataSource)) : []),
    [recs, dataSource],
  );

  if (!open) return null;

  const reset = () => {
    setStep('pick');
    setSelectedId(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Dismiss" onClick={reset} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drill-nav-title"
        className="relative z-[1] flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-hairline bg-paper shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-6 py-5">
          <div>
            <h2 id="drill-nav-title" className="text-xl font-semibold text-content-primary">
              Drillable Navigation
            </h2>
            <p className="mt-1 text-sm text-content-secondary">
              {step === 'pick'
                ? 'Choose the card that should open a deeper view when clicked.'
                : `Recommended drill-down charts for “${selected?.title ?? 'this card'}”.`}
            </p>
          </div>
          <IconButton aria-label="Close" onClick={reset}>
            <X size={16} />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {step === 'pick' ? (
            blocks.length === 0 ? (
              <p className="py-12 text-center text-sm text-content-secondary">
                Add a card to this canvas first, then make it drillable.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {blocks.map((block) => {
                  const item = pickerByType(block.type);
                  const Icon = item.icon;
                  const active = selectedId === block.id;
                  return (
                    <button
                      key={block.id}
                      type="button"
                      onClick={() => setSelectedId(block.id)}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border bg-white px-4 py-3 text-left outline-none',
                        active ? 'border-brand' : 'border-hairline hover:border-brand',
                      )}
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-text">
                        <Icon size={18} strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-content-primary">{block.title}</span>
                        <span className="mt-0.5 block text-xs text-content-tertiary">{item.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {payloads.map((payload, i) => {
                const rec = recs[i]!;
                const item = pickerByType(payload.type);
                const preview: DashboardBlock = {
                  id: `rec-${i}`,
                  ...payload,
                  titleSettings: payload.titleSettings ?? DEFAULT_TITLE_SETTINGS,
                };
                const plot = dataSource ? oneD(dataSource, payload.dimensionKey) : [];
                return (
                  <div key={`${payload.type}-${i}`} className="rounded-xl border border-hairline bg-canvas p-3">
                    <p className="text-sm font-semibold text-content-primary">{item.label}</p>
                    <p className="mt-1 text-xs text-content-secondary">{rec.reason}</p>
                    {dataSource ? (
                      payload.type === 'reporting-table' ? (
                        <div className="mt-3 flex h-[140px] items-center justify-center rounded-lg bg-paper px-4 text-center text-sm text-content-secondary">
                          Group Table — opens with this slice’s rows grouped for drill-down.
                        </div>
                      ) : (
                        <div className="mt-3 overflow-hidden rounded-lg bg-paper">
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
                      )
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-hairline px-6 py-4">
          {step === 'pick' ? (
            <Button
              variant="primary"
              disabled={!selectedId}
              onClick={() => setStep('recommend')}
            >
              Continue
            </Button>
          ) : selected ? (
            <>
              <Button variant="ghost" onClick={() => setStep('pick')}>
                Back
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  onChooseManual(selected);
                  onClose();
                }}
              >
                I’ll add charts manually
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  onChooseRecommended(selected, payloads);
                  onClose();
                }}
              >
                Add these as a drillable dashboard
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
