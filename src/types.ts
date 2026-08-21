export const SCHEMA_VERSION = 4 as const;

export type DateKey = `${number}-${number}-${number}`;
export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type SessionKind = 'tahfiz' | 'qudurat';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type TaskStatus = 'completed' | 'skipped' | 'cancelled' | 'missed';
export type WorkoutId = 'A' | 'B' | 'C' | 'D';

export type PrayerTimingStatus = 'unknown' | 'on-time' | 'late';
export type CongregationStatus = 'unknown' | 'yes' | 'no' | 'not-applicable';

export interface PrayerDetail {
  performedAt: string;
  timing: PrayerTimingStatus;
  congregation: CongregationStatus;
  note: string;
}

export type TahfizAttendanceStatus =
  | 'unrecorded'
  | 'attended'
  | 'skipped-intentionally'
  | 'excused'
  | 'holiday'
  | 'trip'
  | 'missed';

export interface TahfizTracking {
  status: TahfizAttendanceStatus;
  newMemorization: string;
  review: string;
  recitation: string;
  mistakes: number;
  note: string;
}

export interface QuduratTracking {
  lessonName: string;
  questions: number;
  correct: number;
  mistakesReviewed: number;
}

export type DailyLogKind = 'meal' | 'water' | 'prayer' | 'shower' | 'nap' | 'free' | 'custom';

export interface DailyLog {
  id: string;
  kind: DailyLogKind;
  label: string;
  createdAt: number;
  durationMinutes?: number;
  note?: string;
}

export interface ActiveDailyActivity {
  id: string;
  kind: DailyLogKind;
  label: string;
  startedAt: number;
}

export interface PersistentTimer {
  status: TimerStatus;
  accumulatedMs: number;
  startedAt: number | null;
  completedAt: number | null;
}

export type ScheduleItemKind =
  | 'prayer'
  | 'school'
  | 'rest'
  | 'tahfiz'
  | 'qudurat'
  | 'workout'
  | 'movement'
  | 'custom';

export interface BaseScheduleItem {
  id: string;
  title: string;
  kind: ScheduleItemKind;
  startTime: string;
  endTime: string;
  prayerId?: PrayerId;
  workoutId?: WorkoutId;
  note?: string;
}

export type BaseSchedule = Record<number, BaseScheduleItem[]>;

export type OverrideType =
  | 'school-holiday'
  | 'tahfiz-holiday'
  | 'tahfiz-trip'
  | 'official-holiday'
  | 'custom-event'
  | 'reschedule-task'
  | 'cancel-task'
  | 'postpone-task'
  | 'add-task';

export interface DateOverride {
  id: string;
  type: OverrideType;
  startDate: DateKey;
  endDate?: DateKey;
  targetId?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  note?: string;
  createdAt: number;
}

export type DateOverrideMap = Record<string, DateOverride[]>;

export interface ResolvedScheduleItem extends BaseScheduleItem {
  status?: TaskStatus;
  overrideId?: string;
  statusReason?: string;
  isException?: boolean;
}

export interface ResolvedDay {
  date: DateKey;
  items: ResolvedScheduleItem[];
  isHoliday: boolean;
  holidayTitle?: string;
  appliedOverrides: DateOverride[];
}

export interface DayRecord {
  date: DateKey;
  prayers: Record<PrayerId, boolean>;
  prayerDetails: Record<PrayerId, PrayerDetail>;
  sessions: Record<SessionKind, PersistentTimer>;
  sessionNotes: Partial<Record<SessionKind, string>>;
  tahfiz: TahfizTracking;
  qudurat: QuduratTracking;
  taskStatuses: Record<string, TaskStatus>;
  movementCompleted: boolean;
  dayStartedAt: number | null;
  dayEndedAt: number | null;
  wakeTime: string;
  bedTime: string;
  logs: DailyLog[];
  activeActivity: ActiveDailyActivity | null;
  notes: string;
}

export type ExerciseMetric = 'reps' | 'seconds';

export interface ExerciseDefinition {
  id: string;
  arabicName: string;
  englishName: string;
  category: 'warmup' | 'main';
  metric: ExerciseMetric;
  sets: number;
  target: string;
  restSeconds: number;
  restLabel?: string;
  instruction: string;
  technique: string;
  commonMistake: string;
  easier: string;
  harder: string;
  image?: string;
  imageStatus: 'verified-pdf' | 'missing-source-pdf';
}

export interface WorkoutDefinition {
  id: WorkoutId;
  arabicName: string;
  focus: string;
  exerciseIds: string[];
}

export interface ExerciseLog {
  exerciseId: string;
  values: Array<number | null>;
}

export interface ActiveWorkout {
  id: string;
  date: DateKey;
  scheduledFor: DateKey;
  workoutId: WorkoutId;
  timer: PersistentTimer;
  logs: Record<string, ExerciseLog>;
  rating: number | null;
  note: string;
  proudMoment: string;
}

export interface WorkoutHistoryEntry {
  id: string;
  date: DateKey;
  scheduledFor: DateKey;
  workoutId: WorkoutId;
  cycle: number;
  week: number;
  durationMs: number;
  completedAt: number;
  logs: Record<string, ExerciseLog>;
  rating: number | null;
  note: string;
  proudMoment: string;
}

export interface WorkoutState {
  startedOn: DateKey;
  active: ActiveWorkout | null;
  history: WorkoutHistoryEntry[];
}

export interface RoutineSettings {
  userName: string;
  reducedMotion: boolean;
  lastSeenVersion: string;
  wakeTarget: string;
  sleepTarget: string;
  quduratTargetMinutes: number;
  quduratQuestionTarget: number;
  workoutTargetMinutes: number;
}

export interface RoutineState {
  schemaVersion: typeof SCHEMA_VERSION;
  baseSchedule: BaseSchedule;
  dateOverrides: DateOverrideMap;
  days: Record<string, DayRecord>;
  workout: WorkoutState;
  settings: RoutineSettings;
}

export interface LoadResult {
  state: RoutineState;
  recovered: boolean;
  message?: string;
}
