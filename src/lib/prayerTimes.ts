import { addDays, parseDateKey } from './date';
import type { DateKey, PrayerId, ResolvedScheduleItem } from '../types';

export const IQAMA_DELAYS: Record<PrayerId, number> = {
  fajr: 25,
  dhuhr: 20,
  asr: 20,
  maghrib: 15,
  isha: 20,
};

export const PRAYER_NAMES: Record<PrayerId, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export const PRAYER_ORDER: PrayerId[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export interface PrayerTimeEntry {
  id: PrayerId;
  adhan: string;
  iqama: string;
  adhanAt: number;
  iqamaAt: number;
  iqamaDelayMinutes: number;
}

export type PrayerSchedule = Record<PrayerId, PrayerTimeEntry>;
export type PrayerCalculationMethod = 'umm-al-qura' | 'muslim-world-league';

export interface CalculatedPrayerSchedule {
  schedule: PrayerSchedule;
  method: PrayerCalculationMethod;
}

export interface PrayerCountdown {
  kind: 'adhan' | 'iqama';
  prayerId: PrayerId;
  targetAt: number;
  remainingMs: number;
}

export function calculatePrayerSchedule(dateKey: DateKey, latitude: number, longitude: number): CalculatedPrayerSchedule | null {
  const date = parseDateKey(dateKey);
  if (!date || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const method: PrayerCalculationMethod = isWithinSaudiArabia(latitude, longitude) ? 'umm-al-qura' : 'muslim-world-league';
  const dayOfYear = getDayOfYear(date);
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1);
  const equationOfTime = 229.18 * (
    0.000075
    + 0.001868 * Math.cos(gamma)
    - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma)
    - 0.040849 * Math.sin(2 * gamma)
  );
  const declination = 0.006918
    - 0.399912 * Math.cos(gamma)
    + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma)
    + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma)
    + 0.00148 * Math.sin(3 * gamma);

  const timezoneMinutes = -date.getTimezoneOffset();
  const solarNoon = 720 - 4 * longitude - equationOfTime + timezoneMinutes;
  const sunriseOffset = hourAngleMinutes(latitude, declination, 90.833);
  const fajrOffset = hourAngleMinutes(latitude, declination, method === 'umm-al-qura' ? 108.5 : 108);
  if (sunriseOffset === null || fajrOffset === null) return null;

  const sunset = solarNoon + sunriseOffset;
  const asrAltitude = asrAltitudeDegrees(latitude, declination, 1);
  const asrOffset = hourAngleMinutes(latitude, declination, 90 - asrAltitude);
  if (asrOffset === null) return null;

  const rawMinutes: Record<PrayerId, number> = {
    fajr: solarNoon - fajrOffset,
    dhuhr: solarNoon,
    asr: solarNoon + asrOffset,
    maghrib: sunset,
    isha: method === 'umm-al-qura'
      ? sunset + (isRamadan(date) ? 120 : 90)
      : solarNoon + (hourAngleMinutes(latitude, declination, 107) ?? sunriseOffset),
  };

  const entries = Object.fromEntries(PRAYER_ORDER.map((id) => {
    const adhanAt = localTimestampFromMinutes(date, rawMinutes[id]);
    const iqamaAt = adhanAt + IQAMA_DELAYS[id] * 60_000;
    return [id, {
      id,
      adhan: clockFromTimestamp(adhanAt),
      iqama: clockFromTimestamp(iqamaAt),
      adhanAt,
      iqamaAt,
      iqamaDelayMinutes: IQAMA_DELAYS[id],
    } satisfies PrayerTimeEntry];
  })) as PrayerSchedule;

  return { schedule: entries, method };
}

export function applyPrayerScheduleToItems(items: ResolvedScheduleItem[], schedule: PrayerSchedule | null): ResolvedScheduleItem[] {
  if (!schedule) return items;
  return items.map((item) => item.prayerId
    ? { ...item, startTime: schedule[item.prayerId].adhan, endTime: schedule[item.prayerId].iqama }
    : item);
}

export function getPrayerCountdown(now: Date, today: PrayerSchedule | null, tomorrow: PrayerSchedule | null): PrayerCountdown | null {
  if (!today) return null;
  const nowMs = now.getTime();
  for (const id of PRAYER_ORDER) {
    const entry = today[id];
    if (nowMs < entry.adhanAt) return { kind: 'adhan', prayerId: id, targetAt: entry.adhanAt, remainingMs: entry.adhanAt - nowMs };
    if (nowMs < entry.iqamaAt) return { kind: 'iqama', prayerId: id, targetAt: entry.iqamaAt, remainingMs: entry.iqamaAt - nowMs };
  }
  if (tomorrow) {
    const fajr = tomorrow.fajr;
    return { kind: 'adhan', prayerId: 'fajr', targetAt: fajr.adhanAt, remainingMs: Math.max(0, fajr.adhanAt - nowMs) };
  }
  return null;
}

export function calculateTomorrowSchedule(dateKey: DateKey, latitude: number, longitude: number): CalculatedPrayerSchedule | null {
  return calculatePrayerSchedule(addDays(dateKey, 1), latitude, longitude);
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function hourAngleMinutes(latitude: number, declination: number, zenithDegrees: number): number | null {
  const lat = degreesToRadians(latitude);
  const zenith = degreesToRadians(zenithDegrees);
  const cosine = (Math.cos(zenith) - Math.sin(lat) * Math.sin(declination)) / (Math.cos(lat) * Math.cos(declination));
  if (cosine < -1 || cosine > 1) return null;
  return radiansToDegrees(Math.acos(cosine)) * 4;
}

function asrAltitudeDegrees(latitude: number, declinationRadians: number, shadowFactor: number): number {
  const declinationDegrees = radiansToDegrees(declinationRadians);
  const difference = Math.abs(latitude - declinationDegrees);
  return radiansToDegrees(Math.atan(1 / (shadowFactor + Math.tan(degreesToRadians(difference)))));
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const offsetDelta = (start.getTimezoneOffset() - date.getTimezoneOffset()) * 60_000;
  return Math.floor((date.getTime() - start.getTime() + offsetDelta) / 86_400_000);
}

function localTimestampFromMinutes(date: Date, minutes: number): number {
  const value = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  value.setMinutes(Math.round(minutes));
  return value.getTime();
}

function clockFromTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function isWithinSaudiArabia(latitude: number, longitude: number): boolean {
  return latitude >= 16 && latitude <= 33.5 && longitude >= 34 && longitude <= 56.5;
}

function isRamadan(date: Date): boolean {
  try {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { month: 'numeric' }).formatToParts(date);
    return Number(parts.find((part) => part.type === 'month')?.value) === 9;
  } catch {
    return false;
  }
}

function degreesToRadians(value: number): number { return value * Math.PI / 180; }
function radiansToDegrees(value: number): number { return value * 180 / Math.PI; }
