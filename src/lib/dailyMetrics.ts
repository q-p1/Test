import { addDays, toDateKey } from './date';
import { resolveDay } from './schedule';
import { getDayRecord } from './storage';
import { getElapsedMs } from './timer';
import type { DateKey, RoutineState } from '../types';

export interface DailyScore {
  score: number;
  earned: number;
  total: number;
}

export interface WeekSnapshot {
  averageScore: number;
  studyMinutes: number;
  workoutDays: number;
  prayers: number;
  loggedEvents: number;
}

export function calculateDayScore(state: RoutineState, date: DateKey, now = Date.now()): DailyScore {
  const day = getDayRecord(state, date);
  const resolved = resolveDay(state.baseSchedule, state.dateOverrides, date);
  let earned = 0;
  let total = 0;

  for (const item of resolved.items.filter((entry) => entry.kind === 'prayer' && entry.prayerId && entry.status !== 'cancelled')) {
    total += 6;
    if (item.prayerId && day.prayers[item.prayerId]) earned += 6;
  }

  const tahfiz = resolved.items.find((item) => item.kind === 'tahfiz');
  if (tahfiz && tahfiz.status !== 'cancelled' && !['excused', 'holiday'].includes(day.tahfiz.status)) {
    total += 20;
    if (day.sessions.tahfiz.status === 'completed' || ['attended', 'trip'].includes(day.tahfiz.status)) earned += 20;
  }

  const qudurat = resolved.items.find((item) => item.kind === 'qudurat');
  if (qudurat && qudurat.status !== 'cancelled') {
    total += 30;
    const targetMs = Math.max(15, state.settings.quduratTargetMinutes) * 60_000;
    const timeRatio = Math.min(1, getElapsedMs(day.sessions.qudurat, now) / targetMs);
    earned += 30 * timeRatio;
  }

  const workout = resolved.items.find((item) => item.kind === 'workout');
  const movement = resolved.items.find((item) => item.kind === 'movement');
  if (workout && workout.status !== 'cancelled') {
    total += 15;
    if (state.workout.history.some((entry) => entry.date === date)) earned += 15;
  } else if (movement && movement.status !== 'cancelled') {
    total += 15;
    if (day.movementCompleted) earned += 15;
  }

  total += 10;
  if (day.dayStartedAt) earned += 5;
  if (day.dayEndedAt) earned += 5;

  return { score: total > 0 ? Math.round((earned / total) * 100) : 0, earned, total };
}

export function calculateStreak(state: RoutineState, date: DateKey, now = Date.now()): number {
  const today = toDateKey(new Date(now));
  const selected = getDayRecord(state, date);
  let cursor = date === today && !selected.dayEndedAt ? addDays(date, -1) : date;
  let streak = 0;
  for (let index = 0; index < 120; index += 1) {
    if (!state.days[cursor]) break;
    if (calculateDayScore(state, cursor, now).score < 60) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getWeekSnapshot(state: RoutineState, date: DateKey, now = Date.now()): WeekSnapshot {
  const dates = Array.from({ length: 7 }, (_, index) => addDays(date, index - 6));
  let scoreTotal = 0;
  let studyMinutes = 0;
  let prayers = 0;
  let loggedEvents = 0;

  for (const key of dates) {
    const day = getDayRecord(state, key);
    scoreTotal += calculateDayScore(state, key, now).score;
    studyMinutes += Math.round(getElapsedMs(day.sessions.qudurat, now) / 60_000);
    prayers += Object.values(day.prayers).filter(Boolean).length;
    loggedEvents += day.logs.length;
  }

  return {
    averageScore: Math.round(scoreTotal / dates.length),
    studyMinutes,
    workoutDays: state.workout.history.filter((entry) => entry.date >= dates[0]! && entry.date <= dates[6]!).length,
    prayers,
    loggedEvents,
  };
}
