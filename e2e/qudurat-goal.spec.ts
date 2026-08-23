import { expect, test } from '@playwright/test';

const storageKey = 'routine.app.state';

test('Qudurat daily goal is time-based, editable, and persists', async ({ page }) => {
  await page.goto('/');

  const qudurat = page.getByTestId('qudurat-session');
  const goal = qudurat.getByTestId('qudurat-goal');
  const input = goal.getByLabel('مدة هدف القدرات بالدقائق');

  await expect(goal).toBeVisible();
  await goal.getByRole('button', { name: '60 د', exact: true }).click();
  await expect(input).toHaveValue('60');

  await input.fill('');
  await input.fill('75');
  await input.press('Enter');
  await expect(input).toHaveValue('75');

  const savedTarget = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).settings.quduratTargetMinutes, storageKey);
  expect(savedTarget).toBe(75);

  await qudurat.getByRole('button', { name: /بدء/ }).click();
  await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    const date = Object.keys(state.days).sort().at(-1)!;
    state.days[date].sessions.qudurat.startedAt = Date.now() - 30 * 60_000;
    localStorage.setItem(key, JSON.stringify(state));
  }, storageKey);

  await page.reload();

  const restoredGoal = page.getByTestId('qudurat-session').getByTestId('qudurat-goal');
  await expect(restoredGoal.getByLabel('مدة هدف القدرات بالدقائق')).toHaveValue('75');
  await expect(restoredGoal).toContainText('باقي');

  const metric = page.locator('.metric-card').filter({ hasText: 'القدرات' });
  await expect(metric).toContainText('30/75 د');
});
