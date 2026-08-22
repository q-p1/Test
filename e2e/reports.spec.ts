import { expect, test } from '@playwright/test';

test('ending a day opens daily delivery choices and Friday adds the Saturday-to-Friday weekly report', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('اختر التاريخ', { exact: true }).fill('2026-08-21');

  await page.getByRole('button', { name: 'بدأ يومي', exact: true }).click();
  await page.getByLabel('وقت النوم', { exact: true }).fill('22:30');
  await page.getByRole('button', { name: 'انتهى يومي', exact: true }).click();

  const dialog = page.getByRole('dialog', { name: 'تقرير نهاية اليوم' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'صورة', exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'نص', exact: true })).toBeVisible();
  await expect(dialog.getByLabel('معاينة تقرير اليوم')).toBeVisible();

  const kinds = dialog.getByRole('navigation', { name: 'نوع التقرير' });
  await expect(kinds).toBeVisible();
  await kinds.getByRole('button', { name: 'الأسبوع', exact: true }).click();
  await expect(dialog.getByLabel('معاينة تقرير الأسبوع')).toBeVisible();
  await expect(dialog).toContainText('تقرير الأسبوع');
  await page.screenshot({ path: 'visual-qa/end-day-weekly-report.png', fullPage: false });

  await dialog.getByRole('button', { name: 'إغلاق النافذة', exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'عرض تقرير اليوم', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'عرض تقرير اليوم', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'تقرير نهاية اليوم' })).toBeVisible();

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow).toBe(false);
});
