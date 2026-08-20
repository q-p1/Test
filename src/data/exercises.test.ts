import { describe, expect, it } from 'vitest';
import { EXERCISES, EXERCISE_MAP, WORKOUTS, WARMUP_IDS, exerciseRestLabel } from './exercises';

describe('PDF-backed exercise catalogue', () => {
  it('links only the 17 manually verified exercise entries to local PDF images', () => {
    expect(EXERCISES).toHaveLength(19);
    expect(new Set(EXERCISES.map((exercise) => exercise.id)).size).toBe(EXERCISES.length);

    const missing = EXERCISES.filter((exercise) => exercise.imageStatus === 'missing-source-pdf');
    expect(missing.map((exercise) => exercise.id)).toEqual(['dead-bug', 'reverse-lunge']);
    expect(missing.every((exercise) => exercise.image === undefined)).toBe(true);

    const verified = EXERCISES.filter((exercise) => exercise.imageStatus === 'verified-pdf');
    expect(verified).toHaveLength(17);
    expect(new Set(verified.map((exercise) => exercise.image)).size).toBe(16);
    for (const exercise of verified) {
      expect(exercise.image).toMatch(/^\.\/exercises\/[a-z-]+\.webp$/);
      expect(exercise.image).not.toMatch(/^https?:/);
    }
  });

  it('keeps the source plan sets, targets and rest prescriptions', () => {
    const expected: Record<string, [number, string, string]> = {
      pushups: [3, '6–12 تكرارًا', '60–90 ثانية'],
      'bodyweight-squats': [3, '10–15 تكرارًا', '60 ثانية'],
      'glute-bridge': [3, '12–15 تكرارًا', '45–60 ثانية'],
      'w-back-raise': [3, '8–12 تكرارًا', '45 ثانية'],
      'dead-bug': [3, '6–10 لكل جهة', '45 ثانية'],
      'pike-pushup': [3, '5–10 تكرارات', '60–90 ثانية'],
      'reverse-lunge': [3, '8–12 لكل رجل', '60 ثانية'],
      'single-leg-glute-bridge': [3, '8–12 لكل رجل', '60 ثانية'],
      'reverse-snow-angel': [3, '8–12 تكرارًا', '45 ثانية'],
      'side-plank': [3, '15–30 ثانية لكل جهة', '45 ثانية'],
      'incline-pushup': [3, '10–15 تكرارًا', '60 ثانية'],
      'split-squat': [3, '8–12 لكل رجل', '60 ثانية'],
      'hip-hinge': [3, '12–15 تكرارًا', '45–60 ثانية'],
      'bird-dog': [3, '6–10 لكل جهة', '45 ثانية'],
      'shoulder-taps': [3, '6–12 لكل جهة', '45–60 ثانية'],
    };

    for (const [id, [sets, target, rest]] of Object.entries(expected)) {
      const exercise = EXERCISE_MAP[id];
      if (!exercise) throw new Error(`Missing exercise definition: ${id}`);
      expect([exercise.sets, exercise.target, exerciseRestLabel(exercise)]).toEqual([sets, target, rest]);
    }
  });

  it('keeps four warm-ups and four resistance sessions without removing recovery days', () => {
    expect(WARMUP_IDS).toEqual(['alternating-knee-raises', 'shoulder-circles', 'light-squats', 'wall-pushups']);
    expect(WARMUP_IDS.map((id) => EXERCISE_MAP[id]?.sets)).toEqual([1, 1, 1, 1]);
    expect(Object.keys(WORKOUTS)).toEqual(['A', 'B', 'C', 'D']);
    expect(Object.values(WORKOUTS).every((workout) => workout.exerciseIds.length === 4)).toBe(true);
  });
});
