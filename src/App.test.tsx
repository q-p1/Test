import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { RoutineProvider } from './state/RoutineContext';
import { STORAGE_KEY } from './lib/storage';

function renderApp() {
  return render(<RoutineProvider><App /></RoutineProvider>);
}

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});

describe('app persistence smoke tests', () => {
  it('marks and unmarks prayer independently and persists after remount', async () => {
    const first = renderApp();
    const fajr = screen.getByRole('button', { name: /الفجر/ });
    fireEvent.click(fajr);
    expect(fajr).toHaveAttribute('aria-pressed', 'true');
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const savedDate = Object.keys(saved.days)[0];
    if (!savedDate) throw new Error('Expected the current day to be persisted synchronously.');
    expect(saved.days[savedDate].prayers.fajr).toBe(true);
    first.unmount();
    renderApp();
    expect(screen.getByRole('button', { name: /الفجر/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /الفجر/ }));
    expect(screen.getByRole('button', { name: /الفجر/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('stores prayer timing and congregation details independently', () => {
    const first = renderApp();
    fireEvent.click(screen.getByRole('button', { name: /الفجر/ }));
    fireEvent.click(screen.getByRole('button', { name: 'في وقتها' }));
    fireEvent.click(screen.getByRole('button', { name: 'بالجماعة' }));
    let saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    let date = Object.keys(saved.days)[0];
    expect(saved.days[date].prayerDetails.fajr.timing).toBe('on-time');
    expect(saved.days[date].prayerDetails.fajr.congregation).toBe('yes');

    first.unmount();
    renderApp();
    fireEvent.click(screen.getAllByRole('button', { name: 'عرض تفاصيل هذه الصلاة' })[0]!);
    expect(screen.getByRole('button', { name: 'في وقتها' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'بالجماعة' })).toHaveAttribute('aria-pressed', 'true');
    saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    date = Object.keys(saved.days)[0];
    expect(saved.days[date].prayers.fajr).toBe(true);
  });

  it('restores a tahfiz timer from timestamp after forty minutes away', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T10:00:00+03:00'));
    const first = renderApp();
    const tahfiz = screen.getByTestId('tahfiz-session');
    fireEvent.click(within(tahfiz).getByRole('button', { name: /بدء/ }));
    await vi.advanceTimersByTimeAsync(0);
    first.unmount();
    vi.setSystemTime(new Date('2026-08-20T10:40:00+03:00'));
    renderApp();
    expect(screen.getByTestId('tahfiz-session')).toHaveTextContent('40:00');
  });

  it('persists intentional Tahfiz skip and detailed memorization fields', () => {
    const first = renderApp();
    const tahfiz = screen.getByTestId('tahfiz-session');
    fireEvent.click(within(tahfiz).getByRole('button', { name: 'تخطيته بقصد' }));
    fireEvent.change(within(tahfiz).getByLabelText('حفظ جديد'), { target: { value: 'صفحة اختبار' } });
    fireEvent.change(within(tahfiz).getByLabelText('مراجعة'), { target: { value: 'مراجعة قديمة' } });
    first.unmount();

    renderApp();
    const restored = screen.getByTestId('tahfiz-session');
    expect(within(restored).getByRole('button', { name: 'تخطيته بقصد' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(restored).getByLabelText('حفظ جديد')).toHaveValue('صفحة اختبار');
    expect(within(restored).getByLabelText('مراجعة')).toHaveValue('مراجعة قديمة');
  });

  it('restores a long qudurat session independently after closing the app', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T18:00:00+03:00'));
    const first = renderApp();
    const qudurat = screen.getByTestId('qudurat-session');
    fireEvent.click(within(qudurat).getByRole('button', { name: /بدء/ }));
    await vi.advanceTimersByTimeAsync(0);
    first.unmount();
    vi.setSystemTime(new Date('2026-08-20T19:45:00+03:00'));
    renderApp();
    expect(screen.getByTestId('qudurat-session')).toHaveTextContent('01:45:00');
    expect(screen.getByTestId('tahfiz-session')).toHaveTextContent('00:00');
  });

  it('restores Qudurat lesson stats and clamps correct answers to total questions', () => {
    renderApp();
    const qudurat = screen.getByTestId('qudurat-session');
    fireEvent.change(within(qudurat).getByLabelText('الدرس / الفيديو'), { target: { value: 'النسب' } });
    fireEvent.change(within(qudurat).getByLabelText('الأسئلة'), { target: { value: '10' } });
    fireEvent.change(within(qudurat).getByLabelText('الصحيح'), { target: { value: '12' } });
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
    const date = Object.keys(saved.days)[0];
    expect(saved.days[date].qudurat.lessonName).toBe('النسب');
    expect(saved.days[date].qudurat.questions).toBe(10);
    expect(saved.days[date].qudurat.correct).toBe(10);
  });
});
