import { useEffect, useRef, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export function DropdownMenu({
  open,
  onClose,
  trigger,
  children,
}: {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <div className="relative" ref={ref}>
      {trigger}
      {open ? (
        <div className="absolute right-0 z-30 mt-2 min-w-56 rounded-xl border border-hairline bg-paper p-1 shadow-md">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function DropdownItem({
  icon: Icon,
  onClick,
  children,
}: {
  icon?: LucideIcon;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-content-primary',
        'hover:bg-sunken outline-none',
      )}
      onClick={onClick}
    >
      {Icon ? <Icon size={16} strokeWidth={1.75} className="text-content-secondary" /> : null}
      {children}
    </button>
  );
}
