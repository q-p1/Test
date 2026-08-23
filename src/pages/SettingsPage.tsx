import { useMemo, useState } from 'react';
import { minutesFromTime, toDateKey } from '../lib/date';
import { getDayRecord } from '../lib/storage';
import { getOverridesForDate } from '../lib/schedule';
import { loadSchoolData, saveSchoolData, type SchoolData } from '../lib/schoolData';
import { useRoutine } from '../state/RoutineContext';
import type { BaseScheduleItem, DateKey, RoutineState } from '../types';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icon';

const WEEKDAYS = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الاثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
];

export function SettingsPage() {
  const { state, actions } = useRoutine();
  const today = toDateKey(new Date());
  const day = getDayRecord(state, today);
  const school = loadSchoolData();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteOverrides, setDeleteOverrides] = useState(false);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineStart, setRoutineStart] = useState('17:00');
  const [routineEnd, setRoutineEnd] = useState('18:00');
  const [routineDays, setRoutineDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [routineMessage, setRoutineMessage] = useState('');
  const [dataMessage, setDataMessage] = useState('');
  const overrideCount = getOverridesForDate(state.dateOverrides, today).length;
  const hasSchoolDay = Boolean(school.days[today]);
  const completionCount = Object.values(day.prayers).filter(Boolean).length
    + Number(day.sessions.tahfiz.status !== 'idle' || day.tahfiz.status !== 'unrecorded')
    + Number(day.sessions.qudurat.status !== 'idle' || day.qudurat.questions > 0)
    + day.logs.length
    + Object.keys(day.taskStatuses).length
    + Number(hasSchoolDay);
  const appIcon = `${import.meta.env.BASE_URL}icons/icon.svg`;

  const recurring = useMemo(() => {
    const map = new Map<string, BaseScheduleItem>();
    Object.values(state.baseSchedule).flat().forEach((item) => {
      if (item.id.startsWith('recurring-')) map.set(item.id, item);
    });
    return [...map.values()];
  }, [state.baseSchedule]);

  const scheduleTargets = useMemo(() => [
    { id: 'school', title: 'المدرسة', item: findScheduleItem(state, 'school'), days: [0, 1, 2, 3, 4] },
    { id: 'tahfiz', title: 'التحفيظ', item: findScheduleItem(state, 'tahfiz'), days: [0, 1, 2, 3, 4] },
    { id: 'qudurat', title: 'القدرات', item: findScheduleItem(state, 'qudurat'), days: [0, 1, 2, 3, 4] },
  ], [state]);

  const addRoutine = () => {
    const title = routineTitle.trim();
    if (!title) { setRoutineMessage('اكتب اسم الفقرة أولًا.'); return; }
    if (routineDays.length === 0) { setRoutineMessage('اختر يومًا واحدًا على الأقل.'); return; }
    if (minutesFromTime(routineStart) >= minutesFromTime(routineEnd)) { setRoutineMessage('وقت النهاية لازم يكون بعد البداية.'); return; }
    actions.addRecurringRoutine(title, routineStart, routineEnd, routineDays);
    setRoutineTitle('');
    setRoutineMessage('انضافت الفقرة للجدول الأسبوعي.');
  };

  const deleteToday = () => {
    try {
      deleteSchoolDay(school, today);
      actions.deleteDate(today, deleteOverrides);
      setDataMessage('حُذفت بيانات هذا اليوم من روتيني والمدرسة فقط.');
      setDeleteOpen(false);
      setDeleteOverrides(false);
    } catch {
      setDataMessage('تعذّر حذف تسجيل المدرسة من هذا الجهاز. لم نحذف بقية بيانات اليوم حتى تبقى العملية آمنة.');
    }
  };

  return (
    <div className="page page--settings" data-page="settings">
      <header className="page-header page-header--navy">
        <span className="eyebrow eyebrow--gold">تحكّم بدون مخاطرة</span>
        <h1>الإعدادات</h1>
        <p>رجعنا إعدادات اليوم والجدول والنسخ الاحتياطي، مع بقاء كل يوم واستثناء مستقل عن الثاني.</p>
      </header>

      <section className="settings-section" aria-labelledby="profile-title">
        <div className="settings-heading"><span><Icon name="today" /></span><div><h2 id="profile-title">التخصيص</h2><p>تفاصيل بسيطة تجعل الواجهة أقرب ليومك.</p></div></div>
        <label className="setting-row setting-row--stacked"><span><strong>اسمك في التحية</strong><small>اختياري، ومحفوظ على هذا الجهاز فقط</small></span><input type="text" maxLength={60} value={state.settings.userName} onChange={(event) => actions.updateSettings({ userName: event.target.value })} placeholder="مثال: داوي" /></label>
        <label className="setting-row"><span><strong>تقليل الحركة</strong><small>يوقف الانتقالات غير الضرورية</small></span><input className="switch" type="checkbox" checked={state.settings.reducedMotion} onChange={(event) => actions.updateSettings({ reducedMotion: event.target.checked })} /></label>
      </section>

      <section className="settings-section" aria-labelledby="targets-title">
        <div className="settings-heading"><span><Icon name="award" /></span><div><h2 id="targets-title">أهداف يومك</h2><p>هدف القدرات صار بالوقت، وعدد الأسئلة يبقى سجلًا للجلسة فقط.</p></div></div>
        <div className="settings-form-grid">
          <label className="field"><span>وقت الصحوة الافتراضي</span><input type="time" value={state.settings.wakeTarget} onChange={(event) => actions.updateSettings({ wakeTarget: event.target.value })} /></label>
          <label className="field"><span>وقت النوم الافتراضي</span><input type="time" value={state.settings.sleepTarget} onChange={(event) => actions.updateSettings({ sleepTarget: event.target.value })} /></label>
          <label className="field"><span>هدف القدرات بالدقائق</span><input key={`qudurat-target-${state.settings.quduratTargetMinutes}`} aria-label="هدف القدرات بالدقائق" type="number" inputMode="numeric" min="15" max="240" step="5" defaultValue={state.settings.quduratTargetMinutes} onBlur={(event) => { const raw = event.target.value.trim(); if (!raw) { event.target.value = String(state.settings.quduratTargetMinutes); return; } actions.updateSettings({ quduratTargetMinutes: clamp(Number(raw), 15, 240) }); }} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur(); }} /></label>
          <label className="field"><span>الوقت المتوقع للحصة الرياضية</span><input type="number" inputMode="numeric" min="10" max="90" value={Math.min(90, state.settings.workoutTargetMinutes)} onChange={(event) => actions.updateSettings({ workoutTargetMinutes: clamp(Number(event.target.value), 10, 90) })} /></label>
        </div>
      </section>

      <section className="settings-section" aria-labelledby="schedule-title">
        <div className="settings-heading"><span><Icon name="clock" /></span><div><h2 id="schedule-title">أوقات الجدول الأساسي</h2><p>عدّل الأوقات الثابتة بدون ما تغيّر الاستثناءات التي سجلتها لأيام محددة.</p></div></div>
        <div className="schedule-edit-list">
          {scheduleTargets.map((target) => target.item && (
            <ScheduleTimeEditor key={`${target.id}-${target.item.startTime}-${target.item.endTime}`} title={target.title} item={target.item} onSave={(start, end) => actions.updateBaseScheduleTimes(target.id, start, end, target.days)} />
          ))}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="recurring-title">
        <div className="settings-heading"><span><Icon name="plus" /></span><div><h2 id="recurring-title">فقرة ثابتة في روتينك</h2><p>نفس ميزة إضافة فقرة يومية القديمة، لكن تقدر تختار أيام الأسبوع.</p></div></div>
        <div className="recurring-form">
          <label className="field"><span>اسم الفقرة</span><input type="text" maxLength={100} value={routineTitle} placeholder="مثال: قراءة، مشروع، مراجعة" onChange={(event) => { setRoutineTitle(event.target.value); setRoutineMessage(''); }} /></label>
          <div className="settings-form-grid settings-form-grid--two"><label className="field"><span>من</span><input type="time" value={routineStart} onChange={(event) => setRoutineStart(event.target.value)} /></label><label className="field"><span>إلى</span><input type="time" value={routineEnd} onChange={(event) => setRoutineEnd(event.target.value)} /></label></div>
          <fieldset className="weekday-fieldset"><legend>الأيام</legend><div className="weekday-grid">{WEEKDAYS.map((weekday) => <label key={weekday.value} className={routineDays.includes(weekday.value) ? 'weekday-chip is-selected' : 'weekday-chip'}><input type="checkbox" checked={routineDays.includes(weekday.value)} onChange={(event) => setRoutineDays((current) => event.target.checked ? [...current, weekday.value].sort() : current.filter((dayValue) => dayValue !== weekday.value))} /><span>{weekday.label}</span></label>)}</div></fieldset>
          {routineMessage && <p className="form-message" role="status">{routineMessage}</p>}
          <button className="button button--primary button--full" type="button" onClick={addRoutine}><Icon name="plus" /> إضافة للجدول</button>
        </div>
        {recurring.length > 0 && <div className="recurring-list">{recurring.map((item) => <div key={item.id} className="recurring-row"><div><strong>{item.title}</strong><small>{item.startTime} – {item.endTime} · {daysForItem(state, item.id).map((dayValue) => WEEKDAYS.find((entry) => entry.value === dayValue)?.label).filter(Boolean).join('، ')}</small></div><button type="button" className="icon-button icon-button--danger" aria-label={`حذف ${item.title}`} onClick={() => actions.removeRecurringRoutine(item.id)}><Icon name="trash" /></button></div>)}</div>}
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
        <div className="settings-heading"><span><Icon name="history" /></span><div><h2 id="data-title">البيانات والنسخة الاحتياطية</h2><p>{state.workout.history.length} حصص محفوظة · {Object.keys(state.days).length} أيام روتين · {school.subjects.length} مواد</p></div></div>
        <div className="today-data-summary"><div><span>بيانات اليوم</span><strong>{completionCount} سجلات</strong></div><div><span>استثناءات اليوم</span><strong>{overrideCount}</strong></div></div>
        <button className="button button--secondary button--full backup-button" type="button" onClick={() => exportBackup(state, loadSchoolData())}><Icon name="restore" /> تصدير نسخة احتياطية JSON</button>
        <p className="settings-microcopy">النسخة تشمل الجدول والاستثناءات والأيام والمؤقتات والحصص، بالإضافة إلى المواد والجدول الدراسي والواجبات والاختبارات وتسجيلات المدرسة. لا تُرسل لأي خادم.</p>
        {dataMessage && <p className="settings-microcopy" role="status">{dataMessage}</p>}
        <button className="danger-row" type="button" onClick={() => { setDataMessage(''); setDeleteOpen(true); }}><span><Icon name="trash" /></span><div><strong>حذف بيانات هذا اليوم</strong><small>يحذف تسجيل اليوم فقط من روتيني والمدرسة، ويحافظ على المواد والجدول والواجبات والاختبارات</small></div><Icon name="chevron-left" /></button>
      </section>

      <section className="settings-section settings-section--about" aria-labelledby="about-title">
        <div className="settings-heading"><span className="brand-mark brand-mark--small"><img src={appIcon} alt="" aria-hidden="true" style={{ inlineSize: '72%', blockSize: '72%', objectFit: 'contain' }} /></span><div><h2 id="about-title">روتيني</h2><p>الإصدار 1.2.0 · عربي · مصمم لـiPhone أولًا</p></div></div>
        <p>يوم واضح، عبادة محفوظة بالتفاصيل، تحفيظ ودراسة مسجلان بصدق، ومدرسة وروتين قابلان للتعديل بدون فقدان التاريخ.</p>
      </section>

      <BottomSheet open={deleteOpen} title="حذف بيانات اليوم؟" description={`سيُحذف ما سجلته في ${today} فقط، بما فيه المؤقتات والملاحظات والسجلات والحصة المنفذة وتسجيل المدرسة لهذا اليوم.`} onClose={() => setDeleteOpen(false)} size="medium">
        <div className="delete-confirmation">
          <div className="warning-box"><Icon name="info" /><p><strong>لن يُحذف:</strong> إعداداتك، أي يوم سابق، خطة A/B/C/D، تاريخ الحصص في الأيام الأخرى، المواد، جدول المدرسة، الواجبات أو الاختبارات.</p></div>
          {overrideCount > 0 && <label className="check-field"><input type="checkbox" checked={deleteOverrides} onChange={(event) => setDeleteOverrides(event.target.checked)} /><span><strong>احذف استثناءات هذا التاريخ أيضًا</strong><small>الاستثناءات الممتدة ستبقى في الأيام الأخرى.</small></span></label>}
          <div className="confirmation-actions"><button className="button button--danger button--full" type="button" onClick={deleteToday}>حذف هذا اليوم فقط</button><button className="button button--secondary button--full" type="button" onClick={() => setDeleteOpen(false)}>إلغاء</button></div>
        </div>
      </BottomSheet>
    </div>
  );
}

function ScheduleTimeEditor({ title, item, onSave }: { title: string; item: BaseScheduleItem; onSave(start: string, end: string): void }) {
  const [start, setStart] = useState(item.startTime);
  const [end, setEnd] = useState(item.endTime);
  const valid = minutesFromTime(start) < minutesFromTime(end);
  return <div className="schedule-edit-row"><strong>{title}</strong><label><span>من</span><input type="time" value={start} onChange={(event) => setStart(event.target.value)} /></label><label><span>إلى</span><input type="time" value={end} onChange={(event) => setEnd(event.target.value)} /></label><button className="button button--secondary" type="button" disabled={!valid} onClick={() => onSave(start, end)}>حفظ</button></div>;
}

function findScheduleItem(state: RoutineState, id: string): BaseScheduleItem | undefined {
  return Object.values(state.baseSchedule).flat().find((item) => item.id === id);
}

function daysForItem(state: RoutineState, id: string): number[] {
  return Object.entries(state.baseSchedule).filter(([, items]) => items.some((item) => item.id === id)).map(([day]) => Number(day)).sort();
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}

function deleteSchoolDay(school: SchoolData, date: DateKey): void {
  if (!school.days[date]) return;
  const days = { ...school.days };
  delete days[date];
  saveSchoolData({ ...school, days });
}

function exportBackup(state: RoutineState, school: SchoolData): void {
  const payload = {
    exportedAt: new Date().toISOString(),
    app: 'روتيني',
    backupSchemaVersion: 2,
    schemaVersion: state.schemaVersion,
    state,
    school,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `routine-backup-${toDateKey(new Date())}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}