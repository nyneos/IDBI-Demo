import { useRef, useState } from 'react';
import { FileSpreadsheet, FileText, Upload, X } from 'lucide-react';
import { AnalyzeOverlay } from '@/components/upload/AnalyzeProgress';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { ParseUploadError, parseUploadedFile } from '@/data/parseUploadedFile';
import { buildUploadedDataSource } from '@/data/buildUploadedDataSource';
import { buildSuggestions } from '@/data/buildSuggestions';
import { eligibleDimensions, profileColumns } from '@/data/pipeline/profileColumns';
import { proposeHierarchy } from '@/data/pipeline/hierarchy';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import { cn } from '@/lib/cn';

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function truncateName(name: string, max = 36) {
  if (name.length <= max) return name;
  return `${name.slice(0, max - 1)}…`;
}

function paint() {
  return new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export function UploadStep({
  onAnalyzed,
}: {
  onAnalyzed: (ds: DashboardDataSource) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [picked, setPicked] = useState<File | null>(null);

  const takeFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setError('File is larger than 25MB');
      return;
    }
    setError(null);
    setPicked(file);
  };

  const analyze = async () => {
    if (!picked) return;
    setBusy(true);
    setError(null);
    setProgress(8);
    const started = performance.now();
    const timer = window.setInterval(() => {
      setProgress((p) => (p >= 92 ? p : Math.min(92, p + 1.5)));
    }, 80);
    try {
      await paint();
      const records = await parseUploadedFile(picked);
      const profile = profileColumns(records);
      eligibleDimensions(profile);
      proposeHierarchy(profile, records);
      const suggestions = buildSuggestions(profile, records);
      const source = buildUploadedDataSource(records, picked.name, { profile, suggestions });
      const remain = 4200 - (performance.now() - started);
      if (remain > 0) await new Promise<void>((r) => setTimeout(r, remain));
      window.clearInterval(timer);
      setProgress(100);
      await new Promise<void>((r) => setTimeout(r, 350));
      onAnalyzed(source);
    } catch (e) {
      window.clearInterval(timer);
      setError(e instanceof ParseUploadError ? e.message : 'Could not read this file');
    } finally {
      window.clearInterval(timer);
      setBusy(false);
      setProgress(0);
    }
  };

  if (busy) {
    return <AnalyzeOverlay progress={progress} />;
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-4 py-12">
      <FileText size={40} strokeWidth={1.25} className="text-content-secondary" aria-hidden />
      <h1 className="mt-6 text-center text-3xl font-bold text-content-primary">Upload your data</h1>
      <p className="mt-2 text-center text-sm text-content-secondary">
        Drop an Excel or CSV file to build a custom dashboard from it.
      </p>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          takeFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          'mt-8 flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-dashed border-strong px-8 py-14',
          'outline-none hover:border-brand',
        )}
      >
        <Upload size={28} className="text-content-primary" />
        <p className="mt-3 text-sm font-semibold text-content-primary">Drag and drop, or click to browse</p>
      </button>
      <p className="mt-3 text-xs text-content-tertiary">Accepts .xlsx, .xls, .csv — up to 25MB</p>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          takeFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {error ? <p className="mt-3 text-sm text-status-error">{error}</p> : null}

      {picked ? (
        <div className="mt-6 w-full max-w-xl">
          <div className="flex items-center gap-3 rounded-xl border border-hairline bg-paper px-3 py-2.5">
            <FileSpreadsheet size={18} className="shrink-0 text-content-secondary" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-content-primary" title={picked.name}>
                {truncateName(picked.name)}
              </p>
              <p className="text-xs text-content-tertiary">{formatBytes(picked.size)}</p>
            </div>
            <IconButton aria-label="Remove file" onClick={() => setPicked(null)}>
              <X size={14} />
            </IconButton>
            <Button variant="primary" size="sm" onClick={() => void analyze()}>
              Analyze File
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
