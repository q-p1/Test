import { expect, test } from '@playwright/test';

const storageKey = 'routine.app.state';

test('Qudurat uses an editable time goal and countdown instead of a question target', async ({ page }) => {
  await page.goto('/');

  const card = page.getByTestId('qudurat-session');
  await expect(card.getByText('هدف اليوم', { exact: true })).toBeVisible();

  const targetInput = card.getByLabel('هدف القدرات بالدقائق', { exact: true });
  await targetInput.fill('45');
  await targetInput.press('Enter');
  await expect(card.getByLabel('هدف القدرات بالدقائق', { exact: true })).toHaveValue('45');
  await expect(card.getByRole('button', { name: '45 د', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const date = Object.keys(state.days).sort().at(-1)!;
    state.days[date].sessions.qudurat = {
      status: 'paused',
      accumulatedMs: 15 * 60_000,
      startedAt: null,
      completedAt: null,
    };
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);

  await page.reload();
  const restored = page.getByTestId('qudurat-session');
  await expect(restored.getByLabel('هدف القدرات بالدقائق', { exact: true })).toHaveValue('45');
  await expect(restored.getByLabel('هدف القدرات اليومي').locator('.accuracy-tile strong')).toHaveText('30:00');
  await expect(page.locator('.metric-card').filter({ hasText: 'القدرات' })).toContainText('متبقي 30:00');
});
