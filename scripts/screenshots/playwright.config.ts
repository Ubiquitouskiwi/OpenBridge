import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

/**
 * Captures the screenshots in docs/screenshots/ that the README, docs, and wiki use.
 * Run with `npm run screenshots` (it builds the rule toolkit first). This is not a test suite:
 * the e2e specs in each package are the tests. It only drives the real app with a made-up
 * household and saves pictures.
 */
const root = resolve(import.meta.dirname, '../..');
const PORT = 4174;

export default defineConfig({
  testDir: '.',
  outputDir: resolve(root, 'test-results/screenshots'),
  timeout: 60_000,
  // One worker keeps captures in a stable order and avoids two builds racing.
  workers: 1,
  reporter: 'list',
  use: {
    trace: 'off',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    acceptDownloads: true,
  },
  webServer: {
    // Bind to loopback only (privacy-security.md: local servers stay on localhost).
    command: `npm run build -w @openbridge/web-app && npm run preview -w @openbridge/web-app -- --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}`,
    cwd: root,
    reuseExistingServer: false,
    timeout: 180_000,
  },
  projects: [
    {
      name: 'web-app',
      testMatch: 'web-app.capture.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://127.0.0.1:${PORT}`,
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'rule-toolkit',
      testMatch: 'rule-toolkit.capture.ts',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});
