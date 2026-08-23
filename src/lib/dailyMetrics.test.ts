import { describe, expect, it } from 'vitest';
import { calculateDayScore } from './dailyMetrics';
import { createDefaultState } from './storage';
import type { DateKey } from '../types';

const date = '2026-08-17' as DateKey;

describe('time-based Qudurat goal', () => {
  it('scores Qudurat from study time only, not question count', () => {
    const state = createDefaultState(new Date(2026, 7, 17, 12));
    const day = state.days[date]!;
    state.settings.quduratTargetMinutes = 60;
    state.settings.quduratQuestionTarget = 1;
    day.sessions.qudurat = { status: 'paused', accumulatedMs: 30 * 60_000, startedAt: null, completedAt: null };

    day.qudurat.questions = 0;
    const withoutQuestions = calculateDayScore(state, date, 1_000_000);

    day.qudurat.questions = 500;
    day.qudurat.correct = 500;
    const withQuestions = calculateDayScore(state, date, 1_000_000);

    expect(withQuestions.score).toBe(withoutQuestions.score);
    expect(withQuestions.earned).toBe(withoutQuestions.earned);

    day.sessions.qudurat.accumulatedMs = 60 * 60_000;
    const atGoal = calculateDayScore(state, date, 1_000_000);
    expect(atGoal.earned - withQuestions.earned).toBeCloseTo(15, 5);
  });
});
