import { defineConfig, devices } from '@playwright/test';

/**
 * E2E for the single-file toolkit. `npm run e2e` builds first, then the specs open
 * `dist/OpenBridge-Rule-Toolkit.html` straight from disk (file://), the way users do. There is
 * no web server.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: { trace: 'on-first-retry', acceptDownloads: true },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
