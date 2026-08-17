import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { oneD } from '@/components/dashboard-builder/blockData';
import { autoTitle, ENTERPRISE_AI_PICKER_ITEMS, fieldArity, PICKER_ITEMS, pickerByType } from '@/components/dashboard-builder/chartRegistry';
import { renderBlockChart } from '@/components/dashboard-builder/renderBlockChart';
import {
  BLOCK_MIN_SIZE,
  DEFAULT_TITLE_SETTINGS,
  type DashboardBlock,
  type DashboardDataSource,
  type WorkingBlockType,
} from '@/components/dashboard-builder/types';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { seriesForGovernedMeasure } from '../semantic-layer/evaluateMeasure';
import type { BlockSemanticBinding, GovernedDimension, GovernedMeasure } from '../semantic-layer/types';
import { KeyInfluencerConfig } from '../ai-insights/KeyInfluencersView';

type FieldMode = 'governed' | 'custom';

export function EnterpriseBuilderDrawer({
  open,
  onClose,
  triggerRef,
  dataSource,
  approvedMeasures,
  approvedDimensions,
  editingBlock,
  editingBinding,
  blockCount,
  onClearAll,
  onAdd,
  onUpdate,
}: {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  dataSource: DashboardDataSource;
  approvedMeasures: GovernedMeasure[];
  approvedDimensions: GovernedDimension[];
  editingBlock: DashboardBlock | null;
  editingBinding?: BlockSemanticBinding;
  blockCount: number;
  onClearAll: () => void;
  onAdd: (block: Omit<DashboardBlock, 'id'>, binding: BlockSemanticBinding | null) => void;
  onUpdate: (id: string, patch: Partial<DashboardBlock>, binding: BlockSemanticBinding | null) => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [type, setType] = useState<WorkingBlockType>('bar');
  const [mode, setMode] = useState<FieldMode>('governed');
  const [measureId, setMeasureId] = useState('');
  const [dimensionId, setDimensionId] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [title, setTitle] = useState('');
  const [targetValue, setTargetValue] = useState('Failed');

  const dimOptions = dataSource.dimensions.map((d) => ({ value: d.key, label: d.label }));
  const arity = fieldArity(type);
  const needsField = arity.min > 0;

  useEffect(() => {
    if (!open) return;
    if (editingBlock) {
      setType(editingBlock.type);
      setStep(2);
      setTitle(editingBlock.title);
      const bound = Boolean(editingBinding?.measureId);
      setMode(bound ? 'governed' : 'custom');
      setMeasureId(editingBinding?.measureId ?? approvedMeasures[0]?.id ?? '');
      setDimensionId(editingBinding?.dimensionId ?? approvedDimensions[0]?.id ?? '');
      setCustomKey(editingBlock.dimensionKey || dimOptions[0]?.value || '');
      setTargetValue(editingBlock.aiConfig?.targetValue ?? 'Failed');
      return;
    }
    setStep(1);
    setType('bar');
    setMode(approvedMeasures.length ? 'governed' : 'custom');
    setMeasureId(approvedMeasures[0]?.id ?? '');
    setDimensionId(approvedDimensions[0]?.id ?? '');
    setCustomKey(dimOptions[0]?.value ?? '');
    setTitle('');
    setTargetValue('Failed');
  }, [open, editingBlock]);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      (triggerRef.current ?? prev)?.focus();
    };
  }, [open, onClose, triggerRef]);

  const measure = approvedMeasures.find((m) => m.id === measureId);
  const dimension = approvedDimensions.find((d) => d.id === dimensionId);
  const liveTitle =
    title ||
    (mode === 'governed' && measure ? measure.name : autoTitle(type, dimOptions.find((d) => d.value === customKey)?.label ?? customKey));

  const isAiType = type === 'key-influencers' || type === 'decomposition-tree';
  const needsGovernedOnly = type === 'decomposition-tree';

  const previewData =
    type === 'key-influencers' || type === 'decomposition-tree'
      ? []
      : mode === 'governed' && measure
        ? seriesForGovernedMeasure(dataSource, measure, dimension ?? null)
        : customKey
          ? oneD(dataSource, customKey)
          : [];

  const previewBlock: DashboardBlock = {
    id: 'preview',
    type,
    dimensionKey:
      type === 'key-influencers'
        ? customKey || 'Status'
        : mode === 'governed'
          ? (dimension?.sourceField ?? '')
          : customKey,
    dimensionKeys: [mode === 'governed' ? (dimension?.sourceField ?? '') : customKey].filter(Boolean),
    title: liveTitle,
    titleSettings: { ...DEFAULT_TITLE_SETTINGS },
    kpiMode: mode === 'governed' ? 'top' : 'count',
    aiConfig: type === 'key-influencers' ? { targetValue } : undefined,
  };

  const commit = () => {
    const size = BLOCK_MIN_SIZE[type];
    const key = mode === 'governed' ? (dimension?.sourceField ?? measure?.sourceField ?? '') : customKey;
    const payload: Omit<DashboardBlock, 'id'> = {
      type,
      dimensionKey: type === 'key-influencers' ? (customKey || 'Status') : key,
      dimensionKeys: key ? [key] : [],
      title: liveTitle,
      titleSettings: { ...DEFAULT_TITLE_SETTINGS },
      includeInCrossFilter: type !== 'key-influencers' && type !== 'decomposition-tree',
      kpiMode: mode === 'governed' ? 'top' : 'count',
      layout: { i: '', x: 0, y: 0, w: size.w, h: size.h, minW: size.minW, minH: size.minH },
      aiConfig: type === 'key-influencers' ? { targetValue } : undefined,
    };
    const binding: BlockSemanticBinding | null =
      (mode === 'governed' && measure) || type === 'decomposition-tree'
        ? { measureId: measure?.id, dimensionId: dimension?.id }
        : null;
    if (editingBlock) onUpdate(editingBlock.id, payload, binding);
    else onAdd(payload, binding);
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <button type="button" aria-label="Dismiss builder" className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex h-full w-[min(100%,560px)] flex-col border-l border-hairline bg-paper shadow-lg">
        <div ref={panelRef} className="flex h-full min-h-0 flex-col">
          <div className="h-1.5 shrink-0 bg-brand" />
          <div className="flex items-start justify-between gap-4 bg-brand-tint/60 px-6 py-5">
            <h2 id={titleId} className="text-xl font-bold leading-tight text-content-primary">
              {step === 1 ? 'Build this page' : pickerByType(type).label}
            </h2>
            <IconButton aria-label="Close" onClick={onClose}>
              <X size={16} />
            </IconButton>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto bg-sunken py-6">
            {step === 1 ? (
              <div className="flex flex-col gap-4 px-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Charts</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {PICKER_ITEMS.filter((item) => item.group === 'tier1' || item.group === 'report').map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            setType(item.type);
                            setTitle('');
                            setStep(2);
                          }}
                          className="flex h-10 items-center gap-3 rounded-xl border border-hairline bg-white px-3 py-3 text-left hover:border-brand"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-brand-text">
                            <Icon size={16} strokeWidth={1.75} />
                          </span>
                          <span className="text-sm font-medium text-content-primary">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">AI analytics</p>
                  <div className="mt-2 grid grid-cols-2 gap-3">
                    {ENTERPRISE_AI_PICKER_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            setType(item.type);
                            setTitle('');
                            setStep(2);
                          }}
                          className="flex h-10 items-center gap-3 rounded-xl border border-hairline bg-white px-3 py-3 text-left hover:border-brand"
                        >
                          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-tint text-brand-text">
                            <Icon size={16} strokeWidth={1.75} />
                          </span>
                          <span className="text-sm font-medium text-content-primary">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5 px-6">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1 text-sm text-brand-text"
                >
                  <ChevronLeft size={14} /> Back
                </button>

                {needsField && !isAiType ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">Data field</p>
                    <div className="mt-2 flex rounded-lg border border-hairline bg-white p-1">
                      <ModeBtn
                        active={mode === 'governed'}
                        disabled={approvedMeasures.length === 0}
                        onClick={() => setMode('governed')}
                      >
                        Governed Metric
                      </ModeBtn>
                      <ModeBtn active={mode === 'custom'} onClick={() => setMode('custom')}>
                        Custom Field
                      </ModeBtn>
                    </div>
                    {mode === 'governed' ? (
                      <div className="mt-3 flex flex-col gap-3">
                        <Select
                          label="Governed metric"
                          value={measureId}
                          options={approvedMeasures.map((m) => ({ value: m.id, label: m.name }))}
                          onChange={(e) => setMeasureId(e.target.value)}
                          hint={approvedMeasures.length === 0 ? 'Approve a measure in the Semantic Layer first.' : undefined}
                        />
                        <Select
                          label="Governed dimension"
                          value={dimensionId}
                          options={[
                            { value: '', label: 'None (total only)' },
                            ...approvedDimensions.map((d) => ({ value: d.id, label: d.name })),
                          ]}
                          onChange={(e) => setDimensionId(e.target.value)}
                        />
                      </div>
                    ) : (
                      <div className="mt-3">
                        <Select
                          label="Custom field"
                          value={customKey}
                          options={dimOptions}
                          onChange={(e) => setCustomKey(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                ) : null}

                {type === 'key-influencers' ? (
                  <KeyInfluencerConfig
                    source={dataSource}
                    targetField={customKey || 'Status'}
                    targetValue={targetValue}
                    onTargetFieldChange={setCustomKey}
                    onTargetValueChange={setTargetValue}
                  />
                ) : null}

                {needsGovernedOnly ? (
                  <div className="flex flex-col gap-3">
                    <Select
                      label="Governed metric"
                      value={measureId}
                      options={approvedMeasures.map((m) => ({ value: m.id, label: m.name }))}
                      onChange={(e) => setMeasureId(e.target.value)}
                    />
                  </div>
                ) : null}

                <label className="flex flex-col gap-1.5 text-sm font-medium text-content-primary">
                  Title
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={liveTitle}
                    className="h-10 w-full rounded-md border border-hairline bg-white px-3 text-sm outline-none focus:border-brand"
                  />
                </label>

                <div className="overflow-hidden rounded-xl bg-white">
                  <ChartFrame
                    title=""
                    ariaSummary="Preview"
                    plotClassName="h-[160px] min-h-[160px] flex-none overflow-hidden"
                    empty={false}
                  >
                    {(slot) =>
                      renderBlockChart(type, previewData, slot, {
                        compact: true,
                        dimensionKey: previewBlock.dimensionKey,
                        block: previewBlock,
                        source: dataSource,
                        catalog: {
                          measures: approvedMeasures,
                          dimensions: approvedDimensions,
                          bindings: { preview: { measureId: measure?.id, dimensionId: dimension?.id } },
                          updatedAt: Date.now(),
                        },
                      })
                    }
                  </ChartFrame>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-hairline px-6 py-4">
            <Button variant="danger" disabled={blockCount === 0} onClick={onClearAll}>
              Clear all
            </Button>
            {step === 2 ? (
              <Button
                variant="primary"
                onClick={commit}
                disabled={
                  (needsField && !isAiType && mode === 'governed' && !measure) ||
                  (needsGovernedOnly && !measure)
                }
              >
                {editingBlock ? 'Update block' : 'Add to dashboard'}
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

function ModeBtn({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-xs font-semibold',
        active ? 'bg-brand text-white' : 'text-content-secondary hover:bg-sunken',
        disabled && 'opacity-40',
      )}
    >
      {children}
    </button>
  );
}
