export function formatResumeDate(date?: string | null) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function formatYearRange(start?: number | string | null, end?: number | string | null, current?: boolean) {
  const startLabel = start ?? '';
  if (current) return `${startLabel} – Present`.replace(/^ – Present$/, 'Present');
  if (start && end) return `${startLabel} – ${end}`;
  return String(start || end || '');
}

export function formatDateRange(
  start?: string | null,
  end?: string | null,
  current?: boolean,
) {
  const s = formatResumeDate(start);
  const e = current ? 'Present' : formatResumeDate(end);
  if (s && e) return `${s} – ${e}`;
  return s || e || null;
}
