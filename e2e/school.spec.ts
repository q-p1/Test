import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('school hub stores subjects, timetable, attendance, assignments and exams on iPhone WebKit', async ({ page }) => {
  await page.goto('/');
  const mainNav = page.getByRole('navigation', { name: 'التنقل الرئيسي' });
  await mainNav.getByRole('button', { name: 'المدرسة', exact: true }).click();
  await expect(page.locator('[data-page="school"]')).toBeVisible();
  const tabs = page.getByRole('navigation', { name: 'أقسام المدرسة' });

  await tabs.getByRole('button', { name: 'المواد', exact: true }).click();
  await expect(tabs.getByRole('button', { name: 'المواد', exact: true })).toHaveClass(/is-active/);
  await page.getByLabel('اسم المادة', { exact: true }).fill('رياضيات');
  await page.getByRole('textbox', { name: 'المدرس', exact: true }).fill('أستاذ الرياضيات');
  await page.getByLabel('الفصل / المعمل', { exact: true }).fill('12');
  await page.getByRole('button', { name: 'إضافة المادة', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'رياضيات', exact: true })).toBeVisible();

  await tabs.getByRole('button', { name: 'الجدول', exact: true }).click();
  await expect(tabs.getByRole('button', { name: 'الجدول', exact: true })).toHaveClass(/is-active/);
  await page.getByRole('button', { name: 'الأحد', exact: true }).click();
  await page.getByLabel('رقم الحصة', { exact: true }).fill('1');
  await page.getByLabel('البداية', { exact: true }).fill('07:00');
  await page.getByLabel('النهاية', { exact: true }).fill('07:45');
  await page.getByRole('button', { name: 'إضافة الحصة', exact: true }).click();
  await expect(page.locator('.school-period-row')).toContainText('رياضيات');

  await tabs.getByRole('button', { name: 'المهام', exact: true }).click();
  await expect(tabs.getByRole('button', { name: 'المهام', exact: true })).toHaveClass(/is-active/);
  await page.getByLabel('العنوان', { exact: true }).fill('حل صفحة 42');
  await page.getByLabel('موعد التسليم', { exact: true }).fill('2026-08-23');
  await page.getByRole('button', { name: 'إضافة المهمة', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'حل صفحة 42', exact: true })).toBeVisible();

  await page.getByLabel('اسم الاختبار', { exact: true }).fill('اختبار الفصل الثالث');
  await page.getByLabel('التاريخ', { exact: true }).fill('2026-08-25');
  await page.getByLabel('النطاق', { exact: true }).fill('الدروس 1 إلى 3');
  await page.getByRole('button', { name: 'إضافة الاختبار', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'اختبار الفصل الثالث', exact: true })).toBeVisible();

  await tabs.getByRole('button', { name: 'اليوم', exact: true }).click();
  await expect(tabs.getByRole('button', { name: 'اليوم', exact: true })).toHaveClass(/is-active/);
  await page.getByRole('button', { name: 'حضرت', exact: true }).click();
  await page.getByLabel('وقت الوصول', { exact: true }).fill('06:55');
  await page.getByLabel('وقت الخروج', { exact: true }).fill('12:30');
  await expect(page.getByLabel('وقت الوصول', { exact: true })).toHaveValue('06:55');
  await expect(page.getByLabel('وقت الخروج', { exact: true })).toHaveValue('12:30');

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
  await mainNav.getByRole('button', { name: 'المدرسة', exact: true }).click();
  await expect(page.getByRole('button', { name: 'حضرت', exact: true })).toHaveClass(/is-selected/);
  await expect(page.getByLabel('وقت الوصول', { exact: true })).toHaveValue('06:55');
  await expect(page.getByLabel('وقت الخروج', { exact: true })).toHaveValue('12:30');

  const reloadedTabs = page.getByRole('navigation', { name: 'أقسام المدرسة' });
  await reloadedTabs.getByRole('button', { name: 'المواد', exact: true }).click();
  await expect(reloadedTabs.getByRole('button', { name: 'المواد', exact: true })).toHaveClass(/is-active/);
  await expect(page.getByRole('heading', { name: 'رياضيات', exact: true })).toBeVisible();

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow).toBe(false);

  await mainNav.getByRole('button', { name: 'الإعدادات', exact: true }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'تصدير نسخة احتياطية JSON', exact: true }).click();
  const download = await downloadPromise;
  const downloadPath = await download.path();
  expect(downloadPath).toBeTruthy();
  const backup = JSON.parse(await readFile(downloadPath!, 'utf-8'));
  expect(backup.backupSchemaVersion).toBe(2);
  expect(backup.school.subjects).toHaveLength(1);
  expect(backup.school.periods).toHaveLength(1);
  expect(backup.school.assignments).toHaveLength(1);
  expect(backup.school.exams).toHaveLength(1);
  expect(Object.values(backup.school.days)[0]).toMatchObject({ attendance: 'present', arrivalTime: '06:55', departureTime: '12:30' });

  await page.getByRole('button', { name: /حذف بيانات هذا اليوم/ }).click();
  const deleteSheet = page.getByRole('dialog');
  await expect(deleteSheet).toBeVisible();
  await deleteSheet.getByRole('button', { name: 'حذف هذا اليوم فقط', exact: true }).click();

  await mainNav.getByRole('button', { name: 'المدرسة', exact: true }).click();
  await expect(page.getByRole('button', { name: 'حضرت', exact: true })).not.toHaveClass(/is-selected/);
  await expect(page.getByLabel('وقت الوصول', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('وقت الخروج', { exact: true })).toHaveValue('');

  await expect.poll(async () => page.evaluate(() => {
    const stored = JSON.parse(localStorage.getItem('routine.school.v1') ?? 'null');
    return stored ? {
      subjects: stored.subjects?.length,
      periods: stored.periods?.length,
      assignments: stored.assignments?.length,
      exams: stored.exams?.length,
      schoolDays: Object.keys(stored.days ?? {}).length,
    } : null;
  })).toEqual({ subjects: 1, periods: 1, assignments: 1, exams: 1, schoolDays: 0 });
});
