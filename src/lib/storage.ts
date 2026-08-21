import { createDefaultBaseSchedule } from '../data/baseSchedule';
import { toDateKey, parseDateKey } from './date';
import { removeOverridesForSingleDate } from './schedule';
import { createIdleTimer, sanitizeTimer } from './timer';
import type {
  ActiveDailyActivity,
  ActiveWorkout,
  BaseSchedule,
  DailyLog,
  DateOverride,
  DateOverrideMap,
  DayRecord,
  ExerciseLog,
  LoadResult,
  PrayerDetail,
  PrayerId,
  QuduratTracking,
  RoutineState,
  TahfizTracking,
  WorkoutHistoryEntry,
} from '../types';
import { SCHEMA_VERSION } from '../types';

export const STORAGE_KEY = 'routine.app.state';
export const LEGACY_KEYS = ['routine7-state', 'routineState', 'routine-data', 'myRoutineData', 'routine7.v2', 'routine7.v1'];

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const EMPTY_PRAYER_DETAIL: PrayerDetail = {
  performedAt: '',
  timing: 'unknown',
  congregation: 'unknown',
  note: '',
};

const EMPTY_TAHFIZ: TahfizTracking = {
  status: 'unrecorded',
  newMemorization: '',
  review: '',
  recitation: '',
  mistakes: 0,
  note: '',
};

const EMPTY_QUDURAT: QuduratTracking = {
  lessonName: '',
  questions: 0,
  correct: 0,
  mistakesReviewed: 0,
};

export function createEmptyDayRecord(date: `${number}-${number}-${number}`): DayRecord {
  return {
    date,
    prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    prayerDetails: {
      fajr: { ...EMPTY_PRAYER_DETAIL },
      dhuhr: { ...EMPTY_PRAYER_DETAIL },
      asr: { ...EMPTY_PRAYER_DETAIL },
      maghrib: { ...EMPTY_PRAYER_DETAIL },
      isha: { ...EMPTY_PRAYER_DETAIL },
    },
    sessions: { tahfiz: createIdleTimer(), qudurat: createIdleTimer() },
    sessionNotes: {},
    tahfiz: { ...EMPTY_TAHFIZ },
    qudurat: { ...EMPTY_QUDURAT },
    taskStatuses: {},
    movementCompleted: false,
    dayStartedAt: null,
    dayEndedAt: null,
    wakeTime: '',
    bedTime: '',
    logs: [],
    activeActivity: null,
    notes: '',
  };
}

export function createDefaultState(now = new Date()): RoutineState {
  const today = toDateKey(now);
  return {
    schemaVersion: SCHEMA_VERSION,
    baseSchedule: createDefaultBaseSchedule(),
    dateOverrides: {},
    days: { [today]: createEmptyDayRecord(today) },
    workout: { startedOn: today, active: null, history: [] },
    settings: {
      userName: '',
      reducedMotion: false,
      lastSeenVersion: '1.1.0',
      wakeTarget: '04:45',
      sleepTarget: '22:30',
      quduratTargetMinutes: 120,
      quduratQuestionTarget: 60,
      workoutTargetMinutes: 35,
    },
  };
}

export function getDayRecord(state: RoutineState, date: `${number}-${number}-${number}`): DayRecord {
  return state.days[date] ?? createEmptyDayRecord(date);
}

export function loadState(storage: StorageLike = window.localStorage, now = new Date()): LoadResult {
  const current = storage.getItem(STORAGE_KEY);
  if (current) {
    try {
      return { state: sanitizeState(JSON.parse(current), now), recovered: false };
    } catch {
      safeBackupCorrupted(storage, current);
      return { state: createDefaultState(now), recovered: true, message: 'تم تجاهل بيانات تالفة وفتح نسخة سليمة.' };
    }
  }

  for (const key of LEGACY_KEYS) {
    const value = storage.getItem(key);
    if (!value) continue;
    try {
      const migrated = migrateLegacy(JSON.parse(value), now);
      storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return { state: migrated, recovered: true, message: 'تم نقل بياناتك القديمة إلى النسخة الجديدة.' };
    } catch {
      safeBackupCorrupted(storage, value);
    }
  }
  return { state: createDefaultState(now), recovered: false };
}

export function saveState(state: RoutineState, storage: StorageLike = window.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function deleteDayData(state: RoutineState, date: `${number}-${number}-${number}`, includeOverrides: boolean): RoutineState {
  const days = { ...state.days };
  delete days[date];
  return {
    ...state,
    days,
    dateOverrides: includeOverrides ? removeOverridesForSingleDate(state.dateOverrides, date) : state.dateOverrides,
    workout: {
      ...state.workout,
      active: state.workout.active?.date === date ? null : state.workout.active,
      history: state.workout.history.filter((entry) => entry.date !== date),
    },
  };
}

export function sanitizeState(input: unknown, now = new Date()): RoutineState {
  if (!isRecord(input)) return createDefaultState(now);
  if (input.schemaVersion !== SCHEMA_VERSION) return migrateLegacy(input, now);
  const defaults = createDefaultState(now);
  const days: Record<string, DayRecord> = {};
  if (isRecord(input.days)) {
    for (const [date, value] of Object.entries(input.days)) {
      if (parseDateKey(date)) days[date] = sanitizeDayRecord(date as `${number}-${number}-${number}`, value);
    }
  }
  const workoutInput = isRecord(input.workout) ? input.workout : {};
  const startedOn = typeof workoutInput.startedOn === 'string' && parseDateKey(workoutInput.startedOn)
    ? workoutInput.startedOn as `${number}-${number}-${number}`
    : defaults.workout.startedOn;

  return {
    schemaVersion: SCHEMA_VERSION,
    baseSchedule: sanitizeBaseSchedule(input.baseSchedule) ?? defaults.baseSchedule,
    dateOverrides: sanitizeOverrides(input.dateOverrides),
    days: Object.keys(days).length > 0 ? days : defaults.days,
    workout: {
      startedOn,
      active: sanitizeActiveWorkout(workoutInput.active),
      history: Array.isArray(workoutInput.history) ? workoutInput.history.map(sanitizeHistoryEntry).filter(Boolean) as WorkoutHistoryEntry[] : [],
    },
    settings: sanitizeSettings(input.settings, defaults.settings),
  };
}

function migrateLegacy(input: unknown, now: Date): RoutineState {
  const defaults = createDefaultState(now);
  if (!isRecord(input)) return defaults;
  const today = toDateKey(now);
  const candidateDays = isRecord(input.days) ? input.days : isRecord(input.dailyData) ? input.dailyData : {};
  const days: Record<string, DayRecord> = {};

  for (const [date, value] of Object.entries(candidateDays)) {
    if (parseDateKey(date)) days[date] = sanitizeDayRecord(date as `${number}-${number}-${number}`, value);
  }

  if (Object.keys(days).length === 0 && isRecord(input.today)) {
    days[today] = sanitizeStandaloneToday(today, input.today);
  }

  if (Object.keys(days).length === 0 && (isRecord(input.prayers) || isRecord(input.timers))) {
    const record = createEmptyDayRecord(today);
    if (isRecord(input.prayers)) {
      for (const prayer of Object.keys(record.prayers) as PrayerId[]) record.prayers[prayer] = input.prayers[prayer] === true;
    }
    if (isRecord(input.timers)) {
      record.sessions.tahfiz = sanitizeTimer(input.timers.tahfiz);
      record.sessions.qudurat = sanitizeTimer(input.timers.qudurat ?? input.timers.qodurat);
    }
    days[today] = record;
  }

  const normalized: RoutineState = {
    ...defaults,
    schemaVersion: SCHEMA_VERSION,
    baseSchedule: sanitizeBaseSchedule(input.baseSchedule) ?? defaults.baseSchedule,
    dateOverrides: sanitizeOverrides(input.dateOverrides ?? input.overrides),
    days: Object.keys(days).length > 0 ? days : defaults.days,
    workout: isRecord(input.workout)
      ? {
          startedOn: typeof input.workout.startedOn === 'string' && parseDateKey(input.workout.startedOn)
            ? input.workout.startedOn as RoutineState['workout']['startedOn']
            : defaults.workout.startedOn,
          active: sanitizeActiveWorkout(input.workout.active),
          history: Array.isArray(input.workout.history) ? input.workout.history.map(sanitizeHistoryEntry).filter(Boolean) as WorkoutHistoryEntry[] : [],
        }
      : defaults.workout,
    settings: sanitizeSettings(input.settings, defaults.settings),
  };

  return normalized;
}

function sanitizeStandaloneToday(date: `${number}-${number}-${number}`, value: Record<string | number, any>): DayRecord {
  const day = sanitizeDayRecord(date, value);
  day.dayStartedAt = parseTimestamp(value.dayStartedAt);
  day.dayEndedAt = parseTimestamp(value.dayEndedAt);
  day.wakeTime = validClock(value.wakeTime);
  day.bedTime = validClock(value.bedTime);

  if (isRecord(value.study)) {
    day.qudurat = sanitizeQudurat({
      lessonName: value.study.lessonName,
      questions: value.study.questions,
      correct: value.study.correct,
      mistakesReviewed: value.study.mistakesReviewed,
    });
  }

  if (Array.isArray(value.logs)) {
    day.logs = value.logs.map((entry, index) => sanitizeLegacyLog(entry, index)).filter(Boolean) as DailyLog[];
  }

  return day;
}

function sanitizeDayRecord(date: `${number}-${number}-${number}`, value: unknown): DayRecord {
  const defaults = createEmptyDayRecord(date);
  if (!isRecord(value)) return defaults;

  const prayers = { ...defaults.prayers };
  if (isRecord(value.prayers)) {
    for (const prayer of Object.keys(prayers) as PrayerId[]) {
      const raw = value.prayers[prayer];
      prayers[prayer] = raw === true || (isRecord(raw) && raw.completed === true);
    }
  }

  const prayerDetails = { ...defaults.prayerDetails };
  const rawDetails = isRecord(value.prayerDetails) ? value.prayerDetails : isRecord(value.prayerMeta) ? value.prayerMeta : {};
  for (const prayer of Object.keys(prayerDetails) as PrayerId[]) {
    prayerDetails[prayer] = sanitizePrayerDetail(rawDetails[prayer]);
    if (isRecord(value.prayers) && isRecord(value.prayers[prayer])) {
      prayerDetails[prayer] = sanitizePrayerDetail({ ...prayerDetails[prayer], ...value.prayers[prayer] });
    }
  }

  const sessionsInput = isRecord(value.sessions) ? value.sessions : isRecord(value.timers) ? value.timers : {};

  const tahfiz = sanitizeTahfiz(
    isRecord(value.tahfiz)
      ? value.tahfiz
      : isRecord(value.tahfizTracking)
        ? value.tahfizTracking
        : {},
  );

  const qudurat = sanitizeQudurat(
    isRecord(value.qudurat)
      ? value.qudurat
      : isRecord(value.study)
        ? {
            lessonName: value.study.lessonName,
            questions: value.study.questions,
            correct: value.study.correct,
            mistakesReviewed: value.study.mistakesReviewed,
          }
        : {},
  );

  return {
    date,
    prayers,
    prayerDetails,
    sessions: {
      tahfiz: sanitizeTimer(sessionsInput.tahfiz),
      qudurat: sanitizeTimer(sessionsInput.qudurat ?? sessionsInput.qodurat),
    },
    sessionNotes: isRecord(value.sessionNotes) ? {
      tahfiz: typeof value.sessionNotes.tahfiz === 'string' ? value.sessionNotes.tahfiz.slice(0, 500) : undefined,
      qudurat: typeof value.sessionNotes.qudurat === 'string' ? value.sessionNotes.qudurat.slice(0, 500) : undefined,
    } : {},
    tahfiz: {
      ...tahfiz,
      note: tahfiz.note || (isRecord(value.sessionNotes) && typeof value.sessionNotes.tahfiz === 'string' ? value.sessionNotes.tahfiz.slice(0, 500) : ''),
    },
    qudurat,
    taskStatuses: isRecord(value.taskStatuses)
      ? Object.fromEntries(Object.entries(value.taskStatuses).filter(([, status]) => ['completed', 'skipped', 'cancelled', 'missed'].includes(String(status))))
      : {},
    movementCompleted: value.movementCompleted === true,
    dayStartedAt: parseTimestamp(value.dayStartedAt),
    dayEndedAt: parseTimestamp(value.dayEndedAt),
    wakeTime: validClock(value.wakeTime),
    bedTime: validClock(value.bedTime),
    logs: Array.isArray(value.logs) ? value.logs.map((entry, index) => sanitizeLegacyLog(entry, index)).filter(Boolean) as DailyLog[] : [],
    activeActivity: sanitizeActiveActivity(value.activeActivity),
    notes: typeof value.notes === 'string'
      ? value.notes.slice(0, 2000)
      : typeof value.note === 'string'
        ? value.note.slice(0, 2000)
        : '',
  };
}

function sanitizePrayerDetail(value: unknown): PrayerDetail {
  if (!isRecord(value)) return { ...EMPTY_PRAYER_DETAIL };
  const timing = ['on-time', 'late', 'unknown'].includes(String(value.timing))
    ? value.timing as PrayerDetail['timing']
    : value.onTime === true
      ? 'on-time'
      : value.onTime === false
        ? 'late'
        : 'unknown';
  const congregation = ['yes', 'no', 'not-applicable', 'unknown'].includes(String(value.congregation))
    ? value.congregation as PrayerDetail['congregation']
    : value.inCongregation === true
      ? 'yes'
      : value.inCongregation === false
        ? 'no'
        : 'unknown';

  return {
    performedAt: validClock(value.performedAt ?? value.time),
    timing,
    congregation,
    note: typeof value.note === 'string' ? value.note.slice(0, 300) : '',
  };
}

function sanitizeTahfiz(value: unknown): TahfizTracking {
  if (!isRecord(value)) return { ...EMPTY_TAHFIZ };
  const valid = ['unrecorded', 'attended', 'skipped-intentionally', 'excused', 'holiday', 'trip', 'missed'];
  const status = valid.includes(String(value.status)) ? value.status as TahfizTracking['status'] : 'unrecorded';
  return {
    status,
    newMemorization: typeof value.newMemorization === 'string' ? value.newMemorization.slice(0, 300) : '',
    review: typeof value.review === 'string' ? value.review.slice(0, 300) : '',
    recitation: typeof value.recitation === 'string' ? value.recitation.slice(0, 300) : '',
    mistakes: Math.max(0, Math.min(999, finiteNumber(value.mistakes))),
    note: typeof value.note === 'string' ? value.note.slice(0, 500) : '',
  };
}

function sanitizeQudurat(value: unknown): QuduratTracking {
  if (!isRecord(value)) return { ...EMPTY_QUDURAT };
  const questions = Math.max(0, Math.min(5000, Math.floor(finiteNumber(value.questions))));
  const correct = Math.max(0, Math.min(questions, Math.floor(finiteNumber(value.correct))));
  return {
    lessonName: typeof value.lessonName === 'string' ? value.lessonName.slice(0, 200) : '',
    questions,
    correct,
    mistakesReviewed: Math.max(0, Math.min(5000, Math.floor(finiteNumber(value.mistakesReviewed)))),
  };
}

function sanitizeLegacyLog(value: unknown, index: number): DailyLog | null {
  if (!isRecord(value)) return null;
  const kindCandidates = ['meal', 'water', 'prayer', 'shower', 'nap', 'free', 'custom'];
  const kind = kindCandidates.includes(String(value.kind))
    ? value.kind as DailyLog['kind']
    : value.category === 'free'
      ? 'free'
      : value.category === 'health' && String(value.label).includes('موية')
        ? 'water'
        : 'custom';
  const createdAt = parseTimestamp(value.createdAt ?? value.at ?? value.timestamp) ?? Date.now() + index;
  const label = typeof value.label === 'string' && value.label.trim()
    ? value.label.slice(0, 120)
    : 'سجل قديم';
  return {
    id: typeof value.id === 'string' ? value.id : `legacy-${createdAt}-${index}`,
    kind,
    label,
    createdAt,
    durationMinutes: Math.max(0, Math.min(1440, Math.floor(finiteNumber(value.durationMinutes)))),
    note: typeof value.note === 'string' ? value.note.slice(0, 500) : undefined,
  };
}

function sanitizeActiveActivity(value: unknown): ActiveDailyActivity | null {
  if (!isRecord(value) || typeof value.label !== 'string') return null;
  const startedAt = parseTimestamp(value.startedAt);
  if (!startedAt) return null;
  const validKinds = ['meal', 'water', 'prayer', 'shower', 'nap', 'free', 'custom'];
  return {
    id: typeof value.id === 'string' ? value.id : `activity-${startedAt}`,
    kind: validKinds.includes(String(value.kind)) ? value.kind as ActiveDailyActivity['kind'] : 'custom',
    label: value.label.slice(0, 120),
    startedAt,
  };
}

function sanitizeSettings(value: unknown, defaults: RoutineState['settings']): RoutineState['settings'] {
  const input = isRecord(value) ? value : {};
  return {
    userName: typeof input.userName === 'string' ? input.userName.slice(0, 60) : defaults.userName,
    reducedMotion: input.reducedMotion === true,
    lastSeenVersion: typeof input.lastSeenVersion === 'string' ? input.lastSeenVersion : defaults.lastSeenVersion,
    wakeTarget: validClock(input.wakeTarget) || defaults.wakeTarget,
    sleepTarget: validClock(input.sleepTarget) || defaults.sleepTarget,
    quduratTargetMinutes: boundedInteger(input.quduratTargetMinutes ?? input.studyTarget, 30, 300, defaults.quduratTargetMinutes),
    quduratQuestionTarget: boundedInteger(input.quduratQuestionTarget ?? input.questionTarget, 0, 5000, defaults.quduratQuestionTarget),
    workoutTargetMinutes: boundedInteger(input.workoutTargetMinutes ?? input.workoutTarget, 10, 180, defaults.workoutTargetMinutes),
  };
}

function boundedInteger(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = finiteNumber(value);
  if (!Number.isFinite(parsed) || parsed < min) return fallback;
  return Math.min(max, Math.floor(parsed));
}

function sanitizeOverrides(value: unknown): DateOverrideMap {
  if (!isRecord(value)) return {};
  const result: DateOverrideMap = {};
  const validTypes = new Set(['school-holiday', 'tahfiz-holiday', 'tahfiz-trip', 'official-holiday', 'custom-event', 'reschedule-task', 'cancel-task', 'postpone-task', 'add-task']);
  for (const values of Object.values(value)) {
    if (!Array.isArray(values)) continue;
    for (const candidate of values) {
      if (!isRecord(candidate) || typeof candidate.id !== 'string' || typeof candidate.type !== 'string' || !validTypes.has(candidate.type)) continue;
      if (typeof candidate.startDate !== 'string' || !parseDateKey(candidate.startDate)) continue;
      const override: DateOverride = {
        id: candidate.id,
        type: candidate.type as DateOverride['type'],
        startDate: candidate.startDate as DateOverride['startDate'],
        endDate: typeof candidate.endDate === 'string' && parseDateKey(candidate.endDate) && candidate.endDate >= candidate.startDate ? candidate.endDate as DateOverride['endDate'] : undefined,
        targetId: typeof candidate.targetId === 'string' ? candidate.targetId : undefined,
        title: typeof candidate.title === 'string' ? candidate.title.slice(0, 100) : undefined,
        startTime: typeof candidate.startTime === 'string' ? candidate.startTime : undefined,
        endTime: typeof candidate.endTime === 'string' ? candidate.endTime : undefined,
        note: typeof candidate.note === 'string' ? candidate.note.slice(0, 500) : undefined,
        createdAt: typeof candidate.createdAt === 'number' && Number.isFinite(candidate.createdAt) ? candidate.createdAt : 0,
      };
      result[override.startDate] = [...(result[override.startDate] ?? []), override];
    }
  }
  return result;
}

function sanitizeBaseSchedule(value: unknown): BaseSchedule | null {
  if (!isRecord(value)) return null;
  for (let day = 0; day < 7; day += 1) if (!Array.isArray(value[day])) return null;
  return value as unknown as BaseSchedule;
}

function sanitizeActiveWorkout(value: unknown): ActiveWorkout | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.date !== 'string' || !parseDateKey(value.date)) return null;
  if (!['A', 'B', 'C', 'D'].includes(String(value.workoutId))) return null;
  return {
    id: value.id,
    date: value.date as ActiveWorkout['date'],
    scheduledFor: typeof value.scheduledFor === 'string' && parseDateKey(value.scheduledFor) ? value.scheduledFor as ActiveWorkout['scheduledFor'] : value.date as ActiveWorkout['scheduledFor'],
    workoutId: value.workoutId as ActiveWorkout['workoutId'],
    timer: sanitizeTimer(value.timer),
    logs: sanitizeLogs(value.logs),
    rating: typeof value.rating === 'number' && value.rating >= 1 && value.rating <= 5 ? value.rating : null,
    note: typeof value.note === 'string' ? value.note.slice(0, 1000) : '',
    proudMoment: typeof value.proudMoment === 'string' ? value.proudMoment.slice(0, 500) : '',
  };
}

function sanitizeHistoryEntry(value: unknown): WorkoutHistoryEntry | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.date !== 'string' || !parseDateKey(value.date)) return null;
  if (!['A', 'B', 'C', 'D'].includes(String(value.workoutId))) return null;
  return {
    id: value.id,
    date: value.date as WorkoutHistoryEntry['date'],
    scheduledFor: typeof value.scheduledFor === 'string' && parseDateKey(value.scheduledFor) ? value.scheduledFor as WorkoutHistoryEntry['scheduledFor'] : value.date as WorkoutHistoryEntry['scheduledFor'],
    workoutId: value.workoutId as WorkoutHistoryEntry['workoutId'],
    cycle: positiveInteger(value.cycle, 1),
    week: Math.min(24, positiveInteger(value.week, 1)),
    durationMs: Math.max(0, finiteNumber(value.durationMs)),
    completedAt: Math.max(0, finiteNumber(value.completedAt)),
    logs: sanitizeLogs(value.logs),
    rating: typeof value.rating === 'number' && value.rating >= 1 && value.rating <= 5 ? value.rating : null,
    note: typeof value.note === 'string' ? value.note.slice(0, 1000) : '',
    proudMoment: typeof value.proudMoment === 'string' ? value.proudMoment.slice(0, 500) : '',
  };
}

function sanitizeLogs(value: unknown): Record<string, ExerciseLog> {
  if (!isRecord(value)) return {};
  const result: Record<string, ExerciseLog> = {};
  for (const [exerciseId, log] of Object.entries(value)) {
    if (!isRecord(log) || !Array.isArray(log.values)) continue;
    result[exerciseId] = {
      exerciseId,
      values: log.values.slice(0, 10).map((entry) => typeof entry === 'number' && Number.isFinite(entry) && entry >= 0 ? entry : null),
    };
  }
  return result;
}

function safeBackupCorrupted(storage: StorageLike, value: string): void {
  try {
    storage.setItem(`routine.app.corrupt.${Date.now()}`, value);
  } catch {
    // Recovery must continue even when storage is full or unavailable.
  }
}

function validClock(value: unknown): string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : '';
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === 'string' && value) {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function finiteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : Number.isFinite(Number(value)) ? Number(value) : 0;
}

function positiveInteger(value: unknown, fallback: number): number {
  const number = finiteNumber(value);
  return number > 0 ? Math.floor(number) : fallback;
}

function isRecord(value: unknown): value is Record<string | number, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
