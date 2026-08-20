import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { addOverride, removeOverrideById, removeOverridesForSingleDate } from '../lib/schedule';
import { createActiveWorkout, finishActiveWorkout } from '../lib/fitness';
import { completeTimer, pauseTimer, resetTimer, startTimer } from '../lib/timer';
import { deleteDayData, getDayRecord, loadState, saveState } from '../lib/storage';
import { toDateKey } from '../lib/date';
import type {
  DateKey,
  DateOverride,
  PrayerId,
  RoutineState,
  SessionKind,
  TaskStatus,
  WorkoutId,
} from '../types';

type TimerCommand = 'start' | 'pause' | 'complete' | 'reset';

interface RoutineActions {
  togglePrayer(date: DateKey, prayer: PrayerId): void;
  updateSessionTimer(date: DateKey, session: SessionKind, command: TimerCommand, now?: number): void;
  updateSessionNote(date: DateKey, session: SessionKind, note: string): void;
  setTaskStatus(date: DateKey, taskId: string, status: TaskStatus | null): void;
  toggleMovement(date: DateKey): void;
  setDayNotes(date: DateKey, notes: string): void;
  addDateOverride(override: DateOverride): void;
  removeDateOverride(id: string): void;
  restoreDate(date: DateKey): void;
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
      updateState((current) => updateDay(current, date, (day) => ({
        ...day,
        prayers: { ...day.prayers, [prayer]: !day.prayers[prayer] },
      })));
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
        return { ...day, sessions: { ...day.sessions, [session]: nextTimer } };
      }));
    },
    updateSessionNote(date, session, note) {
      updateState((current) => updateDay(current, date, (day) => ({
        ...day,
        sessionNotes: { ...day.sessionNotes, [session]: note.slice(0, 500) },
      })));
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
