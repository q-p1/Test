import { expect, test } from '@playwright/test';

test('uses precise device location for prayer times and exact iqama countdown delays', async ({ context, page }) => {
  const origin = 'http://127.0.0.1:4173';
  await context.grantPermissions(['geolocation'], { origin });
  await context.setGeolocation({ latitude: 24.7136123, longitude: 46.6753123, accuracy: 18 });

  await page.goto('/');

  const locationBar = page.locator('.prayer-location-bar');
  await expect(locationBar).toContainText('حسب موقعك الدقيق الحالي');
  await expect(locationBar).not.toContainText('أم القرى');

  const countdown = page.locator('.prayer-countdown');
  await expect(countdown).toBeVisible();
  await expect(countdown).toContainText(/متبقّي (للأذان|للإقامة)/);
  await expect(countdown.locator('time')).toHaveText(/^\d{2}:\d{2}:\d{2}$/);

  const prayerSection = page.locator('.prayer-section');
  await expect(prayerSection.getByText('بعد 25 د', { exact: false })).toHaveCount(1);
  await expect(prayerSection.getByText('بعد 20 د', { exact: false })).toHaveCount(3);
  await expect(prayerSection.getByText('بعد 15 د', { exact: false })).toHaveCount(1);

  const prayerTimelineItems = page.locator('.timeline-item').filter({ hasText: 'الأذان → الإقامة' });
  await expect(prayerTimelineItems).toHaveCount(5);

  const cached = await page.evaluate(() => JSON.parse(localStorage.getItem('routine.prayer.location.v1') ?? 'null'));
  expect(cached).toMatchObject({ latitude: 24.7136123, longitude: 46.6753123, accuracy: 18 });

  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(hasOverflow).toBe(false);
});

test('warns when iPhone provides only an approximate location', async ({ context, page }) => {
  const origin = 'http://127.0.0.1:4173';
  await context.grantPermissions(['geolocation'], { origin });
  await context.setGeolocation({ latitude: 24.7136, longitude: 46.6753, accuracy: 5_000 });

  await page.goto('/');

  const locationBar = page.locator('.prayer-location-bar');
  await expect(locationBar).toContainText('الموقع وصل بشكل تقريبي');
  await expect(locationBar).toContainText('الموقع الدقيق');
});
