const ORGANIZATION_TIMEZONE_KEY = 'organization_timezone:';

export interface ScheduleDateTime {
  date: string;
  time: string;
}

export interface ScheduleDisplayParts {
  date: string;
  time: string;
}

function getActiveOrganizationId(): string | null {
  const rememberDevice = localStorage.getItem('remember_device') === 'true';
  const stores = rememberDevice ? [localStorage, sessionStorage] : [sessionStorage, localStorage];

  for (const store of stores) {
    const orgId = store.getItem('org_id') || store.getItem('organizationId');
    if (orgId) return orgId;
  }

  return null;
}

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function setOrganizationTimezone(orgId: string, timezone: string | null | undefined): void {
  if (!orgId) return;
  const normalizedTimezone = timezone?.trim();
  if (!normalizedTimezone || !isValidTimezone(normalizedTimezone)) return;

  const key = `${ORGANIZATION_TIMEZONE_KEY}${orgId}`;
  const stores = [localStorage, sessionStorage];

  for (const store of stores) {
    store.setItem(key, normalizedTimezone);
  }
}

export function getActiveTimezone(): string | undefined {
  const orgId = getActiveOrganizationId();
  if (orgId) {
    const key = `${ORGANIZATION_TIMEZONE_KEY}${orgId}`;
    const timezone = sessionStorage.getItem(key) || localStorage.getItem(key);
    if (timezone && isValidTimezone(timezone)) return timezone;
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
}

export function getTimezoneOptions(extra: Intl.DateTimeFormatOptions = {}): Intl.DateTimeFormatOptions {
  const timezone = getActiveTimezone();
  return timezone ? { ...extra, timeZone: timezone } : extra;
}

export function scheduleToUtc(date: string, time: string): ScheduleDateTime {
  if (!date || !time) return { date, time };
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const targetTime = Date.UTC(year, month - 1, day, hours, minutes);
  const timezone = getActiveTimezone();
  let utcTime = targetTime;

  if (timezone) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const parts = new Intl.DateTimeFormat(undefined, {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      }).formatToParts(new Date(utcTime));
      const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(item => item.type === type)?.value);
      const renderedTime = Date.UTC(
        part('year'),
        part('month') - 1,
        part('day'),
        part('hour'),
        part('minute')
      );
      const difference = targetTime - renderedTime;
      utcTime += difference;
      if (difference === 0) break;
    }
  }

  const utcDate = new Date(utcTime);
  return {
    date: `${utcDate.getUTCFullYear()}-${String(utcDate.getUTCMonth() + 1).padStart(2, '0')}-${String(utcDate.getUTCDate()).padStart(2, '0')}`,
    time: `${String(utcDate.getUTCHours()).padStart(2, '0')}:${String(utcDate.getUTCMinutes()).padStart(2, '0')}`,
  };
}

export function scheduleUtcToLocal(date: string, time: string): ScheduleDateTime {
  if (!date || !time) return { date, time };
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
  const timezone = getActiveTimezone();
  if (!timezone) {
    return {
      date: `${utcDate.getFullYear()}-${String(utcDate.getMonth() + 1).padStart(2, '0')}-${String(utcDate.getDate()).padStart(2, '0')}`,
      time: `${String(utcDate.getHours()).padStart(2, '0')}:${String(utcDate.getMinutes()).padStart(2, '0')}`,
    };
  }
  const parts = new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(utcDate);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value || '';
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  };
}

export function scheduleFromUtc(date: string, time: string): ScheduleDateTime {
  if (!date || !time) return { date, time };
  return scheduleUtcToLocal(date, time);
}

export function formatScheduleParts(
  scheduledDate: string | null | undefined,
  timeValue: string | null | undefined
): ScheduleDisplayParts {
  const value = String(timeValue || '');
  const dateTimeMatch = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
  const timeMatch = value.match(/T(\d{2}):(\d{2})/) || value.match(/^(\d{2}):(\d{2})/);
  let date = dateTimeMatch?.[1] || String(scheduledDate || '').slice(0, 10);
  let time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : '';
  let schedule = scheduleFromUtc(date, time);
  const hasTimezoneOffset = value.includes('T') && /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);

  if (hasTimezoneOffset) {
    const instant = new Date(value);
    if (!isNaN(instant.getTime())) {
      const parts = new Intl.DateTimeFormat(undefined, getTimezoneOptions({
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
      })).formatToParts(instant);
      const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value || '';
      date = `${part('year')}-${part('month')}-${part('day')}`;
      time = `${part('hour')}:${part('minute')}`;
      schedule = { date, time };
    }
  }

  const [year, month, day] = schedule.date.split('-').map(Number);

  if (!year || !month || !day) {
    return { date: date || '—', time: '' };
  }

  const dateLabel = new Date(year, month - 1, day)
    .toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  let timeLabel = '';

  if (schedule.time) {
    const [hours, minutes] = schedule.time.split(':');
    const hour = Number(hours);
    if (Number.isFinite(hour) && minutes) {
      timeLabel = new Date(2000, 0, 1, hour, Number(minutes))
        .toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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

export function formatDateLocal(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString(undefined, getTimezoneOptions({ day: 'numeric', month: 'short', year: 'numeric' }));
}

export function formatDateTimeLocal(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  const datePart = d.toLocaleDateString(undefined, getTimezoneOptions({ day: 'numeric', month: 'short', year: 'numeric' }));
  const timePart = formatTimeLocal(d);
  return `${datePart}, ${timePart}`;
}

export function formatTimeLocal(iso: string | Date | null | undefined): string {
  if (!iso) return '';
  const d = iso instanceof Date ? iso : new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString(undefined, getTimezoneOptions({ hour: 'numeric', minute: '2-digit' }));
}