import type { DateKey } from '../types';

export function toDateKey(date: Date): DateKey {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}` as DateKey;
}

export function parseDateKey(key: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return toDateKey(date) === key ? date : null;
}

export function addDays(key: DateKey, amount: number): DateKey {
  const date = parseDateKey(key);
  if (!date) return key;
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

export function compareDateKeys(a: DateKey, b: DateKey): number {
  return a.localeCompare(b);
}

export function isDateInRange(date: DateKey, start: DateKey, end?: DateKey): boolean {
  return compareDateKeys(date, start) >= 0 && compareDateKeys(date, end ?? start) <= 0;
}

export function differenceInCalendarDays(later: DateKey, earlier: DateKey): number {
  const a = parseDateKey(later);
  const b = parseDateKey(earlier);
  if (!a || !b) return 0;
  return Math.round((a.getTime() - b.getTime()) / 86_400_000);
}

export function startOfWeekSunday(key: DateKey): DateKey {
  const date = parseDateKey(key);
  if (!date) return key;
  date.setDate(date.getDate() - date.getDay());
  return toDateKey(date);
}

export function minutesFromTime(time: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(time);
  if (!match) return Number.POSITIVE_INFINITY;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return Number.POSITIVE_INFINITY;
  return hours * 60 + minutes;
}

export function currentMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function formatClock(time: string): string {
  const minutes = minutesFromTime(time);
  if (!Number.isFinite(minutes)) return time;
  const date = new Date(2020, 0, 1, Math.floor(minutes / 60), minutes % 60);
  return new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: '2-digit' }).format(date);
}

export function formatArabicDate(key: DateKey, style: 'short' | 'long' = 'long'): string {
  const date = parseDateKey(key);
  if (!date) return key;
  return new Intl.DateTimeFormat('ar-SA', style === 'long'
    ? { weekday: 'long', day: 'numeric', month: 'long' }
    : { day: 'numeric', month: 'short' }).format(date);
}

export function isValidTimeRange(start?: string, end?: string): boolean {
  if (!start || !end) return false;
  return minutesFromTime(start) < minutesFromTime(end);
}
