import { useEffect, useState } from 'react';
import {
  BarChart3,
  Columns3,
  FileSearch,
  PieChart,
  ScanSearch,
  Sparkles,
  Table2,
  type LucideIcon,
} from 'lucide-react';

const ICONS: LucideIcon[] = [FileSearch, Columns3, ScanSearch, BarChart3, PieChart, Table2, Sparkles];

const LINES = [
  { title: 'Reading your file', sub: 'Opening sheets and checking encoding…' },
  { title: 'Detecting columns', sub: 'Mapping headers to usable fields…' },
  { title: 'Profiling data types', sub: 'Separating categories, dates, and amounts…' },
  { title: 'Finding patterns', sub: 'Looking for hierarchies and clean groupings…' },
  { title: 'Scoring chart ideas', sub: 'Matching fields to bars, pies, and reports…' },
  { title: 'Preparing your canvas', sub: 'Almost ready — assembling the data source…' },
];

export function AnalyzeOverlay({ progress }: { progress: number }) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 900);
    return () => window.clearInterval(id);
  }, []);

  const line = LINES[tick % LINES.length]!;
  const Icon = ICONS[tick % ICONS.length]!;
  const pct = Math.max(4, Math.min(100, Math.round(progress)));

  return (
    <div
      className="flex min-h-[calc(100vh-9rem)] w-full flex-col items-center justify-center rounded-2xl bg-paper px-6 py-16"
      role="status"
      aria-live="polite"
      aria-busy
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-tint text-brand-text">
        <Icon size={32} strokeWidth={1.5} className="animate-analyze-stage" aria-hidden />
      </span>
      <h2 className="mt-6 text-center text-2xl font-semibold text-content-primary">{line.title}</h2>
      <p className="mt-2 max-w-md text-center text-sm text-content-secondary">{line.sub}</p>
      <div className="mt-8 h-2 w-full max-w-xl overflow-hidden rounded-full bg-sunken">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs tabular text-content-tertiary">{pct}% analyzed</p>
    </div>
  );
}
