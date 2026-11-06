import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const here = import.meta.dirname;
const toolkitUrl = pathToFileURL(resolve(here, '../dist/OpenBridge-Rule-Toolkit.html')).href;
const repoFixture = resolve(here, '../../../data/states/oh/fixtures/family-with-children.json');

/** Every request the page makes, so a test can prove nothing leaves the device. */
const requests = new Map<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const seen: string[] = [];
  requests.set(page, seen);
  page.on('request', (request) => seen.push(request.url()));
  await page.goto(toolkitUrl);
  await expect(
    page.getByRole('heading', { level: 1, name: 'OpenBridge Rule Toolkit' }),
  ).toBeVisible();
});

test.afterEach(async ({ page }) => {
  // Privacy: the only loads allowed are the file itself and in-memory data/blob URLs.
  const outside = (requests.get(page) ?? []).filter((url) => !/^(file|data|blob):/.test(url));
  expect(outside).toEqual([]);
});

async function expectNoSeriousAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious).toEqual([]);
}

test('home screen passes axe and stores nothing', async ({ page }) => {
  await expectNoSeriousAxeViolations(page);
  const stored = await page.evaluate(() => ({
    cookie: document.cookie,
    local: (() => {
      try {
        return window.localStorage.length;
      } catch {
        return 0;
      }
    })(),
  }));
  expect(stored).toEqual({ cookie: '', local: 0 });
});

test('review a state and download the report', async ({ page }) => {
  await page.getByRole('button', { name: "Open Review a state's rules" }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: "Review a state's rules" }),
  ).toBeFocused();
  await page.getByLabel('State').selectOption('OH');
  const gross = page.getByRole('group', { name: 'Income limit before deductions' });
  await expect(gross.getByText('130% of the poverty line')).toBeVisible();
  await gross.getByLabel('Matches the source').check();
  await gross.getByLabel('Note (optional)').fill('Checked against the 2024 table.');
  await expect(page.getByText(/^1 of \d+ checked$/)).toBeVisible();
  await page.getByLabel('Your name').fill('Pat Example');
  await expectNoSeriousAxeViolations(page);

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download report' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^openbridge-review-oh-\d{4}-\d{2}-\d{2}\.md$/);
  const text = readFileSync(await file.path(), 'utf8');
  expect(text).toContain('# OpenBridge rule review: Ohio');
  expect(text).toContain('- Reviewer: Pat Example');
  expect(text).toContain('| Matches the source |');
  await expect(page.getByRole('status').filter({ hasText: 'Saved.' })).toBeVisible();
});

test('propose a rule change and download the proposal', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Propose a rule change' }).click();
  await page.getByLabel('State').selectOption('OH');
  await page.getByLabel('Program').selectOption('tanf');
  await page.getByLabel('Rule value').selectOption('tanf.baseMonthlyLimitCents');
  await expect(page.getByText('$600.00')).toBeVisible();
  await page.getByLabel('New dollar amount').fill('$650.50');
  await page.getByLabel('Name of the source').fill('Ohio Works First standards');
  await page.getByLabel('Web address of the source').fill('https://example.org/owf');
  await page.getByLabel('Date the source was published').fill('2025-10-01');
  await page.getByLabel('Why should this change?').fill('The 2025 table raised the limit.');
  await expect(page.getByText('Your proposal is ready.')).toBeVisible();
  await expectNoSeriousAxeViolations(page);

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download proposal file' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^openbridge-proposal-oh-\d{4}-\d{2}-\d{2}\.json$/);
  const proposal = JSON.parse(readFileSync(await file.path(), 'utf8')) as Record<string, unknown>;
  expect(proposal).toMatchObject({
    format: 'openbridge.rule-proposal.v1',
    stateCode: 'OH',
    changes: [{ field: 'tanf.baseMonthlyLimitCents', currentValue: 60000, proposedValue: 65050 }],
    source: {
      sourceName: 'Ohio Works First standards',
      url: 'https://example.org/owf',
      publishedDate: '2025-10-01',
    },
    createdWith: 'openbridge-rule-toolkit 0.1.0',
  });
});

test('check a repo test case and see every row pass', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Check a test case' }).click();
  await expectNoSeriousAxeViolations(page);
  await page.getByLabel('Test case file').setInputFiles(repoFixture);
  await expect(page.getByText('All 7 checks pass with the current Ohio rules.')).toBeVisible();
  await expect(page.getByText('Pass', { exact: true })).toHaveCount(7);
  await expect(page.getByText('Mismatch', { exact: true })).toHaveCount(0);
  await page.getByText('Show the math').first().click();
  await expect(page.getByRole('table').first()).toBeVisible();
  await expectNoSeriousAxeViolations(page);
});

test('works at 320 pixels wide', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.getByRole('button', { name: "Open Review a state's rules" }).click();
  await page.getByLabel('State').selectOption('TX');
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scroll).toBeLessThanOrEqual(320);
});
