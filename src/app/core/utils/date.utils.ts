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
  const timePart = d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', ...(TIMEZONE_ENABLED && TIMEZONE ? { timeZone: TIMEZONE } : {}) });
  return `${datePart}, ${timePart}`;
}

export function formatTimeUTC(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit', ...(TIMEZONE_ENABLED && TIMEZONE ? { timeZone: TIMEZONE } : {}) });
}