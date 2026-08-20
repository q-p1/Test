import { useRoutine } from '../state/RoutineContext';
import { exerciseRestLabel } from '../data/exercises';
import type { ExerciseDefinition } from '../types';
import { BottomSheet } from './BottomSheet';
import { ExerciseVisual } from './ExerciseVisual';
import { Icon } from './Icon';

export function ExerciseDetailSheet({ exercise, open, onClose }: { exercise: ExerciseDefinition | null; open: boolean; onClose(): void }) {
  const { state, actions } = useRoutine();
  if (!exercise) return null;
  const activeLog = state.workout.active?.logs[exercise.id];
  return (
    <BottomSheet open={open} title={exercise.arabicName} description={exercise.englishName} onClose={onClose}>
      <div className="exercise-detail">
        <ExerciseVisual exercise={exercise} large />
        {exercise.imageStatus !== 'verified-pdf' && (
          <div className="source-warning"><Icon name="info" /><span>لا توجد في ملف الخطة صورة مطابقة موثوقة لهذا التمرين؛ لذلك نعرض مكانًا واضحًا بدل ربطه بحركة خاطئة.</span></div>
        )}
        <div className="detail-stat-grid">
          <div><span>الجولات</span><strong>{exercise.sets}</strong></div>
          <div><span>الهدف</span><strong>{exercise.target}</strong></div>
          <div><span>الراحة</span><strong>{exerciseRestLabel(exercise)}</strong></div>
        </div>
        <section className="detail-copy"><span className="eyebrow">طريقة بسيطة</span><p>{exercise.instruction}</p></section>
        <div className="coaching-grid">
          <section><span className="detail-icon detail-icon--good"><Icon name="check" /></span><div><h3>النقطة الأهم</h3><p>{exercise.technique}</p></div></section>
          <section><span className="detail-icon detail-icon--warn"><Icon name="info" /></span><div><h3>خطأ شائع</h3><p>{exercise.commonMistake}</p></div></section>
          <section><span className="detail-icon"><Icon name="chevron-right" /></span><div><h3>نسخة أسهل</h3><p>{exercise.easier}</p></div></section>
          <section><span className="detail-icon"><Icon name="chevron-left" /></span><div><h3>نسخة أصعب</h3><p>{exercise.harder}</p></div></section>
        </div>
        {activeLog && (
          <section className="detail-logging" aria-labelledby="detail-logging-title">
            <div className="section-heading section-heading--small"><div><span className="eyebrow">الحصة الجارية</span><h3 id="detail-logging-title">سجّل الجولات</h3></div></div>
            <div className="set-inputs">
              {activeLog.values.map((value, index) => (
                <label key={index}><span>الجولة {index + 1}</span><input inputMode="numeric" type="number" min="0" max="999" value={value ?? ''} onChange={(event) => actions.updateWorkoutLog(exercise.id, index, event.target.value === '' ? null : Number(event.target.value))} /><small>{exercise.metric === 'seconds' ? 'ثانية' : 'تكرار'}</small></label>
              ))}
            </div>
          </section>
        )}
        <p className="safety-note"><Icon name="shield" /> الجودة أهم من العدد. أوقف الحركة إذا ظهر ألم حاد أو غير معتاد.</p>
      </div>
    </BottomSheet>
  );
}
