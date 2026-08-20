import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { addOverride, removeOverrideById, removeOverridesForSingleDate } from '../lib/schedule';
import { createActiveWorkout, finishActiveWorkout } from '../lib/fitness';
import { completeTimer, pauseTimer, resetTimer, startTimer } from '../lib/timer';
import { deleteDayData, getDayRecord, loadState, saveState } from '../lib/storage';
import { toDateKey } from '../lib/date';
import type {
  BaseScheduleItem,
  CongregationStatus,
  DailyLog,
  DailyLogKind,
  DateKey,
  DateOverride,
  PrayerId,
  PrayerTimingStatus,
  QuduratTracking,
  RoutineState,
  SessionKind,
  TahfizAttendanceStatus,
  TahfizTracking,
  TaskStatus,
  WorkoutId,
} from '../types';

type TimerCommand = 'start' | 'pause' | 'complete' | 'reset';

interface RoutineActions {
  togglePrayer(date: DateKey, prayer: PrayerId): void;
  updatePrayerDetail(date: DateKey, prayer: PrayerId, patch: {
    performedAt?: string;
    timing?: PrayerTimingStatus;
    congregation?: CongregationStatus;
    note?: string;
  }): void;
  updateSessionTimer(date: DateKey, session: SessionKind, command: TimerCommand, now?: number): void;
  updateSessionNote(date: DateKey, session: SessionKind, note: string): void;
  setTahfizStatus(date: DateKey, status: TahfizAttendanceStatus): void;
  updateTahfizTracking(date: DateKey, patch: Partial<Omit<TahfizTracking, 'status'>>): void;
  updateQuduratTracking(date: DateKey, patch: Partial<QuduratTracking>): void;
  startDay(date: DateKey, wakeTime: string, now?: number): void;
  endDay(date: DateKey, bedTime: string, now?: number): void;
  addDailyLog(date: DateKey, kind: DailyLogKind, label: string, note?: string, now?: number): void;
  startDailyActivity(date: DateKey, label: string, kind?: DailyLogKind, now?: number): void;
  finishDailyActivity(date: DateKey, now?: number): void;
  undoLastDailyLog(date: DateKey): void;
  setTaskStatus(date: DateKey, taskId: string, status: TaskStatus | null): void;
  toggleMovement(date: DateKey): void;
  setDayNotes(date: DateKey, notes: string): void;
  addDateOverride(override: DateOverride): void;
  removeDateOverride(id: string): void;
  restoreDate(date: DateKey): void;
  updateBaseScheduleTimes(itemId: string, startTime: string, endTime: string, weekdays?: number[]): void;
  addRecurringRoutine(title: string, startTime: string, endTime: string, weekdays: number[]): void;
  removeRecurringRoutine(itemId: string): void;
  startWorkout(workoutId: WorkoutId, scheduledFor: DateKey, date?: DateKey, now?: number): void;
  updateWorkoutTimer(command: Exclude<TimerCommand, 'reset'>, now?: number): void;
  updateWorkoutLog(exerciseId: string, setIndex: number, value: number | null): void;
  updateWorkoutMeta(field: 'rating' | 'note' | 'proudMoment', value: number | string | null): void;
  finishWorkout(now?: number): void;
  cancelWorkout(): void;
  deleteDate(date: DateKey, includeOverrides: boolean): void;
  updateSettings(patch: Partial<RoutineState['settings']>): void;
  dismissNotice(): void;
}

interface RoutineContextValue {
  state: RoutineState;
  actions: RoutineActions;
  notice: string | null;
  storageError: string | null;
}

const RoutineContext = createContext<RoutineContextValue | null>(null);

export function RoutineProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => loadState());
  const [state, setState] = useState(initial.state);
  const stateRef = useRef(initial.state);
  const [notice, setNotice] = useState<string | null>(initial.message ?? null);
  const [storageError, setStorageError] = useState<string | null>(null);

  const writeState = useCallback((next: RoutineState) => {
    try {
      saveState(next);
      window.setTimeout(() => setStorageError(null), 0);
    } catch {
      window.setTimeout(() => setStorageError('تعذّر حفظ آخر تغيير. قد تكون مساحة التخزين ممتلئة.'), 0);
    }
  }, []);

  const updateState = useCallback((updater: (current: RoutineState) => RoutineState) => {
    const current = stateRef.current;
    const next = updater(current);
    if (next === current) return;
    stateRef.current = next;
    writeState(next);
    setState(next);
  }, [writeState]);

  useEffect(() => {
    writeState(stateRef.current);
  }, [writeState]);

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = state.settings.reducedMotion ? 'true' : 'false';
  }, [state.settings.reducedMotion]);

  const actions = useMemo<RoutineActions>(() => ({
    togglePrayer(date, prayer) {
      updateState((current) => updateDay(current, date, (day) => {
        const nextDone = !day.prayers[prayer];
        const detail = day.prayerDetails[prayer];
        const shouldStamp = nextDone && !detail.performedAt && date === toDateKey(new Date());
        return {
          ...day,
          prayers: { ...day.prayers, [prayer]: nextDone },
          prayerDetails: {
            ...day.prayerDetails,
            [prayer]: {
              ...detail,
              performedAt: shouldStamp ? localClock(new Date()) : detail.performedAt,
            },
          },
        };
      }));
    },
    updatePrayerDetail(date, prayer, patch) {
      updateState((current) => updateDay(current, date, (day) => {
        const detail = day.prayerDetails[prayer];
        const performedAt = patch.performedAt !== undefined
          ? sanitizeClock(patch.performedAt)
          : detail.performedAt;
        const note = patch.note !== undefined ? patch.note.slice(0, 300) : detail.note;
        return {
          ...day,
          prayerDetails: {
            ...day.prayerDetails,
            [prayer]: {
              ...detail,
              ...patch,
              performedAt,
              note,
            },
          },
        };
      }));
    },
    updateSessionTimer(date, session, command, now = Date.now()) {
      updateState((current) => updateDay(current, date, (day) => {
        const timer = day.sessions[session];
        const nextTimer = command === 'start'
          ? startTimer(timer, now)
          : command === 'pause'
            ? pauseTimer(timer, now)
            : command === 'complete'
              ? completeTimer(timer, now)
              : resetTimer();

        const nextDay = { ...day, sessions: { ...day.sessions, [session]: nextTimer } };
        if (session === 'tahfiz' && command !== 'reset' && day.tahfiz.status === 'unrecorded') {
          nextDay.tahfiz = { ...day.tahfiz, status: 'attended' };
        }
        return nextDay;
      }));
    },
    updateSessionNote(date, session, note) {
      updateState((current) => updateDay(current, date, (day) => ({
        ...day,
        sessionNotes: { ...day.sessionNotes, [session]: note.slice(0, 500) },
        tahfiz: session === 'tahfiz' ? { ...day.tahfiz, note: note.slice(0, 500) } : day.tahfiz,
      })));
    },
    setTahfizStatus(date, status) {
      updateState((current) => updateDay(current, date, (day) => ({
        ...day,
        tahfiz: { ...day.tahfiz, status },
      })));
    },
    updateTahfizTracking(date, patch) {
      updateState((current) => updateDay(current, date, (day) => ({
        ...day,
        tahfiz: {
          ...day.tahfiz,
          ...patch,
          newMemorization: patch.newMemorization !== undefined ? patch.newMemorization.slice(0, 300) : day.tahfiz.newMemorization,
          review: patch.review !== undefined ? patch.review.slice(0, 300) : day.tahfiz.review,
          recitation: patch.recitation !== undefined ? patch.recitation.slice(0, 300) : day.tahfiz.recitation,
          mistakes: patch.mistakes !== undefined ? Math.max(0, Math.min(999, Math.floor(Number(patch.mistakes) || 0))) : day.tahfiz.mistakes,
          note: patch.note !== undefined ? patch.note.slice(0, 500) : day.tahfiz.note,
        },
        sessionNotes: patch.note !== undefined
          ? { ...day.sessionNotes, tahfiz: patch.note.slice(0, 500) }
          : day.sessionNotes,
      })));
    },
    updateQuduratTracking(date, patch) {
      updateState((current) => updateDay(current, date, (day) => {
        const questions = patch.questions !== undefined
          ? Math.max(0, Math.min(5000, Math.floor(Number(patch.questions) || 0)))
          : day.qudurat.questions;
        const requestedCorrect = patch.correct !== undefined
          ? Math.max(0, Math.floor(Number(patch.correct) || 0))
          : day.qudurat.correct;
        const correct = Math.min(questions, requestedCorrect);
        const mistakesReviewed = patch.mistakesReviewed !== undefined
          ? Math.max(0, Math.min(5000, Math.floor(Number(patch.mistakesReviewed) || 0)))
          : day.qudurat.mistakesReviewed;
        return {
          ...day,
          qudurat: {
            lessonName: patch.lessonName !== undefined ? patch.lessonName.slice(0, 200) : day.qudurat.lessonName,
            questions,
            correct,
            mistakesReviewed,
          },
        };
      }));
    },
    startDay(date, wakeTime, now = Date.now()) {
      updateState((current) => updateDay(current, date, (day) => {
        if (day.dayStartedAt) return day;
        const clock = sanitizeClock(wakeTime);
        const log: DailyLog = {
          id: `day-start-${now}`,
          kind: 'custom',
          label: `بدأ يومي${clock ? ` — صحيت ${clock}` : ''}`,
          createdAt: now,
        };
        return {
          ...day,
          dayStartedAt: now,
          wakeTime: clock,
          logs: [...day.logs, log].slice(-500),
        };
      }));
    },
    endDay(date, bedTime, now = Date.now()) {
      updateState((current) => updateDay(current, date, (day) => {
        if (day.dayEndedAt) return day;
        const clock = sanitizeClock(bedTime);
        const active = day.activeActivity;
        const logs = [...day.logs];
        if (active) {
          logs.push({
            id: `done-${active.id}-${now}`,
            kind: active.kind,
            label: active.label,
            createdAt: now,
            durationMinutes: Math.max(1, Math.round(Math.max(0, now - active.startedAt) / 60_000)),
          });
        }
        logs.push({ id: `day-end-${now}`, kind: 'custom', label: `قفلت يومي${clock ? ` — نوم ${clock}` : ''}`, createdAt: now });
        return { ...day, dayEndedAt: now, bedTime: clock, activeActivity: null, logs: logs.slice(-500) };
      }));
    },
    addDailyLog(date, kind, label, note = '', now = Date.now()) {
      updateState((current) => updateDay(current, date, (day) => ({
        ...day,
        logs: [
          ...day.logs,
          {
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `log-${now}-${day.logs.length}`,
            kind,
            label: label.trim().slice(0, 120) || 'سجل',
            createdAt: now,
            note: note.trim().slice(0, 500) || undefined,
          },
        ].slice(-500),
      })));
    },
    startDailyActivity(date, label, kind = 'custom', now = Date.now()) {
      updateState((current) => updateDay(current, date, (day) => {
        if (day.activeActivity || !label.trim()) return day;
        return {
          ...day,
          activeActivity: {
            id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `activity-${now}`,
            kind,
            label: label.trim().slice(0, 120),
            startedAt: now,
          },
        };
      }));
    },
    finishDailyActivity(date, now = Date.now()) {
      updateState((current) => updateDay(current, date, (day) => {
        const active = day.activeActivity;
        if (!active) return day;
        const durationMinutes = Math.max(1, Math.round(Math.max(0, now - active.startedAt) / 60_000));
        return {
          ...day,
          activeActivity: null,
          logs: [
            ...day.logs,
            {
              id: `done-${active.id}-${now}`,
              kind: active.kind,
              label: active.label,
              createdAt: now,
              durationMinutes,
            },
          ].slice(-500),
        };
      }));
    },
    undoLastDailyLog(date) {
      updateState((current) => updateDay(current, date, (day) => day.logs.length
        ? { ...day, logs: day.logs.slice(0, -1) }
        : day));
    },
    setTaskStatus(date, taskId, status) {
      updateState((current) => updateDay(current, date, (day) => {
        const taskStatuses = { ...day.taskStatuses };
        if (status === null) delete taskStatuses[taskId];
        else taskStatuses[taskId] = status;
        return { ...day, taskStatuses };
      }));
    },
    toggleMovement(date) {
      updateState((current) => updateDay(current, date, (day) => ({ ...day, movementCompleted: !day.movementCompleted })));
    },
    setDayNotes(date, notes) {
      updateState((current) => updateDay(current, date, (day) => ({ ...day, notes: notes.slice(0, 2000) })));
    },
    addDateOverride(override) {
      updateState((current) => ({ ...current, dateOverrides: addOverride(current.dateOverrides, override) }));
    },
    removeDateOverride(id) {
      updateState((current) => ({ ...current, dateOverrides: removeOverrideById(current.dateOverrides, id) }));
    },
    restoreDate(date) {
      updateState((current) => ({ ...current, dateOverrides: removeOverridesForSingleDate(current.dateOverrides, date) }));
    },
    updateBaseScheduleTimes(itemId, startTime, endTime, weekdays = [0, 1, 2, 3, 4, 5, 6]) {
      const start = sanitizeClock(startTime);
      const end = sanitizeClock(endTime);
      if (!start || !end || start >= end) return;
      updateState((current) => ({
        ...current,
        baseSchedule: Object.fromEntries(Object.entries(current.baseSchedule).map(([dayKey, items]) => {
          const day = Number(dayKey);
          if (!weekdays.includes(day)) return [day, items];
          return [day, items.map((item) => item.id === itemId ? { ...item, startTime: start, endTime: end } : item)];
        })) as RoutineState['baseSchedule'],
      }));
    },
    addRecurringRoutine(title, startTime, endTime, weekdays) {
      const cleanTitle = title.trim().slice(0, 100);
      const start = sanitizeClock(startTime);
      const end = sanitizeClock(endTime);
      const days = [...new Set(weekdays.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))];
      if (!cleanTitle || !start || !end || start >= end || days.length === 0) return;
      const id = `recurring-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: BaseScheduleItem = { id, title: cleanTitle, kind: 'custom', startTime: start, endTime: end, note: 'فقرة ثابتة أضفتها أنت' };
      updateState((current) => ({
        ...current,
        baseSchedule: Object.fromEntries(Object.entries(current.baseSchedule).map(([dayKey, items]) => {
          const day = Number(dayKey);
          return [day, days.includes(day) ? [...items, item].sort((a, b) => a.startTime.localeCompare(b.startTime)) : items];
        })) as RoutineState['baseSchedule'],
      }));
    },
    removeRecurringRoutine(itemId) {
      if (!itemId.startsWith('recurring-')) return;
      updateState((current) => ({
        ...current,
        baseSchedule: Object.fromEntries(Object.entries(current.baseSchedule).map(([dayKey, items]) => [Number(dayKey), items.filter((item) => item.id !== itemId)])) as RoutineState['baseSchedule'],
      }));
    },
    startWorkout(workoutId, scheduledFor, date = toDateKey(new Date()), now = Date.now()) {
      updateState((current) => current.workout.active
        ? current
        : { ...current, workout: { ...current.workout, active: createActiveWorkout(workoutId, date, scheduledFor, now) } });
    },
    updateWorkoutTimer(command, now = Date.now()) {
      updateState((current) => {
        const active = current.workout.active;
        if (!active) return current;
        const timer = command === 'start'
          ? startTimer(active.timer, now)
          : command === 'pause'
            ? pauseTimer(active.timer, now)
            : completeTimer(active.timer, now);
        return { ...current, workout: { ...current.workout, active: { ...active, timer } } };
      });
    },
    updateWorkoutLog(exerciseId, setIndex, value) {
      updateState((current) => {
        const active = current.workout.active;
        const log = active?.logs[exerciseId];
        if (!active || !log || setIndex < 0 || setIndex >= log.values.length) return current;
        const values = [...log.values];
        values[setIndex] = value === null ? null : Math.max(0, Math.min(999, value));
        return {
          ...current,
          workout: {
            ...current.workout,
            active: { ...active, logs: { ...active.logs, [exerciseId]: { ...log, values } } },
          },
        };
      });
    },
    updateWorkoutMeta(field, value) {
      updateState((current) => {
        const active = current.workout.active;
        if (!active) return current;
        if (field === 'rating') {
          const rating = typeof value === 'number' && value >= 1 && value <= 5 ? value : null;
          return { ...current, workout: { ...current.workout, active: { ...active, rating } } };
        }
        const text = typeof value === 'string' ? value : '';
        return { ...current, workout: { ...current.workout, active: { ...active, [field]: text } } };
      });
    },
    finishWorkout(now = Date.now()) {
      updateState((current) => ({ ...current, workout: finishActiveWorkout(current.workout, now) }));
    },
    cancelWorkout() {
      updateState((current) => ({ ...current, workout: { ...current.workout, active: null } }));
    },
    deleteDate(date, includeOverrides) {
      updateState((current) => deleteDayData(current, date, includeOverrides));
      setNotice('حُذفت بيانات هذا اليوم فقط.');
    },
    updateSettings(patch) {
      updateState((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
    },
    dismissNotice() {
      setNotice(null);
    },
  }), [updateState]);

  const value = useMemo(() => ({ state, actions, notice, storageError }), [state, actions, notice, storageError]);
  return <RoutineContext.Provider value={value}>{children}</RoutineContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRoutine(): RoutineContextValue {
  const value = useContext(RoutineContext);
  if (!value) throw new Error('useRoutine must be used within RoutineProvider');
  return value;
}

function updateDay(
  state: RoutineState,
  date: DateKey,
  updater: (day: ReturnType<typeof getDayRecord>) => ReturnType<typeof getDayRecord>,
): RoutineState {
  const day = getDayRecord(state, date);
  return { ...state, days: { ...state.days, [date]: updater(day) } };
}

function sanitizeClock(value: string): string {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : '';
}

function localClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
