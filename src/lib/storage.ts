import { createDefaultBaseSchedule } from '../data/baseSchedule';
import { toDateKey, parseDateKey } from './date';
import { removeOverridesForSingleDate } from './schedule';
import { createIdleTimer, sanitizeTimer } from './timer';
import type {
  ActiveWorkout,
  BaseSchedule,
  DateOverride,
  DateOverrideMap,
  DayRecord,
  ExerciseLog,
  LoadResult,
  PrayerId,
  RoutineState,
  WorkoutHistoryEntry,
} from '../types';
import { SCHEMA_VERSION } from '../types';

export const STORAGE_KEY = 'routine.app.state';
export const LEGACY_KEYS = ['routine7-state', 'routineState', 'routine-data', 'myRoutineData'];

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createEmptyDayRecord(date: `${number}-${number}-${number}`): DayRecord {
  return {
    date,
    prayers: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false },
    sessions: { tahfiz: createIdleTimer(), qudurat: createIdleTimer() },
    sessionNotes: {},
    taskStatuses: {},
    movementCompleted: false,
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
    settings: { userName: '', reducedMotion: false, lastSeenVersion: '1.0.0' },
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
    settings: {
      userName: isRecord(input.settings) && typeof input.settings.userName === 'string' ? input.settings.userName.slice(0, 60) : '',
      reducedMotion: isRecord(input.settings) && input.settings.reducedMotion === true,
      lastSeenVersion: isRecord(input.settings) && typeof input.settings.lastSeenVersion === 'string' ? input.settings.lastSeenVersion : '1.0.0',
    },
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

  return sanitizeState({
    ...defaults,
    schemaVersion: SCHEMA_VERSION,
    baseSchedule: input.baseSchedule ?? defaults.baseSchedule,
    dateOverrides: input.dateOverrides ?? input.overrides ?? {},
    days: Object.keys(days).length > 0 ? days : defaults.days,
    workout: isRecord(input.workout) ? input.workout : defaults.workout,
    settings: isRecord(input.settings) ? input.settings : defaults.settings,
  }, now);
}

function sanitizeDayRecord(date: `${number}-${number}-${number}`, value: unknown): DayRecord {
  const defaults = createEmptyDayRecord(date);
  if (!isRecord(value)) return defaults;
  const prayers = { ...defaults.prayers };
  if (isRecord(value.prayers)) {
    for (const prayer of Object.keys(prayers) as PrayerId[]) prayers[prayer] = value.prayers[prayer] === true;
  }
  const sessionsInput = isRecord(value.sessions) ? value.sessions : isRecord(value.timers) ? value.timers : {};
  return {
    date,
    prayers,
    sessions: {
      tahfiz: sanitizeTimer(sessionsInput.tahfiz),
      qudurat: sanitizeTimer(sessionsInput.qudurat ?? sessionsInput.qodurat),
    },
    sessionNotes: isRecord(value.sessionNotes) ? {
      tahfiz: typeof value.sessionNotes.tahfiz === 'string' ? value.sessionNotes.tahfiz.slice(0, 500) : undefined,
      qudurat: typeof value.sessionNotes.qudurat === 'string' ? value.sessionNotes.qudurat.slice(0, 500) : undefined,
    } : {},
    taskStatuses: isRecord(value.taskStatuses) ? Object.fromEntries(Object.entries(value.taskStatuses).filter(([, status]) => ['completed', 'skipped', 'cancelled', 'missed'].includes(String(status)))) : {},
    movementCompleted: value.movementCompleted === true,
    notes: typeof value.notes === 'string' ? value.notes.slice(0, 2000) : '',
  };
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

function finiteNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function positiveInteger(value: unknown, fallback: number): number {
  const number = finiteNumber(value);
  return number > 0 ? Math.floor(number) : fallback;
}

function isRecord(value: unknown): value is Record<string | number, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
