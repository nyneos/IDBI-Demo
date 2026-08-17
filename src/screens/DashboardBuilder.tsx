import { useRef, useState } from 'react';
import {
  ChevronDown,
  Download,
  FileText,
  LayoutDashboard,
  Move,
  Pencil,
  Presentation,
  RefreshCw,
  RotateCcw,
  Route,
  Save,
  Table,
  ArrowLeft,
} from 'lucide-react';
import { autoArrange } from '@/components/dashboard-builder/autoArrange';
import { BookmarkPopover } from '@/components/dashboard-builder/BookmarkPopover';
import { BuilderDrawer } from '@/components/dashboard-builder/BuilderDrawer';
import { DrillableNavigationWizard } from '@/components/dashboard-builder/DrillableNavigationWizard';
import { ConfirmDialog } from '@/components/dashboard-builder/ConfirmDialog';
import { EnableDrillThroughDialog } from '@/components/dashboard-builder/EnableDrillThroughDialog';
import { DashboardGrid } from '@/components/dashboard-builder/DashboardGrid';
import { BLOCK_MIN_SIZE, type DashboardBlock, type DashboardState } from '@/components/dashboard-builder/types';
import { Button } from '@/components/ui/Button';
import { DropdownItem, DropdownMenu } from '@/components/ui/DropdownMenu';
import { useToast } from '@/components/ui/Toast';
import { CustomDashboardTabs } from '@/layout/CustomDashboardTabs';
import { exportBlockDataToExcel } from '@/lib/exportExcel';
import { exportSectionToPdf } from '@/lib/exportPdf';
import { exportDashboardToPptx } from '@/lib/exportPptx';
import { useLocation, useNavigate } from 'react-router-dom';
import { emptyDashboard, useDashboardState } from '@/state/useDashboardState';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { useDashboardFilterState } from '@/state/useDashboardFilterState';
import { useTemplates } from '@/state/useTemplates';
import { oneD } from '@/components/dashboard-builder/blockData';
import { UploadStep } from '@/screens/UploadStep';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `blk-${Date.now()}`;
}

export function DashboardWorkspace({
  initial,
  templateMode = false,
}: {
  initial?: DashboardState | null;
  templateMode?: boolean;
}) {
  const { dashboard, addBlocks, updateBlock, removeBlock, setLayout, setName, replace, markSaved } =
    useDashboardState(initial ?? null, !templateMode);
  const { dataSource: source, setDataSource, clearDataSource } = useCustomDashboardDataSource();
  const { saveAsTemplate, updateTemplate, templates } = useTemplates();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const drillFrom = (location.state as { parentPath?: string; parentTitle?: string } | null) ?? {};
  const { activeFilter, clearFilter, drillFilter, setDrillFilter, setSlicer, clearSlicers, bookmarks, addBookmark, applyBookmark } =
    useDashboardFilterState();
  const [editing, setEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<DashboardBlock | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [relocateOpen, setRelocateOpen] = useState(false);
  const [naming, setNaming] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [drillBlockId, setDrillBlockId] = useState<string | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const widgetCount = dashboard.blocks.length;
  const pageTitle = dashboard.name?.trim() || 'New Dashboard';
  const usable = source?.dimensions.length ?? 0;
  const excluded = source?.excludedCount ?? 0;
  const status: 'draft' | 'viewing' | 'editing' = !dashboard.isTemplate
    ? 'draft'
    : editing
      ? 'editing'
      : 'viewing';

  const linkDrillAndOpen = (
    sourceBlock: DashboardBlock,
    extras: Omit<DashboardBlock, 'id'>[],
    manual: boolean,
  ) => {
    const field = sourceBlock.dimensionKeys?.[0] || sourceBlock.dimensionKey;
    const sized = extras.map((b) => {
      const id = newId();
      const size = BLOCK_MIN_SIZE[b.type];
      return {
        ...b,
        id,
        sourceId: source?.id,
        includeInCrossFilter: b.includeInCrossFilter ?? true,
        layout: {
          i: id,
          x: 0,
          y: 0,
          w: b.layout?.w ?? size.w,
          h: b.layout?.h ?? size.h,
          minW: size.minW,
          minH: size.minH,
        },
      };
    });
    const packed = sized.length ? autoArrange(sized) : [];
    const withLayout = sized.map((b, i) => ({ ...b, layout: packed[i] ?? b.layout }));
    const targetName = `${sourceBlock.title} · Drill-down`;
    const targetId = saveAsTemplate({
      id: newId(),
      name: targetName,
      blocks: withLayout,
      layout: withLayout.map((b) => b.layout!),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isTemplate: true,
      isDrillThroughTarget: true,
      drillThroughFields: field ? [field] : [],
      parentDashboardId: dashboard.id,
      parentChartTitle: sourceBlock.title,
    });
    const drillPatch = {
      enableDrillThrough: true as const,
      drillThroughTargetId: targetId,
      drillThroughSourceField: field,
      drillThroughTargetField: field,
    };
    const patchedParent = {
      ...dashboard,
      blocks: dashboard.blocks.map((b) => (b.id === sourceBlock.id ? { ...b, ...drillPatch } : b)),
      updatedAt: Date.now(),
    };
    replace(patchedParent);
    if (dashboard.isTemplate || templateMode) {
      updateTemplate({ ...patchedParent, isTemplate: true });
    } else {
      localStorage.setItem('datacanvas.scratch', JSON.stringify(patchedParent));
    }
    toast(manual ? `Opened an empty drill-down for “${sourceBlock.title}”` : `Added a drillable dashboard for “${sourceBlock.title}”`);
    navigate(`/dashboard/${targetId}`, {
      state: {
        parentPath: location.pathname,
        parentTitle: sourceBlock.title,
      },
    });
  };

  const persistTemplate = (name: string) => {
    const id = saveAsTemplate({ ...dashboard, name, isTemplate: true });
    replace({
      ...dashboard,
      id,
      name,
      isTemplate: true,
      updatedAt: Date.now(),
    });
    markSaved();
    toast(`Saved as “${name}”`);
  };

  const handleSaveDashboard = () => {
    if (dashboard.isTemplate) {
      updateTemplate(dashboard);
      markSaved();
      setEditing(false);
      setDrawerOpen(false);
      toast('Dashboard saved');
      return;
    }
    const name = dashboard.name.trim();
    const unnamed = !name || name === 'New Dashboard' || name === 'Untitled Dashboard';
    if (unnamed) {
      setNaming(true);
      return;
    }
    persistTemplate(name);
  };

  const relative = (() => {
    const mins = Math.round((Date.now() - dashboard.updatedAt) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    return `${hrs}h ago`;
  })();

  const exportPdf = async () => {
    if (!canvasRef.current) return;
    await exportSectionToPdf(canvasRef.current, { title: pageTitle });
  };
  const exportPptx = async () => {
    if (!canvasRef.current) return;
    await exportDashboardToPptx(dashboard, canvasRef.current);
  };
  const exportXlsx = () => {
    if (!source) return;
    for (const block of dashboard.blocks) {
      exportBlockDataToExcel(block, oneD(source, block.dimensionKey));
    }
    if (dashboard.blocks.length === 0) toast('Add a block before exporting Excel');
  };

  if (!source && !templateMode) {
    return (
      <div>
        <CustomDashboardTabs />
        <UploadStep onAnalyzed={setDataSource} />
      </div>
    );
  }

  const parentLabel = drillFrom.parentTitle || dashboard.parentChartTitle || 'parent chart';
  const isChildView = Boolean(dashboard.isDrillThroughTarget || drillFrom.parentPath || dashboard.parentDashboardId);

  const goToParent = () => {
    clearFilter();
    setDrillFilter(null);
    clearSlicers();
    if (drillFrom.parentPath) {
      navigate(drillFrom.parentPath);
      return;
    }
    if (dashboard.parentDashboardId && dashboard.parentDashboardId !== 'scratch') {
      navigate(`/dashboard/${dashboard.parentDashboardId}`);
      return;
    }
    navigate('/builder');
  };

  return (
    <div className="flex min-h-0 flex-col">
      <CustomDashboardTabs />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          {naming ? (
            <input
              autoFocus
              defaultValue={dashboard.name === 'New Dashboard' || dashboard.name === 'Untitled Dashboard' ? '' : dashboard.name}
              placeholder="Template name"
              className="h-12 rounded-md border border-brand bg-white px-3 text-3xl font-bold outline-none"
              onBlur={(e) => {
                const name = e.target.value.trim();
                setNaming(false);
                if (!name) return;
                setName(name);
                persistTemplate(name);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setNaming(false);
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
            />
          ) : (
            <h1 className="truncate text-3xl font-bold text-content-primary">{pageTitle}</h1>
          )}
          <p className="mt-1 text-sm text-content-secondary">
            {widgetCount} widget{widgetCount === 1 ? '' : 's'}
            {source?.label ? ` · Data from ${source.label}` : ''}
            {templateMode ? ` · Last edited ${relative}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {status === 'draft' || status === 'editing' ? (
            <Button variant="primary" leftIcon={Save} onClick={handleSaveDashboard}>
              Save Dashboard
            </Button>
          ) : null}
          {status === 'viewing' ? (
            <Button
              variant="primary"
              leftIcon={Pencil}
              onClick={() => {
                setEditingBlock(null);
                setEditing(true);
                setDrawerOpen(true);
              }}
            >
              Edit dashboard
            </Button>
          ) : null}
          {status === 'editing' ? (
            <>
              <div className="relative">
                <Button variant="secondary" leftIcon={Move} onClick={() => setRelocateOpen((v) => !v)}>
                  Relocate
                </Button>
                {relocateOpen ? (
                  <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-hairline bg-paper p-4 shadow-md">
                    <label className="text-sm font-medium">
                      Name
                      <input
                        className="mt-1 h-10 w-full rounded-md border border-hairline bg-white px-3 text-sm outline-none"
                        value={dashboard.name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setLayout(autoArrange(dashboard.blocks));
                        setRelocateOpen(false);
                        toast('Layout compacted');
                      }}
                    >
                      Auto-arrange
                    </Button>
                  </div>
                ) : null}
              </div>
              <Button variant="secondary" leftIcon={Route} onClick={() => setNavOpen(true)}>
                Drillable Navigation
              </Button>
            </>
          ) : null}
          {status === 'viewing' || status === 'draft' ? (
            <Button variant="secondary" leftIcon={Route} onClick={() => setNavOpen(true)}>
              Drillable Navigation
            </Button>
          ) : null}
          {source && (status === 'draft' || status === 'editing') ? (
            <>
              <Button variant="secondary" leftIcon={RefreshCw} onClick={() => setConfirmReplace(true)}>
                Replace Data Source
              </Button>
              <Button variant="ghost" leftIcon={RotateCcw} onClick={() => setConfirmReset(true)}>
                Reset Data
              </Button>
            </>
          ) : null}
          <BookmarkPopover
            bookmarks={bookmarks.filter((b) => b.dashboardId === dashboard.id)}
            onAdd={(name) => {
              addBookmark(name, dashboard.id);
              toast(`Saved bookmark “${name}”`);
            }}
            onApply={(id) => applyBookmark(id)}
          />
          {status === 'viewing' ? (
            <DropdownMenu
              open={exportOpen}
              onClose={() => setExportOpen(false)}
              trigger={
                <Button variant="secondary" leftIcon={Download} onClick={() => setExportOpen((v) => !v)}>
                  Export
                  <ChevronDown size={14} strokeWidth={1.75} aria-hidden />
                </Button>
              }
            >
              <DropdownItem
                icon={FileText}
                onClick={() => {
                  setExportOpen(false);
                  void exportPdf();
                }}
              >
                Export as PDF
              </DropdownItem>
              <DropdownItem
                icon={Presentation}
                onClick={() => {
                  setExportOpen(false);
                  void exportPptx();
                }}
              >
                Export as PowerPoint
              </DropdownItem>
              <DropdownItem
                icon={Table}
                onClick={() => {
                  setExportOpen(false);
                  exportXlsx();
                }}
              >
                Export as Excel
              </DropdownItem>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {source ? (
        <div className="mt-4 rounded-xl border border-hairline bg-paper px-4 py-3">
          <p className="text-sm font-semibold text-content-primary">Analyzed {source.label}</p>
          <p className="mt-1 text-sm text-content-secondary">
            {source.recordCount} records · {usable} usable columns detected
            {excluded > 0 ? ` (${excluded} excluded — empty or unique-ID columns)` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {source.dimensions.map((d) => (
              <span
                key={d.key}
                className="rounded-full bg-sunken px-2.5 py-1 text-xs font-medium text-content-secondary"
              >
                {d.label}
                {typeof d.cardinality === 'number' ? ` (${d.cardinality})` : ''}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {isChildView ? (
        <div className="mt-4">
          <Button variant="secondary" leftIcon={ArrowLeft} onClick={goToParent}>
            Back to {parentLabel}
          </Button>
        </div>
      ) : null}

      {(activeFilter || drillFilter) && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-brand-tint px-3 py-1 text-sm text-brand-text">
          Filtered by: {(activeFilter ?? drillFilter)?.field} = {(activeFilter ?? drillFilter)?.value}
          <button
            type="button"
            className="font-semibold"
            onClick={() => {
              clearFilter();
              if (drillFilter) setSlicer(drillFilter.sourceBlockId, drillFilter.field, []);
              setDrillFilter(null);
              clearSlicers();
            }}
          >
            ×
          </button>
        </div>
      )}

      <div ref={canvasRef} className={widgetCount === 0 ? 'relative mt-6' : 'relative mt-6 min-h-0 flex-1 overflow-hidden'}>
        {widgetCount === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-strong px-8 py-10">
            <div className="flex flex-col items-center px-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-tint text-brand-text">
                <LayoutDashboard size={28} strokeWidth={1.5} />
              </span>
              <p className="mt-6 text-lg font-semibold text-content-primary">
                No custom blocks yet — build your own view of this data.
              </p>
              <Button
                ref={addRef}
                variant="primary"
                className="mt-4"
                onClick={() => {
                  triggerRef.current = addRef.current;
                  setDrawerOpen(true);
                  if (dashboard.isTemplate) setEditing(true);
                }}
              >
                Build this page
              </Button>
            </div>
          </div>
        ) : (
          <DashboardGrid
            blocks={dashboard.blocks}
            layout={dashboard.layout}
            dataSource={source}
            mode={status === 'viewing' ? 'view' : 'edit'}
            onLayoutChange={setLayout}
            onEdit={(id) => {
              setEditingBlock(dashboard.blocks.find((b) => b.id === id) ?? null);
              setDrawerOpen(true);
              if (dashboard.isTemplate) setEditing(true);
            }}
            onRemove={removeBlock}
            onDrillThrough={(id) => setDrillBlockId(id)}
          />
        )}
      </div>

      {source ? (
        <BuilderDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setEditingBlock(null);
          }}
          triggerRef={triggerRef}
          dataSource={source}
          sectionTitle={dashboard.name}
          onSectionTitleChange={setName}
          blockCount={widgetCount}
          onClearAll={() => replace({ ...dashboard, blocks: [], layout: [] })}
          onAddAll={(blocks) => {
            const sized = blocks.map((b) => {
              const size = BLOCK_MIN_SIZE[b.type];
              const id = newId();
              const w = b.layout?.w ?? size.w;
              const h = b.layout?.h ?? size.h;
              return {
                ...b,
                id,
                sourceId: source.id,
                includeInCrossFilter: b.includeInCrossFilter ?? true,
                layout: {
                  i: id,
                  x: 0,
                  y: 0,
                  w,
                  h,
                  minW: size.minW,
                  minH: size.minH,
                },
              };
            });
            const packed = autoArrange(sized);
            addBlocks(sized.map((b, i) => ({ ...b, layout: packed[i]! })));
          }}
          onUpdate={(id, patch) => updateBlock(id, patch)}
          editingBlock={editingBlock}
        />
      ) : null}

      <ConfirmDialog
        open={confirmReplace}
        title="Replace data source?"
        message="Uploading a new file will rebind charts. Blocks whose fields disappear will show empty until you remap them."
        confirmLabel="Replace"
        onCancel={() => setConfirmReplace(false)}
        onConfirm={() => {
          setConfirmReplace(false);
          clearDataSource();
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        title="Reset data?"
        message="This clears the current file so you can upload a new Excel or CSV. Custom blocks on this canvas will also be removed."
        confirmLabel="Reset Data"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          setConfirmReset(false);
          clearDataSource();
          replace(emptyDashboard());
        }}
      />
      <DrillableNavigationWizard
        open={navOpen}
        blocks={dashboard.blocks.filter((b) => b.type !== 'div' && b.type !== 'section-title')}
        dataSource={source}
        onClose={() => setNavOpen(false)}
        onChooseRecommended={(block, extras) => linkDrillAndOpen(block, extras, false)}
        onChooseManual={(block) => linkDrillAndOpen(block, [], true)}
      />
      <EnableDrillThroughDialog
        open={Boolean(drillBlockId)}
        block={dashboard.blocks.find((b) => b.id === drillBlockId) ?? null}
        targets={templates.filter((t) => t.isDrillThroughTarget)}
        onClose={() => setDrillBlockId(null)}
        onConfigureTargets={() => {
          setDrillBlockId(null);
          setNavOpen(true);
        }}
        onEnable={({ targetId, sourceField, targetField }) => {
          if (!drillBlockId) return;
          const drillPatch = {
            enableDrillThrough: true as const,
            drillThroughTargetId: targetId,
            drillThroughSourceField: sourceField,
            drillThroughTargetField: targetField,
          };
          const patched = {
            ...dashboard,
            blocks: dashboard.blocks.map((b) => (b.id === drillBlockId ? { ...b, ...drillPatch } : b)),
            updatedAt: Date.now(),
          };
          replace(patched);
          if (dashboard.isTemplate || templateMode) {
            updateTemplate({ ...patched, isTemplate: true });
          }
          setDrillBlockId(null);
          toast('Drill-through enabled');
        }}
      />
    </div>
  );
}

export function DashboardBuilder() {
  return <DashboardWorkspace />;
}
