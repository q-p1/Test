import axe from 'axe-core';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from './App';
import { addDays, toDateKey } from './lib/date';
import { createDefaultState, createEmptyDayRecord, saveState, STORAGE_KEY } from './lib/storage';
import { RoutineProvider } from './state/RoutineContext';

function renderApp() {
  return render(<RoutineProvider><App /></RoutineProvider>);
}

function navigate(label: 'اليوم' | 'الرياضة' | 'التمارين' | 'الإعدادات') {
  fireEvent.click(within(screen.getByRole('navigation', { name: 'التنقل الرئيسي' })).getByRole('button', { name: label }));
}

afterEach(cleanup);

describe('full interaction regression', () => {
  it('creates and restores a school holiday, then replaces tahfiz with a trip', async () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'تعديل هذا اليوم' }));
    let dialog = screen.getByRole('dialog', { name: 'تعديل هذا اليوم' });
    fireEvent.click(within(dialog).getByRole('button', { name: /إجازة مدرسة/ }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'حفظ الاستثناء' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'إغلاق النافذة' }));
    expect(screen.getByText('هذا اليوم مختلف عن الجدول الأساسي')).toBeVisible();
    expect(document.querySelector('.timeline-item.is-cancelled')?.textContent).toContain('المدرسة');

    fireEvent.click(screen.getAllByRole('button', { name: 'تعديل هذا اليوم' })[0]!);
    dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'إرجاع اليوم للجدول الأساسي' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'إغلاق النافذة' }));
    expect(screen.queryByText('هذا اليوم مختلف عن الجدول الأساسي')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'تعديل هذا اليوم' }));
    dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /رحلة تحفيظ/ }));
    fireEvent.change(within(dialog).getByLabelText(/الاسم/), { target: { value: 'رحلة التحفيظ' } });
    fireEvent.change(within(dialog).getByLabelText('من'), { target: { value: '16:10' } });
    fireEvent.change(within(dialog).getByLabelText('إلى'), { target: { value: '18:00' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'حفظ الاستثناء' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'إغلاق النافذة' }));
    expect(screen.getByText('رحلة التحفيظ')).toBeVisible();
    const tahfizSession = screen.getByTestId('tahfiz-session');
    expect(within(tahfizSession).getByText(/استُبدلت الجلسة بحدث: رحلة التحفيظ/)).toBeVisible();
    expect(within(tahfizSession).queryByRole('button', { name: 'بدء' })).not.toBeInTheDocument();
    await waitFor(() => expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).dateOverrides).toBeTruthy());
  });

  it('persists workout set logging through remount and records completion exactly once', async () => {
    const first = renderApp();
    navigate('الرياضة');
    fireEvent.click(screen.getByRole('button', { name: /بدء الحصة/ }));
    const firstExercise = document.querySelector('.active-exercise')!;
    const inputs = firstExercise.querySelectorAll<HTMLInputElement>('input[type="number"]');
    fireEvent.change(inputs[0]!, { target: { value: '10' } });
    fireEvent.change(inputs[1]!, { target: { value: '9' } });
    fireEvent.change(inputs[2]!, { target: { value: '8' } });
    await waitFor(() => expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).workout.active.logs).toBeTruthy());
    first.unmount();

    renderApp();
    navigate('الرياضة');
    const restored = document.querySelector('.active-exercise')!.querySelectorAll<HTMLInputElement>('input[type="number"]');
    expect([...restored].map((input) => input.value)).toEqual(['10', '9', '8']);
    fireEvent.click(screen.getByRole('button', { name: /إنهاء وحفظ الحصة/ }));
    await waitFor(() => expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).workout.history).toHaveLength(1));
    cleanup();
    renderApp();
    navigate('الرياضة');
    expect(document.querySelectorAll('.history-list > div')).toHaveLength(1);
  });

  it('deletes only today and keeps settings, prior days and prior workout history', async () => {
    const now = new Date();
    const today = toDateKey(now);
    const yesterday = addDays(today, -1);
    const state = createDefaultState(now);
    state.settings.userName = 'اختبار';
    state.days[yesterday] = createEmptyDayRecord(yesterday);
    state.days[yesterday]!.notes = 'سجل قديم';
    state.days[today]!.prayers.fajr = true;
    state.workout.history = [{ id: 'old', date: yesterday, scheduledFor: yesterday, workoutId: 'A', cycle: 1, week: 1, durationMs: 20_000, completedAt: 1, logs: {}, rating: 4, note: '', proudMoment: '' }];
    saveState(state);

    renderApp();
    navigate('الإعدادات');
    fireEvent.click(screen.getByRole('button', { name: /حذف بيانات هذا اليوم/ }));
    const dialog = screen.getByRole('dialog', { name: 'حذف بيانات اليوم؟' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'حذف هذا اليوم فقط' }));
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(saved.days[today]).toBeUndefined();
      expect(saved.days[yesterday].notes).toBe('سجل قديم');
      expect(saved.settings.userName).toBe('اختبار');
      expect(saved.workout.history).toHaveLength(1);
    });
  });

  it('renders all major pages without automated accessibility violations detectable in DOM', async () => {
    renderApp();
    for (const page of ['اليوم', 'الرياضة', 'التمارين', 'الإعدادات'] as const) {
      navigate(page);
      const result = await axe.run(document.body, { rules: { 'color-contrast': { enabled: false } } });
      expect(result.violations.map((violation) => violation.id)).toEqual([]);
    }
  });

  it('shows polished missing-image states instead of a wrong or broken image', () => {
    renderApp();
    navigate('التمارين');
    expect(document.querySelectorAll('.exercise-placeholder')).toHaveLength(2);
    expect(document.querySelectorAll('.exercise-visual img')).toHaveLength(17);
    fireEvent.click(screen.getByRole('button', { name: 'عرض تفاصيل ديد بغ' }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('لن نعرض حركة غير مؤكدة')).toBeVisible();
    expect(within(dialog).queryByRole('img', { name: /الرسم الأصلي/ })).not.toBeInTheDocument();
  });
});
