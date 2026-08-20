import { describe, expect, it } from 'vitest';
import { completeTimer, createIdleTimer, getElapsedMs, pauseTimer, sanitizeTimer, startTimer } from './timer';

describe('timestamp based timers', () => {
  const start = 1_700_000_000_000;

  it('keeps elapsed time after serialization and forty minutes away', () => {
    const running = startTimer(createIdleTimer(), start);
    const restored = JSON.parse(JSON.stringify(running));
    expect(getElapsedMs(restored, start + 40 * 60_000)).toBe(40 * 60_000);
  });

  it('accumulates pause and resume segments without doubling', () => {
    const first = startTimer(createIdleTimer(), start);
    const paused = pauseTimer(first, start + 10_000);
    expect(getElapsedMs(paused, start + 60_000)).toBe(10_000);
    const resumed = startTimer(paused, start + 60_000);
    const completed = completeTimer(resumed, start + 65_000);
    expect(completed.accumulatedMs).toBe(15_000);
    expect(completeTimer(completed, start + 80_000)).toEqual(completed);
  });

  it('recovers from negative, future, and implausible timestamps', () => {
    expect(sanitizeTimer({ status: 'running', accumulatedMs: -10, startedAt: start + 5_000, completedAt: null }, start)).toMatchObject({ status: 'idle', accumulatedMs: 0, startedAt: null });
    expect(sanitizeTimer({ status: 'running', accumulatedMs: 5_000, startedAt: start - 25 * 60 * 60_000, completedAt: null }, start)).toMatchObject({ status: 'paused', accumulatedMs: 5_000, startedAt: null });
  });
});
