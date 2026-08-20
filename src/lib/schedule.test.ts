import { describe, expect, it } from 'vitest';
import { createDefaultBaseSchedule } from '../data/baseSchedule';
import type { DateKey, DateOverride, DateOverrideMap, OverrideType } from '../types';
import { addOverride, getOverridesForDate, removeOverridesForSingleDate, resolveDay } from './schedule';

const date = '2026-08-20' as DateKey;
const base = createDefaultBaseSchedule();

function override(type: OverrideType, extra: Partial<DateOverride> = {}): DateOverride {
  return { id: `${type}-id`, type, startDate: date, createdAt: 1, ...extra };
}

describe('day overrides', () => {
  it('never mutates the weekly base schedule', () => {
    const snapshot = JSON.stringify(base);
    resolveDay(base, { [date]: [override('school-holiday')] }, date);
    expect(JSON.stringify(base)).toBe(snapshot);
  });

  it.each([
    ['school-holiday', 'school'],
    ['tahfiz-holiday', 'tahfiz'],
  ] as const)('%s cancels only its target without marking failure', (type, kind) => {
    const result = resolveDay(base, { [date]: [override(type)] }, date);
    expect(result.items.find((item) => item.kind === kind)?.status).toBe('cancelled');
    expect(result.items.find((item) => item.kind === kind)?.statusReason).toBeTruthy();
  });

  it('replaces tahfiz with a verified custom trip period', () => {
    const result = resolveDay(base, { [date]: [override('tahfiz-trip', { title: 'رحلة التحفيظ', startTime: '16:10', endTime: '18:00' })] }, date);
    expect(result.items.some((item) => item.kind === 'tahfiz')).toBe(false);
    expect(result.items.find((item) => item.title === 'رحلة التحفيظ')).toMatchObject({ startTime: '16:10', endTime: '18:00', isException: true });
  });

  it('handles official holiday, custom event, reschedule, postpone, cancellation and add task', () => {
    let map: DateOverrideMap = {};
    map = addOverride(map, override('official-holiday', { id: 'official', title: 'إجازة رسمية' }));
    map = addOverride(map, override('custom-event', { id: 'custom', title: 'موعد', startTime: '14:00', endTime: '15:00' }));
    map = addOverride(map, override('reschedule-task', { id: 'reschedule', targetId: 'qudurat', startTime: '21:00', endTime: '22:00' }));
    map = addOverride(map, override('postpone-task', { id: 'postpone', targetId: 'workout', startTime: '22:05', endTime: '23:00' }));
    map = addOverride(map, override('cancel-task', { id: 'cancel', targetId: 'rest' }));
    map = addOverride(map, override('add-task', { id: 'add', title: 'اختبار قصير', startTime: '10:00', endTime: '10:30' }));
    const result = resolveDay(base, map, date);
    expect(result.isHoliday).toBe(true);
    expect(result.items.find((item) => item.id === 'school')?.status).toBe('cancelled');
    expect(result.items.find((item) => item.id === 'qudurat')?.startTime).toBe('21:00');
    expect(result.items.find((item) => item.id === 'workout')?.startTime).toBe('22:05');
    expect(result.items.find((item) => item.id === 'rest')?.status).toBe('cancelled');
    expect(result.items.some((item) => item.title === 'موعد')).toBe(true);
    expect(result.items.some((item) => item.title === 'اختبار قصير')).toBe(true);
  });

  it('applies multi-day ranges across a month boundary', () => {
    const range = override('official-holiday', { startDate: '2026-12-31' as DateKey, endDate: '2027-01-02' as DateKey });
    const map = { '2026-12-31': [range] };
    expect(getOverridesForDate(map, '2027-01-01' as DateKey)).toHaveLength(1);
    expect(getOverridesForDate(map, '2027-01-03' as DateKey)).toHaveLength(0);
  });

  it('restores one day inside a range without deleting adjacent days', () => {
    const range = override('official-holiday', { startDate: '2026-08-19' as DateKey, endDate: '2026-08-21' as DateKey });
    const restored = removeOverridesForSingleDate({ '2026-08-19': [range] }, date);
    expect(getOverridesForDate(restored, '2026-08-19' as DateKey)).toHaveLength(1);
    expect(getOverridesForDate(restored, date)).toHaveLength(0);
    expect(getOverridesForDate(restored, '2026-08-21' as DateKey)).toHaveLength(1);
  });
});
