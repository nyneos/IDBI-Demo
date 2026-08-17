import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './IconButton';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isBetween(day: Date, from: Date, to: Date): boolean {
  const t = day.getTime();
  return t > from.getTime() && t < to.getTime();
}

export interface RangeCalendarProps {
  from: Date;
  to: Date;
  onChange: (from: Date, to: Date) => void;
}

export function RangeCalendar({ from, to, onChange }: RangeCalendarProps) {
  const [view, setView] = useState(() => new Date(from.getFullYear(), from.getMonth(), 1));
  const [anchor, setAnchor] = useState<Date | null>(null);

  const cells = useMemo(() => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1);
    const lead = first.getDay();
    const count = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    const days: Array<{ date: Date; current: boolean }> = [];
    for (let i = 0; i < lead; i += 1) {
      const d = new Date(view.getFullYear(), view.getMonth(), i - lead + 1);
      days.push({ date: d, current: false });
    }
    for (let i = 1; i <= count; i += 1) {
      days.push({ date: new Date(view.getFullYear(), view.getMonth(), i), current: true });
    }
    while (days.length % 7 !== 0) {
      const last = days[days.length - 1]!.date;
      days.push({
        date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
        current: false,
      });
    }
    return days;
  }, [view]);

  const rangeStart = anchor ?? startOfDay(from);
  const rangeEnd = anchor ?? startOfDay(to);
  const lo = rangeStart.getTime() <= rangeEnd.getTime() ? rangeStart : rangeEnd;
  const hi = rangeStart.getTime() <= rangeEnd.getTime() ? rangeEnd : rangeStart;

  const pick = (day: Date) => {
    const next = startOfDay(day);
    if (!anchor) {
      setAnchor(next);
      onChange(next, next);
      return;
    }
    const a = startOfDay(anchor);
    const start = next.getTime() <= a.getTime() ? next : a;
    const end = next.getTime() <= a.getTime() ? a : next;
    end.setHours(23, 59, 0, 0);
    onChange(start, end);
    setAnchor(null);
  };

  return (
    <div className="w-[280px]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <IconButton
          aria-label="Previous month"
          onClick={() =>
            setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))
          }
        >
          <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
        </IconButton>
        <p className="text-sm font-semibold text-content-primary">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </p>
        <IconButton
          aria-label="Next month"
          onClick={() =>
            setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))
          }
        >
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
        </IconButton>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="py-1 text-xs font-semibold uppercase tracking-wider text-content-tertiary"
          >
            {d}
          </span>
        ))}
        {cells.map(({ date, current }) => {
          const selectedStart = isSameDay(date, lo);
          const selectedEnd = isSameDay(date, hi);
          const selected = selectedStart || selectedEnd;
          const inRange = isBetween(date, lo, hi);
          return (
            <button
              key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${current ? 'c' : 'x'}`}
              type="button"
              onClick={() => pick(date)}
              className={cn(
                'relative h-8 text-xs tabular',
                'outline-none',
                !current && 'text-content-tertiary/60',
                current && !selected && 'text-content-primary hover:bg-raised',
                inRange && 'bg-brand-tint text-content-primary',
                selected && 'bg-brand font-semibold text-white',
                selectedStart && hi.getTime() !== lo.getTime() && 'rounded-l-md',
                selectedEnd && hi.getTime() !== lo.getTime() && 'rounded-r-md',
                selected && hi.getTime() === lo.getTime() && 'rounded-md',
                !selected && !inRange && 'rounded-md',
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-content-secondary">
        {anchor
          ? 'Select the end date'
          : 'Select a start date, then an end date'}
      </p>
    </div>
  );
}
