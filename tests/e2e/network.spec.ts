import { expect, test } from '@playwright/test';

const STATIC_RESOURCE_TYPES = new Set(['document', 'font', 'image', 'script', 'stylesheet']);
const STATIC_ASSET_PATH = /\.(?:avif|css|gif|ico|jpe?g|js|png|svg|webp|woff2?)$/iu;

interface ObservedRequest {
  readonly url: string;
  readonly resourceType: string;
}

interface FailedRequest {
  readonly url: string;
  readonly errorText: string;
}

test('production shell performs only same-origin static requests', async ({ baseURL, page }) => {
  if (!baseURL) throw new Error('Playwright baseURL is required for the network policy test.');

  const expectedUrl = new URL(baseURL);
  const expectedOrigin = expectedUrl.origin;
  const expectedPathPrefix = expectedUrl.pathname.endsWith('/')
    ? expectedUrl.pathname
    : `${expectedUrl.pathname}/`;
  const requests: ObservedRequest[] = [];
  const failedRequests: FailedRequest[] = [];
  const errorResponses: { url: string; status: number }[] = [];
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const webSockets: string[] = [];

  page.on('request', (request) => {
    requests.push({ url: request.url(), resourceType: request.resourceType() });
  });
  page.on('requestfailed', (request) => {
    failedRequests.push({
      url: request.url(),
      errorText: request.failure()?.errorText ?? 'unknown request failure',
    });
  });
  page.on('response', (response) => {
    if (response.status() >= 400) {
      errorResponses.push({ url: response.url(), status: response.status() });
    }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('websocket', (socket) => webSockets.push(socket.url()));

  await page.goto('./');
  await page.getByRole('button', { name: '候補診断を実行' }).click();
  await expect(page.getByTestId('m0f-diagnostic-run-result')).toContainText(
    'ブラウザ内評価が完了しました',
  );
  await page.waitForLoadState('networkidle');

  const externalRequests = requests.filter(({ url }) => new URL(url).origin !== expectedOrigin);
  const outsideBasePathRequests = requests.filter(({ url }) => {
    const requestUrl = new URL(url);
    return (
      requestUrl.origin === expectedOrigin && !requestUrl.pathname.startsWith(expectedPathPrefix)
    );
  });
  const nonStaticRequests = requests.filter(({ resourceType, url }) => {
    if (STATIC_RESOURCE_TYPES.has(resourceType)) return false;
    return resourceType !== 'other' || !STATIC_ASSET_PATH.test(new URL(url).pathname);
  });

  expect(
    requests.length,
    'at least the document and bundled assets were requested',
  ).toBeGreaterThan(1);
  expect(externalRequests, 'external-origin requests').toEqual([]);
  expect(outsideBasePathRequests, 'requests outside the configured Pages base path').toEqual([]);
  expect(nonStaticRequests, 'same-origin requests that are not static assets').toEqual([]);
  expect(failedRequests, 'failed network requests').toEqual([]);
  expect(errorResponses, 'HTTP error responses').toEqual([]);
  expect(pageErrors, 'uncaught page errors').toEqual([]);
  expect(consoleErrors, 'browser console errors').toEqual([]);
  expect(webSockets, 'WebSocket connections').toEqual([]);
});
