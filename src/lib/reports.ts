import { addDays, formatArabicDate, parseDateKey } from './date';
import { calculateDayScore, calculateStreak } from './dailyMetrics';
import { getDayRecord } from './storage';
import { getElapsedMs } from './timer';
import type { DateKey, DayRecord, RoutineState, TahfizAttendanceStatus } from '../types';
import type { SchoolAttendanceStatus, SchoolData } from './schoolData';

export type ReportKind = 'daily' | 'weekly';

export interface ReportStat {
  label: string;
  value: string;
}

export interface ReportSection {
  title: string;
  lines: string[];
}

export interface RoutineReport {
  kind: ReportKind;
  date: DateKey;
  title: string;
  subtitle: string;
  score: number;
  stats: ReportStat[];
  sections: ReportSection[];
  filename: string;
}

const attendanceLabels: Record<SchoolAttendanceStatus, string> = {
  unrecorded: 'غير مسجل',
  present: 'حاضر',
  late: 'متأخر',
  absent: 'غائب',
  excused: 'غياب بعذر',
  holiday: 'إجازة',
};

const tahfizLabels: Record<TahfizAttendanceStatus, string> = {
  unrecorded: 'غير مسجل',
  attended: 'حضرت',
  'skipped-intentionally': 'تخطيته بقصد',
  excused: 'بعذر',
  holiday: 'إجازة',
  trip: 'رحلة',
  missed: 'فاتت الجلسة',
};

export function isFriday(date: DateKey): boolean {
  return parseDateKey(date)?.getDay() === 5;
}

export function getSaturdayToFriday(friday: DateKey): DateKey[] {
  if (!isFriday(friday)) return [];
  return Array.from({ length: 7 }, (_, index) => addDays(friday, index - 6));
}

export function buildDailyReport(state: RoutineState, school: SchoolData, date: DateKey, now = Date.now()): RoutineReport {
  const day = getDayRecord(state, date);
  const score = calculateDayScore(state, date, now).score;
  const prayers = Object.values(day.prayers).filter(Boolean).length;
  const onTime = Object.entries(day.prayers).filter(([id, done]) => done && day.prayerDetails[id as keyof DayRecord['prayers']].timing === 'on-time').length;
  const congregation = Object.entries(day.prayers).filter(([id, done]) => done && day.prayerDetails[id as keyof DayRecord['prayers']].congregation === 'yes').length;
  const quduratMinutes = minutes(getElapsedMs(day.sessions.qudurat, now));
  const tahfizMinutes = minutes(getElapsedMs(day.sessions.tahfiz, now));
  const accuracy = day.qudurat.questions > 0 ? Math.round((day.qudurat.correct / day.qudurat.questions) * 100) : null;
  const workout = state.workout.history.find((entry) => entry.date === date);
  const schoolDay = school.days[date];
  const sections: ReportSection[] = [];

  sections.push({
    title: 'العبادة',
    lines: [
      `الصلوات: ${prayers}/5${onTime ? ` · في وقتها ${onTime}` : ''}${congregation ? ` · بالجماعة ${congregation}` : ''}`,
      `التحفيظ: ${tahfizLabels[day.tahfiz.status]}${tahfizMinutes ? ` · ${tahfizMinutes} دقيقة` : ''}${day.tahfiz.mistakes ? ` · أخطاء التسميع ${day.tahfiz.mistakes}` : ''}`,
      ...compact([day.tahfiz.newMemorization && `حفظ جديد: ${day.tahfiz.newMemorization}`, day.tahfiz.review && `مراجعة: ${day.tahfiz.review}`]),
    ],
  });

  sections.push({
    title: 'الدراسة',
    lines: [
      `القدرات: ${quduratMinutes} دقيقة · ${day.qudurat.questions} سؤال${accuracy === null ? '' : ` · دقة ${accuracy}%`}`,
      ...compact([day.qudurat.lessonName && `الدرس: ${day.qudurat.lessonName}`, day.qudurat.mistakesReviewed > 0 && `أخطاء راجعتها: ${day.qudurat.mistakesReviewed}`]),
    ],
  });

  if (schoolDay) {
    sections.push({
      title: 'المدرسة',
      lines: [
        `الحضور: ${attendanceLabels[schoolDay.attendance]}${schoolDay.arrivalTime ? ` · وصول ${schoolDay.arrivalTime}` : ''}${schoolDay.departureTime ? ` · خروج ${schoolDay.departureTime}` : ''}`,
        ...compact([schoolDay.note]),
      ],
    });
  }

  sections.push({
    title: 'الرياضة واليوم',
    lines: [
      workout
        ? `تمرين ${workout.workoutId}: ${minutes(workout.durationMs)} دقيقة${workout.rating ? ` · تقييم ${workout.rating}/5` : ''}`
        : day.movementCompleted ? 'الحركة الخفيفة: مكتملة' : 'لا يوجد تمرين أو حركة مسجلة',
      `الصحوة: ${day.wakeTime || 'غير مسجلة'} · النوم: ${day.bedTime || 'غير مسجل'} · الأحداث: ${day.logs.length}`,
      ...compact([workout?.proudMoment && `فخور بـ: ${workout.proudMoment}`, day.notes && `ملاحظة اليوم: ${day.notes}`]),
    ],
  });

  return {
    kind: 'daily',
    date,
    title: 'تقرير اليوم',
    subtitle: formatArabicDate(date),
    score,
    stats: [
      { label: 'إنجاز اليوم', value: `${score}%` },
      { label: 'الصلوات', value: `${prayers}/5` },
      { label: 'القدرات', value: `${quduratMinutes} د` },
      { label: 'الأحداث', value: String(day.logs.length) },
    ],
    sections: sections.map((section) => ({ ...section, lines: section.lines.filter(Boolean) })),
    filename: `routini-day-${date}.png`,
  };
}

export function buildWeeklyReport(state: RoutineState, school: SchoolData, friday: DateKey, now = Date.now()): RoutineReport {
  const dates = getSaturdayToFriday(friday);
  if (dates.length !== 7) return buildDailyReport(state, school, friday, now);

  const days = dates.map((date) => ({ date, day: getDayRecord(state, date), score: calculateDayScore(state, date, now).score }));
  const average = Math.round(days.reduce((sum, entry) => sum + entry.score, 0) / 7);
  const prayers = days.reduce((sum, entry) => sum + Object.values(entry.day.prayers).filter(Boolean).length, 0);
  const onTime = days.reduce((sum, entry) => sum + Object.entries(entry.day.prayers).filter(([id, done]) => done && entry.day.prayerDetails[id as keyof DayRecord['prayers']].timing === 'on-time').length, 0);
  const quduratMinutes = days.reduce((sum, entry) => sum + minutes(getElapsedMs(entry.day.sessions.qudurat, now)), 0);
  const questions = days.reduce((sum, entry) => sum + entry.day.qudurat.questions, 0);
  const correct = days.reduce((sum, entry) => sum + entry.day.qudurat.correct, 0);
  const accuracy = questions > 0 ? Math.round((correct / questions) * 100) : null;
  const tahfizDays = days.filter(({ day }) => day.sessions.tahfiz.status === 'completed' || ['attended', 'trip'].includes(day.tahfiz.status)).length;
  const workouts = state.workout.history.filter((entry) => entry.date >= dates[0]! && entry.date <= dates[6]!);
  const workoutMinutes = workouts.reduce((sum, entry) => sum + minutes(entry.durationMs), 0);
  const schoolDays = dates.flatMap((date) => {
    const entry = school.days[date];
    return entry ? [entry] : [];
  });
  const present = schoolDays.filter((entry) => entry.attendance === 'present').length;
  const late = schoolDays.filter((entry) => entry.attendance === 'late').length;
  const absent = schoolDays.filter((entry) => entry.attendance === 'absent').length;
  const excused = schoolDays.filter((entry) => entry.attendance === 'excused').length;
  const best = [...days].sort((a, b) => b.score - a.score)[0]!;
  const streak = calculateStreak(state, friday, now);
  const notes = days.filter((entry) => entry.day.notes.trim()).slice(-3).map((entry) => `${formatArabicDate(entry.date, 'short')}: ${entry.day.notes.trim()}`);

  return {
    kind: 'weekly',
    date: friday,
    title: 'تقرير الأسبوع',
    subtitle: `${formatArabicDate(dates[0]!, 'short')} → ${formatArabicDate(friday, 'short')}`,
    score: average,
    stats: [
      { label: 'متوسط الأسبوع', value: `${average}%` },
      { label: 'الصلوات', value: `${prayers}/35` },
      { label: 'القدرات', value: `${quduratMinutes} د` },
      { label: 'التمارين', value: String(workouts.length) },
    ],
    sections: [
      {
        title: 'العبادة',
        lines: [
          `الصلوات: ${prayers}/35${onTime ? ` · في وقتها ${onTime}` : ''}`,
          `التحفيظ: ${tahfizDays} أيام مسجلة بإيجابية`,
        ],
      },
      {
        title: 'الدراسة والمدرسة',
        lines: [
          `القدرات: ${quduratMinutes} دقيقة · ${questions} سؤال${accuracy === null ? '' : ` · دقة ${accuracy}%`}`,
          schoolDays.length > 0 ? `المدرسة: حضور ${present} · تأخير ${late} · غياب ${absent} · بعذر ${excused}` : 'المدرسة: لا توجد تسجيلات حضور هذا الأسبوع',
        ],
      },
      {
        title: 'الرياضة والاستمرارية',
        lines: [
          `التمارين: ${workouts.length} حصص · ${workoutMinutes} دقيقة`,
          `أفضل يوم: ${formatArabicDate(best.date, 'short')} · ${best.score}%${streak ? ` · السلسلة ${streak} أيام` : ''}`,
        ],
      },
      ...(notes.length > 0 ? [{ title: 'ملاحظات من الأسبوع', lines: notes }] : []),
    ],
    filename: `routini-week-${dates[0]}-${friday}.png`,
  };
}

export function formatReportText(report: RoutineReport): string {
  const lines = [
    `روتيني · ${report.title}`,
    report.subtitle,
    '',
    ...report.stats.map((stat) => `${stat.label}: ${stat.value}`),
    '',
  ];

  for (const section of report.sections) {
    lines.push(`【 ${section.title} 】`, ...section.lines.map((line) => `• ${line}`), '');
  }

  return lines.join('\n').trim();
}

function minutes(milliseconds: number): number {
  return Math.max(0, Math.round(milliseconds / 60_000));
}

function compact(values: Array<string | false | null | undefined>): string[] {
  return values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
}
