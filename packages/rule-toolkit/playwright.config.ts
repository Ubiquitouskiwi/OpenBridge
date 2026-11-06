import { defineConfig, devices } from '@playwright/test';

/**
 * E2E for the single-file toolkit. `npm run e2e` builds first, then the specs open
 * `dist/OpenBridge-Rule-Toolkit.html` straight from disk (file://), the way users do. There is
 * no web server.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // In CI, also write playwright-report/ so the workflow can upload it when a test fails.
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  // There are no retries, so keep a trace for every failure (on-first-retry never records).
  use: { trace: 'retain-on-failure', acceptDownloads: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
