import * as XLSX from 'xlsx';
import type { DashboardBlock } from '@/components/dashboard-builder/types';

export function exportBlockDataToExcel(block: DashboardBlock, data: { label: string; value: number }[]) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, block.title.slice(0, 31) || 'Sheet1');
  XLSX.writeFile(workbook, `${block.title || 'block'}.xlsx`);
}
