/**
 * Rasterises a DOM section into a landscape A4 PDF.
 * html2canvas captures SVG reasonably well but does not produce vector or
 * selectable text — acceptable for client-side export without a backend.
 */
export async function exportSectionToPdf(
  sectionRef: HTMLElement,
  opts: { title: string; subtitle?: string },
): Promise<void> {
  const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas'),
  ]);

  const canvas = await html2canvas(sectionRef, {
    backgroundColor:
      getComputedStyle(document.documentElement).getPropertyValue('--surface-canvas').trim() || '#F5F5F4',
    scale: 2,
    useCORS: true,
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 40;
  let imgHeight = (canvas.height * imgWidth) / canvas.width;
  const maxHeight = pageHeight - 56;
  if (imgHeight > maxHeight) {
    imgHeight = maxHeight;
  }

  pdf.setFontSize(14);
    pdf.setTextColor('#1A1D29');
  pdf.text(opts.title, 20, 24);
  if (opts.subtitle) {
    pdf.setFontSize(9);
    pdf.setTextColor('#9BA3B7');
    pdf.text(opts.subtitle, 20, 38);
  }
  pdf.addImage(imgData, 'PNG', 20, 48, imgWidth, imgHeight);
  pdf.save(`${opts.title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
