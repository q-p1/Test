import { useNow } from '../hooks/useNow';
import { getDayRecord } from '../lib/storage';
import { formatDuration, getElapsedMs } from '../lib/timer';
import { useRoutine } from '../state/RoutineContext';
import type { DateKey, PersistentTimer, SessionKind, TahfizAttendanceStatus } from '../types';
import { Icon } from './Icon';

const labels: Record<SessionKind, { title: string; subtitle: string; icon: 'book' | 'brain' }> = {
  tahfiz: { title: 'التحفيظ', subtitle: 'الحضور والمحتوى والوقت، كلها محفوظة لليوم نفسه', icon: 'book' },
  qudurat: { title: 'القدرات', subtitle: 'جلسة دراسة عميقة مع الدرس والأسئلة والدقة', icon: 'brain' },
};

const statusLabels: Record<PersistentTimer['status'], string> = {
  idle: 'لم تبدأ',
  running: 'جارية',
  paused: 'متوقفة مؤقتًا',
  completed: 'مكتملة',
};

const tahfizStatuses: Array<{ value: TahfizAttendanceStatus; label: string; tone: 'good' | 'neutral' | 'warn' }> = [
  { value: 'attended', label: 'حضرت وسجلته', tone: 'good' },
  { value: 'skipped-intentionally', label: 'تخطيته بقصد', tone: 'neutral' },
  { value: 'excused', label: 'غياب بعذر', tone: 'neutral' },
  { value: 'holiday', label: 'إجازة تحفيظ', tone: 'neutral' },
  { value: 'trip', label: 'رحلة / فعالية', tone: 'good' },
  { value: 'missed', label: 'فاتني', tone: 'warn' },
];

export function SessionTimerCard({
  date,
  kind,
  timer,
  note,
  disabledReason,
}: {
  date: DateKey;
  kind: SessionKind;
  timer: PersistentTimer;
  note?: string;
  disabledReason?: string;
}) {
  const { state, actions } = useRoutine();
  const day = getDayRecord(state, date);
  const now = useNow(timer.status === 'running');
  const details = labels[kind];
  const elapsed = getElapsedMs(timer, now);
  const isTahfiz = kind === 'tahfiz';
  const tahfizStatus = day.tahfiz.status;
  const manuallyClosedTahfiz = isTahfiz && ['skipped-intentionally', 'excused', 'holiday', 'trip', 'missed'].includes(tahfizStatus);
  const effectiveDisabledReason = disabledReason
    ?? (manuallyClosedTahfiz ? tahfizStatusLabel(tahfizStatus) : undefined);

  return (
    <article className={`session-card session-card--rich ${effectiveDisabledReason ? 'is-cancelled' : ''}`} data-testid={`${kind}-session`}>
      <div className="session-card__top">
        <span className="feature-icon"><Icon name={details.icon} /></span>
        <div className="session-card__copy">
          <h3>{details.title}</h3>
          <p>{effectiveDisabledReason ?? details.subtitle}</p>
        </div>
        <span className={`status-dot status-dot--${timer.status}`} aria-hidden="true" />
        <span className="sr-only">الحالة: {statusLabels[timer.status]}</span>
      </div>

      {isTahfiz && !disabledReason && (
        <div className="tahfiz-status-block">
          <div className="rich-field-heading">
            <strong>وش صار اليوم؟</strong>
            <small>اختيار الحالة ما يمس جدول الأسبوع القادم.</small>
          </div>
          <div className="status-chip-grid" role="group" aria-label="حالة التحفيظ اليوم">
            {tahfizStatuses.map((option) => (
              <button
                key={option.value}
                type="button"
                className={`status-choice status-choice--${option.tone} ${tahfizStatus === option.value ? 'is-selected' : ''}`}
                aria-pressed={tahfizStatus === option.value}
                onClick={() => actions.setTahfizStatus(date, option.value)}
              >
                {option.label}
              </button>
            ))}
            {tahfizStatus !== 'unrecorded' && (
              <button
                type="button"
                className="status-choice status-choice--reset"
                onClick={() => actions.setTahfizStatus(date, 'unrecorded')}
              >
                مسح الحالة
              </button>
            )}
          </div>
        </div>
      )}

      <div className="timer-display" dir="ltr" aria-live="polite">{formatDuration(elapsed)}</div>

      {!effectiveDisabledReason && (
        <div className="timer-actions">
          {(timer.status === 'idle' || timer.status === 'paused') && (
            <button className="button button--primary" type="button" onClick={() => actions.updateSessionTimer(date, kind, 'start')}>
              <Icon name="play" /> {timer.status === 'paused' ? 'متابعة' : 'بدء'}
            </button>
          )}
          {timer.status === 'running' && (
            <button className="button button--secondary" type="button" onClick={() => actions.updateSessionTimer(date, kind, 'pause')}>
              <Icon name="pause" /> إيقاف مؤقت
            </button>
          )}
          {(timer.status === 'running' || timer.status === 'paused') && (
            <button className="button button--quiet" type="button" onClick={() => actions.updateSessionTimer(date, kind, 'complete')}>
              <Icon name="check" /> إنهاء
            </button>
          )}
          {timer.status === 'completed' && (
            <>
              <span className="completion-label"><Icon name="check" /> مكتملة</span>
              <button className="text-button" type="button" onClick={() => actions.updateSessionTimer(date, kind, 'reset')}>إعادة الجلسة</button>
            </>
          )}
        </div>
      )}

      {isTahfiz ? (
        <TahfizDetails date={date} disabled={Boolean(disabledReason)} />
      ) : (
        <QuduratDetails date={date} note={note} />
      )}
    </article>
  );
}

function TahfizDetails({ date, disabled }: { date: DateKey; disabled: boolean }) {
  const { state, actions } = useRoutine();
  const day = getDayRecord(state, date);
  const tracking = day.tahfiz;

  return (
    <div className={`rich-session-fields ${disabled ? 'is-disabled-context' : ''}`}>
      <div className="rich-field-heading">
        <strong>سجل التحفيظ</strong>
        <small>خلّ اليوم له معنى أكثر من “اكتمل”.</small>
      </div>

      <div className="rich-two-col">
        <label className="field field--compact">
          <span>حفظ جديد</span>
          <input
            type="text"
            maxLength={300}
            value={tracking.newMemorization}
            placeholder="مثال: سورة الملك 1–10"
            onChange={(event) => actions.updateTahfizTracking(date, { newMemorization: event.target.value })}
          />
        </label>
        <label className="field field--compact">
          <span>مراجعة</span>
          <input
            type="text"
            maxLength={300}
            value={tracking.review}
            placeholder="مثال: جزء عم"
            onChange={(event) => actions.updateTahfizTracking(date, { review: event.target.value })}
          />
        </label>
        <label className="field field--compact">
          <span>تسميع</span>
          <input
            type="text"
            maxLength={300}
            value={tracking.recitation}
            placeholder="وش سمّعت اليوم؟"
            onChange={(event) => actions.updateTahfizTracking(date, { recitation: event.target.value })}
          />
        </label>
        <label className="field field--compact">
          <span>أخطاء التسميع</span>
          <input
            type="number"
            min="0"
            max="999"
            inputMode="numeric"
            value={tracking.mistakes || ''}
            placeholder="0"
            onChange={(event) => actions.updateTahfizTracking(date, { mistakes: Number(event.target.value) || 0 })}
          />
        </label>
      </div>

      <label className="field field--compact">
        <span>ملاحظة التحفيظ</span>
        <input
          type="text"
          maxLength={500}
          value={tracking.note}
          placeholder="شيء تبي تتذكره عن الحفظ أو المراجعة..."
          onChange={(event) => actions.updateTahfizTracking(date, { note: event.target.value })}
        />
      </label>
    </div>
  );
}

function QuduratDetails({ date, note }: { date: DateKey; note?: string }) {
  const { state, actions } = useRoutine();
  const day = getDayRecord(state, date);
  const tracking = day.qudurat;
  const accuracy = tracking.questions > 0 ? Math.round((tracking.correct / tracking.questions) * 100) : null;

  return (
    <div className="rich-session-fields">
      <div className="rich-field-heading">
        <strong>تقدم القدرات</strong>
        <small>الدرس + الأسئلة + الدقة، مو وقت وبس.</small>
      </div>

      <label className="field field--compact">
        <span>الدرس / الفيديو</span>
        <input
          type="text"
          maxLength={200}
          value={tracking.lessonName}
          placeholder="مثال: جدير — النسب والتناسب"
          onChange={(event) => actions.updateQuduratTracking(date, { lessonName: event.target.value })}
        />
      </label>

      <div className="qudurat-stats-grid">
        <label className="field field--compact">
          <span>الأسئلة</span>
          <input
            type="number"
            min="0"
            max="5000"
            inputMode="numeric"
            value={tracking.questions || ''}
            onChange={(event) => actions.updateQuduratTracking(date, { questions: Number(event.target.value) || 0 })}
          />
        </label>
        <label className="field field--compact">
          <span>الصحيح</span>
          <input
            type="number"
            min="0"
            max={tracking.questions || 0}
            inputMode="numeric"
            value={tracking.correct || ''}
            onChange={(event) => actions.updateQuduratTracking(date, { correct: Number(event.target.value) || 0 })}
          />
        </label>
        <label className="field field--compact">
          <span>أخطاء راجعتها</span>
          <input
            type="number"
            min="0"
            max="5000"
            inputMode="numeric"
            value={tracking.mistakesReviewed || ''}
            onChange={(event) => actions.updateQuduratTracking(date, { mistakesReviewed: Number(event.target.value) || 0 })}
          />
        </label>
        <div className="accuracy-tile" aria-label={accuracy === null ? 'الدقة غير محسوبة' : `الدقة ${accuracy}%`}>
          <span>الدقة</span>
          <strong>{accuracy === null ? '—' : `${accuracy}%`}</strong>
        </div>
      </div>

      <label className="field field--compact">
        <span>ملاحظة الجلسة</span>
        <input
          type="text"
          value={note ?? ''}
          maxLength={500}
          placeholder="مثال: أخطائي كانت في النسب العكسية"
          onChange={(event) => actions.updateSessionNote(date, 'qudurat', event.target.value)}
        />
      </label>
    </div>
  );
}

function tahfizStatusLabel(status: TahfizAttendanceStatus): string {
  return {
    unrecorded: 'غير مسجل',
    attended: 'حضرت وسجلته',
    'skipped-intentionally': 'تخطيته بقصد — لا يُحسب كأنك نسيته',
    excused: 'غياب بعذر',
    holiday: 'إجازة تحفيظ',
    trip: 'رحلة / فعالية تحفيظ',
    missed: 'فاتني التحفيظ',
  }[status];
}
