import type { LineageChain } from './types';

export async function exportLineagePdf(opts: {
  title: string;
  chain: LineageChain;
  tracedAt: number;
}): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const left = 48;
  const maxWidth = pageWidth - left * 2;
  let y = 56;

  const ensure = (need: number) => {
    if (y + need > pageHeight - 48) {
      pdf.addPage();
      y = 56;
    }
  };

  const write = (text: string, size: number, color: string, gap = 14) => {
    pdf.setFontSize(size);
    pdf.setTextColor(color);
    const lines = pdf.splitTextToSize(text, maxWidth) as string[];
    ensure(lines.length * gap);
    pdf.text(lines, left, y);
    y += lines.length * gap;
  };

  write(`Lineage report — ${opts.title}`, 16, '#1A1D29', 20);
  write(
    `Traced ${new Date(opts.tracedAt).toLocaleString('en-IN')}. This document records the pipeline that produced the number on screen: source file, column, transformations, filters in effect at trace time, and the result.`,
    10,
    '#5C6478',
    14,
  );
  y += 8;

  opts.chain.nodes.forEach((node, i) => {
    const next = opts.chain.nodes[i + 1];
    const edge = next
      ? opts.chain.edges.find((e) => e.from === node.id && e.to === next.id)
      : undefined;

    write(`${i + 1}. ${labelType(node.type)} — ${node.label}`, 12, '#1A1D29', 16);
    write(node.detail, 10, '#5C6478', 13);
    if (node.timestamp) {
      write(`Recorded: ${new Date(node.timestamp).toLocaleString('en-IN')}`, 9, '#9BA3B7', 12);
    }
    if (edge?.transform) {
      y += 4;
      write(`↓  ${edge.transform}`, 10, '#1A1D29', 14);
    } else if (next) {
      y += 2;
      write('↓', 10, '#9BA3B7', 12);
    }
    y += 10;
  });

  y += 8;
  write(
    'This report was generated from the live Enterprise pipeline in this browser. It documents the chain as it existed at the timestamp above.',
    8,
    '#9BA3B7',
    12,
  );

  const slug = opts.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'lineage';
  pdf.save(`lineage-${slug}-${new Date(opts.tracedAt).toISOString().slice(0, 10)}.pdf`);
}

function labelType(type: string) {
  switch (type) {
    case 'source':
      return 'Source file';
    case 'column':
      return 'Column';
    case 'calculated-field':
      return 'Calculated field';
    case 'governed-measure':
      return 'Governed measure';
    case 'filter':
      return 'Filter';
    case 'block':
      return 'Visual';
    default:
      return type;
  }
}
