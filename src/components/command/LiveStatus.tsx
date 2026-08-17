import { memo, useEffect, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RangeCalendar } from '@/components/ui/RangeCalendar';
import { useReducedMotion } from '@/motion/useReducedMotion';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDisplay(from: Date, to: Date): string {
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  const fmt = (d: Date) =>
    `${pad(d.getDate())} ${months[d.getMonth()] ?? ''} ${d.getFullYear()}`;
  const sameDay = from.toDateString() === to.toDateString();
  if (sameDay) {
    let h = to.getHours();
    const m = pad(to.getMinutes());
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${fmt(to)} | ${pad(h)}:${m} ${ampm} IST`;
  }
  return `${fmt(from)} – ${fmt(to)}`;
}

export const LiveTimestamp = memo(function LiveTimestamp({ initial }: { initial: string }) {
  const seed = new Date(initial);
  const [from, setFrom] = useState(() => {
    const d = new Date(seed);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [to, setTo] = useState(seed);
  const [open, setOpen] = useState(false);
  const [tick, setTick] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
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

  const now = new Date();
  const toIsToday = to.toDateString() === now.toDateString();
  const displayTo = toIsToday ? now : to;
  void tick;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'pressable inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-strong bg-transparent px-4 py-2.5',
          'text-sm font-semibold text-content-primary hover:bg-raised',
          'outline-none',
        )}
      >
        <Calendar size={16} strokeWidth={1.75} aria-hidden />
        <span className="tabular">{formatDisplay(from, displayTo)}</span>
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label="Select date range"
          className="absolute right-0 z-30 mt-2 rounded-xl border border-hairline bg-raised p-4 shadow-md"
        >
          <RangeCalendar
            from={from}
            to={to}
            onChange={(nextFrom, nextTo) => {
              setFrom(nextFrom);
              setTo(nextTo);
            }}
          />
        </div>
      ) : null}
    </div>
  );
});

export const LivePulse = memo(function LivePulse() {
  const reduced = useReducedMotion();
  return (
    <div className="flex items-center gap-2" aria-live="polite">
      <span
        className={cn(
          'h-2 w-2 rounded-full bg-status-error',
          !reduced && 'animate-live-dot',
        )}
        aria-hidden
      />
      <span className="text-xs font-bold uppercase tracking-wider text-content-primary">Live</span>
    </div>
  );
});
