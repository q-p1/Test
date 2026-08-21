import { expect, test } from '@playwright/test';

test('school hub stores subjects, timetable, attendance, assignments and exams on iPhone WebKit', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'التنقل الرئيسي' }).getByRole('button', { name: 'المدرسة', exact: true }).click();
  await expect(page.locator('[data-page="school"]')).toBeVisible();
  const tabs = page.getByRole('navigation', { name: 'أقسام المدرسة' });

  await tabs.getByRole('button', { name: 'المواد', exact: true }).click();
  await page.getByLabel('اسم المادة').fill('رياضيات');
  await page.getByLabel('المدرس').fill('أستاذ الرياضيات');
  await page.getByLabel('الفصل / المعمل').fill('12');
  await page.getByRole('button', { name: 'إضافة المادة' }).click();
  await expect(page.getByRole('heading', { name: 'رياضيات', exact: true })).toBeVisible();

  await tabs.getByRole('button', { name: 'الجدول', exact: true }).click();
  await page.getByRole('button', { name: 'الأحد', exact: true }).click();
  await page.getByLabel('رقم الحصة').fill('1');
  await page.getByLabel('البداية').fill('07:00');
  await page.getByLabel('النهاية').fill('07:45');
  await page.getByRole('button', { name: 'إضافة الحصة' }).click();
  await expect(page.locator('.school-period-row')).toContainText('رياضيات');

  await tabs.getByRole('button', { name: 'المهام', exact: true }).click();
  await page.getByLabel('العنوان').fill('حل صفحة 42');
  await page.getByLabel('موعد التسليم').fill('2026-08-23');
  await page.getByRole('button', { name: 'إضافة المهمة' }).click();
  await expect(page.getByRole('heading', { name: 'حل صفحة 42', exact: true })).toBeVisible();

  await page.getByLabel('اسم الاختبار').fill('اختبار الفصل الثالث');
  await page.getByLabel('التاريخ').fill('2026-08-25');
  await page.getByLabel('النطاق').fill('الدروس 1 إلى 3');
  await page.getByRole('button', { name: 'إضافة الاختبار' }).click();
  await expect(page.getByRole('heading', { name: 'اختبار الفصل الثالث', exact: true })).toBeVisible();

  await tabs.getByRole('button', { name: 'اليوم', exact: true }).click();
  await page.getByRole('button', { name: 'حضرت', exact: true }).click();
  await page.getByLabel('وقت الوصول').fill('06:55');
  await page.getByLabel('وقت الخروج').fill('12:30');
  await expect(page.getByLabel('وقت الوصول')).toHaveValue('06:55');
  await expect(page.getByLabel('وقت الخروج')).toHaveValue('12:30');

  await expect.poll(async () => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('routine.school.v1') ?? 'null');
    return stored ? {
      subjects: stored.subjects?.length,
      periods: stored.periods?.length,
      assignments: stored.assignments?.length,
      exams: stored.exams?.length,
      attendance: Object.values(stored.days ?? {})[0]?.attendance,
    } : null;
  })).toEqual({ subjects: 1, periods: 1, assignments: 1, exams: 1, attendance: 'present' });

  await page.reload();
  await page.getByRole('navigation', { name: 'التنقل الرئيسي' }).getByRole('button', { name: 'المدرسة', exact: true }).click();
  await expect(page.getByRole('button', { name: 'حضرت', exact: true })).toHaveClass(/is-selected/);
  await expect(page.getByLabel('وقت الوصول')).toHaveValue('06:55');
  await expect(page.getByLabel('وقت الخروج')).toHaveValue('12:30');

  const reloadedTabs = page.getByRole('navigation', { name: 'أقسام المدرسة' });
  await reloadedTabs.getByRole('button', { name: 'المواد', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'رياضيات', exact: true })).toBeVisible();

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow).toBe(false);
});
