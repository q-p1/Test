import { useCallback, useEffect, useMemo, useState } from 'react';
import { calculatePrayerSchedule, calculateTomorrowSchedule, type PrayerCalculationMethod, type PrayerSchedule } from '../lib/prayerTimes';
import type { DateKey } from '../types';

const LOCATION_KEY = 'routine.prayer.location.v1';

type LocationStatus = 'locating' | 'ready' | 'cached' | 'denied' | 'unavailable';

interface CachedLocation {
  latitude: number;
  longitude: number;
  updatedAt: number;
}

export interface PrayerTimesState {
  schedule: PrayerSchedule | null;
  tomorrowSchedule: PrayerSchedule | null;
  method: PrayerCalculationMethod | null;
  locationStatus: LocationStatus;
  locationUpdatedAt: number | null;
  refreshLocation(): void;
}

let sharedLocationRequest: Promise<CachedLocation> | null = null;

export function usePrayerTimes(date: DateKey): PrayerTimesState {
  const [location, setLocation] = useState<CachedLocation | null>(() => readCachedLocation());
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(() => {
    const cached = readCachedLocation();
    if (cached) return 'cached';
    return typeof navigator !== 'undefined' && 'geolocation' in navigator ? 'locating' : 'unavailable';
  });

  const refreshLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setLocationStatus((current) => current === 'cached' || current === 'ready' ? 'cached' : 'unavailable');
      return;
    }
    setLocationStatus((current) => current === 'ready' || current === 'cached' ? 'cached' : 'locating');
    requestLocation(true).then((next) => {
      setLocation(next);
      setLocationStatus('ready');
    }).catch((error: GeolocationPositionError | Error) => {
      const denied = 'code' in error && error.code === 1;
      setLocationStatus((current) => current === 'cached' || current === 'ready' ? 'cached' : denied ? 'denied' : 'unavailable');
    });
  }, []);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    requestLocation(false).then((next) => {
      setLocation(next);
      setLocationStatus('ready');
    }).catch((error: GeolocationPositionError | Error) => {
      const denied = 'code' in error && error.code === 1;
      setLocationStatus((current) => current === 'cached' || current === 'ready' ? 'cached' : denied ? 'denied' : 'unavailable');
    });
  }, []);

  const calculated = useMemo(() => location ? calculatePrayerSchedule(date, location.latitude, location.longitude) : null, [date, location]);
  const tomorrow = useMemo(() => location ? calculateTomorrowSchedule(date, location.latitude, location.longitude) : null, [date, location]);

  return {
    schedule: calculated?.schedule ?? null,
    tomorrowSchedule: tomorrow?.schedule ?? null,
    method: calculated?.method ?? null,
    locationStatus,
    locationUpdatedAt: location?.updatedAt ?? null,
    refreshLocation,
  };
}

function requestLocation(force: boolean): Promise<CachedLocation> {
  if (!force && sharedLocationRequest) return sharedLocationRequest;
  const promise = new Promise<CachedLocation>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition((position) => {
      const location: CachedLocation = {
        latitude: roundCoordinate(position.coords.latitude),
        longitude: roundCoordinate(position.coords.longitude),
        updatedAt: Date.now(),
      };
      try { localStorage.setItem(LOCATION_KEY, JSON.stringify(location)); } catch { /* Local fallback is optional. */ }
      resolve(location);
    }, reject, { enableHighAccuracy: false, timeout: 12_000, maximumAge: 10 * 60_000 });
  });
  if (!force) sharedLocationRequest = promise;
  return promise;
}

function readCachedLocation(): CachedLocation | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCATION_KEY) ?? 'null') as Partial<CachedLocation> | null;
    if (!parsed || !Number.isFinite(parsed.latitude) || !Number.isFinite(parsed.longitude)) return null;
    return {
      latitude: Number(parsed.latitude),
      longitude: Number(parsed.longitude),
      updatedAt: Number.isFinite(parsed.updatedAt) ? Number(parsed.updatedAt) : 0,
    };
  } catch {
    return null;
  }
}

function roundCoordinate(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
