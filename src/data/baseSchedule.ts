import type { BaseSchedule, BaseScheduleItem, PrayerId, WorkoutId } from '../types';

export const PRAYERS: Array<{ id: PrayerId; name: string; time: string }> = [
  { id: 'fajr', name: 'الفجر', time: '04:45' },
  { id: 'dhuhr', name: 'الظهر', time: '12:10' },
  { id: 'asr', name: 'العصر', time: '15:35' },
  { id: 'maghrib', name: 'المغرب', time: '18:35' },
  { id: 'isha', name: 'العشاء', time: '20:05' },
];

const prayerItems: BaseScheduleItem[] = PRAYERS.map((prayer) => ({
  id: `prayer-${prayer.id}`,
  title: `صلاة ${prayer.name}`,
  kind: 'prayer',
  startTime: prayer.time,
  endTime: addMinutes(prayer.time, 15),
  prayerId: prayer.id,
}));

const workoutByDay: Partial<Record<number, WorkoutId>> = {
  0: 'A',
  1: 'B',
  3: 'C',
  4: 'D',
};

function addMinutes(time: string, amount: number): string {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const value = hour * 60 + minute + amount;
  return `${String(Math.floor(value / 60) % 24).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function weekdayItems(day: number): BaseScheduleItem[] {
  const items: BaseScheduleItem[] = [...prayerItems];
  if (day >= 0 && day <= 4) {
    items.push(
      { id: 'school', title: 'المدرسة', kind: 'school', startTime: '06:30', endTime: '13:30' },
      { id: 'rest', title: 'راحة وغداء', kind: 'rest', startTime: '13:35', endTime: '15:20' },
      { id: 'tahfiz', title: 'التحفيظ', kind: 'tahfiz', startTime: '15:50', endTime: '17:30' },
      { id: 'qudurat', title: 'جلسة قدرات', kind: 'qudurat', startTime: '18:55', endTime: '20:25', note: 'درس أو فيديو Jadir بتركيز' },
    );
  }
  const workoutId = workoutByDay[day];
  if (workoutId) {
    items.push({
      id: 'workout',
      title: `تمرين المقاومة ${workoutId}`,
      kind: 'workout',
      startTime: '20:40',
      endTime: '21:35',
      workoutId,
    });
  } else if (day === 2) {
    items.push({ id: 'movement', title: 'حركة خفيفة واستشفاء', kind: 'movement', startTime: '20:40', endTime: '21:10' });
  } else if (day === 5) {
    items.push({ id: 'movement', title: 'كرة أو مشي اختياري', kind: 'movement', startTime: '17:00', endTime: '18:00' });
  } else if (day === 6) {
    items.push({ id: 'movement', title: 'راحة أو مشي هادئ', kind: 'movement', startTime: '17:00', endTime: '17:30' });
  }
  return items;
}

export function createDefaultBaseSchedule(): BaseSchedule {
  return Object.fromEntries(Array.from({ length: 7 }, (_, day) => [day, weekdayItems(day)])) as BaseSchedule;
}
