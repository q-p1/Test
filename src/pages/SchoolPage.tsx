import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { Icon } from '../components/Icon';
import { useNow } from '../hooks/useNow';
import { currentMinutes, formatArabicDate, formatClock, minutesFromTime, toDateKey } from '../lib/date';
import {
  createSchoolId,
  getAttendanceSummary,
  getOverdueAssignments,
  getPendingAssignments,
  getPeriodsForDate,
  getSchoolAverage,
  getSchoolDay,
  getSubjectAverage,
  getUpcomingExams,
  hasSchoolHolidayOverride,
  loadSchoolData,
  saveSchoolData,
  subjectName,
  type SchoolAssignmentKind,
  type SchoolAttendanceStatus,
  type SchoolData,
  type SchoolExamKind,
  type SchoolPeriod,
} from '../lib/schoolData';
import { useRoutine } from '../state/RoutineContext';
import type { DateKey } from '../types';

type SchoolTab = 'today' | 'tasks' | 'schedule' | 'subjects';
type SetSchoolData = Dispatch<SetStateAction<SchoolData>>;

const WEEKDAYS = [
  { id: 0, label: 'الأحد' },
  { id: 1, label: 'الاثنين' },
  { id: 2, label: 'الثلاثاء' },
  { id: 3, label: 'الأربعاء' },
  { id: 4, label: 'الخميس' },
  { id: 5, label: 'الجمعة' },
  { id: 6, label: 'السبت' },
];

const attendanceOptions: Array<{ value: SchoolAttendanceStatus; label: string }> = [
  { value: 'present', label: 'حضرت' },
  { value: 'late', label: 'تأخرت' },
  { value: 'absent', label: 'غياب' },
  { value: 'excused', label: 'غياب بعذر' },
  { value: 'holiday', label: 'إجازة' },
];

const assignmentKindLabels: Record<SchoolAssignmentKind, string> = {
  homework: 'واجب',
  project: 'مشروع',
  worksheet: 'ورقة عمل',
  research: 'بحث',
  other: 'مهمة',
};

const examKindLabels: Record<SchoolExamKind, string> = {
  quiz: 'كويز',
  exam: 'اختبار',
  oral: 'شفهي',
  practical: 'عملي',
  other: 'تقييم',
};

export function SchoolPage() {
  const { state } = useRoutine();
  const [data, setData] = useState<SchoolData>(() => loadSchoolData());
  const [tab, setTab] = useState<SchoolTab>('today');
  const [storageError, setStorageError] = useState(false);
  const nowMs = useNow(true, 30_000);
  const now = useMemo(() => new Date(nowMs), [nowMs]);
  const today = toDateKey(now);
  const day = getSchoolDay(data, today);
  const isOverrideHoliday = hasSchoolHolidayOverride(state.dateOverrides, today);
  const periodsToday = getPeriodsForDate(data, today);
  const pending = getPendingAssignments(data, today);
  const overdue = getOverdueAssignments(data, today);
  const average = getSchoolAverage(data);
  const attendance = getAttendanceSummary(data);

  useEffect(() => {
    try {
      saveSchoolData(data);
      window.setTimeout(() => setStorageError(false), 0);
    } catch {
      window.setTimeout(() => setStorageError(true), 0);
    }
  }, [data]);

  const currentPeriod = useMemo(() => {
    const minutes = currentMinutes(now);
    return periodsToday.find((period) => minutes >= minutesFromTime(period.startTime) && minutes < minutesFromTime(period.endTime)) ?? null;
  }, [now, periodsToday]);

  const nextPeriod = useMemo(() => {
    const minutes = currentMinutes(now);
    return periodsToday.find((period) => minutesFromTime(period.startTime) > minutes) ?? null;
  }, [now, periodsToday]);

  const updateToday = (patch: Partial<ReturnType<typeof getSchoolDay>>) => {
    setData((current) => ({
      ...current,
      days: { ...current.days, [today]: { ...getSchoolDay(current, today), ...patch, date: today } },
    }));
  };

  return (
    <div className="page school-page" data-page="school">
      <section className="school-hero">
        <div className="school-hero__top">
          <div>
            <span className="eyebrow eyebrow--gold">School Hub</span>
            <h1>المدرسة</h1>
            <p>{isOverrideHoliday
              ? 'اليوم مسجل كإجازة مدرسة في روتيني.'
              : currentPeriod
                ? `الحصة الآن: ${subjectName(data, currentPeriod.subjectId)}`
                : nextPeriod
                  ? `الحصة القادمة: ${subjectName(data, nextPeriod.subjectId)} عند ${formatClock(nextPeriod.startTime)}`
                  : periodsToday.length
                    ? 'خلص جدول الحصص لليوم.'
                    : 'ابدأ بإضافة موادك وجدولك.'}</p>
          </div>
          <span className="school-hero__icon"><Icon name="school" /></span>
        </div>
        <div className="school-kpi-grid">
          <SchoolKpi label="حصص اليوم" value={String(periodsToday.length)} />
          <SchoolKpi label="مهام قريبة" value={String(pending.length)} />
          <SchoolKpi label="متأخرة" value={String(overdue.length)} tone={overdue.length ? 'warn' : 'normal'} />
          <SchoolKpi label="متوسط الدرجات" value={average === null ? '—' : `${average}%`} />
        </div>
      </section>

      {storageError && <div className="school-alert school-alert--danger"><Icon name="info" /> تعذّر حفظ آخر تغيير محليًا.</div>}
      {isOverrideHoliday && (
        <div className="school-alert"><Icon name="calendar" /><div><strong>اليوم إجازة مدرسة في روتيني</strong><span>القسم يقرأ استثناءات يومك، لذلك ما يحتاج نخرّب الجدول الأسبوعي عشان إجازة واحدة.</span></div></div>
      )}

      <nav className="school-tabs" aria-label="أقسام المدرسة">
        <button type="button" className={tab === 'today' ? 'is-active' : ''} onClick={() => setTab('today')}><Icon name="today" />اليوم</button>
        <button type="button" className={tab === 'tasks' ? 'is-active' : ''} onClick={() => setTab('tasks')}><Icon name="check" />المهام</button>
        <button type="button" className={tab === 'schedule' ? 'is-active' : ''} onClick={() => setTab('schedule')}><Icon name="calendar" />الجدول</button>
        <button type="button" className={tab === 'subjects' ? 'is-active' : ''} onClick={() => setTab('subjects')}><Icon name="book" />المواد</button>
      </nav>

      {tab === 'today' && <SchoolToday data={data} setData={setData} today={today} day={day} periods={periodsToday} isOverrideHoliday={isOverrideHoliday} attendance={attendance} updateToday={updateToday} />}
      {tab === 'tasks' && <SchoolTasks data={data} setData={setData} today={today} />}
      {tab === 'schedule' && <SchoolSchedule data={data} setData={setData} />}
      {tab === 'subjects' && <SchoolSubjects data={data} setData={setData} />}
    </div>
  );
}

function SchoolToday({ data, setData, today, day, periods, isOverrideHoliday, attendance, updateToday }: {
  data: SchoolData;
  setData: SetSchoolData;
  today: DateKey;
  day: ReturnType<typeof getSchoolDay>;
  periods: SchoolPeriod[];
  isOverrideHoliday: boolean;
  attendance: ReturnType<typeof getAttendanceSummary>;
  updateToday(patch: Partial<ReturnType<typeof getSchoolDay>>): void;
}) {
  const dueSoon = getPendingAssignments(data, today).slice(0, 3);
  const upcomingExams = getUpcomingExams(data, today).slice(0, 3);

  return (
    <div className="school-stack">
      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">تسجيل اليوم</span><h2>{formatArabicDate(today)}</h2></div><span className="section-heading__aside">{attendance.present} حضور</span></div>
        <div className="attendance-chips" role="group" aria-label="حالة الحضور اليوم">
          {attendanceOptions.map((option) => (
            <button key={option.value} type="button" disabled={isOverrideHoliday && option.value !== 'holiday'} className={day.attendance === option.value || (isOverrideHoliday && option.value === 'holiday' && day.attendance === 'unrecorded') ? 'is-selected' : ''} onClick={() => updateToday({ attendance: option.value })}>{option.label}</button>
          ))}
        </div>
        <div className="school-two-col">
          <label className="field field--compact"><span>وقت الوصول</span><input type="time" value={day.arrivalTime} onChange={(event) => updateToday({ arrivalTime: event.target.value })} /></label>
          <label className="field field--compact"><span>وقت الخروج</span><input type="time" value={day.departureTime} onChange={(event) => updateToday({ departureTime: event.target.value })} /></label>
        </div>
        <label className="field field--compact"><span>ملاحظة اليوم الدراسي</span><textarea value={day.note} maxLength={1200} placeholder="وش أخذتوا؟ شيء قاله المدرس؟ مهمة لازم ما تنساها؟" onChange={(event) => updateToday({ note: event.target.value })} /></label>
      </section>

      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">الحصص</span><h2>جدول اليوم</h2></div><span className="section-heading__aside">{periods.length} حصة</span></div>
        {periods.length === 0
          ? <SchoolEmpty icon="calendar" title="ما عندك حصص مسجلة لهذا اليوم" text="أضف موادك أول، ثم ابنِ الجدول الأسبوعي من تبويب الجدول." />
          : <div className="school-period-list">{periods.map((period) => <PeriodRow key={period.id} data={data} period={period} />)}</div>}
      </section>

      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">قبل ما تنسى</span><h2>القادم</h2></div></div>
        <div className="school-upcoming-grid">
          <div className="school-mini-list">
            <strong>واجبات ومهام</strong>
            {dueSoon.length === 0 ? <small>ما فيه شيء قريب 👌</small> : dueSoon.map((item) => <div key={item.id}><span>{subjectName(data, item.subjectId)}</span><b>{item.title}</b><small>{formatArabicDate(item.dueDate, 'short')}</small></div>)}
          </div>
          <div className="school-mini-list">
            <strong>اختبارات</strong>
            {upcomingExams.length === 0 ? <small>ما فيه اختبار مسجل.</small> : upcomingExams.map((exam) => <div key={exam.id}><span>{subjectName(data, exam.subjectId)}</span><b>{exam.title}</b><small>{formatArabicDate(exam.date, 'short')}{exam.time ? ` · ${formatClock(exam.time)}` : ''}</small></div>)}
          </div>
        </div>
      </section>

      {day.attendance !== 'unrecorded' && <button type="button" className="text-button school-reset-day" onClick={() => setData((current) => { const days = { ...current.days }; delete days[today]; return { ...current, days }; })}>مسح تسجيل المدرسة لهذا اليوم</button>}
    </div>
  );
}

function SchoolTasks({ data, setData, today }: { data: SchoolData; setData: SetSchoolData; today: DateKey }) {
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentSubject, setAssignmentSubject] = useState(data.subjects[0]?.id ?? '');
  const [assignmentDate, setAssignmentDate] = useState(today);
  const [assignmentKind, setAssignmentKind] = useState<SchoolAssignmentKind>('homework');
  const [assignmentImportant, setAssignmentImportant] = useState(false);
  const [assignmentNote, setAssignmentNote] = useState('');
  const [examTitle, setExamTitle] = useState('');
  const [examSubject, setExamSubject] = useState(data.subjects[0]?.id ?? '');
  const [examDate, setExamDate] = useState(today);
  const [examTime, setExamTime] = useState('');
  const [examKind, setExamKind] = useState<SchoolExamKind>('exam');
  const [examScope, setExamScope] = useState('');
  const [examNote, setExamNote] = useState('');
  const overdue = getOverdueAssignments(data, today);
  const active = data.assignments.filter((assignment) => assignment.status === 'todo').sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const completed = data.assignments.filter((assignment) => assignment.status !== 'todo').sort((a, b) => b.dueDate.localeCompare(a.dueDate));
  const upcoming = getUpcomingExams(data, today);
  const pastExams = data.exams.filter((exam) => exam.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const addAssignment = () => {
    if (!assignmentTitle.trim() || !assignmentSubject) return;
    setData((current) => ({
      ...current,
      assignments: [...current.assignments, {
        id: createSchoolId('assignment'), subjectId: assignmentSubject, title: assignmentTitle.trim(), dueDate: assignmentDate,
        kind: assignmentKind, status: 'todo', important: assignmentImportant, note: assignmentNote.trim(), createdAt: Date.now(),
      }],
    }));
    setAssignmentTitle('');
    setAssignmentNote('');
    setAssignmentImportant(false);
  };

  const addExam = () => {
    if (!examTitle.trim() || !examSubject) return;
    setData((current) => ({
      ...current,
      exams: [...current.exams, {
        id: createSchoolId('exam'), subjectId: examSubject, title: examTitle.trim(), date: examDate, time: examTime,
        kind: examKind, scope: examScope.trim(), score: null, maxScore: null, note: examNote.trim(), createdAt: Date.now(),
      }],
    }));
    setExamTitle('');
    setExamScope('');
    setExamNote('');
    setExamTime('');
  };

  if (data.subjects.length === 0) return <SchoolEmpty icon="book" title="أضف مادة أول" text="المهام والاختبارات ترتبط بمادة، لذلك ابدأ من تبويب المواد." />;

  return (
    <div className="school-stack">
      {overdue.length > 0 && <div className="school-alert school-alert--danger"><Icon name="info" /><div><strong>{overdue.length} مهمة متأخرة</strong><span>تظل ظاهرة حتى تنهيها، بدل ما تختفي لمجرد أن التاريخ مر.</span></div></div>}

      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">إضافة سريعة</span><h2>واجب أو مشروع</h2></div></div>
        <div className="school-form-grid">
          <label className="field"><span>المادة</span><select value={assignmentSubject} onChange={(event) => setAssignmentSubject(event.target.value)}>{data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label className="field"><span>النوع</span><select value={assignmentKind} onChange={(event) => setAssignmentKind(event.target.value as SchoolAssignmentKind)}>{Object.entries(assignmentKindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field school-form-span"><span>العنوان</span><input value={assignmentTitle} maxLength={140} placeholder="مثال: حل صفحة 42" onChange={(event) => setAssignmentTitle(event.target.value)} /></label>
          <label className="field"><span>موعد التسليم</span><input type="date" value={assignmentDate} onChange={(event) => setAssignmentDate(event.target.value as DateKey)} /></label>
          <label className="school-check"><input type="checkbox" checked={assignmentImportant} onChange={(event) => setAssignmentImportant(event.target.checked)} /><span>مهم</span></label>
          <label className="field school-form-span"><span>ملاحظة</span><input value={assignmentNote} maxLength={500} placeholder="اختياري" onChange={(event) => setAssignmentNote(event.target.value)} /></label>
        </div>
        <button type="button" className="button button--primary button--full" disabled={!assignmentTitle.trim()} onClick={addAssignment}><Icon name="plus" /> إضافة المهمة</button>
      </section>

      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">قائمة العمل</span><h2>المهام الحالية</h2></div><span className="section-heading__aside">{active.length}</span></div>
        {active.length === 0
          ? <SchoolEmpty icon="check" title="ما عندك مهام معلقة" text="جميل. حالة نادرة تستحق التوثيق." />
          : <div className="school-task-list">{active.map((item) => <AssignmentCard key={item.id} data={data} assignment={item} today={today} setData={setData} />)}</div>}
        {completed.length > 0 && <details className="school-completed"><summary>المهام المنتهية ({completed.length})</summary><div className="school-task-list">{completed.map((item) => <AssignmentCard key={item.id} data={data} assignment={item} today={today} setData={setData} />)}</div></details>}
      </section>

      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">اختبار جديد</span><h2>الاختبارات والتقييمات</h2></div></div>
        <div className="school-form-grid">
          <label className="field"><span>المادة</span><select value={examSubject} onChange={(event) => setExamSubject(event.target.value)}>{data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
          <label className="field"><span>النوع</span><select value={examKind} onChange={(event) => setExamKind(event.target.value as SchoolExamKind)}>{Object.entries(examKindLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="field school-form-span"><span>اسم الاختبار</span><input value={examTitle} maxLength={140} placeholder="مثال: اختبار الفصل الثالث" onChange={(event) => setExamTitle(event.target.value)} /></label>
          <label className="field"><span>التاريخ</span><input type="date" value={examDate} onChange={(event) => setExamDate(event.target.value as DateKey)} /></label>
          <label className="field"><span>الوقت</span><input type="time" value={examTime} onChange={(event) => setExamTime(event.target.value)} /></label>
          <label className="field school-form-span"><span>النطاق</span><input value={examScope} maxLength={500} placeholder="الدروس أو الصفحات الداخلة" onChange={(event) => setExamScope(event.target.value)} /></label>
          <label className="field school-form-span"><span>ملاحظة</span><input value={examNote} maxLength={500} placeholder="اختياري" onChange={(event) => setExamNote(event.target.value)} /></label>
        </div>
        <button type="button" className="button button--primary button--full" disabled={!examTitle.trim()} onClick={addExam}><Icon name="plus" /> إضافة الاختبار</button>
      </section>

      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">القادم</span><h2>الاختبارات</h2></div><span className="section-heading__aside">{upcoming.length}</span></div>
        {upcoming.length === 0
          ? <SchoolEmpty icon="calendar" title="ما فيه اختبار قادم مسجل" text="إذا أعلن المدرس اختبارًا، سجله هنا قبل ما يتبخر من الذاكرة." />
          : <div className="school-exam-list">{upcoming.map((exam) => <ExamCard key={exam.id} data={data} exam={exam} setData={setData} />)}</div>}
        {pastExams.length > 0 && <details className="school-completed"><summary>اختبارات سابقة ({pastExams.length})</summary><div className="school-exam-list">{pastExams.map((exam) => <ExamCard key={exam.id} data={data} exam={exam} setData={setData} />)}</div></details>}
      </section>
    </div>
  );
}

function SchoolSchedule({ data, setData }: { data: SchoolData; setData: SetSchoolData }) {
  const [weekday, setWeekday] = useState(new Date().getDay());
  const [subjectId, setSubjectId] = useState(data.subjects[0]?.id ?? '');
  const existing = data.periods.filter((period) => period.weekday === weekday).sort((a, b) => a.periodNumber - b.periodNumber);
  const [periodNumber, setPeriodNumber] = useState(Math.max(1, existing.length + 1));
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('07:45');
  const [note, setNote] = useState('');

  const addPeriod = () => {
    if (!subjectId || !startTime || !endTime || startTime >= endTime) return;
    setData((current) => ({ ...current, periods: [...current.periods, { id: createSchoolId('period'), weekday, periodNumber, subjectId, startTime, endTime, note: note.trim() }] }));
    setPeriodNumber((value) => value + 1);
    setNote('');
  };

  return (
    <div className="school-stack">
      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">الأسبوع</span><h2>اختر اليوم</h2></div></div>
        <div className="school-weekdays">{WEEKDAYS.map((item) => <button key={item.id} type="button" className={weekday === item.id ? 'is-active' : ''} onClick={() => setWeekday(item.id)}>{item.label}</button>)}</div>
      </section>

      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">{WEEKDAYS.find((item) => item.id === weekday)?.label}</span><h2>الحصص</h2></div><span className="section-heading__aside">{existing.length}</span></div>
        {existing.length === 0
          ? <SchoolEmpty icon="calendar" title="اليوم فاضي" text="أضف أول حصة من النموذج تحت." />
          : <div className="school-period-list">{existing.map((period) => <PeriodRow key={period.id} data={data} period={period} onDelete={() => setData((current) => ({ ...current, periods: current.periods.filter((item) => item.id !== period.id) }))} />)}</div>}
      </section>

      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">إضافة</span><h2>حصة للجدول</h2></div></div>
        {data.subjects.length === 0
          ? <SchoolEmpty icon="book" title="أضف مادة أول" text="الحصة لازم ترتبط بمادة من تبويب المواد." />
          : <>
            <div className="school-form-grid">
              <label className="field"><span>المادة</span><select value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>{data.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select></label>
              <label className="field"><span>رقم الحصة</span><input type="number" min="1" max="20" inputMode="numeric" value={periodNumber} onChange={(event) => setPeriodNumber(Math.max(1, Math.min(20, Number(event.target.value) || 1)))} /></label>
              <label className="field"><span>البداية</span><input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} /></label>
              <label className="field"><span>النهاية</span><input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} /></label>
              <label className="field school-form-span"><span>ملاحظة</span><input value={note} maxLength={300} placeholder="معمل، تبديل فصل، شيء ثابت..." onChange={(event) => setNote(event.target.value)} /></label>
            </div>
            <button type="button" className="button button--primary button--full" disabled={!subjectId || startTime >= endTime} onClick={addPeriod}><Icon name="plus" /> إضافة الحصة</button>
          </>}
      </section>
    </div>
  );
}

function SchoolSubjects({ data, setData }: { data: SchoolData; setData: SetSchoolData }) {
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [room, setRoom] = useState('');
  const [note, setNote] = useState('');

  const addSubject = () => {
    if (!name.trim()) return;
    setData((current) => ({ ...current, subjects: [...current.subjects, { id: createSchoolId('subject'), name: name.trim(), teacher: teacher.trim(), room: room.trim(), note: note.trim(), createdAt: Date.now() }] }));
    setName('');
    setTeacher('');
    setRoom('');
    setNote('');
  };

  const removeSubject = (id: string) => {
    setData((current) => ({
      ...current,
      subjects: current.subjects.filter((subject) => subject.id !== id),
      periods: current.periods.filter((period) => period.subjectId !== id),
      assignments: current.assignments.filter((assignment) => assignment.subjectId !== id),
      exams: current.exams.filter((exam) => exam.subjectId !== id),
    }));
  };

  return (
    <div className="school-stack">
      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">المواد</span><h2>موادك الدراسية</h2></div><span className="section-heading__aside">{data.subjects.length}</span></div>
        {data.subjects.length === 0
          ? <SchoolEmpty icon="book" title="لسه ما أضفت مواد" text="أضف أول مادة وبعدها تقدر تبني الجدول والواجبات والاختبارات حولها." />
          : <div className="subject-grid">{data.subjects.map((subject) => {
            const average = getSubjectAverage(data, subject.id);
            const pendingCount = data.assignments.filter((assignment) => assignment.subjectId === subject.id && assignment.status === 'todo').length;
            return <article className="subject-card" key={subject.id}>
              <div className="subject-card__head"><span className="feature-icon"><Icon name="book" /></span><div><h3>{subject.name}</h3><p>{subject.teacher || 'بدون اسم مدرس'}{subject.room ? ` · ${subject.room}` : ''}</p></div></div>
              <div className="subject-card__stats"><span><b>{pendingCount}</b> مهمة</span><span><b>{average === null ? '—' : `${average}%`}</b> متوسط</span></div>
              {subject.note && <p className="subject-card__note">{subject.note}</p>}
              <button type="button" className="text-button text-button--danger" onClick={() => removeSubject(subject.id)}>حذف المادة وكل بياناتها</button>
            </article>;
          })}</div>}
      </section>

      <section className="school-panel">
        <div className="section-heading"><div><span className="eyebrow">إضافة</span><h2>مادة جديدة</h2></div></div>
        <div className="school-form-grid">
          <label className="field school-form-span"><span>اسم المادة</span><input value={name} maxLength={80} placeholder="مثال: رياضيات" onChange={(event) => setName(event.target.value)} /></label>
          <label className="field"><span>المدرس</span><input value={teacher} maxLength={80} placeholder="اختياري" onChange={(event) => setTeacher(event.target.value)} /></label>
          <label className="field"><span>الفصل / المعمل</span><input value={room} maxLength={40} placeholder="اختياري" onChange={(event) => setRoom(event.target.value)} /></label>
          <label className="field school-form-span"><span>ملاحظة</span><input value={note} maxLength={400} placeholder="أي شيء ثابت عن المادة" onChange={(event) => setNote(event.target.value)} /></label>
        </div>
        <button type="button" className="button button--primary button--full" disabled={!name.trim()} onClick={addSubject}><Icon name="plus" /> إضافة المادة</button>
      </section>
    </div>
  );
}

function AssignmentCard({ data, assignment, today, setData }: { data: SchoolData; assignment: SchoolData['assignments'][number]; today: DateKey; setData: SetSchoolData }) {
  const overdue = assignment.status === 'todo' && assignment.dueDate < today;
  return <article className={`school-task-card ${overdue ? 'is-overdue' : ''} ${assignment.status !== 'todo' ? 'is-done' : ''}`}>
    <button type="button" className="school-task-check" aria-label={assignment.status === 'todo' ? 'إكمال المهمة' : 'إرجاع المهمة'} onClick={() => setData((current) => ({ ...current, assignments: current.assignments.map((item) => item.id === assignment.id ? { ...item, status: item.status === 'todo' ? 'done' : 'todo' } : item) }))}><Icon name="check" /></button>
    <div className="school-task-card__body"><div className="school-task-card__meta"><span>{subjectName(data, assignment.subjectId)}</span><span>{assignmentKindLabels[assignment.kind]}</span>{assignment.important && <span className="is-important">مهم</span>}</div><h3>{assignment.title}</h3><p>{overdue ? 'متأخرة · ' : ''}التسليم {formatArabicDate(assignment.dueDate, 'short')}</p>{assignment.note && <small>{assignment.note}</small>}</div>
    <button type="button" className="icon-button school-delete" aria-label="حذف المهمة" onClick={() => setData((current) => ({ ...current, assignments: current.assignments.filter((item) => item.id !== assignment.id) }))}><Icon name="trash" /></button>
  </article>;
}

function ExamCard({ data, exam, setData }: { data: SchoolData; exam: SchoolData['exams'][number]; setData: SetSchoolData }) {
  const percent = exam.score !== null && exam.maxScore ? Math.round((exam.score / exam.maxScore) * 100) : null;
  return <article className="school-exam-card">
    <div className="school-exam-card__top"><span className="feature-icon"><Icon name="calendar" /></span><div><span>{subjectName(data, exam.subjectId)} · {examKindLabels[exam.kind]}</span><h3>{exam.title}</h3><p>{formatArabicDate(exam.date)}{exam.time ? ` · ${formatClock(exam.time)}` : ''}</p></div><button type="button" className="icon-button school-delete" aria-label="حذف الاختبار" onClick={() => setData((current) => ({ ...current, exams: current.exams.filter((item) => item.id !== exam.id) }))}><Icon name="trash" /></button></div>
    {exam.scope && <p className="school-exam-scope"><strong>النطاق:</strong> {exam.scope}</p>}
    <div className="exam-score-row"><label className="field"><span>درجتي</span><input type="number" min="0" inputMode="decimal" value={exam.score ?? ''} onChange={(event) => updateExamScore(setData, exam.id, 'score', event.target.value)} /></label><span>/</span><label className="field"><span>من</span><input type="number" min="1" inputMode="decimal" value={exam.maxScore ?? ''} onChange={(event) => updateExamScore(setData, exam.id, 'maxScore', event.target.value)} /></label>{percent !== null && <strong className="exam-percent">{percent}%</strong>}</div>
    {exam.note && <small className="school-exam-note">{exam.note}</small>}
  </article>;
}

function updateExamScore(setData: SetSchoolData, id: string, field: 'score' | 'maxScore', value: string) {
  const number = value === '' ? null : Math.max(0, Number(value) || 0);
  setData((current) => ({ ...current, exams: current.exams.map((exam) => exam.id === id ? { ...exam, [field]: number } : exam) }));
}

function PeriodRow({ data, period, onDelete }: { data: SchoolData; period: SchoolPeriod; onDelete?: () => void }) {
  const subject = data.subjects.find((item) => item.id === period.subjectId);
  return <article className="school-period-row"><span className="school-period-number">{period.periodNumber}</span><div><h3>{subject?.name ?? 'مادة'}</h3><p>{formatClock(period.startTime)} – {formatClock(period.endTime)}{subject?.teacher ? ` · ${subject.teacher}` : ''}{subject?.room ? ` · ${subject.room}` : ''}</p>{period.note && <small>{period.note}</small>}</div>{onDelete && <button type="button" className="icon-button school-delete" aria-label="حذف الحصة" onClick={onDelete}><Icon name="trash" /></button>}</article>;
}

function SchoolKpi({ label, value, tone = 'normal' }: { label: string; value: string; tone?: 'normal' | 'warn' }) {
  return <div className={`school-kpi ${tone === 'warn' ? 'is-warn' : ''}`}><span>{label}</span><strong>{value}</strong></div>;
}

function SchoolEmpty({ icon, title, text }: { icon: 'book' | 'calendar' | 'check'; title: string; text: string }) {
  return <div className="school-empty"><Icon name={icon} /><strong>{title}</strong><span>{text}</span></div>;
}
