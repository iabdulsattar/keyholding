import { TIMEZONE_ENABLED, TIMEZONE } from '../config';

export interface ScheduleDateTime {
  date: string;
  time: string;
}

export interface ScheduleDisplayParts {
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

export function formatScheduleParts(
  scheduledDate: string | null | undefined,
  timeValue: string | null | undefined
): ScheduleDisplayParts {
  const value = String(timeValue || '');
  const dateTimeMatch = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  const timeMatch = value.match(/T(\d{2}):(\d{2})/) || value.match(/^(\d{2}):(\d{2})/);
  const date = (dateTimeMatch?.[1] || String(scheduledDate || '').slice(0, 10));
  const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : '';
  const schedule = scheduleFromUtc(date, time);
  const [year, month, day] = schedule.date.split('-').map(Number);

  if (!year || !month || !day) {
    return { date: date || '—', time: '' };
  }

  const dateLabel = new Date(Date.UTC(year, month - 1, day))
    .toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  let timeLabel = '';

  if (schedule.time) {
    const [hours, minutes] = schedule.time.split(':');
    const hour = Number(hours);
    if (Number.isFinite(hour) && minutes) {
      timeLabel = `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
    }
  }

  return { date: dateLabel, time: timeLabel };
}

export function formatScheduleRange(
  scheduledDate: string | null | undefined,
  startTime: string | null | undefined,
  endTime: string | null | undefined
): string {
  const start = formatScheduleParts(scheduledDate, startTime);
  const end = formatScheduleParts(scheduledDate, endTime);
  const startLabel = [start.date, start.time].filter(Boolean).join(', ');
  const endLabel = [end.date, end.time].filter(Boolean).join(', ');

  if (!startTime || !endTime) return startLabel;
  return `${startLabel} - ${endLabel}`;
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