import '@testing-library/jest-dom/vitest';
import { beforeEach } from 'vitest';

Object.defineProperty(window, 'scrollTo', {
  configurable: true,
  value: () => undefined,
});

beforeEach(() => {
  localStorage.clear();
});
