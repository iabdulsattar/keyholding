const JOB_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
  PENDING: 'Pending',
};

export function formatJobStatus(status: string | undefined | null): string {
  if (!status) return '—';
  const upper = status.toUpperCase();
  if (JOB_STATUS_LABELS[upper]) {
    return JOB_STATUS_LABELS[upper];
  }
  if (upper.includes('_')) {
    return upper
      .split('_')
      .map(w => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }
  return upper.charAt(0).toUpperCase() + upper.slice(1).toLowerCase();
}

/**
 * Render any backend enum as a readable label: `ON_THE_HOOK` -> "On The Hook",
 * `ISSUED` -> "Issued". Falls back to an em dash when nothing is supplied.
 */
export function humanizeEnum(value: string | undefined | null, labels: Record<string, string> = {}): string {
  const raw = (value || '').trim();
  if (!raw) return '—';
  const upper = raw.toUpperCase();
  if (labels[upper]) return labels[upper];
  return upper
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
