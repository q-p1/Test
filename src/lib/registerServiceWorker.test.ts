import { describe, expect, it, vi } from 'vitest';
import { createControllerChangeHandler } from './registerServiceWorker';

describe('service worker controller changes', () => {
  it('does not reload when the first installed worker claims the page', () => {
    const reload = vi.fn();
    const onControllerChange = createControllerChangeHandler(false, reload);

    onControllerChange();

    expect(reload).not.toHaveBeenCalled();
  });

  it('reloads exactly once when an existing worker is replaced', () => {
    const reload = vi.fn();
    const onControllerChange = createControllerChangeHandler(true, reload);

    onControllerChange();
    onControllerChange();

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('reloads a later update after an initial claim without interruption', () => {
    const reload = vi.fn();
    const onControllerChange = createControllerChangeHandler(false, reload);

    onControllerChange();
    onControllerChange();

    expect(reload).toHaveBeenCalledTimes(1);
  });
});
