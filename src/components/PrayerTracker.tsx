import { useState } from 'react';
import { PRAYERS } from '../data/baseSchedule';
import { formatClock } from '../lib/date';
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

export function PrayerTracker({ date }: { date: DateKey }) {
  const { state, actions } = useRoutine();
  const day = getDayRecord(state, date);
  const [expanded, setExpanded] = useState<PrayerId | null>(null);
  const done = Object.values(day.prayers).filter(Boolean).length;

  return (
    <section className="prayer-section prayer-section--rich" aria-labelledby="prayer-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">ثابت يومك</span>
          <h2 id="prayer-title">الصلوات</h2>
          <p className="section-subcopy">مو بس “صليت”. سجّل الوقت وهل كانت في وقتها وهل صليتها جماعة.</p>
        </div>
        <span className="section-heading__aside">{done} من 5</span>
      </div>

      <div className="prayer-strip prayer-strip--rich">
        {PRAYERS.map((prayer) => {
          const detail = day.prayerDetails[prayer.id];
          const isDone = day.prayers[prayer.id];
          const isOpen = expanded === prayer.id;
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
                  <small>{detail.performedAt ? `أديتها ${formatClock(detail.performedAt)}` : formatClock(prayer.time)}</small>
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
                    <input
                      type="time"
                      value={detail.performedAt}
                      onChange={(event) => actions.updatePrayerDetail(date, prayer.id, { performedAt: event.target.value })}
                    />
                  </label>

                  <fieldset className="choice-fieldset">
                    <legend>التوقيت</legend>
                    <div className="choice-chips">
                      {timingOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={detail.timing === option.value ? 'choice-chip is-selected' : 'choice-chip'}
                          aria-pressed={detail.timing === option.value}
                          onClick={() => actions.updatePrayerDetail(date, prayer.id, { timing: option.value })}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <fieldset className="choice-fieldset">
                    <legend>كيف صليتها؟</legend>
                    <div className="choice-chips">
                      {congregationOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          className={detail.congregation === option.value ? 'choice-chip is-selected' : 'choice-chip'}
                          aria-pressed={detail.congregation === option.value}
                          onClick={() => actions.updatePrayerDetail(date, prayer.id, { congregation: option.value })}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>

                  <label className="field field--compact">
                    <span>ملاحظة</span>
                    <input
                      type="text"
                      maxLength={300}
                      value={detail.note}
                      placeholder="اختياري"
                      onChange={(event) => actions.updatePrayerDetail(date, prayer.id, { note: event.target.value })}
                    />
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
