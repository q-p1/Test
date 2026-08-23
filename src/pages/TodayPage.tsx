import { useMemo, useState } from 'react';
import { useNow } from '../hooks/useNow';
import { usePrayerTimes } from '../hooks/usePrayerTimes';
import { addDays, currentMinutes, formatArabicDate, formatClock, minutesFromTime, toDateKey } from '../lib/date';
import { applyPrayerScheduleToItems } from '../lib/prayerTimes';
import { resolveDay } from '../lib/schedule';
import { getDayRecord } from '../lib/storage';
import { formatDuration, getElapsedMs } from '../lib/timer';
import { useRoutine } from '../state/RoutineContext';
import type { DateKey, DayRecord, ResolvedScheduleItem, RoutineState, TaskStatus } from '../types';
import { DailyJournalPanel } from '../components/DailyJournalPanel';
import { DayOverrideSheet } from '../components/DayOverrideSheet';
import { Icon, type IconName } from '../components/Icon';
import { PrayerTracker } from '../components/PrayerTracker';
import { ProgressRing } from '../components/ProgressRing';
import { SessionTimerCard } from '../components/SessionTimerCard';

interface TodayPageProps { onOpenFitness(): void; }

export function TodayPage({ onOpenFitness }: TodayPageProps) {
  const { state, actions } = useRoutine();
  const nowMs = useNow(true, 30_000);
  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const today = toDateKey(now);
  const [selectedDate, setSelectedDate] = useState<DateKey>(today);
  const [overrideOpen, setOverrideOpen] = useState(false);
  const day = getDayRecord(state, selectedDate);
  const prayerTimes = usePrayerTimes(selectedDate);
  const resolvedBase = useMemo(() => resolveDay(state.baseSchedule, state.dateOverrides, selectedDate), [state.baseSchedule, state.dateOverrides, selectedDate]);
  const resolved = useMemo(() => ({ ...resolvedBase, items: applyPrayerScheduleToItems(resolvedBase.items, prayerTimes.schedule) }), [resolvedBase, prayerTimes.schedule]);
  const prayersDone = Object.values(day.prayers).filter(Boolean).length;
  const statuses = useMemo(() => Object.fromEntries(resolved.items.map((item) => [item.id, getItemStatus(item, day, state, selectedDate, now)])), [resolved.items, day, state, selectedDate, now]);
  const tahfizTrip = resolved.appliedOverrides.find((override) => override.type === 'tahfiz-trip');
  const tahfizCancelledItem = resolved.items.find((item) => item.kind === 'tahfiz' && item.status === 'cancelled');
  const tahfizHoliday = resolved.appliedOverrides.find((override) => override.type === 'tahfiz-holiday');
  const tahfizDisabledReason = tahfizTrip
    ? `استُبدلت الجلسة بحدث: ${tahfizTrip.title ?? 'رحلة التحفيظ'} — لا يُحسب فشلًا`
    : tahfizHoliday
      ? `${tahfizHoliday.title ?? 'إجازة تحفيظ'} — لا تُحسب فشلًا`
      : tahfizCancelledItem?.statusReason
        ? `${tahfizCancelledItem.statusReason} — لا يُحسب فشلًا`
        : undefined;
  const quduratCancelledItem = resolved.items.find((item) => item.kind === 'qudurat' && item.status === 'cancelled');
  const quduratDisabledReason = quduratCancelledItem?.statusReason ? `${quduratCancelledItem.statusReason} — لا يُحسب فشلًا` : undefined;
  const current = selectedDate === today ? getCurrentItem(resolved.items, now) : null;
  const next = selectedDate === today ? getNextItem(resolved.items, now) : null;
  const currentRemaining = current ? Math.max(0, minutesFromTime(current.endTime) - currentMinutes(now)) : null;
  const workoutDone = state.workout.history.some((entry) => entry.date === selectedDate);
  const workoutItem = resolved.items.find((item) => item.kind === 'workout');
  const movementItem = resolved.items.find((item) => item.kind === 'movement');
  const workoutMetric = workoutDone
    ? 'مكتملة'
    : workoutItem
      ? statuses[workoutItem.id] === 'cancelled' ? 'ملغاة' : statuses[workoutItem.id] === 'skipped' ? 'تخطيتها بقصد' : statuses[workoutItem.id] === 'missed' ? 'فاتت' : 'بانتظارك'
      : movementItem ? day.movementCompleted ? 'حركة مكتملة' : 'حركة خفيفة' : 'راحة';
  const hasException = resolved.appliedOverrides.length > 0;
  const tahfizPositive = day.sessions.tahfiz.status === 'completed' || ['attended', 'trip'].includes(day.tahfiz.status);
  const tahfizMetric = tahfizTrip ? 'رحلة' : tahfizDisabledReason ? 'ملغى' : tahfizLabel(day);
  const quduratTargetMinutes = Math.max(15, Math.min(240, Math.round(state.settings.quduratTargetMinutes || 60)));
  const quduratTargetMs = quduratTargetMinutes * 60_000;
  const quduratElapsedMs = getElapsedMs(day.sessions.qudurat, nowMs);
  const quduratRemainingMs = Math.max(0, quduratTargetMs - quduratElapsedMs);
  const quduratGoalDone = quduratElapsedMs >= quduratTargetMs;
  const quduratMetric = quduratDisabledReason ? 'ملغاة' : quduratGoalDone ? 'تم الهدف ✓' : `متبقي ${formatDuration(quduratRemainingMs)}`;
  const achievements = prayersDone + Number(tahfizPositive) + Number(quduratGoalDone) + Number(workoutDone || day.movementCompleted);

  return (
    <div className="page page--today" data-page="today">
      <section className={`day-hero ${resolved.isHoliday ? 'day-hero--holiday' : ''}`}>
        <div className="date-switcher">
          <button className="icon-button icon-button--on-dark" type="button" aria-label="اليوم السابق" onClick={() => setSelectedDate(addDays(selectedDate, -1))}><Icon name="chevron-right" /></button>
          <label className="date-switcher__label"><span>{selectedDate === today ? 'اليوم' : formatArabicDate(selectedDate, 'short')}</span><input aria-label="اختر التاريخ" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value as DateKey)} /></label>
          <button className="icon-button icon-button--on-dark" type="button" aria-label="اليوم التالي" onClick={() => setSelectedDate(addDays(selectedDate, 1))}><Icon name="chevron-left" /></button>
        </div>
        <div className="day-hero__status">
          <div>
            <span className="eyebrow eyebrow--gold">{resolved.isHoliday ? resolved.holidayTitle : hasException ? 'يوم باستثناء' : formatArabicDate(selectedDate)}</span>
            <h1>{selectedDate !== today ? 'ملخص هذا اليوم' : current ? current.title : next ? 'بين مرحلتين' : 'اكتمل جدول اليوم'}</h1>
            <p>{selectedDate !== today ? 'يمكنك مراجعة الإنجاز أو تعديل هذا التاريخ دون تغيير الأسبوع.' : current ? `${formatClock(current.startTime)} – ${formatClock(current.endTime)}${currentRemaining !== null ? ` · متبقّي ${currentRemaining} د` : ''}` : next ? `القادم: ${next.title} عند ${formatClock(next.startTime)}` : 'خذ نهاية اليوم بهدوء، بياناتك محفوظة.'}</p>
          </div>
          <ProgressRing value={prayersDone} total={5} label="الصلوات" />
        </div>
        <div className="hero-next-row"><span><Icon name="clock" /> {next ? <>القادم <strong>{next.title}</strong></> : 'لا توجد مهام أخرى اليوم'}</span><button type="button" onClick={() => setOverrideOpen(true)}><Icon name="edit" /> تعديل هذا اليوم</button></div>
      </section>

      {hasException && <div className="exception-banner" role="status"><Icon name="calendar" /><div><strong>هذا اليوم مختلف عن الجدول الأساسي</strong><span>{resolved.appliedOverrides.length} {resolved.appliedOverrides.length === 1 ? 'استثناء نشط' : 'استثناءات نشطة'} — الإلغاء المقصود لا يُحسب فشلًا.</span></div><button type="button" className="text-button" onClick={() => setOverrideOpen(true)}>عرض</button></div>}

      <section className="dashboard-section" aria-labelledby="dashboard-title">
        <div className="section-heading"><div><span className="eyebrow">نظرة سريعة</span><h2 id="dashboard-title">لوحة اليوم</h2></div><span className="section-heading__aside">{achievements} إنجازات</span></div>
        <div className="metric-grid">
          <MetricCard icon="prayer" label="الصلاة" value={`${prayersDone}/5`} state={prayersDone === 5 ? 'done' : 'active'} />
          <MetricCard icon="book" label="التحفيظ" value={tahfizMetric} state={tahfizPositive ? 'done' : tahfizDisabledReason || ['excused', 'holiday', 'skipped-intentionally'].includes(day.tahfiz.status) ? 'neutral' : 'active'} />
          <MetricCard icon="brain" label="القدرات" value={quduratMetric} state={quduratGoalDone ? 'done' : quduratDisabledReason ? 'neutral' : 'active'} />
          <MetricCard icon="fitness" label="الرياضة" value={workoutMetric} state={workoutDone || day.movementCompleted ? 'done' : 'neutral'} onClick={onOpenFitness} />
        </div>
      </section>

      <PrayerTracker key={`prayers-${selectedDate}`} date={selectedDate} schedule={prayerTimes.schedule} tomorrowSchedule={prayerTimes.tomorrowSchedule} method={prayerTimes.method} locationStatus={prayerTimes.locationStatus} isToday={selectedDate === today} onRefreshLocation={prayerTimes.refreshLocation} />

      <section className="sessions-section" aria-labelledby="sessions-title"><div className="section-heading"><div><span className="eyebrow">جلسات بوقت حقيقي</span><h2 id="sessions-title">التركيز</h2></div></div><div className="session-grid"><SessionTimerCard date={selectedDate} kind="tahfiz" timer={day.sessions.tahfiz} note={day.sessionNotes.tahfiz} disabledReason={tahfizDisabledReason} /><SessionTimerCard date={selectedDate} kind="qudurat" timer={day.sessions.qudurat} note={day.sessionNotes.qudurat} disabledReason={quduratDisabledReason} /></div></section>

      <DailyJournalPanel key={`journal-${selectedDate}`} date={selectedDate} />

      <section className="timeline-section" aria-labelledby="timeline-title">
        <div className="section-heading"><div><span className="eyebrow">من الاستيقاظ للنوم</span><h2 id="timeline-title">مسار اليوم</h2></div></div>
        <ol className="timeline-list">
          {resolved.items.map((item) => {
            const status = statuses[item.id];
            const isCurrent = current?.id === item.id;
            return <li key={`${item.id}-${item.overrideId ?? 'base'}`} className={`timeline-item ${status ? `is-${status}` : ''} ${isCurrent ? 'is-current' : ''}`}>
              <div className="timeline-time"><strong>{formatClock(item.startTime)}</strong><span>{formatClock(item.endTime)}</span></div>
              <div className="timeline-node"><span><Icon name={iconForItem(item)} /></span></div>
              <div className="timeline-card"><div className="timeline-card__main"><div><h3>{item.title}</h3>{item.kind === 'prayer' && <p>الأذان → الإقامة</p>}{item.note && <p>{item.note}</p>}{item.statusReason && <p>{item.statusReason}</p>}</div>{isCurrent && <span className="now-badge">الآن</span>}{status && <StatusBadge status={status} />}</div>{item.kind !== 'prayer' && !['tahfiz', 'qudurat'].includes(item.kind) && item.status !== 'cancelled' && <label className="status-select"><span className="sr-only">حالة {item.title}</span><select value={day.taskStatuses[item.id] ?? ''} onChange={(event) => actions.setTaskStatus(selectedDate, item.id, (event.target.value || null) as TaskStatus | null)}><option value="">غير مسجل</option><option value="completed">مكتمل</option><option value="skipped">تخطيته بقصد</option></select></label>}</div>
            </li>;
          })}
        </ol>
      </section>

      <section className="daily-note-section" aria-labelledby="daily-note-title"><div className="section-heading section-heading--small"><h2 id="daily-note-title">ملاحظة اليوم</h2></div><textarea value={day.notes} maxLength={2000} rows={3} onChange={(event) => actions.setDayNotes(selectedDate, event.target.value)} placeholder="شيء تريد تذكره عن هذا اليوم..." /></section>
      <DayOverrideSheet key={selectedDate} open={overrideOpen} date={selectedDate} items={resolved.items} onClose={() => setOverrideOpen(false)} />
    </div>
  );
}

function MetricCard({ icon, label, value, state, onClick }: { icon: IconName; label: string; value: string; state: 'done' | 'active' | 'neutral'; onClick?: () => void }) {
  const content = <><span className={`metric-card__icon metric-card__icon--${state}`}><Icon name={icon} /></span><span>{label}</span><strong>{value}</strong></>;
  return onClick ? <button type="button" className="metric-card metric-card--button" onClick={onClick}>{content}<Icon name="chevron-left" className="metric-card__arrow" /></button> : <div className="metric-card">{content}</div>;
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const label: Record<TaskStatus, string> = { completed: 'مكتمل', skipped: 'متخطى بقصد', cancelled: 'ملغى', missed: 'فات' };
  return <span className={`task-status task-status--${status}`}>{status === 'completed' && <Icon name="check" />}{label[status]}</span>;
}

function getCurrentItem(items: ResolvedScheduleItem[], now: Date): ResolvedScheduleItem | null {
  const minutes = currentMinutes(now);
  return items.find((item) => item.status !== 'cancelled' && minutes >= minutesFromTime(item.startTime) && minutes < minutesFromTime(item.endTime)) ?? null;
}

function getNextItem(items: ResolvedScheduleItem[], now: Date): ResolvedScheduleItem | null {
  const minutes = currentMinutes(now);
  return items.find((item) => item.status !== 'cancelled' && minutesFromTime(item.startTime) > minutes) ?? null;
}

function getItemStatus(item: ResolvedScheduleItem, day: DayRecord, state: RoutineState, date: DateKey, now: Date): TaskStatus | undefined {
  if (item.status === 'cancelled') return 'cancelled';
  if (item.prayerId && day.prayers[item.prayerId]) return 'completed';
  if (item.kind === 'tahfiz') {
    if (day.sessions.tahfiz.status === 'completed' || ['attended', 'trip'].includes(day.tahfiz.status)) return 'completed';
    if (day.tahfiz.status === 'skipped-intentionally') return 'skipped';
    if (day.tahfiz.status === 'missed') return 'missed';
    if (['excused', 'holiday'].includes(day.tahfiz.status)) return 'cancelled';
  }
  if (item.kind === 'qudurat' && day.sessions.qudurat.status === 'completed') return 'completed';
  if (item.kind === 'workout' && state.workout.history.some((entry) => entry.date === date && (!item.workoutId || entry.workoutId === item.workoutId))) return 'completed';
  if (item.kind === 'movement' && day.movementCompleted) return 'completed';
  if (day.taskStatuses[item.id]) return day.taskStatuses[item.id];
  const today = toDateKey(now);
  if (date < today || (date === today && minutesFromTime(item.endTime) < currentMinutes(now))) return 'missed';
  return undefined;
}

function iconForItem(item: ResolvedScheduleItem): IconName {
  const icons: Partial<Record<ResolvedScheduleItem['kind'], IconName>> = { prayer: 'prayer', school: 'school', rest: 'moon', tahfiz: 'book', qudurat: 'brain', workout: 'fitness', movement: 'walk', custom: 'calendar' };
  return icons[item.kind] ?? 'clock';
}

function sessionLabel(status: DayRecord['sessions']['tahfiz']['status']): string { return status === 'completed' ? 'مكتملة' : status === 'running' ? 'جارية' : status === 'paused' ? 'متوقفة' : 'بانتظارك'; }

function tahfizLabel(day: DayRecord): string {
  const labels: Record<DayRecord['tahfiz']['status'], string> = { unrecorded: sessionLabel(day.sessions.tahfiz.status), attended: 'حضرت', 'skipped-intentionally': 'تخطيته بقصد', excused: 'بعذر', holiday: 'إجازة', trip: 'رحلة', missed: 'فاتني' };
  return labels[day.tahfiz.status];
}
