import { expect, test } from '@playwright/test';

test('M0 empty shell opens', async ({ page }) => {
  const response = await page.goto('./');

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/OriDesign/u);
  await expect(page.getByTestId('m0-shell')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'OriDesign' })).toBeVisible();
});

test('M0F candidate diagnostic remains visibly separate from product features', async ({
  page,
}) => {
  await page.goto('./');

  const diagnostic = page.getByTestId('m0f-diagnostic');
  await expect(diagnostic).toBeVisible();
  await expect(diagnostic.getByRole('heading', { name: '製品移行 readiness' })).toBeVisible();
  await expect(page.getByTestId('m0f-diagnostic-status')).toHaveText(/NOT READY/u);
  await expect(page.getByTestId('m0f-blocking-areas')).toHaveText('10 / 10');
  await expect(page.getByTestId('m0f-unmet-go-conditions')).toHaveText('14 / 14');
  await expect(page.getByTestId('m0f-unmet-deliverables')).toHaveText('14 / 14');
  await expect(page.getByTestId('m0f-missing-fixtures')).toHaveText('27');
  await expect(page.getByTestId('m0f-product-authorization')).toContainText('製品実装開始：未承認');
  await expect(diagnostic).toContainText('最終GO / NO-GO判定でもありません');
});
