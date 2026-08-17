import type { jsPDF } from 'jspdf';
import type { ChartSeriesPoint } from './types';
import type { ReportChartVisual } from './chartVisuals';

const BRAND: [number, number, number] = [26, 86, 50];
const MUTED: [number, number, number] = [92, 100, 118];
const PALETTE: [number, number, number][] = [
  [26, 86, 50],
  [79, 70, 229],
  [15, 157, 141],
  [37, 99, 235],
  [217, 119, 6],
  [124, 58, 237],
  [219, 39, 119],
  [8, 145, 178],
];

export function drawReportChart(
  pdf: jsPDF,
  visual: ReportChartVisual,
  series: ChartSeriesPoint[],
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  if (series.length === 0) {
    pdf.setFontSize(9);
    pdf.setTextColor(...MUTED);
    pdf.text('No data for this chart.', x, y + 12);
    return y + 28;
  }
  if (visual === 'pie') return drawPie(pdf, series, x, y, width, height);
  if (visual === 'line') return drawLine(pdf, series, x, y, width, height);
  if (visual === 'gauge') return drawGauge(pdf, series, x, y, width, height);
  return drawBars(pdf, series, x, y, width, height);
}

function drawBars(
  pdf: jsPDF,
  series: ChartSeriesPoint[],
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  const max = Math.max(...series.map((s) => s.value), 1);
  const gap = 6;
  const barW = Math.min(28, (width - gap * (series.length + 1)) / series.length);
  const base = y + height - 18;
  const plotH = height - 28;

  pdf.setDrawColor(220, 223, 230);
  pdf.line(x, base, x + width, base);

  series.forEach((s, i) => {
    const h = (s.value / max) * plotH;
    const bx = x + gap + i * (barW + gap);
    pdf.setFillColor(...PALETTE[i % PALETTE.length]!);
    pdf.rect(bx, base - h, barW, h, 'F');
  });

  pdf.setFontSize(7);
  pdf.setTextColor(...MUTED);
  series.forEach((s, i) => {
    const bx = x + gap + i * (barW + gap) + barW / 2;
    const label = s.label.length > 10 ? `${s.label.slice(0, 9)}…` : s.label;
    pdf.text(label, bx, base + 10, { align: 'center' });
  });

  return y + height;
}

function drawLine(
  pdf: jsPDF,
  series: ChartSeriesPoint[],
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  const max = Math.max(...series.map((s) => s.value), 1);
  const base = y + height - 18;
  const plotH = height - 28;
  const step = series.length > 1 ? width / (series.length - 1) : width;

  pdf.setDrawColor(220, 223, 230);
  pdf.line(x, base, x + width, base);

  const pts = series.map((s, i) => ({
    px: x + i * step,
    py: base - (s.value / max) * plotH,
  }));

  pdf.setDrawColor(...BRAND);
  pdf.setLineWidth(1.5);
  for (let i = 1; i < pts.length; i++) {
    pdf.line(pts[i - 1]!.px, pts[i - 1]!.py, pts[i]!.px, pts[i]!.py);
  }
  pdf.setFillColor(...BRAND);
  pts.forEach((p) => pdf.circle(p.px, p.py, 2, 'F'));

  pdf.setFontSize(7);
  pdf.setTextColor(...MUTED);
  series.forEach((s, i) => {
    const label = s.label.length > 10 ? `${s.label.slice(0, 9)}…` : s.label;
    pdf.text(label, pts[i]!.px, base + 10, { align: 'center' });
  });

  return y + height;
}

function drawPie(
  pdf: jsPDF,
  series: ChartSeriesPoint[],
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  const total = series.reduce((s, p) => s + p.value, 0) || 1;
  const r = Math.min(width, height) / 2 - 8;
  const cx = x + r + 8;
  const cy = y + height / 2;
  let angle = -Math.PI / 2;

  series.forEach((s, i) => {
    const sweep = (s.value / total) * Math.PI * 2;
    const color = PALETTE[i % PALETTE.length]!;
    fillSlice(pdf, cx, cy, r, angle, angle + sweep, color);
    angle += sweep;
  });

  const legendX = cx + r + 16;
  pdf.setFontSize(8);
  series.slice(0, 8).forEach((s, i) => {
    const ly = y + 10 + i * 14;
    pdf.setFillColor(...PALETTE[i % PALETTE.length]!);
    pdf.rect(legendX, ly - 6, 8, 8, 'F');
    pdf.setTextColor(26, 29, 41);
    const pct = `${((s.value / total) * 100).toFixed(0)}%`;
    pdf.text(`${s.label}  ${pct}`, legendX + 12, ly);
  });

  return y + height;
}

function fillSlice(
  pdf: jsPDF,
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  rgb: [number, number, number],
) {
  const steps = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.12));
  pdf.setFillColor(...rgb);
  let prev = { x: cx + r * Math.cos(a0), y: cy + r * Math.sin(a0) };
  for (let i = 1; i <= steps; i++) {
    const a = a0 + (a1 - a0) * (i / steps);
    const next = { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    pdf.triangle(cx, cy, prev.x, prev.y, next.x, next.y, 'F');
    prev = next;
  }
}

function drawGauge(
  pdf: jsPDF,
  series: ChartSeriesPoint[],
  x: number,
  y: number,
  width: number,
  height: number,
): number {
  const max = Math.max(...series.map((s) => s.value), 1);
  const value = series[0]?.value ?? 0;
  const ratio = Math.min(1, value / max);
  const cx = x + width / 2;
  const cy = y + height - 8;
  const r = Math.min(width, height) * 0.42;
  fillSlice(pdf, cx, cy, r, Math.PI, Math.PI + Math.PI * ratio, BRAND);
  pdf.setDrawColor(220, 223, 230);
  pdf.setLineWidth(1);
  pdf.circle(cx, cy, r, 'S');
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(26, 29, 41);
  pdf.text(series[0]?.label ?? '', cx, cy - 8, { align: 'center' });
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(String(Math.round(value)), cx, cy + 8, { align: 'center' });
  return y + height;
}
