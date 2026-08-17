import { useEffect, useId, useRef, useState } from 'react';
import { MoreVertical, Pencil, Route, Trash2 } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { cn } from '@/lib/cn';

interface BlockCardMenuProps {
  onEdit: () => void;
  onRemove: () => void;
  onDrillThrough?: () => void;
  drillThroughEnabled?: boolean;
}

export function BlockCardMenu({ onEdit, onRemove, onDrillThrough, drillThroughEnabled }: BlockCardMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) {
      setConfirming(false);
      return;
    }
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  return (
    <div ref={rootRef} className="relative">
      <IconButton
        aria-label="Block actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        <MoreVertical size={16} strokeWidth={1.75} aria-hidden />
      </IconButton>
      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-40 rounded-lg border border-hairline bg-raised p-1 shadow-md"
        >
          <button
            type="button"
            role="menuitem"
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-content-primary',
              'hover:bg-sunken outline-none',
            )}
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil size={14} strokeWidth={1.75} aria-hidden />
            Edit
          </button>
          {onDrillThrough ? (
            <button
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-content-primary',
                'hover:bg-sunken outline-none',
              )}
              onClick={() => {
                setOpen(false);
                onDrillThrough();
              }}
            >
              <Route size={14} strokeWidth={1.75} aria-hidden />
              {drillThroughEnabled ? 'Edit Drill-Through' : 'Enable Drill-Through'}
            </button>
          ) : null}
          <button
            type="button"
            role="menuitem"
            className={cn(
              'flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm',
              'outline-none',
              confirming
                ? 'bg-status-error/15 font-semibold text-status-error'
                : 'text-status-error hover:bg-sunken',
            )}
            onClick={() => {
              if (!confirming) {
                setConfirming(true);
                return;
              }
              setOpen(false);
              onRemove();
            }}
          >
            <Trash2 size={14} strokeWidth={1.75} aria-hidden />
            {confirming ? 'Confirm remove?' : 'Remove'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
