import { expect, test, type Page } from '@playwright/test';

const storageKey = 'routine.app.state';

// Playwright creates an isolated browser context for every test. Do not clear
// localStorage in an init script: init scripts also run after page.reload(),
// which would invalidate the persistence scenarios these tests are designed
// to verify.

test('fresh install renders a styled RTL app with stable navigation and no overflow', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle('روتيني');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('[data-page="today"]')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'التنقل الرئيسي' })).toBeVisible();
  await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);
  const serviceWorkerScope = await page.evaluate(async () => (await navigator.serviceWorker.ready).scope);
  expect(serviceWorkerScope).toBe('http://127.0.0.1:4173/');
  await assertNoHorizontalOverflow(page);
  await navigate(page, 'الرياضة');
  await expect(page.locator('[data-page="fitness"]')).toBeVisible();
  await assertNoHorizontalOverflow(page);
  await navigate(page, 'التمارين');
  await expect(page.locator('[data-page="library"]')).toBeVisible();
  await assertNoHorizontalOverflow(page);
  expect(errors).toEqual([]);
});

test('prayers and timestamp timers persist through reload and long absence', async ({ page }) => {
  await page.goto('/');
  const fajr = page.getByRole('button', { name: /الفجر/ });
  await fajr.click();
  await expect(fajr).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.getByRole('button', { name: /الفجر/ })).toHaveAttribute('aria-pressed', 'true');

  const tahfiz = page.getByTestId('tahfiz-session');
  await tahfiz.getByRole('button', { name: /بدء/ }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const date = Object.keys(state.days).sort().at(-1)!;
    state.days[date].sessions.tahfiz.startedAt = Date.now() - 40 * 60_000;
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.reload();
  await expect(page.getByTestId('tahfiz-session').locator('.timer-display')).toContainText('40:');

  const qudurat = page.getByTestId('qudurat-session');
  await qudurat.getByRole('button', { name: /بدء/ }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const date = Object.keys(state.days).sort().at(-1)!;
    state.days[date].sessions.qudurat.startedAt = Date.now() - 75 * 60_000;
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.reload();
  await expect(page.getByTestId('qudurat-session').locator('.timer-display')).toContainText('01:15:');
});

test('rich prayer, Tahfiz, and Qudurat details persist together', async ({ page }) => {
  await page.goto('/');

  const fajr = page.getByRole('button', { name: /الفجر/ });
  await fajr.click();
  await page.getByRole('button', { name: 'في وقتها' }).click();
  await page.getByRole('button', { name: 'بالجماعة' }).click();
  await page.getByLabel('وقت الأداء').fill('05:02');

  const tahfiz = page.getByTestId('tahfiz-session');
  await tahfiz.getByRole('button', { name: 'تخطيته بقصد' }).click();
  await tahfiz.getByLabel('حفظ جديد').fill('سورة الملك 1-10');
  await tahfiz.getByLabel('مراجعة').fill('جزء عم');
  await tahfiz.getByLabel('تسميع').fill('سورة النبأ');
  await tahfiz.getByLabel('أخطاء التسميع').fill('2');

  const qudurat = page.getByTestId('qudurat-session');
  await qudurat.getByLabel('الدرس / الفيديو').fill('النسب والتناسب');
  await qudurat.getByLabel('الأسئلة').fill('20');
  await qudurat.getByLabel('الصحيح').fill('17');
  await qudurat.getByLabel('أخطاء راجعتها').fill('3');
  await expect(qudurat.locator('.accuracy-tile')).toContainText('85%');

  await page.reload();
  const persisted = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const date = Object.keys(state.days).sort().at(-1)!;
    return state.days[date];
  }, storageKey);
  expect(persisted.prayerDetails.fajr).toMatchObject({ performedAt: '05:02', timing: 'on-time', congregation: 'yes' });
  expect(persisted.tahfiz).toMatchObject({ status: 'skipped-intentionally', newMemorization: 'سورة الملك 1-10', review: 'جزء عم', recitation: 'سورة النبأ', mistakes: 2 });
  expect(persisted.qudurat).toMatchObject({ lessonName: 'النسب والتناسب', questions: 20, correct: 17, mistakesReviewed: 3 });
  await expect(page.getByTestId('tahfiz-session').getByRole('button', { name: 'تخطيته بقصد' })).toHaveAttribute('aria-pressed', 'true');
  await assertNoHorizontalOverflow(page);
});

test('daily journal, quick logs, recurring routine, and backup survive real UI flow', async ({ page }) => {
  await page.goto('/');

  const journal = page.locator('.journal-section');
  await journal.getByLabel('وقت الصحوة').fill('05:10');
  await journal.getByRole('button', { name: /بدأ يومي/ }).click();
  await journal.getByRole('button', { name: 'موية', exact: true }).click();
  await journal.getByRole('button', { name: 'وجبة', exact: true }).click();
  await journal.getByLabel('الاسم').fill('مراجعة مشروع');
  await journal.getByLabel('ملاحظة اختيارية').fill('نصف ساعة تركيز');
  await journal.getByRole('button', { name: /سجل الآن/ }).click();
  await expect(journal.locator('.journal-log-list')).toContainText('مراجعة مشروع');
  await journal.getByLabel('وقت النوم').fill('22:40');
  await journal.getByRole('button', { name: /انتهى يومي/ }).click();

  await navigate(page, 'الإعدادات');
  const recurring = page.locator('.recurring-form');
  await recurring.getByLabel('اسم الفقرة').fill('قراءة يومية');
  await recurring.getByLabel('من').fill('17:20');
  await recurring.getByLabel('إلى').fill('17:50');
  await recurring.getByRole('button', { name: /إضافة للجدول/ }).click();
  await expect(page.locator('.recurring-list')).toContainText('قراءة يومية');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /تصدير نسخة احتياطية JSON/ }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^routine-backup-\d{4}-\d{2}-\d{2}\.json$/);

  await page.reload();
  await expect(page.locator('.recurring-list')).toContainText('قراءة يومية');
  const persisted = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const date = Object.keys(state.days).sort().at(-1)!;
    return { day: state.days[date], baseSchedule: state.baseSchedule };
  }, storageKey);
  expect(persisted.day.wakeTime).toBe('05:10');
  expect(persisted.day.bedTime).toBe('22:40');
  expect(persisted.day.logs.some((entry: { label: string }) => entry.label === 'موية')).toBe(true);
  expect(persisted.day.logs.some((entry: { label: string }) => entry.label === 'مراجعة مشروع')).toBe(true);
  expect(Object.values(persisted.baseSchedule).flat().some((entry: any) => entry.title === 'قراءة يومية')).toBe(true);
  await assertNoHorizontalOverflow(page);
});

test('day override sheet saves, restores, and distinguishes a tahfiz trip', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'تعديل هذا اليوم' }).click();
  const dialog = page.getByRole('dialog', { name: 'تعديل هذا اليوم' });
  for (const label of ['إجازة مدرسة', 'إجازة تحفيظ', 'رحلة تحفيظ', 'إجازة رسمية', 'حدث خاص', 'تعديل وقت', 'إلغاء مهمة', 'تأجيل مهمة', 'مهمة استثنائية']) {
    await expect(dialog.getByRole('button', { name: new RegExp(label) })).toBeVisible();
  }
  await dialog.getByRole('button', { name: /إجازة مدرسة/ }).click();
  await dialog.getByRole('button', { name: 'حفظ الاستثناء' }).click();
  await dialog.getByRole('button', { name: 'إغلاق النافذة' }).click();
  await expect(page.getByText('هذا اليوم مختلف عن الجدول الأساسي')).toBeVisible();
  await expect(page.locator('.timeline-item.is-cancelled').filter({ hasText: 'المدرسة' })).toBeVisible();

  await page.getByRole('button', { name: 'تعديل هذا اليوم' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'إرجاع اليوم للجدول الأساسي' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'إغلاق النافذة' }).click();
  await expect(page.getByText('هذا اليوم مختلف عن الجدول الأساسي')).toHaveCount(0);

  await page.getByRole('button', { name: 'تعديل هذا اليوم' }).click();
  const tripDialog = page.getByRole('dialog');
  await tripDialog.getByRole('button', { name: /رحلة تحفيظ/ }).click();
  await tripDialog.getByLabel(/الاسم/).fill('رحلة التحفيظ');
  await tripDialog.getByLabel('من', { exact: true }).fill('16:10');
  await tripDialog.getByLabel('إلى', { exact: true }).fill('18:00');
  await tripDialog.getByRole('button', { name: 'حفظ الاستثناء' }).click();
  await tripDialog.getByRole('button', { name: 'إغلاق النافذة' }).click();
  await expect(page.locator('.timeline-card').filter({ hasText: 'رحلة التحفيظ' })).toBeVisible();
  await expect(page.getByTestId('tahfiz-session')).toContainText('استُبدلت الجلسة بحدث');
  await expect(page.getByTestId('tahfiz-session').getByRole('button', { name: /بدء/ })).toHaveCount(0);
});

test('workout set logs survive reload and completion is written once', async ({ page }) => {
  await page.goto('/');
  await navigate(page, 'الرياضة');
  await page.getByRole('button', { name: /بدء الحصة/ }).click();
  const firstExercise = page.locator('.active-exercise').first();
  const inputs = firstExercise.locator('input[type="number"]');
  await inputs.nth(0).fill('10');
  await inputs.nth(1).fill('9');
  await inputs.nth(2).fill('8');
  await page.reload();
  await navigate(page, 'الرياضة');
  const restoredInputs = page.locator('.active-exercise').first().locator('input[type="number"]');
  await expect(restoredInputs.nth(0)).toHaveValue('10');
  await expect(restoredInputs.nth(1)).toHaveValue('9');
  await expect(restoredInputs.nth(2)).toHaveValue('8');
  await page.getByRole('button', { name: /إنهاء وحفظ الحصة/ }).click();
  await expect(page.locator('.history-list > div')).toHaveCount(1);
  await page.reload();
  await navigate(page, 'الرياضة');
  await expect(page.locator('.history-list > div')).toHaveCount(1);
});

test('missed workout remains next and delete-day preserves settings and prior dates', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const today = Object.keys(state.days)[0];
    state.workout.startedOn = '2026-08-16';
    state.workout.history = [{ id: 'a-complete', date: '2026-08-16', scheduledFor: '2026-08-16', workoutId: 'A', cycle: 1, week: 1, durationMs: 1000, completedAt: 1, logs: {}, rating: null, note: '', proudMoment: '' }];
    state.days['2026-08-19'] = { ...state.days[today], date: '2026-08-19', notes: 'قديم' };
    state.days[today].prayers.fajr = true;
    state.settings.userName = 'اختبار';
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);
  await page.reload();
  await navigate(page, 'الرياضة');
  await expect(page.locator('.next-workout-card__letter')).toHaveText('B');
  await expect(page.getByText(/سنكمل/)).toContainText('B');

  await navigate(page, 'الإعدادات');
  await page.getByRole('button', { name: /حذف بيانات هذا اليوم/ }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'حذف هذا اليوم فقط' }).click();
  const surviving = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(surviving.settings.userName).toBe('اختبار');
  expect(surviving.days['2026-08-19'].notes).toBe('قديم');
  expect(surviving.workout.history).toHaveLength(1);
});

test('corrupted storage and missing exercise images recover without broken UI', async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, '{broken'), storageKey);
  await page.goto('/');
  await expect(page.getByText(/تم تجاهل بيانات تالفة/)).toBeVisible();
  await navigate(page, 'التمارين');
  await expect(page.locator('.exercise-placeholder')).toHaveCount(2);
  await expect(page.getByRole('img', { name: 'الرسم الأصلي لتمرين الضغط من خطة التمارين', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'عرض تفاصيل ديد بغ' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('لن نعرض حركة غير مؤكدة');
  await expect(dialog.locator('img')).toHaveCount(0);
  await assertNoHorizontalOverflow(page);
});

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({ width: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(overflow.width).toBeLessThanOrEqual(overflow.viewport + 1);
}

async function navigate(page: Page, label: 'اليوم' | 'الرياضة' | 'التمارين' | 'الإعدادات') {
  await page.getByRole('navigation', { name: 'التنقل الرئيسي' }).getByRole('button', { name: label, exact: true }).click();
}
