import { describe, expect, it } from 'vitest';
import type { DateKey, WorkoutHistoryEntry } from '../types';
import { getOverridesForDate } from './schedule';
import { createDefaultState, deleteDayData, LEGACY_KEYS, loadState, saveState, STORAGE_KEY } from './storage';

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) { return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { this.data.set(key, value); }
  removeItem(key: string) { this.data.delete(key); }
}

const now = new Date(2026, 7, 20, 12, 0, 0);
const today = '2026-08-20' as DateKey;

describe('storage, migration and safe delete', () => {
  it('creates a valid fresh install and reloads an existing user', () => {
    const storage = new MemoryStorage();
    const fresh = loadState(storage, now);
    expect(fresh.recovered).toBe(false);
    expect(fresh.state.days[today]?.prayers.fajr).toBe(false);
    fresh.state.days[today]!.prayers.fajr = true;
    saveState(fresh.state, storage);
    expect(loadState(storage, now).state.days[today]?.prayers.fajr).toBe(true);
  });

  it('migrates a legacy prayer and timer shape without dropping data', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_KEYS[0]!, JSON.stringify({ prayers: { fajr: true }, timers: { tahfiz: { status: 'paused', accumulatedMs: 42_000 } } }));
    const result = loadState(storage, now);
    expect(result.recovered).toBe(true);
    expect(result.state.days[today]?.prayers.fajr).toBe(true);
    expect(result.state.days[today]?.sessions.tahfiz.accumulatedMs).toBe(42_000);
    expect(storage.getItem(STORAGE_KEY)).toBeTruthy();
  });

  it('backs up corrupted JSON and recovers gracefully', () => {
    const storage = new MemoryStorage();
    storage.setItem(STORAGE_KEY, '{broken');
    const result = loadState(storage, now);
    expect(result.recovered).toBe(true);
    expect([...storage.data.keys()].some((key) => key.startsWith('routine.app.corrupt.'))).toBe(true);
  });

  it('deletes only one date while preserving settings, older days, history and adjacent range dates', () => {
    const state = createDefaultState(now);
    state.settings.userName = 'د';
    state.days['2026-08-19'] = { ...state.days[today]!, date: '2026-08-19' as DateKey };
    state.days['2026-08-21'] = { ...state.days[today]!, date: '2026-08-21' as DateKey };
    state.dateOverrides['2026-08-19'] = [{ id: 'range', type: 'official-holiday', startDate: '2026-08-19' as DateKey, endDate: '2026-08-21' as DateKey, createdAt: 1 }];
    const oldHistory: WorkoutHistoryEntry = { id: 'old', date: '2026-08-19' as DateKey, scheduledFor: '2026-08-19' as DateKey, workoutId: 'C', cycle: 1, week: 1, durationMs: 10, completedAt: 1, logs: {}, rating: null, note: '', proudMoment: '' };
    const todayHistory: WorkoutHistoryEntry = { ...oldHistory, id: 'today', date: today, scheduledFor: today, workoutId: 'D' };
    state.workout.history = [oldHistory, todayHistory];
    const result = deleteDayData(state, today, true);
    expect(result.days[today]).toBeUndefined();
    expect(result.days['2026-08-19']).toBeTruthy();
    expect(result.days['2026-08-21']).toBeTruthy();
    expect(result.settings.userName).toBe('د');
    expect(result.workout.history.map((entry) => entry.id)).toEqual(['old']);
    expect(getOverridesForDate(result.dateOverrides, today)).toHaveLength(0);
    expect(getOverridesForDate(result.dateOverrides, '2026-08-19' as DateKey)).toHaveLength(1);
    expect(getOverridesForDate(result.dateOverrides, '2026-08-21' as DateKey)).toHaveLength(1);
  });
});
