import { expect, test, type Page } from '@playwright/test';

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

type SensitiveApiSpyState = Readonly<{
  calls: readonly string[];
  installed: readonly string[];
}>;

async function installSensitiveApiSpies(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const calls: string[] = [];
    const installed: string[] = [];
    const spyState = { calls, installed };
    Object.defineProperty(window, '__m0fDiagnosticSensitiveApiSpyState', {
      configurable: false,
      enumerable: false,
      value: spyState,
      writable: false,
    });

    const wrapMethod = (target: unknown, key: string, label: string): void => {
      if ((typeof target !== 'object' || target === null) && typeof target !== 'function') return;
      const record = target as Record<string, unknown>;
      const original = record[key];
      if (typeof original !== 'function') return;
      try {
        const wrapped = function (this: unknown, ...arguments_: unknown[]): unknown {
          calls.push(label);
          return Reflect.apply(original, this, arguments_) as unknown;
        };
        record[key] = wrapped;
        if (record[key] === wrapped) installed.push(label);
      } catch {
        // An unavailable or non-writable browser API cannot be used by this page either.
      }
    };

    wrapMethod(Storage.prototype, 'setItem', 'storage.setItem');
    wrapMethod(Storage.prototype, 'removeItem', 'storage.removeItem');
    wrapMethod(Storage.prototype, 'clear', 'storage.clear');
    wrapMethod(IDBFactory.prototype, 'open', 'indexedDB.open');
    wrapMethod(IDBFactory.prototype, 'deleteDatabase', 'indexedDB.deleteDatabase');
    wrapMethod(URL, 'createObjectURL', 'url.createObjectURL');
    wrapMethod(URL, 'revokeObjectURL', 'url.revokeObjectURL');
    wrapMethod(HTMLAnchorElement.prototype, 'click', 'anchor.click');

    const optionalConstructors = globalThis as unknown as Record<string, unknown>;
    const clipboard = optionalConstructors.Clipboard;
    if (typeof clipboard === 'function') {
      wrapMethod(clipboard.prototype, 'write', 'clipboard.write');
      wrapMethod(clipboard.prototype, 'writeText', 'clipboard.writeText');
    }
    const cacheStorage = optionalConstructors.CacheStorage;
    if (typeof cacheStorage === 'function') {
      wrapMethod(cacheStorage.prototype, 'open', 'cacheStorage.open');
      wrapMethod(cacheStorage.prototype, 'delete', 'cacheStorage.delete');
    }
    const fileHandle = optionalConstructors.FileSystemFileHandle;
    if (typeof fileHandle === 'function') {
      wrapMethod(fileHandle.prototype, 'createWritable', 'fileSystem.createWritable');
    }
    wrapMethod(window, 'showOpenFilePicker', 'fileSystem.showOpenFilePicker');
    wrapMethod(window, 'showSaveFilePicker', 'fileSystem.showSaveFilePicker');
    wrapMethod(window, 'showDirectoryPicker', 'fileSystem.showDirectoryPicker');
  });
}

test('production diagnostics use only static requests and no persistence or export APIs', async ({
  baseURL,
  page,
}) => {
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

  await installSensitiveApiSpies(page);

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
  await page.getByRole('button', { name: '候補JSONを表示' }).click();
  await expect(page.getByTestId('m0f-candidate-fold-preview-status')).toContainText(
    '読み取り専用の候補JSONを表示しました',
  );
  await page.waitForLoadState('networkidle');

  const sensitiveApiState = await page.evaluate(
    () =>
      (window as unknown as Record<string, SensitiveApiSpyState>)
        .__m0fDiagnosticSensitiveApiSpyState,
  );
  if (sensitiveApiState === undefined) {
    throw new Error('diagnostic sensitive API spies were not installed');
  }

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
  expect(sensitiveApiState.installed).toEqual(
    expect.arrayContaining([
      'storage.setItem',
      'storage.removeItem',
      'storage.clear',
      'indexedDB.open',
      'indexedDB.deleteDatabase',
      'url.createObjectURL',
      'url.revokeObjectURL',
      'anchor.click',
    ]),
  );
  expect(sensitiveApiState.calls, 'persistence, export, or clipboard API calls').toEqual([]);
});
