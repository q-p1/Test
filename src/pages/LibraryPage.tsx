import { useMemo, useState } from 'react';
import { EXERCISES } from '../data/exercises';
import { getBestExerciseValue } from '../lib/fitness';
import { useRoutine } from '../state/RoutineContext';
import type { ExerciseDefinition } from '../types';
import { ExerciseCard } from '../components/ExerciseCard';
import { ExerciseDetailSheet } from '../components/ExerciseDetailSheet';
import { Icon } from '../components/Icon';

type Filter = 'all' | 'warmup' | 'main';

export function LibraryPage() {
  const { state } = useRoutine();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ExerciseDefinition | null>(null);
  const exercises = useMemo(() => EXERCISES.filter((exercise) => {
    const matchesFilter = filter === 'all' || exercise.category === filter;
    const normalized = query.trim().toLocaleLowerCase('ar');
    const matchesQuery = !normalized || `${exercise.arabicName} ${exercise.englishName}`.toLocaleLowerCase('ar').includes(normalized);
    return matchesFilter && matchesQuery;
  }), [filter, query]);

  return (
    <div className="page page--library" data-page="library">
      <header className="page-header page-header--navy">
        <span className="eyebrow eyebrow--gold">مرجع بصري واضح</span>
        <h1>مكتبة التمارين</h1>
        <p>افتح أي تمرين لتعرف الحركة، النقطة التقنية، والنسخة الأنسب لك.</p>
      </header>
      <div className="library-toolbar">
        <label className="search-field"><Icon name="search" /><span className="sr-only">ابحث عن تمرين</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ابحث بالعربي أو الإنجليزي" /></label>
        <div className="segmented-control" role="group" aria-label="تصفية التمارين">
          <button type="button" className={filter === 'all' ? 'is-active' : ''} onClick={() => setFilter('all')}>الكل</button>
          <button type="button" className={filter === 'warmup' ? 'is-active' : ''} onClick={() => setFilter('warmup')}>الإحماء</button>
          <button type="button" className={filter === 'main' ? 'is-active' : ''} onClick={() => setFilter('main')}>الأساسية</button>
        </div>
      </div>
      <div className="library-summary"><span>{exercises.length} تمرينًا</span><span><Icon name="image" /> الصور الأصلية قيد انتظار ملف الخطة</span></div>
      {exercises.length > 0 ? (
        <section className="exercise-grid" aria-labelledby="exercise-list-title">
          <h2 id="exercise-list-title" className="sr-only">قائمة التمارين</h2>
          {exercises.map((exercise) => <ExerciseCard key={exercise.id} exercise={exercise} best={getBestExerciseValue(state.workout.history, exercise.id)} onOpen={() => setSelected(exercise)} />)}
        </section>
      ) : (
        <div className="empty-state"><span><Icon name="search" /></span><h2>لا يوجد تمرين بهذا الاسم</h2><p>جرّب كلمة أقصر أو اختر “الكل”.</p></div>
      )}
      <ExerciseDetailSheet exercise={selected} open={Boolean(selected)} onClose={() => setSelected(null)} />
    </div>
  );
}
