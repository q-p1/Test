import { useMemo, useRef, useState } from 'react';
import { useNow } from '../hooks/useNow';
import { calculateDayScore, calculateStreak, getWeekSnapshot } from '../lib/dailyMetrics';
import { toDateKey } from '../lib/date';
import { getDayRecord } from '../lib/storage';
import { useRoutine } from '../state/RoutineContext';
import type { DailyLogKind, DateKey } from '../types';
import { Icon } from './Icon';
import { ProgressRing } from './ProgressRing';

const QUICK_LOGS: Array<{ kind: DailyLogKind; label: string; symbol: string }> = [
  { kind: 'meal', label: 'وجبة', symbol: '🍽️' },
  { kind: 'water', label: 'موية', symbol: '💧' },
  { kind: 'prayer', label: 'صلاة', symbol: '🕌' },
  { kind: 'shower', label: 'شاور', symbol: '🚿' },
  { kind: 'nap', label: 'قيلولة', symbol: '😴' },
  { kind: 'free', label: 'وقت حر', symbol: '🎮' },
];

const CUSTOM_KINDS: Array<{ value: DailyLogKind; label: string }> = [
  { value: 'custom', label: 'مخصص' },
  { value: 'free', label: 'وقت حر' },
  { value: 'meal', label: 'أكل' },
  { value: 'water', label: 'موية' },
  { value: 'shower', label: 'عناية' },
  { value: 'nap', label: 'راحة / قيلولة' },
];

export function DailyJournalPanel({ date }: { date: DateKey }) {
  const { state, actions } = useRoutine();
  const day = getDayRecord(state, date);
  const now = useNow(Boolean(day.activeActivity), 1000);
  const today = toDateKey(new Date(now));
  const initialWakeTime = day.wakeTime || (date === today ? localClock(new Date(now)) : state.settings.wakeTarget);
  const initialBedTime = day.bedTime || state.settings.sleepTarget;
  const [wakeTime, setWakeTime] = useState(initialWakeTime);
  const [bedTime, setBedTime] = useState(initialBedTime);
  const wakeTimeRef = useRef(initialWakeTime);
  const bedTimeRef = useRef(initialBedTime);
  const [customLabel, setCustomLabel] = useState('');
  const [customKind, setCustomKind] = useState<DailyLogKind>('custom');
  const [customNote, setCustomNote] = useState('');

  const score = useMemo(() => calculateDayScore(state, date, now), [state, date, now]);
  const streak = useMemo(() => calculateStreak(state, date, now), [state, date, now]);
  const week = useMemo(() => getWeekSnapshot(state, date, now), [state, date, now]);
  const activeSeconds = day.activeActivity ? Math.max(0, Math.floor((now - day.activeActivity.startedAt) / 1000)) : 0;
  const recentLogs = [...day.logs].reverse().slice(0, 10);

  const saveCustom = (mode: 'log' | 'timer') => {
    const label = customLabel.trim();
    if (!label) return;
    if (mode === 'timer') actions.startDailyActivity(date, label, customKind);
    else actions.addDailyLog(date, customKind, label, customNote);
    setCustomLabel('');
    setCustomNote('');
  };

  return (
    <section className="journal-section" aria-labelledby="journal-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">يومك كامل</span>
          <h2 id="journal-title">السجل اليومي</h2>
          <p className="section-subcopy">من وقت صحوتك إلى آخر حدث قبل النوم. كل شيء يبقى مربوطًا بهذا التاريخ فقط.</p>
        </div>
      </div>

      <div className="journal-score-card">
        <ProgressRing value={score.score} total={100} label="إنجاز اليوم" />
        <div className="journal-score-copy">
          <span>إنجاز اليوم</span>
          <strong>{score.score}%</strong>
          <small>السلسلة الحالية: {streak} {streak === 1 ? 'يوم' : 'أيام'}</small>
        </div>
        <div className="journal-week-mini">
          <span><b>{week.averageScore}%</b> متوسط 7 أيام</span>
          <span><b>{week.studyMinutes}</b> د قدرات</span>
          <span><b>{week.workoutDays}</b> حصص</span>
          <span><b>{week.prayers}</b> صلاة</span>
        </div>
      </div>

      <div className="day-boundary-grid">
        <article className={day.dayStartedAt ? 'day-boundary-card is-done' : 'day-boundary-card'}>
          <div><span className="feature-icon"><Icon name="today" /></span><div><strong>بداية اليوم</strong><small>{day.dayStartedAt ? `بدأ عند ${formatTimestamp(day.dayStartedAt)}` : 'سجّل صحوتك مرة واحدة'}</small></div></div>
          <label className="field field--compact"><span>وقت الصحوة</span><input type="time" value={wakeTime} disabled={Boolean(day.dayStartedAt)} onChange={(event) => { wakeTimeRef.current = event.target.value; setWakeTime(event.target.value); }} /></label>
          <button className="button button--primary button--full" type="button" disabled={Boolean(day.dayStartedAt)} onClick={() => actions.startDay(date, wakeTimeRef.current)}><Icon name="play" /> {day.dayStartedAt ? 'اليوم بدأ ✓' : 'بدأ يومي'}</button>
        </article>

        <article className={day.dayEndedAt ? 'day-boundary-card is-done' : 'day-boundary-card'}>
          <div><span className="feature-icon"><Icon name="moon" /></span><div><strong>إغلاق اليوم</strong><small>{day.dayEndedAt ? `أغلق عند ${formatTimestamp(day.dayEndedAt)}` : 'وقت النوم وملاحظة اليوم يبقون محفوظين'}</small></div></div>
          <label className="field field--compact"><span>وقت النوم</span><input type="time" value={bedTime} disabled={Boolean(day.dayEndedAt)} onChange={(event) => { bedTimeRef.current = event.target.value; setBedTime(event.target.value); }} /></label>
          <button className="button button--secondary button--full" type="button" disabled={Boolean(day.dayEndedAt)} onClick={() => actions.endDay(date, bedTimeRef.current)}><Icon name="check" /> {day.dayEndedAt ? 'اليوم مقفل ✓' : 'انتهى يومي'}</button>
        </article>
      </div>

      <div className="quick-log-panel">
        <div className="rich-field-heading"><strong>وش صار الآن؟</strong><small>التسجيل السريع القديم رجع، بدون ما يحول الصفحة إلى لوحة طائرة.</small></div>
        <div className="quick-log-grid-rich">
          {QUICK_LOGS.map((item) => (
            <button key={item.kind} type="button" onClick={() => actions.addDailyLog(date, item.kind, item.label)}>
              <span aria-hidden="true">{item.symbol}</span><strong>{item.label}</strong>
            </button>
          ))}
        </div>
      </div>

      <div className="custom-log-panel">
        <div className="rich-field-heading"><strong>حدث مخصص</strong><small>سجله فورًا أو شغّل له مؤقتًا حقيقيًا.</small></div>
        {day.activeActivity ? (
          <div className="active-daily-activity">
            <div><span>النشاط الجاري</span><strong>{day.activeActivity.label}</strong></div>
            <b dir="ltr">{formatSeconds(activeSeconds)}</b>
            <button className="button button--primary" type="button" onClick={() => actions.finishDailyActivity(date)}><Icon name="stop" /> إنهاء وتسجيل</button>
          </div>
        ) : (
          <>
            <div className="custom-log-grid">
              <label className="field field--compact"><span>الاسم</span><input type="text" maxLength={120} value={customLabel} placeholder="مثال: طلعة، مذاكرة مادة، مشوار..." onChange={(event) => setCustomLabel(event.target.value)} /></label>
              <label className="field field--compact"><span>النوع</span><select value={customKind} onChange={(event) => setCustomKind(event.target.value as DailyLogKind)}>{CUSTOM_KINDS.map((kind) => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</select></label>
            </div>
            <label className="field field--compact"><span>ملاحظة اختيارية</span><input type="text" maxLength={500} value={customNote} placeholder="تفصيل صغير إذا احتجته" onChange={(event) => setCustomNote(event.target.value)} /></label>
            <div className="custom-log-actions"><button className="button button--secondary" type="button" disabled={!customLabel.trim()} onClick={() => saveCustom('log')}><Icon name="plus" /> سجل الآن</button><button className="button button--primary" type="button" disabled={!customLabel.trim()} onClick={() => saveCustom('timer')}><Icon name="play" /> ابدأ بمؤقت</button></div>
          </>
        )}
      </div>

      <div className="activity-log-panel">
        <div className="rich-field-heading"><strong>سجل الأحداث</strong><small>{day.logs.length} حدث مسجل · آخر 10 ظاهرة هنا</small></div>
        {recentLogs.length === 0 ? <div className="journal-empty"><Icon name="history" /><span>لسه ما سجلت شيء في هذا اليوم.</span></div> : (
          <div className="journal-log-list">
            {recentLogs.map((log) => <div className="journal-log-row" key={log.id}><span className="journal-log-symbol">{symbolFor(log.kind)}</span><div><strong>{log.label}</strong><small>{formatTimestamp(log.createdAt)}{log.durationMinutes ? ` · ${log.durationMinutes} د` : ''}{log.note ? ` · ${log.note}` : ''}</small></div></div>)}
          </div>
        )}
        {day.logs.length > 0 && <button className="text-button" type="button" onClick={() => actions.undoLastDailyLog(date)}>تراجع عن آخر سجل</button>}
      </div>
    </section>
  );
}

function formatTimestamp(timestamp: number): string {
  return new Intl.DateTimeFormat('ar-SA', { hour: 'numeric', minute: '2-digit' }).format(new Date(timestamp));
}

function localClock(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function symbolFor(kind: DailyLogKind): string {
  return { meal: '🍽️', water: '💧', prayer: '🕌', shower: '🚿', nap: '😴', free: '🎮', custom: '◆' }[kind];
}
