import { TIMEZONE_ENABLED, TIMEZONE } from '../config';

export function getTimezoneOptions(extra?: Record<string, any>): Intl.DateTimeFormatOptions {
  const opts: any = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...extra,
  };
  if (TIMEZONE_ENABLED && TIMEZONE) {
    opts['timeZone'] = TIMEZONE;
  }
  return opts as Intl.DateTimeFormatOptions;
}

export function isTimezoneEnabled(): boolean {
  return !!TIMEZONE_ENABLED;
}

export function formatDateUTC(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-GB', getTimezoneOptions());
}

export function formatDateTimeUTC(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const datePart = d.toLocaleDateString('en-GB', getTimezoneOptions());
  const timePart = formatTimeUTC(d);
  return `${datePart}, ${timePart}`;
}

/**
 * Builds a UTC instant from a `YYYY-MM-DD` date and an `HH:mm` / `HH:mm:ss` time.
 * Both parts are already UTC wall-clock values, so the result is the same clock
 * reading with an explicit `Z` instead of an implicit local interpretation.
 */
export function toUtcIso(date: string | null | undefined, time?: string | null): string | undefined {
  if (!date) return undefined;
  const datePart = date.length > 10 ? date.slice(0, 10) : date;
  const timePart = toUtcTimeOfDay(time) || '00:00:00';
  // An instant is only trusted once it round-trips; a malformed input would
  // otherwise be sent as an invalid timestamp.
  const instant = new Date(`${datePart}T${timePart}Z`);
  if (isNaN(instant.getTime())) return undefined;
  return instant.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** Normalises `HH:mm` or `HH:mm:ss` to `HH:mm:ss`. */
export function toUtcTimeOfDay(time: string | null | undefined): string | undefined {
  if (!time) return undefined;
  return time.length === 5 ? `${time}:00` : time;
}

export function formatTimeUTC(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', ...(TIMEZONE_ENABLED && TIMEZONE ? { timeZone: TIMEZONE } : {}) });
}