import { useMemo, useState } from 'react';
import { EXERCISE_MAP, WORKOUTS, WARMUP_IDS, exerciseRestLabel } from '../data/exercises';
import { useNow } from '../hooks/useNow';
import { findNextUnfinishedWorkout, getCycleInfo, getWeeklyWorkoutHistory, scheduledWorkoutForDate } from '../lib/fitness';
import { formatArabicDate, toDateKey } from '../lib/date';
import { resolveDay } from '../lib/schedule';
import { formatDuration, getElapsedMs } from '../lib/timer';
import { getDayRecord } from '../lib/storage';
import { useRoutine } from '../state/RoutineContext';
import type { ExerciseDefinition, WorkoutId } from '../types';
import { BottomSheet } from '../components/BottomSheet';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseDetailSheet } from '../components/ExerciseDetailSheet';
import { Icon } from '../components/Icon';

const weekPlan: Array<{ day: string; id: WorkoutId | null; label: string }> = [
  { day: 'الأحد', id: 'A', label: 'دفع + كور' },
  { day: 'الاثنين', id: 'B', label: 'رجل + خلفية' },
  { day: 'الثلاثاء', id: null, label: 'حركة خفيفة' },
  { day: 'الأربعاء', id: 'C', label: 'ظهر + ثبات' },
  { day: 'الخميس', id: 'D', label: 'رجل + تحكم' },
  { day: 'الجمعة', id: null, label: 'اختياري' },
  { day: 'السبت', id: null, label: 'راحة' },
];

export function FitnessPage() {
  const { state, actions } = useRoutine();
  const today = toDateKey(new Date());
  const cycle = getCycleInfo(state.workout.startedOn, today);
  const next = useMemo(() => findNextUnfinishedWorkout(state.workout, today, (date, workoutId) => {
    const explicitStatus = state.days[date]?.taskStatuses.workout;
    if (explicitStatus === 'skipped' || explicitStatus === 'cancelled') return true;
    return resolveDay(state.baseSchedule, state.dateOverrides, date).items.some((item) => item.kind === 'workout' && item.workoutId === workoutId && item.status === 'cancelled');
  }), [state.workout, state.days, state.baseSchedule, state.dateOverrides, today]);
  const scheduled = scheduledWorkoutForDate(today);
  const weeklyHistory = getWeeklyWorkoutHistory(state.workout, today);
  const day = getDayRecord(state, today);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);
  const active = state.workout.active;
  const activeNow = useNow(active?.timer.status === 'running');
  const [cancelOpen, setCancelOpen] = useState(false);
  const activeDefinition = active ? WORKOUTS[active.workoutId] : null;
  const catchUp = scheduled !== null && next.workoutId !== scheduled;

  return (
    <div className="page page--fitness" data-page="fitness">
      <header className="fitness-hero">
        <div className="fitness-hero__top"><span className="eyebrow eyebrow--gold">الدورة {cycle.cycle} · الأسبوع {cycle.week}/24</span><span className="phase-chip">{cycle.phase}</span></div>
        <h1>{active ? `حصة ${active.workoutId} جارية` : 'ابنِ قوتك بهدوء'}</h1>
        <p>أربع حصص مقاومة أسبوعيًا، وبينها حركة واستشفاء. التاريخ مستمر ولا يُمسح عند دورة جديدة.</p>
        <div
          className="cycle-progress"
          role="progressbar"
          aria-label="تقدم الدورة التدريبية"
          aria-valuemin={1}
          aria-valuemax={24}
          aria-valuenow={cycle.week}
          aria-valuetext={`الأسبوع ${cycle.week} من 24`}
        ><span style={{ width: `${(cycle.week / 24) * 100}%` }} /></div>
      </header>

      {!active && (
        <section className="next-workout-card" aria-labelledby="next-workout-title">
          <div className="next-workout-card__letter">{next.workoutId}</div>
          <div className="next-workout-card__copy">
            <span className="eyebrow">الحصة التالية لك</span>
            <h2 id="next-workout-title">{WORKOUTS[next.workoutId].arabicName}</h2>
            <p>{WORKOUTS[next.workoutId].focus}</p>
            {scheduled && <div className={catchUp ? 'schedule-contrast is-catchup' : 'schedule-contrast'}><Icon name="calendar" /><span>المجدول اليوم <strong>{scheduled}</strong>{catchUp && <> · سنكمل <strong>{next.workoutId}</strong> أولًا</>}</span></div>}
          </div>
          <button className="button button--gold button--large" type="button" onClick={() => actions.startWorkout(next.workoutId, next.date)}><Icon name="play" /> بدء الحصة</button>
        </section>
      )}

      {active && activeDefinition && (
        <section className="active-workout" aria-labelledby="active-workout-title">
          <div className="active-workout__header">
            <div><span className="eyebrow">حصة {active.workoutId}</span><h2 id="active-workout-title">{activeDefinition.arabicName}</h2><p>{active.scheduledFor !== active.date ? `تعويض حصة ${formatArabicDate(active.scheduledFor, 'short')}` : 'الحصة المجدولة اليوم'}</p></div>
            <div className="workout-timer" dir="ltr"><Icon name="clock" /><strong>{formatDuration(getElapsedMs(active.timer, activeNow))}</strong></div>
          </div>
          <div className="timer-actions timer-actions--workout">
            {active.timer.status === 'running' ? (
              <button className="button button--secondary" type="button" onClick={() => actions.updateWorkoutTimer('pause')}><Icon name="pause" /> إيقاف مؤقت</button>
            ) : (
              <button className="button button--primary" type="button" onClick={() => actions.updateWorkoutTimer('start')}><Icon name="play" /> متابعة الوقت</button>
            )}
            <button className="button button--quiet button--danger-text" type="button" onClick={() => setCancelOpen(true)}>إلغاء الحصة</button>
          </div>

          <div className="warmup-callout"><span className="feature-icon"><Icon name="spark" /></span><div><strong>ابدأ بالإحماء</strong><p>{WARMUP_IDS.map((id) => EXERCISE_MAP[id]?.arabicName).filter(Boolean).join(' · ')}</p></div></div>
          <div className="active-exercise-list">
            {activeDefinition.exerciseIds.map((exerciseId, exerciseIndex) => {
              const exercise = EXERCISE_MAP[exerciseId];
              const log = active.logs[exerciseId];
              if (!exercise || !log) return null;
              return (
                <article className="active-exercise" key={exerciseId}>
                  <button type="button" className="active-exercise__title" onClick={() => setSelectedExercise(exercise)}><span>{exerciseIndex + 1}</span><div><h3>{exercise.arabicName}</h3><p>{exercise.target} · راحة {exerciseRestLabel(exercise)}</p></div><Icon name="chevron-left" /></button>
                  <div className="set-inputs set-inputs--inline">
                    {log.values.map((value, index) => (
                      <label key={index}><span>جولة {index + 1}</span><input aria-label={`${exercise.arabicName} الجولة ${index + 1}`} inputMode="numeric" type="number" min="0" max="999" value={value ?? ''} onChange={(event) => actions.updateWorkoutLog(exerciseId, index, event.target.value === '' ? null : Number(event.target.value))} /><small>{exercise.metric === 'seconds' ? 'ث' : 'عدة'}</small></label>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="workout-reflection">
            <fieldset className="rating-field"><legend>تقييم الحصة</legend><div>{[1, 2, 3, 4, 5].map((rating) => <button type="button" key={rating} className={active.rating === rating ? 'is-selected' : ''} aria-label={`تقييم ${rating} من 5`} onClick={() => actions.updateWorkoutMeta('rating', rating)}>{rating}</button>)}</div></fieldset>
            <label className="field"><span>ملاحظة</span><textarea rows={2} value={active.note} onChange={(event) => actions.updateWorkoutMeta('note', event.target.value)} placeholder="كيف كانت التقنية أو الطاقة؟" /></label>
            <label className="field"><span>أفضل شيء اليوم</span><textarea rows={2} value={active.proudMoment} onChange={(event) => actions.updateWorkoutMeta('proudMoment', event.target.value)} placeholder="شيء صغير أنت فخور به" /></label>
          </div>
          <button className="button button--gold button--large button--full" type="button" onClick={() => actions.finishWorkout()}><Icon name="check" /> إنهاء وحفظ الحصة</button>
        </section>
      )}

      <section className="weekly-plan" aria-labelledby="weekly-plan-title">
        <div className="section-heading"><div><span className="eyebrow">إيقاع مستدام</span><h2 id="weekly-plan-title">هذا الأسبوع</h2></div><span className="section-heading__aside">{weeklyHistory.length}/4 حصص</span></div>
        <div className="week-strip">
          {weekPlan.map((item, index) => {
            const completed = item.id ? weeklyHistory.some((entry) => entry.workoutId === item.id) : false;
            const todayIndex = new Date().getDay();
            return <div key={item.day} className={`${completed ? 'is-complete' : ''} ${todayIndex === index ? 'is-today' : ''}`}><span>{item.day.slice(2, 5)}</span><strong>{item.id ?? (index === 2 ? 'خفيف' : index === 5 ? 'حر' : 'راحة')}</strong><small>{item.label}</small>{completed && <Icon name="check" />}</div>;
          })}
        </div>
        <button type="button" className={day.movementCompleted ? 'movement-toggle is-complete' : 'movement-toggle'} aria-pressed={day.movementCompleted} onClick={() => actions.toggleMovement(today)}><span><Icon name="walk" /></span><div><strong>حركة خفيفة اليوم</strong><p>مشي، كرة اختيارية، أو حركة مريحة</p></div><span className="movement-toggle__check"><Icon name="check" /></span></button>
      </section>

      <section className="workout-preview" aria-labelledby="workout-preview-title">
        <div className="section-heading"><div><span className="eyebrow">محتوى الحصة التالية</span><h2 id="workout-preview-title">تمارين {next.workoutId}</h2></div></div>
        <div className="exercise-grid exercise-grid--compact">
          {WORKOUTS[next.workoutId].exerciseIds.map((id) => {
            const exercise = EXERCISE_MAP[id];
            return exercise ? <ExerciseCard key={id} exercise={exercise} onOpen={() => setSelectedExercise(exercise)} /> : null;
          })}
        </div>
      </section>

      <section className="history-section" aria-labelledby="history-title">
        <div className="section-heading"><div><span className="eyebrow">لا يضيع تقدمك</span><h2 id="history-title">آخر الحصص</h2></div><Icon name="history" /></div>
        {state.workout.history.length > 0 ? (
          <div className="history-list">
            {[...state.workout.history].reverse().slice(0, 6).map((entry) => <div key={entry.id}><span className="history-letter">{entry.workoutId}</span><div><strong>{WORKOUTS[entry.workoutId].arabicName}</strong><small>{formatArabicDate(entry.date, 'short')} · دورة {entry.cycle}، أسبوع {entry.week}</small></div><span>{formatDuration(entry.durationMs)}</span></div>)}
          </div>
        ) : <div className="empty-state empty-state--small"><span><Icon name="history" /></span><h3>أول حصة ستظهر هنا</h3><p>السجل مستمر عبر كل دورات الـ24 أسبوعًا.</p></div>}
      </section>

      <p className="safety-note"><Icon name="shield" /> البرنامج يركز على القوة والتقنية والاستمرارية، مع أيام راحة وحركة خفيفة بين الحصص.</p>
      <ExerciseDetailSheet exercise={selectedExercise} open={Boolean(selectedExercise)} onClose={() => setSelectedExercise(null)} />
      <BottomSheet open={cancelOpen} title="إلغاء الحصة الجارية؟" description="سيُحذف مؤقت هذه الحصة وتسجيلها غير المكتمل فقط." onClose={() => setCancelOpen(false)} size="medium">
        <div className="confirmation-actions"><button className="button button--danger button--full" type="button" onClick={() => { actions.cancelWorkout(); setCancelOpen(false); }}>نعم، إلغاء الحصة</button><button className="button button--secondary button--full" type="button" onClick={() => setCancelOpen(false)}>العودة للحصة</button></div>
      </BottomSheet>
    </div>
  );
}
