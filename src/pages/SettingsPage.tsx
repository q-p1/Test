import { useState } from 'react';
import { toDateKey } from '../lib/date';
import { getDayRecord } from '../lib/storage';
import { getOverridesForDate } from '../lib/schedule';
import { useRoutine } from '../state/RoutineContext';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icon';

export function SettingsPage() {
  const { state, actions } = useRoutine();
  const today = toDateKey(new Date());
  const day = getDayRecord(state, today);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteOverrides, setDeleteOverrides] = useState(false);
  const overrideCount = getOverridesForDate(state.dateOverrides, today).length;
  const completionCount = Object.values(day.prayers).filter(Boolean).length
    + Number(day.sessions.tahfiz.status !== 'idle')
    + Number(day.sessions.qudurat.status !== 'idle')
    + Object.keys(day.taskStatuses).length;

  return (
    <div className="page page--settings" data-page="settings">
      <header className="page-header page-header--navy">
        <span className="eyebrow eyebrow--gold">تحكّم بدون مخاطرة</span>
        <h1>الإعدادات</h1>
        <p>البيانات اليومية منفصلة؛ حذف يوم لا يمس تاريخك أو البرنامج أو بقية الأيام.</p>
      </header>

      <section className="settings-section" aria-labelledby="profile-title">
        <div className="settings-heading"><span><Icon name="today" /></span><div><h2 id="profile-title">التخصيص</h2><p>تفاصيل بسيطة تجعل الواجهة أقرب ليومك.</p></div></div>
        <label className="setting-row setting-row--stacked"><span><strong>اسمك في التحية</strong><small>اختياري، ومحفوظ على هذا الجهاز فقط</small></span><input type="text" maxLength={60} value={state.settings.userName} onChange={(event) => actions.updateSettings({ userName: event.target.value })} placeholder="مثال: داوي" /></label>
        <label className="setting-row"><span><strong>تقليل الحركة</strong><small>يوقف الانتقالات غير الضرورية</small></span><input className="switch" type="checkbox" checked={state.settings.reducedMotion} onChange={(event) => actions.updateSettings({ reducedMotion: event.target.checked })} /></label>
      </section>

      <section className="settings-section" aria-labelledby="pwa-title">
        <div className="settings-heading"><span><Icon name="shield" /></span><div><h2 id="pwa-title">روتيني على iPhone</h2><p>يعمل كتطبيق مستقل ويحفظ بياناتك محليًا.</p></div></div>
        <ol className="install-steps">
          <li><span>1</span><div><strong>افتح في Safari</strong><small>وليس متصفحًا داخل تطبيق آخر</small></div></li>
          <li><span>2</span><div><strong>اضغط زر المشاركة</strong><small>ثم اختر “إضافة إلى الشاشة الرئيسية”</small></div></li>
          <li><span>3</span><div><strong>افتح أيقونة روتيني</strong><small>ستعمل بوضع مستقل مع safe areas</small></div></li>
        </ol>
        <button className="button button--secondary button--full" type="button" onClick={() => window.dispatchEvent(new Event('routine:check-update'))}><Icon name="restore" /> التحقق من تحديث التطبيق</button>
      </section>

      <section className="settings-section" aria-labelledby="data-title">
        <div className="settings-heading"><span><Icon name="history" /></span><div><h2 id="data-title">البيانات</h2><p>{state.workout.history.length} حصص محفوظة · {Object.keys(state.days).length} أيام مسجلة</p></div></div>
        <div className="today-data-summary"><div><span>بيانات اليوم</span><strong>{completionCount} سجلات</strong></div><div><span>استثناءات اليوم</span><strong>{overrideCount}</strong></div></div>
        <button className="danger-row" type="button" onClick={() => setDeleteOpen(true)}><span><Icon name="trash" /></span><div><strong>حذف بيانات هذا اليوم</strong><small>لا يحذف الإعدادات أو الأيام السابقة أو البرنامج</small></div><Icon name="chevron-left" /></button>
      </section>

      <section className="settings-section settings-section--about" aria-labelledby="about-title">
        <div className="settings-heading"><span className="brand-mark brand-mark--small">ر</span><div><h2 id="about-title">روتيني</h2><p>الإصدار 1.0.0 · عربي · مصمم لـiPhone أولًا</p></div></div>
        <p>التركيز على يوم واضح، عبادة محفوظة، دراسة عميقة، وقوة تُبنى باستمرارية آمنة.</p>
      </section>

      <BottomSheet open={deleteOpen} title="حذف بيانات اليوم؟" description={`سيُحذف ما سجلته في ${today} فقط، بما فيه المؤقتات والملاحظات والحصة المنفذة اليوم.`} onClose={() => setDeleteOpen(false)} size="medium">
        <div className="delete-confirmation">
          <div className="warning-box"><Icon name="info" /><p><strong>لن يُحذف:</strong> إعداداتك، أي يوم سابق، خطة A/B/C/D، أو تاريخ الحصص في الأيام الأخرى.</p></div>
          {overrideCount > 0 && <label className="check-field"><input type="checkbox" checked={deleteOverrides} onChange={(event) => setDeleteOverrides(event.target.checked)} /><span><strong>احذف استثناءات هذا التاريخ أيضًا</strong><small>الاستثناءات الممتدة ستبقى في الأيام الأخرى.</small></span></label>}
          <div className="confirmation-actions"><button className="button button--danger button--full" type="button" onClick={() => { actions.deleteDate(today, deleteOverrides); setDeleteOpen(false); setDeleteOverrides(false); }}>حذف هذا اليوم فقط</button><button className="button button--secondary button--full" type="button" onClick={() => setDeleteOpen(false)}>إلغاء</button></div>
        </div>
      </BottomSheet>
    </div>
  );
}
