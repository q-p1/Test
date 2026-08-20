import { useState } from 'react';
import type { ExerciseDefinition } from '../types';
import { Icon } from './Icon';

export function ExerciseVisual({ exercise, large = false }: { exercise: ExerciseDefinition; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(exercise.image) && !failed;
  return (
    <div className={`exercise-visual ${large ? 'exercise-visual--large' : ''} ${showImage ? 'has-image' : 'is-placeholder'}`}>
      {showImage ? (
        <img
          src={exercise.image}
          alt={`الرسم الأصلي لتمرين ${exercise.arabicName} من خطة التمارين`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="exercise-placeholder" role="img" aria-label={`لا توجد صورة موثوقة لتمرين ${exercise.arabicName}`}>
          <Icon name="image" />
          <strong>{failed ? 'تعذّر تحميل الصورة الأصلية' : 'لا توجد صورة مطابقة في الخطة'}</strong>
          <span>{failed ? 'بقية تفاصيل التمرين ما زالت متاحة' : 'لن نعرض حركة غير مؤكدة'}</span>
        </div>
      )}
    </div>
  );
}
