import { useState } from 'react';
import { MoreVertical, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { StatusPill } from '@/components/ui/StatusPill';
import { ConfirmDialog } from '@/components/dashboard-builder/ConfirmDialog';
import { PublishDialog } from '@/components/dashboard-builder/PublishDialog';
import { CustomDashboardTabs } from '@/layout/CustomDashboardTabs';
import { formatRelativeTime } from '@/lib/format';
import { ROUTES } from '@/lib/routes';
import { useModules } from '@/state/useModules';
import { useTemplates } from '@/state/useTemplates';
import { useToast } from '@/components/ui/Toast';

export function MyTemplates({
  onOpen,
  onNew,
}: {
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const { templates, renameTemplate, duplicateTemplate, deleteTemplate, publishTemplate, unpublishTemplate } =
    useTemplates();
  const { modules, byId, setActiveModule } = useModules();
  const toast = useToast();
  const [menuId, setMenuId] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [publishId, setPublishId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const publishing = publishId ? templates.find((t) => t.id === publishId) : null;

  return (
    <div>
      <CustomDashboardTabs />
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-content-tertiary">My Templates</h2>
        <Button variant="primary" leftIcon={Plus} onClick={onNew}>
          New
        </Button>
      </div>

      {templates.length === 0 ? (
        <p className="mt-8 text-sm text-content-secondary">
          No templates yet. Build a dashboard, then use Save as Template.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => {
            const mod = t.moduleId ? byId(t.moduleId) : undefined;
            return (
              <article key={t.id} className="relative rounded-2xl border border-hairline bg-paper p-5 shadow-sm">
                <div className="absolute right-3 top-3">
                  <IconButton
                    aria-label={`${t.name} actions`}
                    onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                  >
                    <MoreVertical size={16} />
                  </IconButton>
                  {menuId === t.id ? (
                    <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-hairline bg-paper p-1 shadow-md">
                      {t.published ? (
                        <button
                          type="button"
                          className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-sunken"
                          onClick={() => {
                            unpublishTemplate(t.id);
                            toast(`Unpublished “${t.name}”`);
                            setMenuId(null);
                          }}
                        >
                          Unpublish
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-sunken"
                        onClick={() => {
                          setRenaming(t.id);
                          setMenuId(null);
                        }}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-sunken"
                        onClick={() => {
                          duplicateTemplate(t.id);
                          toast(`Duplicated “${t.name}”`);
                          setMenuId(null);
                        }}
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        className="block w-full rounded-md px-2 py-2 text-left text-sm text-status-error hover:bg-sunken"
                        onClick={() => {
                          setPendingDelete({ id: t.id, name: t.name });
                          setMenuId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
                {renaming === t.id ? (
                  <input
                    autoFocus
                    defaultValue={t.name}
                    className="h-10 w-full rounded-md border border-brand bg-white px-3 pr-10 text-lg font-semibold outline-none"
                    onBlur={(e) => {
                      renameTemplate(t.id, e.target.value.trim() || t.name);
                      setRenaming(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      if (e.key === 'Escape') setRenaming(null);
                    }}
                  />
                ) : (
                  <h3 className="pr-10 text-lg font-semibold text-content-primary">{t.name}</h3>
                )}
                <p className="mt-2 text-sm text-content-secondary">
                  {t.blocks.length} block{t.blocks.length === 1 ? '' : 's'}
                </p>
                <p className="mt-1 text-xs text-content-tertiary">Edited {formatRelativeTime(t.updatedAt)}</p>
                {t.published ? (
                  <div className="mt-3">
                    <StatusPill label={mod ? `Published · ${mod.name}` : 'Published'} tone="success" />
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-content-tertiary">Not published</p>
                )}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <Button variant="secondary" onClick={() => onOpen(t.id)}>
                    Open
                  </Button>
                  {t.published ? null : (
                    <Button
                      variant="primary"
                      onClick={() => setPublishId(t.id)}
                    >
                      Publish
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PublishDialog
        open={Boolean(publishing)}
        templateName={publishing?.name ?? ''}
        initialModuleId={publishing?.moduleId}
        onCancel={() => setPublishId(null)}
        onPublish={(moduleId) => {
          if (!publishing) return;
          publishTemplate(publishing.id, moduleId);
          setActiveModule(moduleId);
          const name = modules.find((m) => m.id === moduleId)?.name ?? 'sidebar';
          toast(`Published to ${name}`);
          setPublishId(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete template?"
        message={`This deletes “${pendingDelete?.name}” permanently. This can't be undone.`}
        confirmLabel="Delete"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteTemplate(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

export function MyTemplatesGallery() {
  const navigate = useNavigate();
  return (
    <MyTemplates
      onOpen={(id) => navigate(`/dashboard/${id}`)}
      onNew={() => navigate(ROUTES.customDashboard)}
    />
  );
}
