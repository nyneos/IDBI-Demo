import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { drawBankLogo } from './bankLogo';
import { drawReportChart } from './drawCharts';
import {
  buildReportData,
  resolvePlaceholders,
  sectionMeasureValues,
} from './reportData';
import type { ReportData, ReportTemplate } from './types';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';
import type { SemanticCatalog } from '../semantic-layer/types';

type AutoTableDoc = jsPDF & { lastAutoTable?: { finalY: number } };

const PAGE_MARGIN = 40;
const FOOTER_Y_OFFSET = 20;

export function composeReport(
  template: ReportTemplate,
  source: DashboardDataSource,
  catalog: SemanticCatalog,
  burst?: { field: string; value: string },
): jsPDF {
  const data = buildReportData(template, source, catalog, burst);
  return composeReportFromData(template, data);
}

export function composeReportFromData(template: ReportTemplate, data: ReportData): jsPDF {
  const pdf = new jsPDF({
    orientation: template.orientation,
    unit: 'pt',
    format: template.pageSize.toLowerCase() as 'a4' | 'letter',
  });

  let y = PAGE_MARGIN;

  if (template.header.logo) {
    drawBankLogo(pdf, PAGE_MARGIN, y);
    y += 36;
  }

  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 29, 41);
  pdf.text(resolvePlaceholders(template.header.title, data.placeholders), PAGE_MARGIN, y + 16);

  if (template.header.subtitle) {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(92, 100, 118);
    pdf.text(resolvePlaceholders(template.header.subtitle, data.placeholders), PAGE_MARGIN, y + 34);
    y += 52;
  } else {
    y += 36;
  }

  pdf.setDrawColor(220, 223, 230);
  pdf.line(PAGE_MARGIN, y, pdf.internal.pageSize.getWidth() - PAGE_MARGIN, y);
  y += 24;

  for (const section of template.bodySections) {
    y = ensureSpace(pdf, y, 80);

    if (section.title) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(26, 29, 41);
      pdf.text(section.title, PAGE_MARGIN, y);
      y += 18;
    }

    if (section.type === 'text' && section.text) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(92, 100, 118);
      const lines = pdf.splitTextToSize(
        resolvePlaceholders(section.text, data.placeholders),
        pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2,
      ) as string[];
      pdf.text(lines, PAGE_MARGIN, y);
      y += lines.length * 14 + 12;
    }

    if (section.type === 'kpi-row') {
      const measures = sectionMeasureValues(section, data);
      const colWidth = Math.min(
        160,
        (pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2) / Math.max(measures.length, 1),
      );
      measures.forEach((measure, i) => {
        const x = PAGE_MARGIN + i * colWidth;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(92, 100, 118);
        pdf.text(measure.label, x, y);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(26, 29, 41);
        pdf.text(measure.formattedValue, x, y + 18);
      });
      y += 50;
    }

    if (section.type === 'table' && section.boundTable) {
      const rows = data.tableRows.get(section.id) ?? [];
      autoTable(pdf, {
        startY: y,
        head: [section.boundTable.columns],
        body: rows,
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
        styles: { fontSize: 9, cellPadding: 4 },
        headStyles: { fillColor: [26, 86, 50], textColor: 255, fontStyle: 'bold' },
        showHead: 'everyPage',
      });
      y = ((pdf as AutoTableDoc).lastAutoTable?.finalY ?? y) + 20;
    }

    if (section.type === 'records-table') {
      const cols = section.recordColumns?.length
        ? section.recordColumns
        : ['Column'];
      const rows = data.recordRows.get(section.id) ?? [];
      autoTable(pdf, {
        startY: y,
        head: [cols],
        body: rows,
        margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [26, 86, 50], textColor: 255, fontStyle: 'bold' },
        showHead: 'everyPage',
      });
      y = ((pdf as AutoTableDoc).lastAutoTable?.finalY ?? y) + 20;
    }

    if (section.type === 'chart' && section.chart) {
      y = ensureSpace(pdf, y, 180);
      const width = pdf.internal.pageSize.getWidth() - PAGE_MARGIN * 2;
      y = drawReportChart(
        pdf,
        section.chart.visual,
        data.chartSeries.get(section.id) ?? [],
        PAGE_MARGIN,
        y,
        width,
        160,
      );
      y += 16;
    }
  }

  drawSignatureBlock(pdf, template);
  drawFooters(pdf, template);

  return pdf;
}

function ensureSpace(pdf: jsPDF, y: number, needed: number): number {
  const pageHeight = pdf.internal.pageSize.getHeight();
  if (y + needed > pageHeight - 60) {
    pdf.addPage();
    return PAGE_MARGIN;
  }
  return y;
}

function drawSignatureBlock(pdf: jsPDF, template: ReportTemplate) {
  if (!template.signatureBlock?.lines.length) return;
  const pageCount = pdf.getNumberOfPages();
  pdf.setPage(pageCount);
  const pageHeight = pdf.internal.pageSize.getHeight();
  const y = pageHeight - 80;
  template.signatureBlock.lines.forEach((line, i) => {
    const x = PAGE_MARGIN + i * 170;
    pdf.setDrawColor(120, 125, 140);
    pdf.line(x, y, x + 140, y);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(92, 100, 118);
    pdf.text(line.label, x, y + 14);
  });
}

function drawFooters(pdf: jsPDF, template: ReportTemplate) {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const generated = new Date().toLocaleString('en-IN');

  for (let p = 1; p <= pageCount; p++) {
    pdf.setPage(p);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(155, 163, 183);

    if (template.footer.showGeneratedDate) {
      pdf.text(`Generated ${generated}`, PAGE_MARGIN, pageHeight - FOOTER_Y_OFFSET);
    }
    if (template.footer.customText) {
      pdf.text(template.footer.customText, PAGE_MARGIN, pageHeight - FOOTER_Y_OFFSET - 12);
    }
    if (template.footer.showPageNumbers) {
      pdf.text(`Page ${p} of ${pageCount}`, pageWidth - PAGE_MARGIN - 40, pageHeight - FOOTER_Y_OFFSET);
    }
  }
}

export function downloadReport(pdf: jsPDF, filename: string) {
  pdf.save(filename);
}

export function previewReport(pdf: jsPDF) {
  const blob = pdf.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank', 'noopener,noreferrer');
}
