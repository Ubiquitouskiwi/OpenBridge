import { defineConfig, devices } from '@playwright/test';

/**
 * E2E config (requirement 5.x, tasks §13). Builds and previews the app, then runs specs.
 * Run locally with: `npx playwright install` once, then `npm run e2e -w @openbridge/web-app`.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
