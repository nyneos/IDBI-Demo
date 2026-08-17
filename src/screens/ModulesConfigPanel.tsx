import { useState, type ReactNode } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, X } from 'lucide-react';
import { ConfirmDialog } from '@/components/dashboard-builder/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Select } from '@/components/ui/Select';
import { cn } from '@/lib/cn';
import { MODULE_ICON_IDS, moduleIcon, type ModuleIconId } from '@/lib/moduleIcons';
import { useModules } from '@/state/useModules';
import { useTemplates } from '@/state/useTemplates';
import { useToast } from '@/components/ui/Toast';

function IconPicker({
  value,
  onChange,
}: {
  value: ModuleIconId;
  onChange: (id: ModuleIconId) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {MODULE_ICON_IDS.map((id) => {
        const Icon = moduleIcon(id);
        const selected = value === id;
        return (
          <button
            key={id}
            type="button"
            aria-label={id}
            onClick={() => onChange(id)}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg border outline-none',
              selected ? 'border-brand bg-brand-tint text-brand-text' : 'border-hairline text-content-secondary hover:border-strong',
            )}
          >
            <Icon size={18} strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}

function SortableModuleRow({
  id,
  children,
}: {
  id: string;
  children: (handleProps: Record<string, unknown>) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-2 rounded-xl border border-hairline bg-paper px-2 py-2', isDragging && 'z-10 shadow-md')}
    >
      {children({ ...attributes, ...listeners, className: 'cursor-grab touch-none text-content-tertiary outline-none' })}
    </li>
  );
}

export function ModulesConfigPanel({ onClose }: { onClose?: () => void }) {
  const {
    modules,
    maxModules,
    atCap,
    addModule,
    renameModule,
    reorderModules,
    deleteModule,
    setMaxModules,
  } = useModules();
  const { templates, unpublishTemplate } = useTemplates();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftIcon, setDraftIcon] = useState<ModuleIconId>('Home');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string; count: number } | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = modules.map((m) => m.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const next = [...ids];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved!);
    reorderModules(next);
  };

  const publishedCount = (moduleId: string) => templates.filter((t) => t.published && t.moduleId === moduleId).length;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="modules-config-title" className="text-xl font-bold text-content-primary">
            Configure Modules
          </h2>
          <p className="mt-1 text-sm text-content-secondary">Decide which modules appear in your navigation.</p>
        </div>
        {onClose ? (
          <IconButton aria-label="Close" onClick={onClose}>
            <X size={16} strokeWidth={1.75} />
          </IconButton>
        ) : null}
      </div>

      <div className="mt-6">
        <Select
          label="Max modules"
          value={String(maxModules)}
          onChange={(e) => setMaxModules(Number(e.target.value))}
          hint={`currently ${modules.length} of ${maxModules} used`}
          options={Array.from({ length: 20 }, (_, i) => i + 1).map((n) => ({
            value: String(n),
            label: String(n),
          }))}
        />
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <ul className="mt-6 flex flex-col gap-2">
            {modules.map((m) => {
              const Icon = moduleIcon(m.icon);
              return (
                <SortableModuleRow key={m.id} id={m.id}>
                  {(handleProps) => (
                    <>
                      <button type="button" aria-label={`Reorder ${m.name}`} {...handleProps}>
                        <GripVertical size={18} />
                      </button>
                      <span className="flex h-9 w-9 items-center justify-center text-content-secondary">
                        <Icon size={18} strokeWidth={1.75} />
                      </span>
                      {renamingId === m.id ? (
                        <input
                          autoFocus
                          defaultValue={m.name}
                          className="h-10 min-w-0 flex-1 rounded-md border border-brand bg-white px-3 text-sm outline-none"
                          onBlur={(e) => {
                            renameModule(m.id, e.target.value);
                            setRenamingId(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                        />
                      ) : (
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-content-primary">
                          {m.name}
                        </span>
                      )}
                      <Button variant="ghost" onClick={() => setRenamingId(m.id)}>
                        Rename
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() =>
                          setPendingDelete({ id: m.id, name: m.name, count: publishedCount(m.id) })
                        }
                      >
                        Delete
                      </Button>
                    </>
                  )}
                </SortableModuleRow>
              );
            })}
          </ul>
        </SortableContext>
      </DndContext>

      {adding ? (
        <form
          className="mt-4 rounded-xl border border-hairline bg-sunken p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const created = addModule(draftName, draftIcon);
            if (!created) return;
            setDraftName('');
            setDraftIcon('Home');
            setAdding(false);
            toast('Module created');
          }}
        >
          <input
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Module name, e.g. Retail Banking"
            className="h-10 w-full rounded-full border border-strong bg-white px-5 text-sm outline-none focus:border-brand"
          />
          <p className="mt-3 mb-2 text-sm font-medium text-content-primary">Icon</p>
          <IconPicker value={draftIcon} onChange={setDraftIcon} />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={!draftName.trim()}>
              Add
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4">
          <Button
            variant="secondary"
            leftIcon={Plus}
            disabled={atCap}
            onClick={() => setAdding(true)}
          >
            Add Module
          </Button>
          {atCap ? (
            <p className="mt-2 text-sm text-content-secondary">
              Maximum of {maxModules} modules reached — remove one first, or raise the limit above
            </p>
          ) : null}
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this module?"
        message={
          pendingDelete && pendingDelete.count > 0
            ? `“${pendingDelete.name}” has ${pendingDelete.count} published dashboard${pendingDelete.count === 1 ? '' : 's'}. They will return to My Templates as unpublished. The dashboards themselves will not be deleted.`
            : `Delete “${pendingDelete?.name}”? This does not delete any dashboards.`
        }
        confirmLabel="Delete module"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          templates
            .filter((t) => t.moduleId === pendingDelete.id)
            .forEach((t) => unpublishTemplate(t.id));
          deleteModule(pendingDelete.id);
          toast(`Deleted “${pendingDelete.name}”`);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
