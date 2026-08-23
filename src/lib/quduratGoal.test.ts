import { describe, expect, it } from 'vitest';
import { calculateDayScore } from './dailyMetrics';
import { createDefaultState } from './storage';
import type { DateKey } from '../types';

const date = '2026-08-23' as DateKey;

describe('Qudurat timer goal', () => {
  it('scores the daily Qudurat goal from elapsed time, not question count', () => {
    const state = createDefaultState(new Date(2026, 7, 23, 12));
    const day = state.days[date]!;
    state.settings.quduratTargetMinutes = 60;
    state.settings.quduratQuestionTarget = 60;
    day.sessions.qudurat = { status: 'paused', accumulatedMs: 30 * 60_000, startedAt: null, completedAt: null };

    day.qudurat.questions = 0;
    const withoutQuestions = calculateDayScore(state, date, 1_000).earned;

    day.qudurat.questions = 500;
    day.qudurat.correct = 500;
    const withManyQuestions = calculateDayScore(state, date, 1_000).earned;

    expect(withManyQuestions).toBe(withoutQuestions);

    day.sessions.qudurat.accumulatedMs = 60 * 60_000;
    const atGoal = calculateDayScore(state, date, 1_000).earned;
    expect(atGoal).toBeGreaterThan(withoutQuestions);
  });
});
