import { useCallback, useRef, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { exportSectionToPdf } from '@/lib/exportPdf';

export function useSectionExport(title: string, subtitle?: string) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    const el = sectionRef.current;
    if (!el) return;
    setExporting(true);
    try {
      await exportSectionToPdf(el, { title, subtitle });
    } catch {
      /* exportPdf already falls back to a text PDF */
    } finally {
      setExporting(false);
    }
  }, [title, subtitle]);

  return { sectionRef, exporting, handleExport };
}

export function ExportButton({
  exporting,
  onExport,
  label,
}: {
  exporting: boolean;
  onExport: () => void;
  label: string;
}) {
  return (
    <Button type="button" variant="secondary" size="sm" disabled={exporting} onClick={() => void onExport()}>
      {exporting ? (
        <Loader2 size={16} strokeWidth={1.75} className="animate-spin" aria-hidden />
      ) : (
        <Download size={16} strokeWidth={1.75} aria-hidden />
      )}
      {exporting ? 'Exporting…' : label}
    </Button>
  );
}
