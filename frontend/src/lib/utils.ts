import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount?: number | null, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export function timeAgo(date: string | Date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  const units: [number, string][] = [
    [60, 'second'],
    [60, 'minute'],
    [24, 'hour'],
    [7, 'day'],
    [4.34, 'week'],
    [12, 'month'],
    [Number.POSITIVE_INFINITY, 'year'],
  ];
  const value = seconds;
  let unit = 'second';
  let divisor = 1;
  for (const [step, name] of units) {
    if (Math.abs(value) < divisor * step) {
      unit = name;
      break;
    }
    divisor *= step;
    unit = name;
  }
  const rel = Math.round(value / divisor) * -1;
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(rel, unit as Intl.RelativeTimeFormatUnit);
}

export function titleCase(s?: string | null) {
  if (!s) return '';
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function initials(first?: string, last?: string) {
  return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?';
}
