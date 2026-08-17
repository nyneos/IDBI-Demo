import * as XLSX from 'xlsx';
import { normaliseHeaders } from './pipeline/normalise';
import type { RawRecord } from './pipeline/types';

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export class ParseUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseUploadError';
  }
}

export async function parseUploadedFile(file: File): Promise<RawRecord[]> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ParseUploadError('File too large');
  }
  if (file.size === 0) {
    throw new ParseUploadError('No data found in this file');
  }

  let workbook: XLSX.WorkBook;
  try {
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv') || file.type.includes('csv')) {
      const text = await file.text();
      workbook = XLSX.read(text, { type: 'string', cellDates: true });
    } else {
      const buffer = await file.arrayBuffer();
      workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    }
  } catch {
    throw new ParseUploadError("Couldn't read this file — is it a valid Excel or CSV?");
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new ParseUploadError('No data found in this file');
  }
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    throw new ParseUploadError('No data found in this file');
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const records = normaliseHeaders(rows).filter((row) =>
    Object.values(row).some((v) => v != null && v !== ''),
  );
  if (records.length === 0) {
    throw new ParseUploadError('No data found in this file');
  }
  return records;
}
