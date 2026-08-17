import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, Plus, Save } from 'lucide-react';
import { autoArrange } from '@/components/dashboard-builder/autoArrange';
import { BLOCK_MIN_SIZE, type DashboardBlock } from '@/components/dashboard-builder/types';
import { Button } from '@/components/ui/Button';
import { useCustomDashboardDataSource } from '@/state/useCustomDashboardDataSource';
import { useDashboardFilterState } from '@/state/useDashboardFilterState';
import { cloneDashboard } from '../audit/dashboardGovernance';
import { logAuditEntry } from '../audit/useAuditLog';
import { PromotionControls } from '../audit/PromotionControls';
import { useDashboardGovernance } from '../audit/useDashboardGovernance';
import { VersionHistoryPanel } from '../audit/VersionHistoryPanel';
import { useEnterpriseSession } from '../auth/useEnterpriseSession';
import { captureFilters, readLineageStore, recordLineageBlock } from '../lineage/useLineage';
import { SemanticMetricPicker } from '../semantic-layer/SemanticMetricPicker';
import { useSemanticLayer } from '../semantic-layer/useSemanticLayer';
import type { BlockSemanticBinding } from '../semantic-layer/types';
import { EnterpriseBuilderDrawer } from './EnterpriseBuilderDrawer';
import { EnterpriseDashboardGrid } from './EnterpriseDashboardGrid';
import { useEnterpriseCanvas } from './useEnterpriseCanvas';

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `ent-${Date.now()}`;
}

export function EnterpriseDashboardBuilder() {
  const { dataSource } = useCustomDashboardDataSource();
  const { user } = useEnterpriseSession();
  const actor = user?.email ?? 'unknown';
  const { dashboard, addBlocks, updateBlock, removeBlock, setLayout, setName, replace } =
    useEnterpriseCanvas();
  const { status, versions, appendVersion, setStatus } = useDashboardGovernance(dashboard.id);
  const { catalog, approvedMeasures, approvedDimensions, setBinding } = useSemanticLayer();
  const filters = useDashboardFilterState();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<DashboardBlock | null>(null);
  const addRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const widgetCount = dashboard.blocks.length;
  const published = status === 'published';

  useEffect(() => {
    const store = readLineageStore();
    for (const b of dashboard.blocks) {
      if (store.blocks[b.id]) continue;
      const binding = catalog.bindings[b.id];
      recordLineageBlock(b.id, binding?.measureId ?? null, b.dimensionKey || null, { entries: [] });
    }
  }, [dashboard.blocks, catalog.bindings]);

  const saveVersion = (changeSummary?: string) => {
    const isFirst = versions.length === 0;
    const version = appendVersion(dashboard, actor, changeSummary ? { changeSummary } : undefined);
    logAuditEntry({
      actor,
      action: isFirst ? 'dashboard.created' : 'dashboard.edited',
      targetType: 'dashboard',
      targetId: dashboard.id,
      targetName: dashboard.name,
      details: version.changeSummary,
    });
  };

  const placeBlock = (payload: Omit<DashboardBlock, 'id'>, binding: BlockSemanticBinding | null) => {
    const size = BLOCK_MIN_SIZE[payload.type];
    const id = newId();
    const sized: DashboardBlock = {
      ...payload,
      id,
      sourceId: dataSource?.id,
      layout: {
        i: id,
        x: 0,
        y: Number.NaN,
        w: payload.layout?.w ?? size.w,
        h: payload.layout?.h ?? size.h,
        minW: size.minW,
        minH: size.minH,
      },
    };
    const packed = autoArrange([sized]);
    addBlocks([{ ...sized, layout: packed[0]! }]);
    setBinding(id, binding);
    recordLineageBlock(
      id,
      binding?.measureId ?? null,
      payload.dimensionKey || null,
      captureFilters({
        activeFilter: filters.activeFilter,
        drillFilter: filters.drillFilter,
        slicers: filters.slicers,
      }),
    );
  };

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="truncate text-3xl font-bold text-content-primary">{dashboard.name}</h1>
          </div>
          <p className="mt-1 text-sm text-content-secondary">
            {widgetCount} widget{widgetCount === 1 ? '' : 's'}
            {dataSource?.label ? ` · Data from ${dataSource.label}` : ' · Upload a file in Custom Dashboard to bind charts'}
            {published ? ' · Published — revert to draft to edit' : ''}
          </p>
          <div className="mt-2">
            <SemanticMetricPicker measures={approvedMeasures} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <PromotionControls
            status={status}
            onSubmit={() => {
              appendVersion(dashboard, actor, {
                status: 'in-review',
                changeSummary: 'Submitted for review',
              });
              logAuditEntry({
                actor,
                action: 'dashboard.submitted',
                targetType: 'dashboard',
                targetId: dashboard.id,
                targetName: dashboard.name,
                details: 'Submitted for review',
              });
            }}
            onApprovePublish={() => {
              appendVersion(dashboard, actor, {
                status: 'published',
                changeSummary: 'Approved and published',
              });
              logAuditEntry({
                actor,
                action: 'dashboard.published',
                targetType: 'dashboard',
                targetId: dashboard.id,
                targetName: dashboard.name,
                details: 'Approved and published (single-admin workflow)',
              });
            }}
            onRevert={() => {
              setStatus('draft');
              logAuditEntry({
                actor,
                action: 'dashboard.edited',
                targetType: 'dashboard',
                targetId: dashboard.id,
                targetName: dashboard.name,
                details: 'Reverted to draft',
              });
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              leftIcon={Save}
              onClick={() => saveVersion()}
              disabled={published}
            >
              Save
            </Button>
            <Button
              ref={addRef}
              variant="primary"
              leftIcon={Plus}
              onClick={() => {
                triggerRef.current = addRef.current;
                setEditingBlock(null);
                setDrawerOpen(true);
              }}
              disabled={!dataSource || published}
            >
              Add block
            </Button>
          </div>
        </div>
      </div>

      <div className="relative mt-6">
        {widgetCount === 0 ? (
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-strong px-8 py-10">
            <div className="flex flex-col items-center px-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-tint text-brand-text">
                <LayoutDashboard size={28} strokeWidth={1.5} />
              </span>
              <p className="mt-6 text-lg font-semibold text-content-primary">Isolated Enterprise canvas</p>
              <p className="mt-2 max-w-md text-sm text-content-secondary">
                Bind blocks to approved semantic measures so the definition stays in one place.
                {!dataSource ? (
                  <>
                    {' '}
                    <Link to="/builder" className="font-medium text-brand-text">
                      Upload data in Custom Dashboard
                    </Link>{' '}
                    first, then return.
                  </>
                ) : null}
              </p>
              {dataSource && !published ? (
                <Button
                  variant="primary"
                  className="mt-4"
                  onClick={() => {
                    triggerRef.current = addRef.current;
                    setDrawerOpen(true);
                  }}
                >
                  Build this page
                </Button>
              ) : null}
            </div>
          </div>
        ) : (
          <EnterpriseDashboardGrid
            blocks={dashboard.blocks}
            layout={dashboard.layout}
            dataSource={dataSource}
            dashboardName={dashboard.name}
            catalog={catalog}
            mode={published ? 'view' : 'edit'}
            onLayoutChange={published ? () => undefined : setLayout}
            onEdit={(id) => {
              if (published) return;
              setEditingBlock(dashboard.blocks.find((b) => b.id === id) ?? null);
              setDrawerOpen(true);
            }}
            onRemove={(id) => {
              if (published) return;
              setBinding(id, null);
              removeBlock(id);
            }}
          />
        )}
      </div>

      <div className="mt-8">
        <VersionHistoryPanel
          dashboardName={dashboard.name}
          versions={versions}
          onRestore={(version) => {
            replace(cloneDashboard(version.snapshot));
            setStatus('draft');
            logAuditEntry({
              actor,
              action: 'dashboard.restored',
              targetType: 'dashboard',
              targetId: dashboard.id,
              targetName: dashboard.name,
              details: `Restored v${version.version} into current draft`,
            });
          }}
        />
      </div>

      {dataSource && !published ? (
        <EnterpriseBuilderDrawer
          open={drawerOpen}
          onClose={() => {
            setDrawerOpen(false);
            setEditingBlock(null);
          }}
          triggerRef={triggerRef}
          dataSource={dataSource}
          approvedMeasures={approvedMeasures}
          approvedDimensions={approvedDimensions}
          editingBlock={editingBlock}
          editingBinding={editingBlock ? catalog.bindings[editingBlock.id] : undefined}
          blockCount={widgetCount}
          onClearAll={() => {
            for (const b of dashboard.blocks) setBinding(b.id, null);
            replace({ ...dashboard, blocks: [], layout: [] });
            setName(dashboard.name);
          }}
          onAdd={placeBlock}
          onUpdate={(id, patch, binding) => {
            updateBlock(id, patch);
            setBinding(id, binding);
            recordLineageBlock(
              id,
              binding?.measureId ?? null,
              patch.dimensionKey ?? null,
              captureFilters({
                activeFilter: filters.activeFilter,
                drillFilter: filters.drillFilter,
                slicers: filters.slicers,
              }),
            );
          }}
        />
      ) : null}
    </div>
  );
}
