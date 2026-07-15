import { expect, test } from '@playwright/test';

test('M0 empty shell opens', async ({ page }) => {
  const response = await page.goto('./');

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/OriDesign/u);
  await expect(page.getByTestId('m0-shell')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'OriDesign' })).toBeVisible();
});
