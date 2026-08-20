import { useEffect, useState } from 'react';
import { BottomNavigation, type AppPage } from './components/BottomNavigation';
import { Icon } from './components/Icon';
import { FitnessPage } from './pages/FitnessPage';
import { LibraryPage } from './pages/LibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { TodayPage } from './pages/TodayPage';
import { useRoutine } from './state/RoutineContext';

export default function App() {
  const { state, actions, notice, storageError } = useRoutine();
  const [page, setPage] = useState<AppPage>('today');
  const [updateRegistration, setUpdateRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    const onUpdate = (event: Event) => setUpdateRegistration((event as CustomEvent<ServiceWorkerRegistration>).detail);
    window.addEventListener('routine:update-ready', onUpdate);
    return () => window.removeEventListener('routine:update-ready', onUpdate);
  }, []);

  const changePage = (next: AppPage) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: state.settings.reducedMotion ? 'auto' : 'smooth' });
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">انتقل إلى المحتوى</a>
      <header className="app-bar">
        <div className="app-bar__brand"><span className="brand-mark">ر</span><div><strong>روتيني</strong><small>{state.settings.userName ? `يوم ${state.settings.userName}` : 'يوم واضح، خطوة بخطوة'}</small></div></div>
        <span className="local-badge"><span /> محفوظ محليًا</span>
      </header>
      <main id="main-content" className="app-main">
        {page === 'today' && <TodayPage onOpenFitness={() => changePage('fitness')} />}
        {page === 'fitness' && <FitnessPage />}
        {page === 'library' && <LibraryPage />}
        {page === 'settings' && <SettingsPage />}
      </main>
      <BottomNavigation key={page} page={page} onChange={changePage} />
      {(notice || storageError) && (
        <div className={`toast ${storageError ? 'toast--error' : ''}`} role="status"><span>{storageError ?? notice}</span>{notice && <button type="button" aria-label="إغلاق الإشعار" onClick={actions.dismissNotice}><Icon name="close" /></button>}</div>
      )}
      {updateRegistration && (
        <div className="update-banner" role="status"><div><Icon name="spark" /><span><strong>نسخة جديدة جاهزة</strong><small>حدّث الآن لتظهر الواجهة الجديدة كاملة.</small></span></div><button type="button" onClick={() => updateRegistration.waiting?.postMessage({ type: 'SKIP_WAITING' })}>تحديث</button></div>
      )}
    </div>
  );
}
