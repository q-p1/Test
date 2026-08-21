import { expect, test, type Page } from '@playwright/test';

const storageKey = 'routine.app.state';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-13', 'Visual QA is captured once at the central iPhone size.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('capture core screens and states', async ({ page }) => {
  await page.goto('/');
  await capture(page, 'today');

  await seedSchoolPreview(page);
  await navigate(page, 'المدرسة');
  await capture(page, 'school-today');
  const schoolTabs = page.getByRole('navigation', { name: 'أقسام المدرسة' });
  const tasksTab = schoolTabs.getByRole('button', { name: 'المهام', exact: true });
  await tasksTab.click();
  await expect(tasksTab).toHaveClass(/is-active/);
  await capture(page, 'school-tasks');
  const subjectsTab = schoolTabs.getByRole('button', { name: 'المواد', exact: true });
  await subjectsTab.click();
  await expect(subjectsTab).toHaveClass(/is-active/);
  await capture(page, 'school-subjects');

  await navigate(page, 'الرياضة');
  await capture(page, 'fitness');

  await navigate(page, 'التمارين');
  await warmLazyImages(page);
  await capture(page, 'exercise-library');
  await page.locator('.exercise-card__button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await settlePaint(page);
  await page.screenshot({ path: 'visual-qa/exercise-detail.png', fullPage: false });
  await page.getByRole('dialog').getByRole('button', { name: 'إغلاق النافذة' }).click();

  await navigate(page, 'الإعدادات');
  await capture(page, 'settings');

  await navigate(page, 'اليوم');
  await page.getByRole('button', { name: 'تعديل هذا اليوم' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await settlePaint(page);
  await page.screenshot({ path: 'visual-qa/day-override-sheet.png', fullPage: false });
  await page.getByRole('dialog').getByRole('button', { name: 'إغلاق النافذة' }).click();

  await navigate(page, 'التمارين');
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

async function seedSchoolPreview(page: Page) {
  await page.evaluate(() => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    localStorage.setItem('routine.school.v1', JSON.stringify({
      schemaVersion: 1,
      subjects: [
        { id: 'math', name: 'رياضيات', teacher: 'أستاذ الرياضيات', room: 'فصل 12', note: 'مراجعة القوانين قبل كل اختبار', createdAt: 1 },
        { id: 'physics', name: 'فيزياء', teacher: 'أستاذ الفيزياء', room: 'المعمل', note: '', createdAt: 2 },
      ],
      periods: [
        { id: 'p1', weekday: now.getDay(), periodNumber: 1, subjectId: 'math', startTime: '07:00', endTime: '07:45', note: '' },
        { id: 'p2', weekday: now.getDay(), periodNumber: 2, subjectId: 'physics', startTime: '07:50', endTime: '08:35', note: 'معمل' },
      ],
      assignments: [
        { id: 'a1', subjectId: 'math', title: 'حل صفحة 42', dueDate: date, kind: 'homework', status: 'todo', important: true, note: 'الأسئلة الفردية', createdAt: 1 },
      ],
      exams: [
        { id: 'e1', subjectId: 'physics', title: 'اختبار الحركة', date, time: '10:00', kind: 'quiz', scope: 'الفصل الأول', score: 18, maxScore: 20, note: '', createdAt: 1 },
      ],
      days: { [date]: { date, attendance: 'present', arrivalTime: '06:55', departureTime: '12:30', note: 'يوم مرتب' } },
    }));
  });
}

async function capture(page: Page, name: string) {
  await expect(page.locator('.app-shell')).toBeVisible();
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo({ top: 0, behavior: 'auto' });
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await settlePaint(page);
  await page.screenshot({ path: `visual-qa/${name}.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

async function settlePaint(page: Page) {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}

async function warmLazyImages(page: Page) {
  const images = page.locator('.exercise-card img');
  const expectedImages = await images.count();
  expect(expectedImages).toBe(17);
  for (let index = 0; index < expectedImages; index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect.poll(
      () => image.evaluate((node) => node.complete ? node.naturalWidth : 0),
      { timeout: 15_000, message: `Exercise image ${index + 1}/${expectedImages} did not load` },
    ).toBeGreaterThan(0);
  }
}

async function navigate(page: Page, label: 'اليوم' | 'المدرسة' | 'الرياضة' | 'التمارين' | 'الإعدادات') {
  const destination = page
    .getByRole('navigation', { name: 'التنقل الرئيسي' })
    .getByRole('button', { name: label, exact: true });
  await destination.click();
  await expect(destination).toHaveAttribute('aria-current', 'page');
}
