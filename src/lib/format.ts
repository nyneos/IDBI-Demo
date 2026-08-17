const enIN = new Intl.NumberFormat('en-IN');
const enINCurrency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCount(value: number): string {
  return enIN.format(Math.round(value));
}

export function formatINR(value: number): string {
  return enINCurrency.format(value).replace(/\s/g, '');
}

export function formatPercent(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

export function formatShare(part: number, whole: number, digits = 1): string {
  if (whole === 0) return formatPercent(0, digits);
  return formatPercent((part / whole) * 100, digits);
}

export function formatDays(value: number, digits = 1): string {
  return `${value.toFixed(digits)} Days`;
}

export function formatCr(value: number): string {
  return `₹${value.toFixed(2)} Cr`;
}

export function formatRelativeTime(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function shareOf(part: number, whole: number): number {
  if (whole === 0) return 0;
  return (part / whole) * 100;
}

const istDate = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const istDateTime = new Intl.DateTimeFormat('en-IN', {
  timeZone: 'Asia/Kolkata',
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDateIST(value: string | number | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  const hasTime = typeof value === 'string' && (value.includes('T') || value.includes(':'));
  return hasTime ? istDateTime.format(d) : istDate.format(d);
}
