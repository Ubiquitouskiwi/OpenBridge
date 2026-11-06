import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config (requirement 5.x, tasks §13). Builds and previews the app, then runs specs.
 * Run locally with: `npx playwright install` once, then `npm run e2e -w @openbridge/web-app`.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  // In CI, also write playwright-report/ so the workflow can upload it when a test fails.
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    // There are no retries, so keep a trace for every failure (on-first-retry never records).
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
