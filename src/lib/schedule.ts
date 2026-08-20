import { addDays, isDateInRange, minutesFromTime, parseDateKey } from './date';
import type {
  BaseScheduleItem,
  DateKey,
  DateOverride,
  DateOverrideMap,
  ResolvedDay,
  ResolvedScheduleItem,
} from '../types';

export function getOverridesForDate(overrides: DateOverrideMap, date: DateKey): DateOverride[] {
  return Object.values(overrides)
    .flat()
    .filter((override) => isDateInRange(date, override.startDate, override.endDate))
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function resolveDay(
  baseSchedule: Record<number, BaseScheduleItem[]>,
  overrides: DateOverrideMap,
  date: DateKey,
): ResolvedDay {
  const parsed = parseDateKey(date);
  const weekday = parsed?.getDay() ?? 0;
  let items: ResolvedScheduleItem[] = (baseSchedule[weekday] ?? []).map((item) => ({ ...item }));
  const appliedOverrides = getOverridesForDate(overrides, date);
  let isHoliday = false;
  let holidayTitle: string | undefined;

  for (const override of appliedOverrides) {
    switch (override.type) {
      case 'school-holiday':
        items = cancelMatching(items, (item) => item.kind === 'school', override, override.title ?? 'إجازة مدرسة');
        break;
      case 'tahfiz-holiday':
        items = cancelMatching(items, (item) => item.kind === 'tahfiz', override, override.title ?? 'إجازة تحفيظ');
        break;
      case 'official-holiday':
        isHoliday = true;
        holidayTitle = override.title ?? 'إجازة رسمية';
        items = cancelMatching(items, (item) => item.kind === 'school', override, holidayTitle);
        break;
      case 'tahfiz-trip': {
        const tahfiz = items.find((item) => item.kind === 'tahfiz');
        items = items.filter((item) => item.kind !== 'tahfiz');
        items.push({
          id: `exception-${override.id}`,
          title: override.title ?? 'رحلة التحفيظ',
          kind: 'custom',
          startTime: override.startTime ?? tahfiz?.startTime ?? '15:50',
          endTime: override.endTime ?? tahfiz?.endTime ?? '17:30',
          note: override.note,
          overrideId: override.id,
          isException: true,
        });
        break;
      }
      case 'custom-event':
      case 'add-task':
        items.push(createCustomItem(override));
        break;
      case 'reschedule-task':
      case 'postpone-task':
        items = items.map((item) => item.id === override.targetId
          ? {
              ...item,
              startTime: override.startTime ?? item.startTime,
              endTime: override.endTime ?? item.endTime,
              note: override.note ?? item.note,
              overrideId: override.id,
              isException: true,
            }
          : item);
        break;
      case 'cancel-task':
        items = cancelMatching(items, (item) => item.id === override.targetId, override, override.title ?? 'ملغاة لهذا اليوم');
        break;
    }
  }

  items.sort((a, b) => minutesFromTime(a.startTime) - minutesFromTime(b.startTime));
  return { date, items, isHoliday, holidayTitle, appliedOverrides };
}

export function removeOverridesForSingleDate(overrides: DateOverrideMap, date: DateKey): DateOverrideMap {
  const result: DateOverrideMap = {};
  for (const override of Object.values(overrides).flat()) {
    if (!isDateInRange(date, override.startDate, override.endDate)) {
      appendOverride(result, override);
      continue;
    }

    const end = override.endDate ?? override.startDate;
    if (override.startDate < date) {
      appendOverride(result, {
        ...override,
        id: `${override.id}-before-${date}`,
        endDate: addDays(date, -1),
      });
    }
    if (end > date) {
      const startDate = addDays(date, 1);
      appendOverride(result, {
        ...override,
        id: `${override.id}-after-${date}`,
        startDate,
        endDate: end,
      });
    }
  }
  return result;
}

export function addOverride(overrides: DateOverrideMap, override: DateOverride): DateOverrideMap {
  const key = override.startDate;
  return { ...overrides, [key]: [...(overrides[key] ?? []), override] };
}

export function removeOverrideById(overrides: DateOverrideMap, id: string): DateOverrideMap {
  const result: DateOverrideMap = {};
  for (const [date, values] of Object.entries(overrides)) {
    const filtered = values.filter((override) => override.id !== id);
    if (filtered.length > 0) result[date] = filtered;
  }
  return result;
}

function cancelMatching(
  items: ResolvedScheduleItem[],
  predicate: (item: ResolvedScheduleItem) => boolean,
  override: DateOverride,
  reason: string,
): ResolvedScheduleItem[] {
  return items.map((item) => predicate(item)
    ? { ...item, status: 'cancelled', statusReason: reason, overrideId: override.id, isException: true }
    : item);
}

function createCustomItem(override: DateOverride): ResolvedScheduleItem {
  return {
    id: `exception-${override.id}`,
    title: override.title ?? 'مهمة استثنائية',
    kind: 'custom',
    startTime: override.startTime ?? '18:00',
    endTime: override.endTime ?? '19:00',
    note: override.note,
    overrideId: override.id,
    isException: true,
  };
}

function appendOverride(map: DateOverrideMap, override: DateOverride): void {
  map[override.startDate] = [...(map[override.startDate] ?? []), override];
}
