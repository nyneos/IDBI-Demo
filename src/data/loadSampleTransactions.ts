import { parseUploadedFile } from '@/data/parseUploadedFile';
import { buildUploadedDataSource } from '@/data/buildUploadedDataSource';
import type { DashboardDataSource } from '@/components/dashboard-builder/types';

const SAMPLE_URL = '/samples/idbi_transaction_sample.xlsx';
const SAMPLE_NAME = 'idbi_transaction_sample.xlsx';

let cache: Promise<DashboardDataSource> | null = null;

export function loadSampleTransactions(): Promise<DashboardDataSource> {
  if (!cache) {
    cache = (async () => {
      const res = await fetch(SAMPLE_URL);
      if (!res.ok) {
        throw new Error(`Could not load sample file (${res.status})`);
      }
      const buffer = await res.arrayBuffer();
      const file = new File([buffer], SAMPLE_NAME, {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const records = await parseUploadedFile(file);
      return buildUploadedDataSource(records, SAMPLE_NAME);
    })();
  }
  return cache;
}
