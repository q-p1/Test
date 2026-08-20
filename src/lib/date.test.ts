import { describe, expect, it } from 'vitest';
import type { DateKey } from '../types';
import { addDays, differenceInCalendarDays, isDateInRange, isValidTimeRange, parseDateKey, startOfWeekSunday } from './date';

describe('calendar boundaries and input validation', () => {
  it('moves correctly through previous, next, month, leap-day and year boundaries', () => {
    expect(addDays('2026-08-20' as DateKey, -1)).toBe('2026-08-19');
    expect(addDays('2026-08-20' as DateKey, 1)).toBe('2026-08-21');
    expect(addDays('2026-08-31' as DateKey, 1)).toBe('2026-09-01');
    expect(addDays('2027-12-31' as DateKey, 1)).toBe('2028-01-01');
    expect(addDays('2028-02-28' as DateKey, 1)).toBe('2028-02-29');
  });

  it('rejects impossible dates and invalid time ranges', () => {
    expect(parseDateKey('2026-02-30')).toBeNull();
    expect(parseDateKey('20-08-26')).toBeNull();
    expect(isValidTimeRange('21:00', '22:00')).toBe(true);
    expect(isValidTimeRange('22:00', '21:00')).toBe(false);
    expect(isValidTimeRange('25:00', '26:00')).toBe(false);
  });

  it('keeps calendar calculations stable across weeks and ranges', () => {
    expect(differenceInCalendarDays('2027-01-02' as DateKey, '2026-12-31' as DateKey)).toBe(2);
    expect(isDateInRange('2027-01-01' as DateKey, '2026-12-31' as DateKey, '2027-01-02' as DateKey)).toBe(true);
    expect(startOfWeekSunday('2026-08-20' as DateKey)).toBe('2026-08-16');
  });
});
