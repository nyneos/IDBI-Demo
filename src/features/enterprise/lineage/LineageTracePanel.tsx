import { BarChart3, FileSpreadsheet, FunctionSquare, GitBranch, Sigma, Table2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { exportLineagePdf } from './exportLineagePdf';
import type { LineageChain, LineageNode, LineageNodeType } from './types';

const ICON: Record<LineageNodeType, typeof GitBranch> = {
  source: FileSpreadsheet,
  column: Table2,
  'calculated-field': FunctionSquare,
  'governed-measure': Sigma,
  filter: GitBranch,
  block: BarChart3,
};

export function LineageTracePanel({
  title,
  chain,
  onClose,
}: {
  title: string;
  chain: LineageChain;
  onClose: () => void;
}) {
  const [exporting, setExporting] = useState(false);
  const tracedAt = Date.now();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const onExport = async () => {
    setExporting(true);
    try {
      await exportLineagePdf({ title, chain, tracedAt });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Dismiss" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lineage-title"
        className="relative z-[1] flex max-h-[min(70vh,520px)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-hairline bg-paper shadow-lg"
      >
        <div className="flex items-start justify-between gap-3 border-b border-hairline px-5 py-4">
          <div className="min-w-0">
            <h2 id="lineage-title" className="text-lg font-bold text-content-primary">
              Lineage: {title}
            </h2>
            <p className="mt-1 text-xs text-content-secondary">
              Recorded from the live pipeline · {new Date(tracedAt).toLocaleString('en-IN')}
            </p>
          </div>
          <IconButton aria-label="Close" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <ol className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {chain.nodes.map((node, i) => {
            const next = chain.nodes[i + 1];
            const edge = next ? chain.edges.find((e) => e.from === node.id && e.to === next.id) : undefined;
            return (
              <li key={node.id}>
                <NodeRow node={node} />
                {next ? <EdgeMark transform={edge?.transform} /> : null}
              </li>
            );
          })}
        </ol>
        <div className="flex justify-end gap-2 border-t border-hairline px-5 py-3">
          <Button variant="secondary" onClick={() => void onExport()} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export Lineage Report'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function NodeRow({ node }: { node: LineageNode }) {
  const Icon = ICON[node.type];
  return (
    <div className="flex gap-3">
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-text">
        <Icon size={16} strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-content-primary">{node.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-content-secondary">{node.detail}</p>
      </div>
    </div>
  );
}

function EdgeMark({ transform }: { transform?: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex w-10 shrink-0 justify-center py-1" aria-hidden>
        <span className="h-8 w-0 border-l-[3px] border-dashed border-content-tertiary/70" />
      </div>
      {transform ? (
        <p className="self-center font-mono text-xs text-content-tertiary">{transform}</p>
      ) : (
        <span className="sr-only">next step</span>
      )}
    </div>
  );
}
