import type { ExerciseDefinition } from '../types';
import { exerciseRestLabel } from '../data/exercises';
import { ExerciseVisual } from './ExerciseVisual';
import { Icon } from './Icon';

export function ExerciseCard({ exercise, best, onOpen }: { exercise: ExerciseDefinition; best?: number | null; onOpen(): void }) {
  return (
    <article className="exercise-card">
      <button type="button" className="exercise-card__button" onClick={onOpen} aria-label={`عرض تفاصيل ${exercise.arabicName}`}>
        <ExerciseVisual exercise={exercise} />
        <div className="exercise-card__body">
          <div className="exercise-card__title"><div><h3>{exercise.arabicName}</h3><p dir="ltr">{exercise.englishName}</p></div><Icon name="chevron-left" /></div>
          <div className="exercise-card__meta">
            <span><strong>{exercise.sets}</strong> جولات</span>
            <span>{exercise.target}</span>
            <span>راحة {exerciseRestLabel(exercise)}</span>
          </div>
          {best !== undefined && best !== null && <span className="best-chip"><Icon name="award" /> أفضل نتيجة: {best} {exercise.metric === 'seconds' ? 'ث' : 'تكرار'}</span>}
        </div>
      </button>
    </article>
  );
}
