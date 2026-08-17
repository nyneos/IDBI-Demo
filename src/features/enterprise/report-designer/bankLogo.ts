import type { jsPDF } from 'jspdf';

/** Vector fallback when no raster logo asset is bundled — still print-grade text. */
export function drawBankLogo(pdf: jsPDF, x: number, y: number) {
  pdf.setFillColor(26, 86, 50);
  pdf.roundedRect(x, y, 72, 28, 4, 4, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('IDBI BANK', x + 8, y + 18);
  pdf.setTextColor(26, 29, 41);
}
