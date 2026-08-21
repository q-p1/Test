import { useState } from 'react';
import { PRAYERS } from '../data/baseSchedule';
import { useNow } from '../hooks/useNow';
import { formatClock } from '../lib/date';
import { formatCountdown, getPrayerCountdown, IQAMA_DELAYS, PRAYER_NAMES, type PrayerCalculationMethod, type PrayerSchedule } from '../lib/prayerTimes';
import { getDayRecord } from '../lib/storage';
import { useRoutine } from '../state/RoutineContext';
import type { DateKey, PrayerId } from '../types';
import { Icon } from './Icon';

const timingOptions = [
  { value: 'on-time', label: 'في وقتها' },
  { value: 'late', label: 'متأخرة' },
  { value: 'unknown', label: 'غير محدد' },
] as const;

const congregationOptions = [
  { value: 'yes', label: 'بالجماعة' },
  { value: 'no', label: 'فردي' },
  { value: 'not-applicable', label: 'غير منطبق' },
] as const;

interface PrayerTrackerProps {
  date: DateKey;
  schedule: PrayerSchedule | null;
  tomorrowSchedule: PrayerSchedule | null;
  method: PrayerCalculationMethod | null;
  locationStatus: 'locating' | 'ready' | 'approximate' | 'cached' | 'denied' | 'unavailable';
  isToday: boolean;
  onRefreshLocation(): void;
}

export function PrayerTracker({ date, schedule, tomorrowSchedule, method, locationStatus, isToday, onRefreshLocation }: PrayerTrackerProps) {
  const { state, actions } = useRoutine();
  const day = getDayRecord(state, date);
  const [expanded, setExpanded] = useState<PrayerId | null>(null);
  const done = Object.values(day.prayers).filter(Boolean).length;
  const nowMs = useNow(isToday, 1_000);
  const countdown = isToday ? getPrayerCountdown(new Date(nowMs), schedule, tomorrowSchedule) : null;

  return (
    <section className="prayer-section prayer-section--rich" aria-labelledby="prayer-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ثابت يومك</span>
          <h2 id="prayer-title">الصلوات</h2>
          <p className="section-subcopy">الأذان حسب إحداثيات موقع جهازك، والإقامة حسب المدة المحددة لكل صلاة.</p>
        </div>
        <span className="section-heading__aside">{done} من 5</span>
      </div>

      <div className={`prayer-location-bar prayer-location-bar--${locationStatus}`} data-calculation-method={method ?? 'unknown'}>
        <div>
          <Icon name="prayer" />
          <span>{locationMessage(locationStatus)}</span>
        </div>
        <button type="button" className="text-button" onClick={onRefreshLocation}>تحديث الموقع</button>
      </div>

      {countdown && (
        <div className={`prayer-countdown prayer-countdown--${countdown.kind}`} aria-live="polite">
          <div>
            <span>{countdown.kind === 'adhan' ? 'متبقّي للأذان' : 'متبقّي للإقامة'}</span>
            <strong>{PRAYER_NAMES[countdown.prayerId]}</strong>
          </div>
          <time dir="ltr">{formatCountdown(countdown.remainingMs)}</time>
        </div>
      )}

      <div className="prayer-strip prayer-strip--rich">
        {PRAYERS.map((prayer) => {
          const detail = day.prayerDetails[prayer.id];
          const isDone = day.prayers[prayer.id];
          const isOpen = expanded === prayer.id;
          const prayerTime = schedule?.[prayer.id];
          const adhan = prayerTime?.adhan ?? prayer.time;
          const iqama = prayerTime?.iqama ?? addClockMinutes(adhan, IQAMA_DELAYS[prayer.id]);
          const detailSummary = [
            detail.timing === 'on-time' ? 'في وقتها' : detail.timing === 'late' ? 'متأخرة' : '',
            detail.congregation === 'yes' ? 'جماعة' : detail.congregation === 'no' ? 'فردي' : '',
          ].filter(Boolean).join(' · ');

          return (
            <article key={prayer.id} className={`prayer-rich-card ${isDone ? 'is-complete' : ''} ${isOpen ? 'is-open' : ''}`}>
              <div className="prayer-rich-card__head">
                <button
                  type="button"
                  className={isDone ? 'prayer-pill is-complete' : 'prayer-pill'}
                  aria-pressed={isDone}
                  onClick={() => { actions.togglePrayer(date, prayer.id); if (!isDone) setExpanded(prayer.id); }}
                >
                  <span className="prayer-pill__check"><Icon name="check" /></span>
                  <strong>{prayer.name}</strong>
                  <small>{detail.performedAt ? `أديتها ${formatClock(detail.performedAt)}` : `الأذان ${formatClock(adhan)}`}</small>
                  <span className="prayer-iqama-time">الإقامة {formatClock(iqama)} · بعد {IQAMA_DELAYS[prayer.id]} د</span>
                </button>
                <button
                  type="button"
                  className="prayer-detail-toggle"
                  aria-expanded={isOpen}
                  aria-label="عرض تفاصيل هذه الصلاة"
                  onClick={() => setExpanded(isOpen ? null : prayer.id)}
                >
                  <span>{detailSummary || 'تفاصيل'}</span>
                  <Icon name={isOpen ? 'chevron-right' : 'chevron-left'} />
                </button>
              </div>

              {isOpen && (
                <div className="prayer-detail-panel">
                  <label className="field field--compact">
                    <span>وقت الأداء</span>
                    <input type="time" value={detail.performedAt} onChange={(event) => actions.updatePrayerDetail(date, prayer.id, { performedAt: event.target.value })} />
                  </label>
                  <fieldset className="choice-fieldset">
                    <legend>التوقيت</legend>
                    <div className="choice-chips">
                      {timingOptions.map((option) => <button key={option.value} type="button" className={detail.timing === option.value ? 'choice-chip is-selected' : 'choice-chip'} aria-pressed={detail.timing === option.value} onClick={() => actions.updatePrayerDetail(date, prayer.id, { timing: option.value })}>{option.label}</button>)}
                    </div>
                  </fieldset>
                  <fieldset className="choice-fieldset">
                    <legend>كيف صليتها؟</legend>
                    <div className="choice-chips">
                      {congregationOptions.map((option) => <button key={option.value} type="button" className={detail.congregation === option.value ? 'choice-chip is-selected' : 'choice-chip'} aria-pressed={detail.congregation === option.value} onClick={() => actions.updatePrayerDetail(date, prayer.id, { congregation: option.value })}>{option.label}</button>)}
                    </div>
                  </fieldset>
                  <label className="field field--compact">
                    <span>ملاحظة</span>
                    <input type="text" maxLength={300} value={detail.note} placeholder="اختياري" onChange={(event) => actions.updatePrayerDetail(date, prayer.id, { note: event.target.value })} />
                  </label>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function locationMessage(status: PrayerTrackerProps['locationStatus']): string {
  if (status === 'locating') return 'نحدد موقعك الدقيق تلقائيًا لحساب أوقات الصلاة…';
  if (status === 'denied') return 'فعّل إذن الموقع والموقع الدقيق ليتم حساب الأذان حسب مكانك.';
  if (status === 'unavailable') return 'تعذّر الوصول للموقع؛ تظهر أوقات احتياطية مؤقتًا.';
  if (status === 'approximate') return 'الموقع وصل بشكل تقريبي · فعّل «الموقع الدقيق» من إعدادات الآيفون.';
  if (status === 'cached') return 'آخر موقع محفوظ · جاري تحديثه بموقعك الدقيق.';
  return 'حسب موقعك الدقيق الحالي';
}

function addClockMinutes(time: string, amount: number): string {
  const [hour = 0, minute = 0] = time.split(':').map(Number);
  const total = hour * 60 + minute + amount;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
