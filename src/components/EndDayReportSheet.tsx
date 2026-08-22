import { useMemo, useState } from 'react';
import { loadSchoolData } from '../lib/schoolData';
import { buildDailyReport, buildWeeklyReport, formatReportText, isFriday, type ReportKind } from '../lib/reports';
import { renderReportPng } from '../lib/reportImage';
import { useRoutine } from '../state/RoutineContext';
import type { DateKey } from '../types';
import { BottomSheet } from './BottomSheet';
import { Icon } from './Icon';

interface EndDayReportSheetProps {
  open: boolean;
  date: DateKey;
  onClose(): void;
}

export function EndDayReportSheet({ open, date, onClose }: EndDayReportSheetProps) {
  const { state } = useRoutine();
  const [kind, setKind] = useState<ReportKind>('daily');
  const [message, setMessage] = useState('');
  const school = loadSchoolData();
  const daily = useMemo(() => buildDailyReport(state, school, date), [state, school, date]);
  const weekly = useMemo(() => isFriday(date) ? buildWeeklyReport(state, school, date) : null, [state, school, date]);
  const report = kind === 'weekly' && weekly ? weekly : daily;
  const text = useMemo(() => formatReportText(report), [report]);

  const close = () => {
    setKind('daily');
    setMessage('');
    onClose();
  };

  const handleText = async () => {
    setMessage('');
    try {
      if (navigator.share) {
        await navigator.share({ title: `روتيني · ${report.title}`, text });
        setMessage('تم فتح خيارات مشاركة التقرير النصي.');
        return;
      }
      await copyText(text);
      setMessage('تم نسخ التقرير النصي.');
    } catch (error) {
      if (isAbort(error)) return;
      try {
        await copyText(text);
        setMessage('تعذرت المشاركة، فنسخنا التقرير بدلًا منها.');
      } catch {
        setMessage('تعذرت مشاركة أو نسخ التقرير على هذا المتصفح.');
      }
    }
  };

  const handleImage = async () => {
    setMessage('نجهز الصورة…');
    try {
      const blob = await renderReportPng(report);
      const file = new File([blob], report.filename, { type: 'image/png' });
      const shareData: ShareData = { title: `روتيني · ${report.title}`, files: [file] };
      if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
        await navigator.share(shareData);
        setMessage('تم فتح خيارات حفظ أو مشاركة الصورة.');
        return;
      }
      downloadBlob(blob, report.filename);
      setMessage('تم تجهيز صورة PNG وحفظها كملف.');
    } catch (error) {
      if (isAbort(error)) { setMessage(''); return; }
      setMessage('تعذر إنشاء صورة التقرير. التقرير النصي ما زال متاحًا.');
    }
  };

  return (
    <BottomSheet
      open={open}
      title="تقرير نهاية اليوم"
      description={weekly ? 'اختر تقرير اليوم أو الأسبوع، ثم استلمه كنص أو صورة.' : 'بيانات يومك تحولت إلى تقرير جاهز للحفظ أو المشاركة.'}
      onClose={close}
      size="large"
    >
      <div className="end-report-sheet">
        {weekly && (
          <nav className="report-kind-tabs" aria-label="نوع التقرير">
            <button type="button" className={kind === 'daily' ? 'is-active' : ''} onClick={() => { setKind('daily'); setMessage(''); }}><Icon name="today" /> اليوم</button>
            <button type="button" className={kind === 'weekly' ? 'is-active' : ''} onClick={() => { setKind('weekly'); setMessage(''); }}><Icon name="calendar" /> الأسبوع</button>
          </nav>
        )}

        <article className="report-preview" aria-label={`معاينة ${report.title}`}>
          <header>
            <div><span>روتيني</span><h3>{report.title}</h3><p>{report.subtitle}</p></div>
            <strong>{report.score}%</strong>
          </header>
          <div className="report-preview__stats">
            {report.stats.map((stat) => <div key={stat.label}><span>{stat.label}</span><b>{stat.value}</b></div>)}
          </div>
          <div className="report-preview__sections">
            {report.sections.map((section) => <section key={section.title}><h4>{section.title}</h4>{section.lines.slice(0, 3).map((line) => <p key={line}>{line}</p>)}</section>)}
          </div>
        </article>

        <div className="report-delivery-heading"><strong>كيف تبي تستلم التقرير؟</strong><span>الاثنين يحتويان نفس بيانات روتيني، بس بشكل مختلف.</span></div>
        <div className="report-delivery-grid">
          <button type="button" className="report-delivery-option" aria-label="صورة" onClick={handleImage}>
            <span><Icon name="image" /></span><div><strong>صورة</strong><small>بطاقة PNG مرتبة للحفظ في الصور أو المشاركة</small></div><Icon name="chevron-left" />
          </button>
          <button type="button" className="report-delivery-option" aria-label="نص" onClick={handleText}>
            <span><Icon name="history" /></span><div><strong>نص</strong><small>تقرير عربي جاهز للمشاركة أو النسخ</small></div><Icon name="chevron-left" />
          </button>
        </div>
        {message && <p className="report-message" role="status">{message}</p>}
      </div>
    </BottomSheet>
  );
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('copy failed');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
