import { useNow } from '../hooks/useNow';
import { formatDuration, getElapsedMs } from '../lib/timer';
import { useRoutine } from '../state/RoutineContext';
import type { DateKey, PersistentTimer, SessionKind } from '../types';
import { Icon } from './Icon';

const labels: Record<SessionKind, { title: string; subtitle: string; icon: 'book' | 'brain' }> = {
  tahfiz: { title: 'التحفيظ', subtitle: 'وقت محفوظ بدقة حتى لو أغلقت التطبيق', icon: 'book' },
  qudurat: { title: 'القدرات', subtitle: 'جلسة دراسة عميقة، وليست علامة سريعة', icon: 'brain' },
};

const statusLabels: Record<PersistentTimer['status'], string> = {
  idle: 'لم تبدأ',
  running: 'جارية',
  paused: 'متوقفة مؤقتًا',
  completed: 'مكتملة',
};

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
  const { actions } = useRoutine();
  const now = useNow(timer.status === 'running');
  const details = labels[kind];
  const elapsed = getElapsedMs(timer, now);

  return (
    <article className={`session-card ${disabledReason ? 'is-cancelled' : ''}`} data-testid={`${kind}-session`}>
      <div className="session-card__top">
        <span className="feature-icon"><Icon name={details.icon} /></span>
        <div className="session-card__copy">
          <h3>{details.title}</h3>
          <p>{disabledReason ?? details.subtitle}</p>
        </div>
        <span className={`status-dot status-dot--${timer.status}`} aria-hidden="true" />
        <span className="sr-only">الحالة: {statusLabels[timer.status]}</span>
      </div>
      <div className="timer-display" dir="ltr" aria-live="polite">{formatDuration(elapsed)}</div>
      {!disabledReason && (
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
      {!disabledReason && (
        <label className="field field--compact">
          <span>ملاحظة اختيارية</span>
          <input
            type="text"
            value={note ?? ''}
            maxLength={500}
            placeholder={kind === 'qudurat' ? 'مثال: أكملت درس النسب' : 'مثال: مراجعة السورة'}
            onChange={(event) => actions.updateSessionNote(date, kind, event.target.value)}
          />
        </label>
      )}
    </article>
  );
}
