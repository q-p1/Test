import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  reporter: [['line'], ['html', { open: 'never' }]],
  webServer: {
    command: './node_modules/.bin/vite preview --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
  use: {
    baseURL: 'http://127.0.0.1:4173',
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'iphone-se', use: { ...devices['iPhone SE'] } },
    { name: 'iphone-13', use: { ...devices['iPhone 13'] } },
    { name: 'iphone-pro-max', use: { ...devices['iPhone 14 Pro Max'] } },
  ],
});
