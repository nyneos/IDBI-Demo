import { useEffect, useId, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
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
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const placeMenu = () => {
    const el = rootRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCoords({ top: r.bottom + 4, right: window.innerWidth - r.right });
  };

  useLayoutEffect(() => {
    if (!open) return;
    placeMenu();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setConfirming(false);
      return;
    }
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onReposition = () => placeMenu();
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const stopGrid = (e: MouseEvent | PointerEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      ref={rootRef}
      className="block-card-menu relative"
      onMouseDown={stopGrid}
      onPointerDown={stopGrid}
      onClick={stopGrid}
    >
      <IconButton
        aria-label="Block actions"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          setOpen((v) => !v);
          placeMenu();
        }}
      >
        <MoreVertical size={16} strokeWidth={1.75} aria-hidden />
      </IconButton>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              className="fixed z-[80] min-w-40 rounded-lg border border-hairline bg-paper p-1 shadow-md"
              style={{ top: coords.top, right: coords.right }}
              onMouseDown={stopGrid}
              onPointerDown={stopGrid}
              onClick={stopGrid}
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
