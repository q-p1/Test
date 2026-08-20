import { describe, expect, it } from 'vitest';
import type { DateKey, WorkoutHistoryEntry, WorkoutState } from '../types';
import { createActiveWorkout, findNextUnfinishedWorkout, finishActiveWorkout, getBestExerciseValue, getCycleInfo } from './fitness';

function history(date: DateKey, scheduledFor: DateKey, workoutId: 'A' | 'B' | 'C' | 'D'): WorkoutHistoryEntry {
  return { id: `${scheduledFor}-${workoutId}`, date, scheduledFor, workoutId, cycle: 1, week: 1, durationMs: 1_000, completedAt: 1, logs: {}, rating: null, note: '', proudMoment: '' };
}

describe('long-term workout progression', () => {
  it('keeps missed B ahead of a scheduled C, then advances after catch-up', () => {
    const startedOn = '2026-08-16' as DateKey;
    const wednesday = '2026-08-19' as DateKey;
    let state: WorkoutState = { startedOn, active: null, history: [history(startedOn, startedOn, 'A')] };
    const next = findNextUnfinishedWorkout(state, wednesday);
    expect(next).toMatchObject({ workoutId: 'B', date: '2026-08-17', scheduledToday: 'C' });

    state = { ...state, active: createActiveWorkout('B', wednesday, next.date, 1_700_000_000_000) };
    state = finishActiveWorkout(state, 1_700_000_060_000);
    expect(state.history.at(-1)?.scheduledFor).toBe('2026-08-17');
    expect(findNextUnfinishedWorkout(state, wednesday).workoutId).toBe('C');
  });

  it('does not treat an intentionally cancelled occurrence as a missed workout', () => {
    const startedOn = '2026-08-16' as DateKey;
    const monday = '2026-08-17' as DateKey;
    const state: WorkoutState = { startedOn, active: null, history: [] };
    const next = findNextUnfinishedWorkout(state, monday, (date, workoutId) => date === startedOn && workoutId === 'A');
    expect(next).toMatchObject({ workoutId: 'B', date: monday });
  });

  it('moves from week 24 to cycle 2 week 1 without clearing history', () => {
    expect(getCycleInfo('2026-01-04' as DateKey, '2026-06-20' as DateKey)).toMatchObject({ cycle: 1, week: 24, phase: 'تثبيت وتقدم' });
    expect(getCycleInfo('2026-01-04' as DateKey, '2026-06-21' as DateKey)).toMatchObject({ cycle: 2, week: 1, phase: 'تأسيس وتقنية' });
  });

  it('finishes a session exactly once and retains logs', () => {
    const start = 1_700_000_000_000;
    let state: WorkoutState = { startedOn: '2026-08-16' as DateKey, active: createActiveWorkout('A', '2026-08-16' as DateKey, '2026-08-16' as DateKey, start), history: [] };
    if (state.active) state.active.logs.pushups!.values = [8, 7, 6];
    state = finishActiveWorkout(state, start + 30_000);
    state = finishActiveWorkout(state, start + 60_000);
    expect(state.history).toHaveLength(1);
    expect(state.history[0]?.logs.pushups?.values).toEqual([8, 7, 6]);
    expect(getBestExerciseValue(state.history, 'pushups')).toBe(8);
  });
});
