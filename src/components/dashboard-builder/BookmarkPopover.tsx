import { useEffect, useRef, useState } from 'react';
import { Bookmark, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Bookmark as BookmarkRecord } from '@/state/useDashboardFilterState';

export function BookmarkPopover({
  bookmarks,
  onAdd,
  onApply,
}: {
  bookmarks: BookmarkRecord[];
  onAdd: (name: string) => void;
  onApply: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="secondary" leftIcon={Bookmark} onClick={() => setOpen((v) => !v)}>
        Bookmark
      </Button>
      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-hairline bg-paper p-4 shadow-md">
          <h4 className="mb-3 text-base font-semibold text-content-primary">Bookmarks</h4>
          {bookmarks.length === 0 ? (
            <p className="mb-3 text-sm text-content-secondary">
              No bookmarks yet — capture the current filters as a named view.
            </p>
          ) : (
            <ul className="mb-3 flex flex-col gap-1">
              {bookmarks.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-sunken"
                    onClick={() => {
                      onApply(b.id);
                      setOpen(false);
                    }}
                  >
                    {b.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Bookmark name"
            className="mb-2 h-10 w-full rounded-md border border-strong bg-white px-3 text-sm outline-none focus:border-brand"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) {
                onAdd(name.trim());
                setName('');
              }
            }}
          />
          <Button
            variant="primary"
            className="w-full"
            leftIcon={Plus}
            disabled={!name.trim()}
            onClick={() => {
              if (!name.trim()) return;
              onAdd(name.trim());
              setName('');
            }}
          >
            Add Bookmark
          </Button>
        </div>
      ) : null}
    </div>
  );
}
