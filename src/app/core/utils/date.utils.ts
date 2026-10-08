import { TIMEZONE_ENABLED, TIMEZONE } from '../config';

export interface ScheduleDateTime {
  date: string;
  time: string;
}

export function getTimezoneOptions(extra: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormatOptions {
  return {
    ...extra,
    ...(TIMEZONE_ENABLED && TIMEZONE ? { timeZone: TIMEZONE } : {}),
  };
}

export function isTimezoneEnabled(): boolean {
  return !!(TIMEZONE_ENABLED && TIMEZONE);
}

export function scheduleToUtc(date: string, time: string): ScheduleDateTime {
  if (!date || !time) return { date, time };
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const utcDate = new Date(year, month - 1, day, hours, minutes);
  return {
    date: `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}-${String(utcDate.getUTCDate()).padStart(2, '0')}`,
    time: `${String(utcDate.getUTCHours()).padStart(2, '0')}:${String(utcDate.getUTCMinutes()).padStart(2, '0')}`,
  };
}

export function scheduleUtcToLocal(date: string, time: string): ScheduleDateTime {
  if (!date || !time) return { date, time };
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const localDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  return {
    date: `${localDate.getFullYear()}-${String(localDate.getMonth() + 1).padStart(2, '0')}-${String(localDate.getDate()).padStart(2, '0')}`,
    time: `${String(localDate.getHours()).padStart(2, '0')}:${String(localDate.getMinutes()).padStart(2, '0')}`,
  };
}

export function scheduleFromUtc(date: string, time: string): ScheduleDateTime {
  if (!date || !time || isTimezoneEnabled()) return { date, time };
  return scheduleUtcToLocal(date, time);
}

export function formatDateUTC(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-GB', getTimezoneOptions({ day: 'numeric', month: 'short', year: 'numeric' }));
}

export function formatDateTimeUTC(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const datePart = d.toLocaleDateString('en-GB', getTimezoneOptions({ day: 'numeric', month: 'short', year: 'numeric' }));
  const timePart = formatTimeUTC(d);
  return `${datePart}, ${timePart}`;
}

export function formatTimeUTC(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-GB', getTimezoneOptions({ hour: 'numeric', minute: '2-digit' }));
}