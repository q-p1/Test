import type { PersistentTimer } from '../types';

const MAX_REASONABLE_SESSION_MS = 24 * 60 * 60 * 1000;

export function createIdleTimer(): PersistentTimer {
  return { status: 'idle', accumulatedMs: 0, startedAt: null, completedAt: null };
}

export function sanitizeTimer(value: unknown, now = Date.now()): PersistentTimer {
  if (!value || typeof value !== 'object') return createIdleTimer();
  const input = value as Partial<PersistentTimer>;
  const statuses = ['idle', 'running', 'paused', 'completed'];
  const status = statuses.includes(input.status ?? '') ? input.status as PersistentTimer['status'] : 'idle';
  const accumulatedMs = clampDuration(input.accumulatedMs);
  const validStartedAt = typeof input.startedAt === 'number'
    && Number.isFinite(input.startedAt)
    && input.startedAt > 0
    && input.startedAt <= now
    && now - input.startedAt <= MAX_REASONABLE_SESSION_MS;
  const startedAt = status === 'running' && validStartedAt ? input.startedAt as number : null;
  const completedAt = status === 'completed' && typeof input.completedAt === 'number' && Number.isFinite(input.completedAt)
    ? Math.min(input.completedAt, now)
    : null;

  if (status === 'running' && startedAt === null) {
    return { status: accumulatedMs > 0 ? 'paused' : 'idle', accumulatedMs, startedAt: null, completedAt: null };
  }
  return { status, accumulatedMs, startedAt, completedAt };
}

export function getElapsedMs(timer: PersistentTimer, now = Date.now()): number {
  const safe = sanitizeTimer(timer, now);
  if (safe.status !== 'running' || safe.startedAt === null) return safe.accumulatedMs;
  return clampDuration(safe.accumulatedMs + Math.max(0, now - safe.startedAt));
}

export function startTimer(timer: PersistentTimer, now = Date.now()): PersistentTimer {
  const safe = sanitizeTimer(timer, now);
  if (safe.status === 'running' || safe.status === 'completed') return safe;
  return { ...safe, status: 'running', startedAt: now, completedAt: null };
}

export function pauseTimer(timer: PersistentTimer, now = Date.now()): PersistentTimer {
  const safe = sanitizeTimer(timer, now);
  if (safe.status !== 'running') return safe;
  return { status: 'paused', accumulatedMs: getElapsedMs(safe, now), startedAt: null, completedAt: null };
}

export function completeTimer(timer: PersistentTimer, now = Date.now()): PersistentTimer {
  const safe = sanitizeTimer(timer, now);
  if (safe.status === 'completed') return safe;
  return { status: 'completed', accumulatedMs: getElapsedMs(safe, now), startedAt: null, completedAt: now };
}

export function resetTimer(): PersistentTimer {
  return createIdleTimer();
}

export function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.floor(Math.max(0, milliseconds) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function clampDuration(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.min(MAX_REASONABLE_SESSION_MS, Math.max(0, value));
}
