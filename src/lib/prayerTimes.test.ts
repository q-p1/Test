import { describe, expect, it } from 'vitest';
import { calculatePrayerSchedule, formatCountdown, IQAMA_DELAYS, PRAYER_ORDER } from './prayerTimes';

const date = '2026-08-21' as const;

describe('location prayer schedule', () => {
  it('uses Umm al-Qura inside Saudi Arabia and preserves requested iqama delays', () => {
    const result = calculatePrayerSchedule(date, 24.7136, 46.6753);
    expect(result?.method).toBe('umm-al-qura');
    expect(result).not.toBeNull();
    for (const id of PRAYER_ORDER) {
      const prayer = result!.schedule[id];
      expect(Math.round((prayer.iqamaAt - prayer.adhanAt) / 60_000)).toBe(IQAMA_DELAYS[id]);
    }
  });

  it('uses the global calculation method outside Saudi Arabia', () => {
    expect(calculatePrayerSchedule(date, 51.5074, -0.1278)?.method).toBe('muslim-world-league');
  });

  it('formats a live countdown without negative values', () => {
    expect(formatCountdown(3_661_000)).toBe('01:01:01');
    expect(formatCountdown(-5_000)).toBe('00:00:00');
  });
});
