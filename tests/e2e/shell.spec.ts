import { expect, test } from '@playwright/test';

test('M0 shell opens', async ({ page }) => {
  const response = await page.goto('./');

  expect(response?.ok()).toBe(true);
  await expect(page).toHaveTitle(/OriDesign/u);
  await expect(page.getByTestId('m0-shell')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1, name: 'OriDesign' })).toBeVisible();
});

test('M0F candidate diagnostic remains separate and runs only its bundled input', async ({
  page,
}) => {
  await page.goto('./');

  const diagnostic = page.getByTestId('m0f-diagnostic');
  await expect(diagnostic).toBeVisible();
  await expect(
    diagnostic.getByRole('heading', { name: '製品引き継ぎ準備状況（候補診断）' }),
  ).toBeVisible();
  await expect(page.getByTestId('m0f-diagnostic-status')).toHaveText(
    '引き継ぎ準備：未完了（診断）',
  );
  await expect(page.getByTestId('m0f-blocking-areas')).toHaveText('10 / 10');
  await expect(page.getByTestId('m0f-unmet-go-conditions')).toHaveText('14 / 14');
  await expect(page.getByTestId('m0f-unmet-deliverables')).toHaveText('14 / 14');
  await expect(page.getByTestId('m0f-missing-canonical-rules')).toHaveText('27');
  await expect(page.getByTestId('m0f-product-authorization')).toContainText('製品実装開始：未承認');
  await expect(diagnostic).toContainText('最終GO / NO-GO判定でもありません');
  await expect(diagnostic).toContainText('外部通信、保存、製品状態の変更は行いません');

  const runResult = page.getByTestId('m0f-diagnostic-run-result');
  await expect(runResult).toContainText('まだ実行していません');
  await diagnostic.getByRole('button', { name: '候補診断を実行' }).click();
  await expect(runResult).toContainText('ブラウザ内評価が完了しました');
  await expect(runResult).toContainText('ブロック領域 10 件');
  await expect(runResult).toContainText('最終判断 not-recorded');
  await expect(runResult).toContainText('製品実装開始 未承認');
});
