import { describe, expect, it } from 'vitest';
import { createDefaultSchoolData } from './schoolData';
import { createDefaultState, createEmptyDayRecord } from './storage';
import { buildDailyReport, buildWeeklyReport, formatReportText, getSaturdayToFriday, isFriday } from './reports';
import type { DateKey } from '../types';

const friday = '2026-08-21' as DateKey;

describe('end-of-day reports', () => {
  it('builds a factual daily report from stored routine and school data', () => {
    const state = createDefaultState(new Date(2026, 7, 21, 12));
    const day = state.days[friday]!;
    day.dayStartedAt = 1;
    day.dayEndedAt = 2;
    day.wakeTime = '05:00';
    day.bedTime = '22:30';
    day.prayers = { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true };
    day.prayerDetails.fajr.timing = 'on-time';
    day.sessions.qudurat = { status: 'completed', accumulatedMs: 3_600_000, startedAt: null, completedAt: 2 };
    day.qudurat = { lessonName: 'النسب', questions: 40, correct: 32, mistakesReviewed: 6 };
    day.tahfiz.status = 'attended';
    day.notes = 'أنجزت الشيء الأهم أولًا';

    const school = createDefaultSchoolData();
    school.days[friday] = { date: friday, attendance: 'present', arrivalTime: '06:50', departureTime: '12:30', note: '' };

    const report = buildDailyReport(state, school, friday, 10_000);
    const text = formatReportText(report);

    expect(report.kind).toBe('daily');
    expect(report.stats.find((stat) => stat.label === 'الصلوات')?.value).toBe('5/5');
    expect(text).toContain('القدرات: 60 دقيقة · 40 سؤال · دقة 80%');
    expect(text).toContain('الحضور: حاضر · وصول 06:50 · خروج 12:30');
    expect(text).toContain('ملاحظة اليوم: أنجزت الشيء الأهم أولًا');
  });

  it('uses a fixed Saturday-to-Friday range for the weekly report', () => {
    expect(isFriday(friday)).toBe(true);
    expect(getSaturdayToFriday(friday)).toEqual([
      '2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21',
    ]);

    const state = createDefaultState(new Date(2026, 7, 21, 12));
    for (const date of getSaturdayToFriday(friday)) {
      const day = createEmptyDayRecord(date);
      day.dayStartedAt = 1;
      day.dayEndedAt = 2;
      day.prayers.fajr = true;
      state.days[date] = day;
    }
    const report = buildWeeklyReport(state, createDefaultSchoolData(), friday, 10_000);
    expect(report.kind).toBe('weekly');
    expect(report.stats.find((stat) => stat.label === 'الصلوات')?.value).toBe('7/35');
    expect(report.subtitle).toContain('→');
    expect(formatReportText(report)).toContain('تقرير الأسبوع');
  });
});
