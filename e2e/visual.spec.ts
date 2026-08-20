import { expect, test, type Page } from '@playwright/test';

const storageKey = 'routine.app.state';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-13', 'Visual QA is captured once at the central iPhone size.');
  await page.addInitScript(() => localStorage.clear());
});

test('capture core screens and states', async ({ page }) => {
  await page.goto('/');
  await capture(page, 'today');

  await page.getByRole('button', { name: 'الرياضة' }).click();
  await capture(page, 'fitness');

  await page.getByRole('button', { name: 'التمارين' }).click();
  await capture(page, 'exercise-library');
  await page.locator('.exercise-card__button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.screenshot({ path: 'visual-qa/exercise-detail.png', fullPage: false });
  await page.getByRole('dialog').getByRole('button', { name: 'إغلاق النافذة' }).click();

  await page.getByRole('button', { name: 'الإعدادات' }).click();
  await capture(page, 'settings');

  await page.getByRole('button', { name: 'اليوم' }).click();
  await page.getByRole('button', { name: 'تعديل هذا اليوم' }).click();
  await page.screenshot({ path: 'visual-qa/day-override-sheet.png', fullPage: false });
  await page.getByRole('dialog').getByRole('button', { name: 'إغلاق النافذة' }).click();

  await page.getByRole('button', { name: 'التمارين' }).click();
  await page.getByRole('searchbox').fill('لا يوجد إطلاقًا');
  await capture(page, 'empty-state');
});

test('capture completed, holiday and tahfiz trip days', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const date = Object.keys(state.days)[0];
    Object.keys(state.days[date].prayers).forEach((prayer) => { state.days[date].prayers[prayer] = true; });
    state.days[date].sessions.tahfiz = { status: 'completed', accumulatedMs: 2_400_000, startedAt: null, completedAt: Date.now() };
    state.days[date].sessions.qudurat = { status: 'completed', accumulatedMs: 5_400_000, startedAt: null, completedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.reload();
  await capture(page, 'completed-day');

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const date = Object.keys(state.days)[0];
    state.dateOverrides = { [date]: [{ id: 'holiday', type: 'official-holiday', startDate: date, title: 'إجازة رسمية', createdAt: 1 }] };
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.reload();
  await capture(page, 'holiday-day');

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const date = Object.keys(state.days)[0];
    state.dateOverrides = { [date]: [{ id: 'trip', type: 'tahfiz-trip', startDate: date, title: 'رحلة التحفيظ', startTime: '16:00', endTime: '18:00', note: 'التجمع أمام المسجد', createdAt: 1 }] };
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.reload();
  await capture(page, 'tahfiz-trip-day');
});

async function capture(page: Page, name: string) {
  await expect(page.locator('.app-shell')).toBeVisible();
  await page.screenshot({ path: `visual-qa/${name}.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}
