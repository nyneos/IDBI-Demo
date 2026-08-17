import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ChevronLeft, Pencil, Plus, RotateCcw, Sparkles, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ChartFrame } from '@/components/charts/ChartFrame';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { defaultReportingConfig } from '@/components/table/ReportingTableBlock';
import { ConfirmDialog } from './ConfirmDialog';
import { autoTitle, fieldArity, PICKER_ITEMS, pickerByType } from './chartRegistry';
import { oneD } from './blockData';
import { renderBlockChart } from './renderBlockChart';
import {
  BLOCK_MIN_SIZE,
  DEFAULT_TITLE_SETTINGS,
  TITLE_ALIGN_CLASS,
  TITLE_SIZE_CLASS,
  TITLE_WEIGHT_CLASS,
  type DashboardBlock,
  type DashboardDataSource,
  type KpiMode,
  type TitleAlign,
  type TitleSettings,
  type TitleSize,
  type TitleWeight,
  type WorkingBlockType,
} from './types';

function fieldLabel(source: DashboardDataSource, type: WorkingBlockType, key: string): string {
  if (type === 'gauge') return source.gauges?.find((m) => m.key === key)?.label ?? key;
  return (
    source.dimensions.find((d) => d.key === key)?.label ??
    source.metrics?.find((d) => d.key === key)?.label ??
    key
  );
}

function defaultKeys(source: DashboardDataSource, type: WorkingBlockType, suggestion?: string[]): string[] {
  const { min } = fieldArity(type);
  if (min === 0) return [];
  if (type === 'gauge') return [source.gauges?.[0]?.key ?? ''];
  if (suggestion?.length) return suggestion.slice(0, Math.max(min, suggestion.length));
  return source.dimensions.slice(0, Math.max(min, 1)).map((d) => d.key);
}

interface Draft {
  type: WorkingBlockType;
  dimensionKeys: string[];
  title: string;
  titleEdited: boolean;
  titleSettings: TitleSettings;
  kpiMode: KpiMode;
  spacerHeight: number;
  stagingId?: string;
  gridW: number;
  gridH: number;
  axisX: string;
  axisY: string;
  drillThroughTargetId: string;
  drillThroughSourceField: string;
  drillThroughTargetField: string;
  reporting: NonNullable<DashboardBlock['reportingConfig']>;
}

function makeDraft(
  source: DashboardDataSource,
  type: WorkingBlockType,
  existing?: DashboardBlock,
  suggestionKeys?: string[],
): Draft {
  if (existing) {
    return {
      type: existing.type,
      dimensionKeys: existing.dimensionKeys?.length
        ? existing.dimensionKeys
        : existing.dimensionKey
          ? [existing.dimensionKey]
          : [],
      title: existing.title,
      titleEdited: true,
      titleSettings: { ...existing.titleSettings },
      kpiMode: existing.kpiMode ?? 'count',
      spacerHeight: existing.spacerHeight ?? 64,
      stagingId: existing.id.startsWith('stage-') ? existing.id : undefined,
      gridW: existing.layout?.w ?? BLOCK_MIN_SIZE[existing.type].w,
      gridH: existing.layout?.h ?? BLOCK_MIN_SIZE[existing.type].h,
      axisX: existing.axisLabels?.x ?? '',
      axisY: existing.axisLabels?.y ?? '',
      drillThroughTargetId: existing.drillThroughTargetId ?? '',
      drillThroughSourceField: existing.drillThroughSourceField ?? '',
      drillThroughTargetField: existing.drillThroughTargetField ?? '',
      reporting: existing.reportingConfig ?? defaultReportingConfig(source),
    };
  }
  const dimensionKeys = defaultKeys(source, type, suggestionKeys);
  const label = dimensionKeys[0] ? fieldLabel(source, type, dimensionKeys[0]) : '';
  const size = BLOCK_MIN_SIZE[type];
  return {
    type,
    dimensionKeys,
    title: autoTitle(type, label),
    titleEdited: false,
    titleSettings: { ...DEFAULT_TITLE_SETTINGS },
    kpiMode: 'count',
    spacerHeight: 64,
    gridW: size.w,
    gridH: size.h,
    axisX: '',
    axisY: '',
    drillThroughTargetId: '',
    drillThroughSourceField: '',
    drillThroughTargetField: '',
    reporting: defaultReportingConfig(source),
  };
}

function payloadFromDraft(draft: Draft, source: DashboardDataSource): Omit<DashboardBlock, 'id'> {
  const label = draft.dimensionKeys[0] ? fieldLabel(source, draft.type, draft.dimensionKeys[0]) : '';
  return {
    type: draft.type,
    dimensionKey:
      draft.type === 'reporting-table' ? (draft.reporting.groupBy[0] ?? '') : (draft.dimensionKeys[0] ?? ''),
    dimensionKeys:
      draft.type === 'reporting-table' ? draft.reporting.groupBy.filter(Boolean) : draft.dimensionKeys,
    kpiMode: draft.type === 'kpi' ? draft.kpiMode : undefined,
    spacerHeight: draft.type === 'div' ? draft.spacerHeight : undefined,
    title: draft.title.trim() || autoTitle(draft.type, label),
    titleSettings: draft.titleSettings,
    axisLabels: { x: draft.axisX || undefined, y: draft.axisY || undefined },
    enableDrillThrough: Boolean(draft.drillThroughTargetId),
    drillThroughTargetId: draft.drillThroughTargetId || undefined,
    drillThroughSourceField: draft.drillThroughSourceField || undefined,
    drillThroughTargetField: draft.drillThroughTargetField || undefined,
    reportingConfig: draft.type === 'reporting-table' ? draft.reporting : undefined,
    combo:
      draft.type === 'combo'
        ? {
            xField: draft.dimensionKeys[0] ?? '',
            series1: {
              type: 'bar',
              field: draft.dimensionKeys[1] ?? draft.dimensionKeys[0] ?? '',
              axis: 'left',
            },
            series2: {
              type: 'line',
              field: draft.dimensionKeys[2] ?? draft.dimensionKeys[1] ?? draft.dimensionKeys[0] ?? '',
              axis: 'right',
            },
          }
        : undefined,
    whatIf:
      draft.type === 'what-if'
        ? { name: draft.title || 'Parameter', min: 0, max: 100, step: 1, value: 10 }
        : undefined,
    layout: {
      i: '',
      x: 0,
      y: 0,
      w: draft.gridW,
      h: draft.gridH,
      minW: BLOCK_MIN_SIZE[draft.type].minW,
      minH: BLOCK_MIN_SIZE[draft.type].minH,
    },
  };
}

function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  const groupId = useId();
  return (
    <div>
      <p id={groupId} className="mb-1.5 text-sm font-medium text-content-primary">
        {label}
      </p>
      <div
        role="radiogroup"
        aria-labelledby={groupId}
        className="flex items-center gap-4 border-b border-hairline"
      >
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(opt.value)}
              className={cn(
                '-mb-px border-b-2 pb-2 text-sm transition-colors duration-fast ease-standard',
                'outline-none',
                selected
                  ? 'border-brand font-semibold text-brand-text'
                  : 'border-transparent font-medium text-content-secondary hover:text-content-primary',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FieldChecklist({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">{label}</legend>
      <div className="mt-2 max-h-36 overflow-y-auto rounded-lg border border-hairline bg-white p-2">
        {options.length === 0 ? (
          <p className="text-xs text-content-tertiary">No fields available</p>
        ) : (
          options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 py-1 text-sm text-content-primary">
              <input
                type="checkbox"
                checked={selected.includes(o.value)}
                className="accent-brand"
                onChange={(e) => {
                  onChange(e.target.checked ? [...selected, o.value] : selected.filter((k) => k !== o.value));
                }}
              />
              {o.label}
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  onBlur,
  id,
  dataSectionTitle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  dataSectionTitle?: boolean;
}) {
  const fallbackId = useId();
  const inputId = id ?? fallbackId;
  return (
    <label className="flex min-w-0 flex-col gap-1.5" htmlFor={inputId}>
      <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
        {label}
      </span>
      <input
        id={inputId}
        value={value}
        data-section-title={dataSectionTitle ? '' : undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          'h-10 w-full rounded-lg border border-strong bg-white px-3',
          'text-sm font-normal text-content-primary',
          'hover:border-content-tertiary',
          'focus:border-brand outline-none',
        )}
      />
    </label>
  );
}

function MicroLabel({ children }: { children: string }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-text">
      {children}
    </p>
  );
}

function BlockTile({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="block w-full text-left outline-none">
      <span className="flex h-12 items-center gap-3 rounded-xl border border-hairline bg-paper px-3 shadow-xs transition-[border-color,box-shadow,background-color] duration-fast ease-standard hover:border-brand hover:bg-brand-tint hover:shadow-sm">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-text">
          <Icon size={16} strokeWidth={1.75} aria-hidden />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-content-primary">{label}</span>
        <Plus size={16} strokeWidth={1.75} aria-hidden className="shrink-0 text-brand-text" />
      </span>
    </button>
  );
}

export interface BuilderDrawerProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  dataSource: DashboardDataSource;
  sectionTitle: string;
  onSectionTitleChange: (title: string) => void;
  blockCount: number;
  onClearAll: () => void;
  onAddAll: (blocks: Omit<DashboardBlock, 'id'>[]) => void;
  onUpdate: (id: string, patch: Partial<DashboardBlock>) => void;
  editingBlock: DashboardBlock | null;
}

export function BuilderDrawer({
  open,
  onClose,
  triggerRef,
  dataSource,
  sectionTitle,
  onSectionTitleChange,
  blockCount,
  onClearAll,
  onAddAll,
  onUpdate,
  editingBlock,
}: BuilderDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [titleDraft, setTitleDraft] = useState(sectionTitle);
  const [confirmClear, setConfirmClear] = useState(false);
  const [staged, setStaged] = useState<DashboardBlock[]>([]);
  const editId = editingBlock && !editingBlock.id.startsWith('stage-') ? editingBlock.id : null;

  useEffect(() => {
    if (!open) return;
    setTitleDraft(sectionTitle);
    setStaged([]);
    if (editingBlock) {
      setDraft(makeDraft(dataSource, editingBlock.type, editingBlock));
      setStep(2);
    } else {
      setDraft(null);
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open/editing only
  }, [open, editingBlock]);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const root = panelRef.current;
    const focusables = () =>
      root
        ? [...root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea')].filter(
            (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-disabled') !== 'true',
          )
        : [];
    const titleInput = root?.querySelector<HTMLInputElement>('input[data-section-title]');
    const frame = window.requestAnimationFrame(() => (titleInput ?? focusables()[0])?.focus());

    const onKey = (e: KeyboardEvent) => {
      if (confirmClear) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !root) return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', onKey);
      (triggerRef.current ?? prev)?.focus();
    };
  }, [open, triggerRef, confirmClear]);

  const flushTitle = () => {
    if (titleDraft !== sectionTitle) onSectionTitleChange(titleDraft);
  };

  const selectType = (type: WorkingBlockType, suggestionKeys?: string[]) => {
    setDraft(makeDraft(dataSource, type, undefined, suggestionKeys));
    setStep(2);
  };

  const resetDraft = () => {
    if (step === 1) {
      setStaged([]);
      setTitleDraft(sectionTitle);
      return;
    }
    if (!draft) return;
    setDraft(makeDraft(dataSource, draft.type, editingBlock ?? undefined));
  };

  const addToList = () => {
    if (!draft) return;
    const payload = payloadFromDraft(draft, dataSource);
    if (editId) {
      onUpdate(editId, payload);
      setDraft(null);
      setStep(1);
      return;
    }
    if (draft.stagingId) {
      setStaged((list) =>
        list.map((b) => (b.id === draft.stagingId ? { ...b, ...payload } : b)),
      );
    } else {
      const id = `stage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setStaged((list) => [...list, { ...payload, id }]);
    }
    setDraft(null);
    setStep(1);
  };

  const commitAll = () => {
    onSectionTitleChange(titleDraft);
    onAddAll(staged.map(({ id: _id, ...rest }) => rest));
    setStaged([]);
    onClose();
  };

  const arity = draft ? fieldArity(draft.type) : { min: 1, max: 1 };
  const dimOptions = dataSource.dimensions.map((d) => ({ value: d.key, label: d.label }));
  const gaugeOptions = (dataSource.gauges ?? []).map((m) => ({ value: m.key, label: m.label }));
  const metricOptions = [
    ...dimOptions,
    ...(dataSource.metrics ?? []).map((d) => ({ value: d.key, label: d.label })),
  ];
  const allFieldOptions = [
    ...dimOptions,
    ...(dataSource.metrics ?? []).map((d) => ({ value: d.key, label: d.label })),
    ...(dataSource.dates ?? []).map((d) => ({ value: d.key, label: d.label })),
  ].filter((o, i, arr) => arr.findIndex((x) => x.value === o.value) === i);
  const numericFieldOptions = [
    ...(dataSource.metrics ?? []).map((d) => ({ value: d.key, label: d.label })),
    ...dimOptions.filter((d) => /amount|value|count|qty|score|rate/i.test(d.label) || /amount|value|count/i.test(d.value)),
  ].filter((o, i, arr) => arr.findIndex((x) => x.value === o.value) === i);

  const previewData =
    draft && draft.type !== 'gauge' && draft.dimensionKeys[0]
      ? oneD(dataSource, draft.dimensionKeys[0])
      : [];

  const previewBlock: DashboardBlock | null = draft
    ? { id: 'preview', ...payloadFromDraft(draft, dataSource) }
    : null;

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Dismiss builder"
        className="fixed inset-0 z-40 bg-black/40"
        onClick={() => {
          flushTitle();
          onClose();
        }}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex h-full w-[min(100%,560px)] flex-col border-l border-hairline bg-paper shadow-lg">
                  <div ref={panelRef} className="flex h-full min-h-0 flex-col">
                    <div className="h-1.5 shrink-0 bg-brand" />
                    <div className="flex items-start justify-between gap-4 bg-brand-tint/60 px-6 py-5">
                      <h2 id={titleId} className="text-2xl font-semibold leading-tight text-content-primary">
                        Build this page
                      </h2>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          variant="primary"
                          disabled={staged.length === 0}
                          className="disabled:opacity-50 disabled:hover:bg-brand"
                          onClick={commitAll}
                        >
                          Add All ({staged.length})
                        </Button>
                        <IconButton
                          aria-label="Close"
                          onClick={() => {
                            flushTitle();
                            onClose();
                          }}
                        >
                          <X size={16} strokeWidth={1.75} aria-hidden />
                        </IconButton>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 border-b border-hairline px-6 py-4">
                      <Button
                        variant="danger"
                        leftIcon={Trash2}
                        disabled={blockCount === 0}
                        onClick={() => setConfirmClear(true)}
                      >
                        Clear all
                      </Button>
                      <Button variant="secondary" leftIcon={RotateCcw} onClick={resetDraft}>
                        Reset
                      </Button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto bg-sunken py-6">
                      {step === 1 || !draft ? (
                        <div className="flex flex-col gap-8 px-6">
                          <div>
                            <LabeledInput
                              label="Dashboard Name"
                              value={titleDraft}
                              dataSectionTitle
                              onChange={setTitleDraft}
                              onBlur={() => {
                                if (titleDraft !== sectionTitle) onSectionTitleChange(titleDraft);
                              }}
                            />
                          </div>

                          {dataSource.suggestions.length > 0 ? (
                            <div>
                              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-content-primary">
                                <Sparkles size={16} strokeWidth={1.75} aria-hidden className="text-brand-text" />
                                Suggested
                              </p>
                              <div className="grid grid-cols-2 gap-3">
                                {dataSource.suggestions.map((s) => {
                                  const item = pickerByType(s.type);
                                  return (
                                    <BlockTile
                                      key={`${s.type}-${s.reason}`}
                                      icon={item.icon}
                                      label={item.label}
                                      onClick={() =>
                                        selectType(s.type, s.fields ?? (s.field ? [s.field] : undefined))
                                      }
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          <div>
                            <MicroLabel>Add blocks</MicroLabel>
                            <div className="grid grid-cols-2 gap-3">
                              {PICKER_ITEMS.filter((item) => item.group !== 'report').map((item) => (
                                <BlockTile
                                  key={item.type}
                                  icon={item.icon}
                                  label={item.label}
                                  onClick={() => selectType(item.type)}
                                />
                              ))}
                            </div>
                            {dataSource.dimensions.length === 0 ? (
                              <p className="mt-4 text-xs text-content-tertiary">
                                No usable category fields in this file. Title, spacer, and KPI blocks still work.
                              </p>
                            ) : null}
                          </div>

                          <div>
                            <MicroLabel>Add Report</MicroLabel>
                            <div className="grid grid-cols-2 gap-3">
                              {PICKER_ITEMS.filter((item) => item.group === 'report').map((item) => (
                                <BlockTile
                                  key={item.type}
                                  icon={item.icon}
                                  label={item.label}
                                  onClick={() => selectType(item.type)}
                                />
                              ))}
                            </div>
                          </div>

                          {staged.length > 0 ? (
                            <div>
                              <MicroLabel>{`Your list (${staged.length})`}</MicroLabel>
                              <ul className="flex flex-col gap-2.5">
                                {staged.map((b) => {
                                  const item = pickerByType(b.type);
                                  const Icon = item.icon;
                                  const bound = fieldLabel(dataSource, b.type, b.dimensionKey);
                                  return (
                                    <li
                                      key={b.id}
                                      className="flex items-center gap-3 rounded-xl border border-hairline bg-paper px-3 py-2.5 shadow-xs"
                                    >
                                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-text">
                                        <Icon size={16} strokeWidth={1.75} aria-hidden />
                                      </span>
                                      <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold text-content-primary">
                                          {b.title}
                                        </p>
                                        {bound ? (
                                          <p className="truncate text-xs text-content-tertiary">{bound}</p>
                                        ) : null}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        leftIcon={Pencil}
                                        onClick={() => {
                                          setDraft(makeDraft(dataSource, b.type, b));
                                          setStep(2);
                                        }}
                                      >
                                        Edit
                                      </Button>
                                      <IconButton
                                        aria-label="Remove from list"
                                        onClick={() => setStaged((list) => list.filter((x) => x.id !== b.id))}
                                      >
                                        <Trash2 size={14} strokeWidth={1.75} aria-hidden />
                                      </IconButton>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex flex-col gap-6 px-6">
                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className={cn(
                              'inline-flex items-center gap-1 self-start text-sm font-semibold text-content-secondary',
                              'hover:text-content-primary outline-none',
                            )}
                          >
                            <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
                            Back
                          </button>

                          {draft.type !== 'section-title' && draft.type !== 'div' ? (
                            <ChartFrame
                              title={draft.title}
                              ariaSummary="Live preview of the selected block"
                              titleClassName={cn(
                                TITLE_SIZE_CLASS[draft.titleSettings.size],
                                TITLE_WEIGHT_CLASS[draft.titleSettings.weight],
                                TITLE_ALIGN_CLASS[draft.titleSettings.align],
                              )}
                              plotClassName="h-[200px] min-h-[200px] flex-none overflow-hidden"
                              empty={false}
                            >
                              {(slot) =>
                                previewBlock
                                  ? renderBlockChart(draft.type, previewData, slot, {
                                      compact: true,
                                      dimensionKey: draft.dimensionKeys[0],
                                      block: previewBlock,
                                      source: dataSource,
                                    })
                                  : null
                              }
                            </ChartFrame>
                          ) : null}

                          {arity.max > 0 ? (
                            <div className="flex flex-col gap-3">
                              <p className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                                Data field
                              </p>
                              {Array.from({ length: arity.max }, (_, i) => {
                                const options =
                                  draft.type === 'gauge'
                                    ? gaugeOptions
                                    : draft.type === 'scatter'
                                      ? metricOptions
                                      : dimOptions;
                                if (options.length === 0) return null;
                                if (i >= Math.max(arity.min, draft.dimensionKeys.length, i === 0 ? 1 : 0) && i > 0) {
                                  if (draft.dimensionKeys.length < i) return null;
                                }
                                return (
                                  <Select
                                    key={i}
                                    label={arity.max > 1 ? `Field ${i + 1}` : 'Data field'}
                                    hideLabel={arity.max === 1}
                                    value={draft.dimensionKeys[i] ?? options[0]?.value ?? ''}
                                    options={options}
                                    onChange={(e) => {
                                      const next = e.target.value;
                                      setDraft((prev) => {
                                        if (!prev) return prev;
                                        const keys = [...prev.dimensionKeys];
                                        keys[i] = next;
                                        const label = fieldLabel(dataSource, prev.type, keys[0] ?? next);
                                        return {
                                          ...prev,
                                          dimensionKeys: keys,
                                          title: prev.titleEdited ? prev.title : autoTitle(prev.type, label),
                                        };
                                      });
                                    }}
                                  />
                                );
                              })}
                            </div>
                          ) : null}

                          {draft.type === 'reporting-table' ? (
                            <div className="flex flex-col gap-4">
                              <Select
                                label="Group By (primary)"
                                value={draft.reporting.groupBy[0] ?? dimOptions[0]?.value ?? ''}
                                options={dimOptions}
                                onChange={(e) =>
                                  setDraft((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          reporting: {
                                            ...prev.reporting,
                                            groupBy: [e.target.value, prev.reporting.groupBy[1]].filter(
                                              (k): k is string => Boolean(k),
                                            ),
                                          },
                                        }
                                      : prev,
                                  )
                                }
                              />
                              <Select
                                label="Group By (secondary)"
                                value={draft.reporting.groupBy[1] ?? ''}
                                options={[{ value: '', label: 'None' }, ...dimOptions]}
                                onChange={(e) =>
                                  setDraft((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          reporting: {
                                            ...prev.reporting,
                                            groupBy: e.target.value
                                              ? [prev.reporting.groupBy[0] ?? dimOptions[0]?.value ?? '', e.target.value]
                                              : [prev.reporting.groupBy[0] ?? dimOptions[0]?.value ?? ''],
                                          },
                                        }
                                      : prev,
                                  )
                                }
                              />
                              <FieldChecklist
                                label="Columns to show"
                                options={allFieldOptions}
                                selected={draft.reporting.columns}
                                onChange={(columns) =>
                                  setDraft((prev) =>
                                    prev ? { ...prev, reporting: { ...prev.reporting, columns } } : prev,
                                  )
                                }
                              />
                              <FieldChecklist
                                label="Aggregatable columns"
                                options={numericFieldOptions.length ? numericFieldOptions : allFieldOptions}
                                selected={draft.reporting.aggregatableColumns}
                                onChange={(aggregatableColumns) =>
                                  setDraft((prev) =>
                                    prev ? { ...prev, reporting: { ...prev.reporting, aggregatableColumns } } : prev,
                                  )
                                }
                              />
                              <FieldChecklist
                                label="Expandable detail fields"
                                options={allFieldOptions}
                                selected={draft.reporting.expandableFields}
                                onChange={(expandableFields) =>
                                  setDraft((prev) =>
                                    prev ? { ...prev, reporting: { ...prev.reporting, expandableFields } } : prev,
                                  )
                                }
                              />
                            </div>
                          ) : null}

                          {draft.type === 'kpi' ? (
                            <SegmentedControl<KpiMode>
                              label="KPI mode"
                              value={draft.kpiMode}
                              options={[
                                { value: 'count', label: 'Count' },
                                { value: 'top', label: 'Top value' },
                                { value: 'rate', label: 'Rate' },
                              ]}
                              onChange={(kpiMode) =>
                                setDraft((prev) => (prev ? { ...prev, kpiMode } : prev))
                              }
                            />
                          ) : null}

                          {draft.type === 'div' ? (
                            <SegmentedControl<string>
                              label="Height"
                              value={String(draft.spacerHeight)}
                              options={[
                                { value: '48', label: 'Small' },
                                { value: '64', label: 'Medium' },
                                { value: '128', label: 'Large' },
                              ]}
                              onChange={(v) =>
                                setDraft((prev) =>
                                  prev ? { ...prev, spacerHeight: Number(v) } : prev,
                                )
                              }
                            />
                          ) : null}

                          <label className="flex min-w-0 flex-col gap-1.5">
                            <span className="text-xs font-semibold uppercase tracking-wider text-content-tertiary">
                              Block title
                            </span>
                            <input
                              value={draft.title}
                              onChange={(e) =>
                                setDraft((prev) =>
                                  prev ? { ...prev, title: e.target.value, titleEdited: true } : prev,
                                )
                              }
                              className={cn(
                                'h-10 w-full rounded-lg border border-strong bg-white px-3',
                                'text-sm font-normal text-content-primary',
                                'focus:border-brand outline-none',
                              )}
                            />
                          </label>

                          <div className="flex flex-col gap-4">
                            <p className="text-sm font-semibold text-content-primary">
                              Container Title Settings
                            </p>
                            <SegmentedControl<TitleSize>
                              label="Title size"
                              value={draft.titleSettings.size}
                              options={[
                                { value: 'small', label: 'Small' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'large', label: 'Large' },
                              ]}
                              onChange={(size) =>
                                setDraft((prev) =>
                                  prev
                                    ? { ...prev, titleSettings: { ...prev.titleSettings, size } }
                                    : prev,
                                )
                              }
                            />
                            <SegmentedControl<TitleWeight>
                              label="Title style"
                              value={draft.titleSettings.weight}
                              options={[
                                { value: 'regular', label: 'Regular' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'semibold', label: 'Semibold' },
                                { value: 'bold', label: 'Bold' },
                              ]}
                              onChange={(weight) =>
                                setDraft((prev) =>
                                  prev
                                    ? { ...prev, titleSettings: { ...prev.titleSettings, weight } }
                                    : prev,
                                )
                              }
                            />
                            <SegmentedControl<TitleAlign>
                              label="Title alignment"
                              value={draft.titleSettings.align}
                              options={[
                                { value: 'start', label: 'Start' },
                                { value: 'center', label: 'Center' },
                                { value: 'end', label: 'End' },
                              ]}
                              onChange={(align) =>
                                setDraft((prev) =>
                                  prev
                                    ? { ...prev, titleSettings: { ...prev.titleSettings, align } }
                                    : prev,
                                )
                              }
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <LabeledInput
                              label="Width (cols)"
                              value={String(draft.gridW)}
                              onChange={(v) =>
                                setDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        gridW: Math.max(
                                          BLOCK_MIN_SIZE[prev.type].minW,
                                          Math.min(12, Number(v) || prev.gridW),
                                        ),
                                      }
                                    : prev,
                                )
                              }
                            />
                            <LabeledInput
                              label="Height (rows)"
                              value={String(draft.gridH)}
                              onChange={(v) =>
                                setDraft((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        gridH: Math.max(
                                          BLOCK_MIN_SIZE[prev.type].minH,
                                          Math.min(24, Number(v) || prev.gridH),
                                        ),
                                      }
                                    : prev,
                                )
                              }
                            />
                          </div>
                          {draft.type === 'bar' ||
                          draft.type === 'line' ||
                          draft.type === 'combo' ||
                          draft.type === 'double-bar' ||
                          draft.type === 'stacked-bar' ||
                          draft.type === 'scatter' ? (
                            <div className="grid grid-cols-2 gap-3">
                              <LabeledInput
                                label="X axis label"
                                value={draft.axisX}
                                onChange={(axisX) =>
                                  setDraft((prev) => (prev ? { ...prev, axisX } : prev))
                                }
                              />
                              <LabeledInput
                                label="Y axis label"
                                value={draft.axisY}
                                onChange={(axisY) =>
                                  setDraft((prev) => (prev ? { ...prev, axisY } : prev))
                                }
                              />
                            </div>
                          ) : null}

                          <div className="flex items-center gap-2 pt-1">
                            <Button variant="primary" onClick={addToList}>
                              {editId ? 'Save Changes' : 'Add to List'}
                            </Button>
                            <Button variant="ghost" onClick={() => setStep(1)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

      <ConfirmDialog
        open={confirmClear}
        title="Remove all custom blocks?"
        message={`Remove all ${blockCount} custom blocks? This can't be undone.`}
        confirmLabel="Remove All"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          onClearAll();
          setConfirmClear(false);
        }}
      />
    </>
  );
}
