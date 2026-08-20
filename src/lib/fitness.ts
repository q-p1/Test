import { WORKOUTS } from '../data/exercises';
import { addDays, compareDateKeys, differenceInCalendarDays, startOfWeekSunday } from './date';
import { completeTimer, createIdleTimer, getElapsedMs } from './timer';
import type {
  ActiveWorkout,
  DateKey,
  ExerciseLog,
  WorkoutHistoryEntry,
  WorkoutId,
  WorkoutState,
} from '../types';

const WORKOUT_BY_WEEKDAY: Partial<Record<number, WorkoutId>> = { 0: 'A', 1: 'B', 3: 'C', 4: 'D' };

export interface CycleInfo {
  cycle: number;
  week: number;
  phase: 'تأسيس وتقنية' | 'زيادة تدريجية' | 'تنويعات أصعب' | 'تثبيت وتقدم';
}

export interface NextWorkout {
  workoutId: WorkoutId;
  date: DateKey;
  scheduledToday: WorkoutId | null;
  cycle: number;
  week: number;
}

export type WorkoutDismissedPredicate = (date: DateKey, workoutId: WorkoutId) => boolean;

export function scheduledWorkoutForDate(date: DateKey): WorkoutId | null {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return WORKOUT_BY_WEEKDAY[parsed.getDay()] ?? null;
}

export function getCycleInfo(startedOn: DateKey, date: DateKey): CycleInfo {
  const anchor = startOfWeekSunday(startedOn);
  const elapsedDays = Math.max(0, differenceInCalendarDays(date, anchor));
  const absoluteWeek = Math.floor(elapsedDays / 7);
  const cycle = Math.floor(absoluteWeek / 24) + 1;
  const week = (absoluteWeek % 24) + 1;
  const phase = week <= 6
    ? 'تأسيس وتقنية'
    : week <= 12
      ? 'زيادة تدريجية'
      : week <= 18
        ? 'تنويعات أصعب'
        : 'تثبيت وتقدم';
  return { cycle, week, phase };
}

export function findNextUnfinishedWorkout(workout: WorkoutState, today: DateKey, isDismissed: WorkoutDismissedPredicate = () => false): NextWorkout {
  const completed = new Set(workout.history.map((entry) => `${entry.scheduledFor}:${entry.workoutId}`));
  const scheduledToday = scheduledWorkoutForDate(today);
  let cursor = workout.startedOn;
  const maxPastDays = Math.max(0, differenceInCalendarDays(today, workout.startedOn));

  for (let offset = 0; offset <= maxPastDays; offset += 1) {
    const workoutId = scheduledWorkoutForDate(cursor);
    if (workoutId && !completed.has(`${cursor}:${workoutId}`) && !isDismissed(cursor, workoutId)) {
      return { workoutId, date: cursor, scheduledToday, ...getCycleInfo(workout.startedOn, cursor) };
    }
    cursor = addDays(cursor, 1);
  }

  cursor = compareDateKeys(cursor, today) <= 0 ? addDays(today, 1) : cursor;
  for (let offset = 0; offset < 14; offset += 1) {
    const workoutId = scheduledWorkoutForDate(cursor);
    if (workoutId) return { workoutId, date: cursor, scheduledToday, ...getCycleInfo(workout.startedOn, cursor) };
    cursor = addDays(cursor, 1);
  }

  return { workoutId: 'A', date: today, scheduledToday, ...getCycleInfo(workout.startedOn, today) };
}

export function createActiveWorkout(workoutId: WorkoutId, date: DateKey, scheduledFor = date, now = Date.now()): ActiveWorkout {
  const logs = Object.fromEntries(WORKOUTS[workoutId].exerciseIds.map((exerciseId) => [
    exerciseId,
    { exerciseId, values: [null, null, null] } satisfies ExerciseLog,
  ]));
  return {
    id: `workout-${date}-${workoutId}-${now}`,
    date,
    scheduledFor,
    workoutId,
    timer: { ...createIdleTimer(), status: 'running', startedAt: now },
    logs,
    rating: null,
    note: '',
    proudMoment: '',
  };
}

export function finishActiveWorkout(state: WorkoutState, now = Date.now()): WorkoutState {
  const active = state.active;
  if (!active) return state;
  if (state.history.some((entry) => entry.id === active.id)) return { ...state, active: null };
  const timer = completeTimer(active.timer, now);
  const cycle = getCycleInfo(state.startedOn, active.scheduledFor);
  const historyEntry: WorkoutHistoryEntry = {
    id: active.id,
    date: active.date,
    scheduledFor: active.scheduledFor,
    workoutId: active.workoutId,
    cycle: cycle.cycle,
    week: cycle.week,
    durationMs: getElapsedMs(timer, now),
    completedAt: now,
    logs: active.logs,
    rating: active.rating,
    note: active.note,
    proudMoment: active.proudMoment,
  };
  return { ...state, active: null, history: [...state.history, historyEntry] };
}

export function getWeeklyWorkoutHistory(state: WorkoutState, date: DateKey): WorkoutHistoryEntry[] {
  const start = startOfWeekSunday(date);
  const end = addDays(start, 6);
  return state.history.filter((entry) => entry.date >= start && entry.date <= end);
}

export function getBestExerciseValue(history: WorkoutHistoryEntry[], exerciseId: string): number | null {
  const values = history.flatMap((entry) => entry.logs[exerciseId]?.values ?? []).filter((value): value is number => typeof value === 'number');
  return values.length > 0 ? Math.max(...values) : null;
}
