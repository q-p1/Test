import { isDateInRange, parseDateKey, toDateKey } from './date';
import type { DateKey, DateOverrideMap } from '../types';

export const SCHOOL_STORAGE_KEY = 'routine.school.v1';
export const SCHOOL_SCHEMA_VERSION = 1 as const;

export type SchoolAttendanceStatus = 'unrecorded' | 'present' | 'late' | 'absent' | 'excused' | 'holiday';
export type SchoolAssignmentStatus = 'todo' | 'done' | 'submitted';
export type SchoolAssignmentKind = 'homework' | 'project' | 'worksheet' | 'research' | 'other';
export type SchoolExamKind = 'quiz' | 'exam' | 'oral' | 'practical' | 'other';

export interface SchoolSubject {
  id: string;
  name: string;
  teacher: string;
  room: string;
  note: string;
  createdAt: number;
}

export interface SchoolPeriod {
  id: string;
  weekday: number;
  periodNumber: number;
  subjectId: string;
  startTime: string;
  endTime: string;
  note: string;
}

export interface SchoolAssignment {
  id: string;
  subjectId: string;
  title: string;
  dueDate: DateKey;
  kind: SchoolAssignmentKind;
  status: SchoolAssignmentStatus;
  important: boolean;
  note: string;
  createdAt: number;
}

export interface SchoolExam {
  id: string;
  subjectId: string;
  title: string;
  date: DateKey;
  time: string;
  kind: SchoolExamKind;
  scope: string;
  score: number | null;
  maxScore: number | null;
  note: string;
  createdAt: number;
}

export interface SchoolDayRecord {
  date: DateKey;
  attendance: SchoolAttendanceStatus;
  arrivalTime: string;
  departureTime: string;
  note: string;
}

export interface SchoolData {
  schemaVersion: typeof SCHOOL_SCHEMA_VERSION;
  subjects: SchoolSubject[];
  periods: SchoolPeriod[];
  assignments: SchoolAssignment[];
  exams: SchoolExam[];
  days: Record<string, SchoolDayRecord>;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function createDefaultSchoolData(): SchoolData {
  return {
    schemaVersion: SCHOOL_SCHEMA_VERSION,
    subjects: [],
    periods: [],
    assignments: [],
    exams: [],
    days: {},
  };
}

export function createEmptySchoolDay(date: DateKey): SchoolDayRecord {
  return { date, attendance: 'unrecorded', arrivalTime: '', departureTime: '', note: '' };
}

export function loadSchoolData(storage: StorageLike = window.localStorage): SchoolData {
  try {
    const raw = storage.getItem(SCHOOL_STORAGE_KEY);
    if (!raw) return createDefaultSchoolData();
    return sanitizeSchoolData(JSON.parse(raw));
  } catch {
    return createDefaultSchoolData();
  }
}

export function saveSchoolData(data: SchoolData, storage: StorageLike = window.localStorage): void {
  storage.setItem(SCHOOL_STORAGE_KEY, JSON.stringify(data));
}

export function sanitizeSchoolData(input: unknown): SchoolData {
  const fallback = createDefaultSchoolData();
  if (!isRecord(input)) return fallback;

  const subjects = Array.isArray(input.subjects)
    ? input.subjects.map(sanitizeSubject).filter(Boolean) as SchoolSubject[]
    : [];
  const subjectIds = new Set(subjects.map((subject) => subject.id));

  const periods = Array.isArray(input.periods)
    ? input.periods.map((value) => sanitizePeriod(value, subjectIds)).filter(Boolean) as SchoolPeriod[]
    : [];
  const assignments = Array.isArray(input.assignments)
    ? input.assignments.map((value) => sanitizeAssignment(value, subjectIds)).filter(Boolean) as SchoolAssignment[]
    : [];
  const exams = Array.isArray(input.exams)
    ? input.exams.map((value) => sanitizeExam(value, subjectIds)).filter(Boolean) as SchoolExam[]
    : [];

  const days: Record<string, SchoolDayRecord> = {};
  if (isRecord(input.days)) {
    for (const [key, value] of Object.entries(input.days)) {
      if (!parseDateKey(key)) continue;
      days[key] = sanitizeDay(key as DateKey, value);
    }
  }

  return { schemaVersion: SCHOOL_SCHEMA_VERSION, subjects, periods, assignments, exams, days };
}

export function getSchoolDay(data: SchoolData, date: DateKey): SchoolDayRecord {
  return data.days[date] ?? createEmptySchoolDay(date);
}

export function getPeriodsForDate(data: SchoolData, date: DateKey): SchoolPeriod[] {
  const parsed = parseDateKey(date);
  if (!parsed) return [];
  return data.periods
    .filter((period) => period.weekday === parsed.getDay())
    .sort((a, b) => a.periodNumber - b.periodNumber || a.startTime.localeCompare(b.startTime));
}

export function getPendingAssignments(data: SchoolData, today: DateKey = toDateKey(new Date())): SchoolAssignment[] {
  return data.assignments
    .filter((assignment) => assignment.status === 'todo' && assignment.dueDate >= today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || Number(b.important) - Number(a.important));
}

export function getOverdueAssignments(data: SchoolData, today: DateKey = toDateKey(new Date())): SchoolAssignment[] {
  return data.assignments
    .filter((assignment) => assignment.status === 'todo' && assignment.dueDate < today)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getUpcomingExams(data: SchoolData, today: DateKey = toDateKey(new Date())): SchoolExam[] {
  return data.exams
    .filter((exam) => exam.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export function subjectName(data: SchoolData, subjectId: string): string {
  return data.subjects.find((subject) => subject.id === subjectId)?.name ?? 'مادة غير معروفة';
}

export function getSubjectAverage(data: SchoolData, subjectId: string): number | null {
  const scored = data.exams.filter((exam) => exam.subjectId === subjectId && exam.score !== null && exam.maxScore && exam.maxScore > 0);
  if (scored.length === 0) return null;
  const ratios = scored.map((exam) => (exam.score! / exam.maxScore!) * 100);
  return Math.round(ratios.reduce((sum, value) => sum + value, 0) / ratios.length);
}

export function getSchoolAverage(data: SchoolData): number | null {
  const scored = data.exams.filter((exam) => exam.score !== null && exam.maxScore && exam.maxScore > 0);
  if (scored.length === 0) return null;
  const ratios = scored.map((exam) => (exam.score! / exam.maxScore!) * 100);
  return Math.round(ratios.reduce((sum, value) => sum + value, 0) / ratios.length);
}

export function getAttendanceSummary(data: SchoolData): { present: number; late: number; absent: number; excused: number } {
  const values = Object.values(data.days).map((day) => day.attendance);
  return {
    present: values.filter((value) => value === 'present').length,
    late: values.filter((value) => value === 'late').length,
    absent: values.filter((value) => value === 'absent').length,
    excused: values.filter((value) => value === 'excused').length,
  };
}

export function hasSchoolHolidayOverride(overrides: DateOverrideMap, date: DateKey): boolean {
  return Object.values(overrides).flat().some((override) =>
    ['school-holiday', 'official-holiday'].includes(override.type) && isDateInRange(date, override.startDate, override.endDate));
}

export function createSchoolId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeSubject(value: unknown): SchoolSubject | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.name !== 'string' || !value.name.trim()) return null;
  return {
    id: value.id,
    name: value.name.trim().slice(0, 80),
    teacher: cleanText(value.teacher, 80),
    room: cleanText(value.room, 40),
    note: cleanText(value.note, 400),
    createdAt: finiteNumber(value.createdAt, Date.now()),
  };
}

function sanitizePeriod(value: unknown, subjectIds: Set<string>): SchoolPeriod | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.subjectId !== 'string' || !subjectIds.has(value.subjectId)) return null;
  const weekday = Math.floor(finiteNumber(value.weekday, -1));
  const periodNumber = Math.floor(finiteNumber(value.periodNumber, 0));
  const startTime = validClock(value.startTime);
  const endTime = validClock(value.endTime);
  if (weekday < 0 || weekday > 6 || periodNumber < 1 || periodNumber > 20 || !startTime || !endTime) return null;
  return { id: value.id, weekday, periodNumber, subjectId: value.subjectId, startTime, endTime, note: cleanText(value.note, 300) };
}

function sanitizeAssignment(value: unknown, subjectIds: Set<string>): SchoolAssignment | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.subjectId !== 'string' || !subjectIds.has(value.subjectId)) return null;
  if (typeof value.title !== 'string' || !value.title.trim() || typeof value.dueDate !== 'string' || !parseDateKey(value.dueDate)) return null;
  const kinds: SchoolAssignmentKind[] = ['homework', 'project', 'worksheet', 'research', 'other'];
  const statuses: SchoolAssignmentStatus[] = ['todo', 'done', 'submitted'];
  return {
    id: value.id,
    subjectId: value.subjectId,
    title: value.title.trim().slice(0, 140),
    dueDate: value.dueDate as DateKey,
    kind: kinds.includes(value.kind as SchoolAssignmentKind) ? value.kind as SchoolAssignmentKind : 'homework',
    status: statuses.includes(value.status as SchoolAssignmentStatus) ? value.status as SchoolAssignmentStatus : 'todo',
    important: value.important === true,
    note: cleanText(value.note, 500),
    createdAt: finiteNumber(value.createdAt, Date.now()),
  };
}

function sanitizeExam(value: unknown, subjectIds: Set<string>): SchoolExam | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.subjectId !== 'string' || !subjectIds.has(value.subjectId)) return null;
  if (typeof value.title !== 'string' || !value.title.trim() || typeof value.date !== 'string' || !parseDateKey(value.date)) return null;
  const kinds: SchoolExamKind[] = ['quiz', 'exam', 'oral', 'practical', 'other'];
  const score = nullableNumber(value.score);
  const maxScore = nullableNumber(value.maxScore);
  return {
    id: value.id,
    subjectId: value.subjectId,
    title: value.title.trim().slice(0, 140),
    date: value.date as DateKey,
    time: validClock(value.time),
    kind: kinds.includes(value.kind as SchoolExamKind) ? value.kind as SchoolExamKind : 'exam',
    scope: cleanText(value.scope, 500),
    score: score !== null ? Math.max(0, score) : null,
    maxScore: maxScore !== null && maxScore > 0 ? maxScore : null,
    note: cleanText(value.note, 500),
    createdAt: finiteNumber(value.createdAt, Date.now()),
  };
}

function sanitizeDay(date: DateKey, value: unknown): SchoolDayRecord {
  if (!isRecord(value)) return createEmptySchoolDay(date);
  const statuses: SchoolAttendanceStatus[] = ['unrecorded', 'present', 'late', 'absent', 'excused', 'holiday'];
  return {
    date,
    attendance: statuses.includes(value.attendance as SchoolAttendanceStatus) ? value.attendance as SchoolAttendanceStatus : 'unrecorded',
    arrivalTime: validClock(value.arrivalTime),
    departureTime: validClock(value.departureTime),
    note: cleanText(value.note, 1200),
  };
}

function validClock(value: unknown): string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : '';
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
