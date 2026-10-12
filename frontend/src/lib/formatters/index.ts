/**
 * Format a number as Indonesian Rupiah.
 * Example: 15000 → "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a number with Indonesian locale (no currency symbol).
 */
export function formatNumber(n: number, fractionDigits = 0): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(n);
}

/**
 * Format a date-time string to Indonesian locale.
 * Example: "2026-10-11T08:30:00Z" → "11 Okt 2026, 15.30"
 */
export function formatDateTime(dateString: string): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(dateString));
}

/**
 * Format a date-only string.
 * Example: "2026-10-11" → "11 Okt 2026"
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(dateString));
}

/**
 * Get today's date as YYYY-MM-DD string.
 */
export function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/**
 * Get the date N days ago as YYYY-MM-DD string.
 */
export function daysAgoISO(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
