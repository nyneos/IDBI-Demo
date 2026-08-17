import html2canvas from 'html2canvas';
import type { DashboardState } from '@/components/dashboard-builder/types';

export async function exportDashboardToPptx(dashboard: DashboardState, sectionRef: HTMLElement) {
  const pptxgen = (await import('pptxgenjs')).default;
  const canvas = await html2canvas(sectionRef, {
    backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--surface-canvas').trim() || '#F5F5F4',
    scale: 2,
  });
  const pptx = new pptxgen();
  const slide = pptx.addSlide();
  slide.addImage({ data: canvas.toDataURL('image/png'), x: 0.3, y: 0.3, w: 9.4, h: 5.2 });
  slide.addText(dashboard.name, { x: 0.3, y: 0.05, fontSize: 14, bold: true });
  await pptx.writeFile({ fileName: `${dashboard.name}.pptx` });
}
