export const SCHEMA_VERSION = 3 as const;

export type DateKey = `${number}-${number}-${number}`;
export type PrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type SessionKind = 'tahfiz' | 'qudurat';
export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';
export type TaskStatus = 'completed' | 'skipped' | 'cancelled' | 'missed';
export type WorkoutId = 'A' | 'B' | 'C' | 'D';

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
  sessions: Record<SessionKind, PersistentTimer>;
  sessionNotes: Partial<Record<SessionKind, string>>;
  taskStatuses: Record<string, TaskStatus>;
  movementCompleted: boolean;
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
