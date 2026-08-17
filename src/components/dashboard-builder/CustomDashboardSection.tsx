import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PanelHeader } from '@/components/ui/PanelHeader';
import { EASE, MOTION } from '@/motion/tokens';
import { filterDataSource } from '@/data/buildUploadedDataSource';
import { BuilderDrawer } from './BuilderDrawer';
import { ConfirmDialog } from './ConfirmDialog';
import { CustomBlockCard } from './CustomBlockCard';
import { JustAskDialog, NyneOsMark } from './JustAskDialog';
import {
  BLOCK_SPAN_CLASS,
  type DashboardBlock,
  type DashboardDataSource,
} from './types';
import { useCustomDashboard } from './useCustomDashboard';

function newBlockId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface CustomDashboardSectionProps {
  dataSource: DashboardDataSource;
  addDashboardRef: RefObject<HTMLButtonElement | null>;
  drawerOpen: boolean;
  onDrawerOpenChange: (open: boolean) => void;
  storageKey?: string;
  autosave?: boolean;
  initialState?: { sectionTitle: string; blocks: DashboardBlock[] } | null;
}

export function CustomDashboardSection({
  dataSource,
  addDashboardRef,
  drawerOpen,
  onDrawerOpenChange,
  storageKey,
  autosave,
  initialState,
}: CustomDashboardSectionProps) {
  const { state, addBlocks, updateBlock, removeBlock, clearAll, setSectionTitle } =
    useCustomDashboard(storageKey, { autosave, initial: initialState });
  const [editing, setEditing] = useState<DashboardBlock | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const addBlockRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const localOpen = useRef(false);
  const hydrated = useRef(false);

  useEffect(() => {
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!drawerOpen) return;
    if (localOpen.current) {
      localOpen.current = false;
      return;
    }
    triggerRef.current = addDashboardRef.current;
    setEditing(null);
  }, [drawerOpen, addDashboardRef]);

  const openAtStep1 = useCallback(
    (from: RefObject<HTMLButtonElement | null>) => {
      localOpen.current = true;
      triggerRef.current = from.current;
      setEditing(null);
      onDrawerOpenChange(true);
    },
    [onDrawerOpenChange],
  );

  const openForEdit = useCallback(
    (id: string) => {
      localOpen.current = true;
      const block = state.blocks.find((b) => b.id === id) ?? null;
      triggerRef.current = addBlockRef.current ?? addDashboardRef.current;
      setEditing(block);
      onDrawerOpenChange(true);
    },
    [addDashboardRef, onDrawerOpenChange, state.blocks],
  );

  const filterMap: Record<string, string> = {};
  for (const block of state.blocks) {
    if (block.type !== 'filter') continue;
    const v = filters[block.id];
    if (v && v !== '__all__' && block.dimensionKey) filterMap[block.dimensionKey] = v;
  }
  const viewSource = filterDataSource(dataSource, filterMap);

  return (
    <section className="mt-6" aria-label={state.sectionTitle}>
      {state.blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-hairline">
          <EmptyState
            icon={LayoutDashboard}
            className="py-8 pb-3"
            message="No custom blocks yet — build your own view of this data."
            action={{
              label: 'Build this page',
              onClick: () => openAtStep1(addDashboardRef),
            }}
          />
          <div className="flex justify-center pb-8">
            <Button variant="secondary" onClick={() => setAskOpen(true)}>
              <NyneOsMark />
              Ask NyneOS
            </Button>
          </div>
        </div>
      ) : (
        <>
          <PanelHeader
            title={state.sectionTitle}
            actions={
              <>
                <Button variant="secondary" onClick={() => setAskOpen(true)}>
                  <NyneOsMark />
                  Ask NyneOS
                </Button>
                <Button
                  ref={addBlockRef}
                  variant="secondary"
                  leftIcon={Plus}
                  onClick={() => openAtStep1(addBlockRef)}
                >
                  Add Block
                </Button>
                <Button
                  variant="danger"
                  leftIcon={Trash2}
                  onClick={() => setConfirmClear(true)}
                >
                  Clear
                </Button>
              </>
            }
          />
          <div className="grid grid-cols-12 gap-3">
            <AnimatePresence>
              {state.blocks.map((block) => (
                <motion.div
                  key={block.id}
                  layout
                  className={BLOCK_SPAN_CLASS[block.type]}
                  initial={hydrated.current ? { opacity: 0, y: 12 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: MOTION.base / 1000, ease: EASE.exit } }}
                  transition={{ duration: MOTION.slow / 1000, ease: EASE.enter }}
                  style={
                    block.type === 'div'
                      ? { minHeight: block.spacerHeight ?? 64 }
                      : undefined
                  }
                >
                  <CustomBlockCard
                    block={block}
                    dataSource={viewSource}
                    onEdit={openForEdit}
                    onRemove={removeBlock}
                    filterValue={filters[block.id]}
                    onFilterChange={(value) =>
                      setFilters((prev) => ({ ...prev, [block.id]: value }))
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      <BuilderDrawer
        open={drawerOpen}
        onClose={() => {
          setEditing(null);
          onDrawerOpenChange(false);
        }}
        triggerRef={triggerRef}
        dataSource={dataSource}
        sectionTitle={state.sectionTitle}
        onSectionTitleChange={setSectionTitle}
        blockCount={state.blocks.length}
        onClearAll={clearAll}
        onAddAll={(blocks) => addBlocks(blocks.map((b) => ({ ...b, id: newBlockId() })))}
        onUpdate={(id, patch) => {
          updateBlock(id, patch);
          setEditing(null);
        }}
        editingBlock={editing}
      />

      <JustAskDialog
        open={askOpen}
        dataSource={dataSource}
        onClose={() => setAskOpen(false)}
        onAdd={(payloads) => {
          addBlocks(payloads.map((b) => ({ ...b, id: newBlockId() })));
        }}
      />

      <ConfirmDialog
        open={confirmClear}
        title="Remove all custom blocks?"
        message={`Remove all ${state.blocks.length} custom blocks? This can't be undone.`}
        confirmLabel="Remove All"
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearAll();
          setConfirmClear(false);
        }}
      />
    </section>
  );
}
