import { useNow } from '../hooks/useNow';
import { getDayRecord } from '../lib/storage';
import { formatDuration, getElapsedMs } from '../lib/timer';
import { useRoutine } from '../state/RoutineContext';
import type { DateKey, PersistentTimer, SessionKind, TahfizAttendanceStatus } from '../types';
import { Icon } from './Icon';

const labels: Record<SessionKind, { title: string; subtitle: string; icon: 'book' | 'brain' }> = {
  tahfiz: { title: 'التحفيظ', subtitle: 'الحضور والمحتوى والوقت، كلها محفوظة لليوم نفسه', icon: 'book' },
  qudurat: { title: 'القدرات', subtitle: 'هدف زمني واضح، والأسئلة والدقة تبقى سجلًا للجلسة', icon: 'brain' },
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

const quduratGoalPresets = [30, 45, 60, 90, 120];

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
  const isQudurat = kind === 'qudurat';
  const targetMinutes = clampQuduratTarget(state.settings.quduratTargetMinutes);
  const targetMs = targetMinutes * 60_000;
  const remainingMs = Math.max(0, targetMs - elapsed);
  const overGoalMs = Math.max(0, elapsed - targetMs);
  const goalProgress = targetMs > 0 ? Math.min(100, Math.floor((elapsed / targetMs) * 100)) : 0;
  const goalReached = isQudurat && elapsed >= targetMs;
  const tahfizStatus = day.tahfiz.status;
  const manuallyClosedTahfiz = isTahfiz && ['skipped-intentionally', 'excused', 'holiday', 'trip', 'missed'].includes(tahfizStatus);
  const effectiveDisabledReason = disabledReason
    ?? (manuallyClosedTahfiz ? tahfizStatusLabel(tahfizStatus) : undefined);

  const saveQuduratTarget = (raw: string) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    actions.updateSettings({ quduratTargetMinutes: clampQuduratTarget(value) });
  };

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

      {isQudurat && !effectiveDisabledReason && (
        <div className="tahfiz-status-block" data-testid="qudurat-goal">
          <div className="rich-field-heading">
            <strong>هدف اليوم</strong>
            <small>{goalReached ? `وصلت للهدف · ${goalProgress}%` : `أنجزت ${goalProgress}% · باقي ${formatDuration(remainingMs)}`}</small>
          </div>
          <div className="qudurat-stats-grid">
            <label className="field field--compact">
              <span>مدة الهدف بالدقائق</span>
              <input
                key={`qudurat-goal-${targetMinutes}`}
                aria-label="مدة هدف القدرات بالدقائق"
                type="number"
                inputMode="numeric"
                min="15"
                max="240"
                step="5"
                defaultValue={targetMinutes}
                onBlur={(event) => saveQuduratTarget(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
              />
            </label>
            <div className="accuracy-tile" aria-label={goalReached ? `تجاوزت الهدف بمقدار ${formatDuration(overGoalMs)}` : `المتبقي ${formatDuration(remainingMs)}`}>
              <span>{goalReached ? 'فوق الهدف' : 'المتبقي'}</span>
              <strong dir="ltr">{goalReached ? `+${formatDuration(overGoalMs)}` : formatDuration(remainingMs)}</strong>
            </div>
          </div>
          <div className="status-chip-grid" role="group" aria-label="اختيارات سريعة لهدف القدرات">
            {quduratGoalPresets.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={`status-choice status-choice--neutral ${targetMinutes === minutes ? 'is-selected' : ''}`}
                aria-pressed={targetMinutes === minutes}
                onClick={() => actions.updateSettings({ quduratTargetMinutes: minutes })}
              >
                {minutes} د
              </button>
            ))}
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
        <strong>سجل الجلسة</strong>
        <small>عدد الأسئلة والدقة معلومات مفيدة، لكن هدف اليوم صار وقتًا.</small>
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

function clampQuduratTarget(value: number): number {
  const rounded = Math.round(Number(value) || 60);
  return Math.max(15, Math.min(240, rounded));
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
