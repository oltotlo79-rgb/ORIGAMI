import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_M0F_BASE_URL ?? 'http://127.0.0.1:43118';
const previewPort = new URL(baseURL).port || '43118';

export default defineConfig({
  testDir: './tests/e2e-m0f',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${previewPort} --strictPort`,
    url: `${baseURL}/tests/browser-harness/m0f-worker.html`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'edge', use: { ...devices['Desktop Edge'], channel: 'msedge' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
