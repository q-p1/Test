import { describe, expect, it } from 'vitest';
import {
  createDefaultSchoolData,
  getOverdueAssignments,
  getPendingAssignments,
  getPeriodsForDate,
  getSchoolAverage,
  getSubjectAverage,
  sanitizeSchoolData,
  type SchoolData,
} from './schoolData';

const subject = { id: 's1', name: 'رياضيات', teacher: 'أستاذ', room: '12', note: '', createdAt: 1 };

function sample(): SchoolData {
  return {
    ...createDefaultSchoolData(),
    subjects: [subject],
    periods: [
      { id: 'p1', weekday: 0, periodNumber: 2, subjectId: 's1', startTime: '08:00', endTime: '08:45', note: '' },
      { id: 'p2', weekday: 0, periodNumber: 1, subjectId: 's1', startTime: '07:00', endTime: '07:45', note: '' },
    ],
    assignments: [
      { id: 'a1', subjectId: 's1', title: 'قريب', dueDate: '2026-08-23', kind: 'homework', status: 'todo', important: false, note: '', createdAt: 1 },
      { id: 'a2', subjectId: 's1', title: 'متأخر', dueDate: '2026-08-20', kind: 'homework', status: 'todo', important: true, note: '', createdAt: 2 },
      { id: 'a3', subjectId: 's1', title: 'منتهي', dueDate: '2026-08-20', kind: 'homework', status: 'done', important: false, note: '', createdAt: 3 },
    ],
    exams: [
      { id: 'e1', subjectId: 's1', title: 'اختبار 1', date: '2026-08-10', time: '', kind: 'exam', scope: '', score: 18, maxScore: 20, note: '', createdAt: 1 },
      { id: 'e2', subjectId: 's1', title: 'اختبار 2', date: '2026-08-11', time: '', kind: 'quiz', scope: '', score: 8, maxScore: 10, note: '', createdAt: 2 },
    ],
    days: {},
  };
}

describe('school data', () => {
  it('sorts periods by period number for a date', () => {
    const periods = getPeriodsForDate(sample(), '2026-08-23');
    expect(periods.map((period) => period.periodNumber)).toEqual([1, 2]);
  });

  it('separates pending and overdue assignments without treating completed work as overdue', () => {
    expect(getPendingAssignments(sample(), '2026-08-21').map((item) => item.id)).toEqual(['a1']);
    expect(getOverdueAssignments(sample(), '2026-08-21').map((item) => item.id)).toEqual(['a2']);
  });

  it('calculates subject and school averages from recorded exams', () => {
    expect(getSubjectAverage(sample(), 's1')).toBe(85);
    expect(getSchoolAverage(sample())).toBe(85);
  });

  it('drops records that reference a missing subject instead of keeping corrupt relations', () => {
    const clean = sanitizeSchoolData({ ...sample(), subjects: [], periods: sample().periods, assignments: sample().assignments, exams: sample().exams });
    expect(clean.periods).toHaveLength(0);
    expect(clean.assignments).toHaveLength(0);
    expect(clean.exams).toHaveLength(0);
  });
});
