import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { RoutineProvider } from './state/RoutineContext';
import { STORAGE_KEY } from './lib/storage';

function renderApp() {
  return render(<RoutineProvider><App /></RoutineProvider>);
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('app persistence smoke tests', () => {
  it('marks and unmarks prayer independently and persists after remount', async () => {
    const first = renderApp();
    const fajr = screen.getByRole('button', { name: /الفجر/ });
    fireEvent.click(fajr);
    expect(fajr).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).days).toBeTruthy());
    first.unmount();
    renderApp();
    expect(screen.getByRole('button', { name: /الفجر/ })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: /الفجر/ }));
    expect(screen.getByRole('button', { name: /الفجر/ })).toHaveAttribute('aria-pressed', 'false');
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
});
