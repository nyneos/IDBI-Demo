import * as XLSX from 'xlsx';
import { factsOf } from '@/components/dashboard-builder/blockData';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import type { ScheduleFormat } from './types';

const ROW_CAP = 400;

function slug(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40) || 'report';
}

function rowsOf(source: DashboardDataSource) {
  return factsOf(source).slice(0, ROW_CAP);
}

export async function generateBurstFile(opts: {
  title: string;
  recipientName: string;
  recipientEmail: string;
  burstLabel?: string;
  format: ScheduleFormat;
  source: DashboardDataSource;
}): Promise<{ name: string; blob: Blob; sizeKB: number; url: string; recordCount: number }> {
  const recordCount = opts.source.recordCount;
  const slice = opts.burstLabel ? slug(opts.burstLabel) : 'all';
  const base = `${slug(opts.title)}_${slice}`;

  let blob: Blob;
  let name: string;

  if (opts.format === 'excel') {
    name = `${base}.xlsx`;
    blob = excelBlob(opts, recordCount);
  } else if (opts.format === 'pptx') {
    name = `${base}.pptx`;
    blob = await pptxBlob(opts, recordCount);
  } else {
    name = `${base}.pdf`;
    blob = await pdfBlob(opts, recordCount);
  }

  return {
    name,
    blob,
    sizeKB: Math.max(1, Math.round(blob.size / 1024)),
    url: URL.createObjectURL(blob),
    recordCount,
  };
}

function excelBlob(
  opts: {
    title: string;
    recipientName: string;
    recipientEmail: string;
    burstLabel?: string;
    source: DashboardDataSource;
  },
  recordCount: number,
): Blob {
  const meta = [
    { Field: 'Report', Value: opts.title },
    { Field: 'Recipient', Value: `${opts.recipientName} <${opts.recipientEmail}>` },
    { Field: 'Burst slice', Value: opts.burstLabel ?? 'All records' },
    { Field: 'Record count', Value: recordCount },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), 'Cover');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rowsOf(opts.source)), 'Data');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

async function pdfBlob(
  opts: {
    title: string;
    recipientName: string;
    recipientEmail: string;
    burstLabel?: string;
    source: DashboardDataSource;
  },
  recordCount: number,
): Promise<Blob> {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  pdf.setFontSize(16);
  pdf.text(opts.title, 32, 36);
  pdf.setFontSize(10);
  pdf.text(`Recipient: ${opts.recipientName} <${opts.recipientEmail}>`, 32, 56);
  pdf.text(`Burst slice: ${opts.burstLabel ?? 'All records'}  ·  ${recordCount} records`, 32, 72);

  const rows = rowsOf(opts.source);
  const keys = Object.keys(rows[0] ?? {}).slice(0, 6);
  let y = 96;
  pdf.setFontSize(8);
  pdf.text(keys.join('  |  ') || '(no columns)', 32, y);
  y += 14;
  for (const row of rows.slice(0, 28)) {
    const line = keys.map((k) => String(row[k] ?? '')).join('  |  ').slice(0, 140);
    pdf.text(line, 32, y);
    y += 12;
    if (y > 540) break;
  }
  return pdf.output('blob');
}

async function pptxBlob(
  opts: {
    title: string;
    recipientName: string;
    recipientEmail: string;
    burstLabel?: string;
    source: DashboardDataSource;
  },
  recordCount: number,
): Promise<Blob> {
  const pptxgen = (await import('pptxgenjs')).default;
  const pptx = new pptxgen();
  const slide = pptx.addSlide();
  slide.addText(opts.title, { x: 0.4, y: 0.3, fontSize: 18, bold: true });
  slide.addText(`Recipient: ${opts.recipientName} <${opts.recipientEmail}>`, { x: 0.4, y: 0.8, fontSize: 12 });
  slide.addText(`Burst slice: ${opts.burstLabel ?? 'All records'}  ·  ${recordCount} records`, {
    x: 0.4,
    y: 1.1,
    fontSize: 12,
  });
  const rows = rowsOf(opts.source);
  const keys = Object.keys(rows[0] ?? {}).slice(0, 5);
  if (keys.length) {
    slide.addTable(
      [
        keys,
        ...rows.slice(0, 8).map((r) => keys.map((k) => String(r[k] ?? ''))),
      ],
      { x: 0.4, y: 1.5, w: 9.2, h: 3.6, fontSize: 10 },
    );
  }
  const out = (await pptx.write({ outputType: 'blob' })) as Blob;
  return out;
}
