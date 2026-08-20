import { useMemo, useState } from 'react';
import { getOverridesForDate } from '../lib/schedule';
import { isValidTimeRange } from '../lib/date';
import { useRoutine } from '../state/RoutineContext';
import type { DateKey, OverrideType, ResolvedScheduleItem } from '../types';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';

const overrideOptions: Array<{ type: OverrideType; title: string; description: string }> = [
  { type: 'school-holiday', title: 'إجازة مدرسة', description: 'تلغي المدرسة فقط دون فشل' },
  { type: 'tahfiz-holiday', title: 'إجازة تحفيظ', description: 'تلغي التحفيظ فقط دون فشل' },
  { type: 'tahfiz-trip', title: 'رحلة تحفيظ', description: 'تستبدل فترة التحفيظ بفعالية' },
  { type: 'official-holiday', title: 'إجازة رسمية', description: 'تحوّل اليوم إلى يوم إجازة' },
  { type: 'custom-event', title: 'حدث خاص', description: 'موعد، زيارة، سفر أو اختبار' },
  { type: 'reschedule-task', title: 'تعديل وقت', description: 'غيّر وقت مهمة لهذا اليوم' },
  { type: 'cancel-task', title: 'إلغاء مهمة', description: 'إلغاء مقصود لا يُحسب فشلًا' },
  { type: 'postpone-task', title: 'تأجيل مهمة', description: 'انقلها إلى وقت آخر اليوم' },
  { type: 'add-task', title: 'مهمة استثنائية', description: 'مهمة لا تتكرر لاحقًا' },
];

export function DayOverrideSheet({
  open,
  date,
  items,
  onClose,
}: {
  open: boolean;
  date: DateKey;
  items: ResolvedScheduleItem[];
  onClose(): void;
}) {
  const { state, actions } = useRoutine();
  const [type, setType] = useState<OverrideType>('school-holiday');
  const [multiDay, setMultiDay] = useState(false);
  const [endDate, setEndDate] = useState<DateKey>(date);
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:30');
  const [targetId, setTargetId] = useState('qudurat');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const existing = useMemo(() => getOverridesForDate(state.dateOverrides, date), [state.dateOverrides, date]);
  const needsTime = ['tahfiz-trip', 'custom-event', 'reschedule-task', 'postpone-task', 'add-task'].includes(type);
  const needsTarget = ['reschedule-task', 'cancel-task', 'postpone-task'].includes(type);
  const needsTitle = ['tahfiz-trip', 'official-holiday', 'custom-event', 'add-task'].includes(type);
  const targets = useMemo(() => items.filter((item) => item.kind !== 'prayer' && item.status !== 'cancelled'), [items]);
  const selectedTargetId = targets.some((item) => item.id === targetId) ? targetId : targets[0]?.id ?? '';

  const handleSave = () => {
    if (multiDay && endDate < date) {
      setError('نهاية الاستثناء يجب أن تكون بعد بدايته.');
      return;
    }
    if (needsTarget && !selectedTargetId) {
      setError('اختر المهمة التي تريد تعديلها.');
      return;
    }
    if (needsTime && !isValidTimeRange(startTime, endTime)) {
      setError('تأكد أن وقت النهاية بعد وقت البداية.');
      return;
    }
    if (needsTitle && !title.trim() && !['tahfiz-trip', 'official-holiday'].includes(type)) {
      setError('اكتب اسمًا واضحًا للحدث.');
      return;
    }
    const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `override-${Date.now()}`;
    actions.addDateOverride({
      id,
      type,
      startDate: date,
      endDate: multiDay ? endDate : undefined,
      targetId: needsTarget ? selectedTargetId : undefined,
      title: title.trim() || undefined,
      startTime: needsTime ? startTime : undefined,
      endTime: needsTime ? endTime : undefined,
      note: note.trim() || undefined,
      createdAt: Date.now(),
    });
    setError(null);
    setTitle('');
    setNote('');
  };

  return (
    <BottomSheet open={open} title="تعديل هذا اليوم" description="أي تغيير هنا لن يمس جدول الأسبوع الأساسي." onClose={onClose}>
      <div className="override-sheet">
        {existing.length > 0 && (
          <section className="existing-overrides" aria-labelledby="existing-overrides-title">
            <div className="section-heading section-heading--small">
              <div><span className="eyebrow">نشط الآن</span><h3 id="existing-overrides-title">استثناءات هذا اليوم</h3></div>
            </div>
            {existing.map((override) => (
              <div className="override-row" key={override.id}>
                <div>
                  <strong>{labelForType(override.type, override.title)}</strong>
                  <span>{override.endDate ? `حتى ${override.endDate}` : 'لهذا اليوم فقط'}</span>
                </div>
                <button className="icon-button icon-button--danger" type="button" aria-label={`حذف ${labelForType(override.type, override.title)}`} onClick={() => actions.removeDateOverride(override.id)}>
                  <Icon name="trash" />
                </button>
              </div>
            ))}
            <button className="button button--secondary button--full" type="button" onClick={() => actions.restoreDate(date)}>
              <Icon name="restore" /> إرجاع اليوم للجدول الأساسي
            </button>
          </section>
        )}

        <section aria-labelledby="override-type-title">
          <div className="section-heading section-heading--small"><h3 id="override-type-title">نوع التعديل</h3></div>
          <div className="override-type-grid">
            {overrideOptions.map((option) => (
              <button
                key={option.type}
                type="button"
                className={type === option.type ? 'override-type is-selected' : 'override-type'}
                onClick={() => { setType(option.type); setError(null); }}
              >
                <strong>{option.title}</strong>
                <span>{option.description}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="form-grid">
          {needsTarget && (
            <label className="field field--full">
              <span>المهمة</span>
              <select value={selectedTargetId} onChange={(event) => setTargetId(event.target.value)}>
                {targets.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
              </select>
            </label>
          )}
          {needsTitle && (
            <label className="field field--full">
              <span>الاسم {['tahfiz-trip', 'official-holiday'].includes(type) ? '(اختياري)' : ''}</span>
              <input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} placeholder={type === 'official-holiday' ? 'مثال: إجازة اليوم الوطني' : type === 'tahfiz-trip' ? 'رحلة التحفيظ' : 'اسم الحدث'} />
            </label>
          )}
          {needsTime && (
            <>
              <label className="field"><span>من</span><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
              <label className="field"><span>إلى</span><input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
            </>
          )}
          <label className="check-field field--full">
            <input type="checkbox" checked={multiDay} onChange={(event) => setMultiDay(event.target.checked)} />
            <span><strong>استثناء لعدة أيام</strong><small>مثل إجازة من الأحد إلى الثلاثاء</small></span>
          </label>
          {multiDay && (
            <label className="field field--full"><span>آخر يوم</span><input type="date" min={date} value={endDate} onChange={(event) => setEndDate(event.target.value as DateKey)} /></label>
          )}
          <label className="field field--full"><span>ملاحظة اختيارية</span><textarea rows={3} value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="أي تفاصيل تساعدك لاحقًا" /></label>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="button button--primary button--full button--large" type="button" onClick={handleSave}>
          <Icon name="plus" /> حفظ الاستثناء
        </button>
      </div>
    </BottomSheet>
  );
}

function labelForType(type: OverrideType, title?: string): string {
  return title || overrideOptions.find((option) => option.type === type)?.title || 'استثناء';
}
