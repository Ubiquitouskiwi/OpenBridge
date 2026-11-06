import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, test } from '@playwright/test';
import { prepare, shoot } from './shared.js';

/**
 * Screenshots of the community rule toolkit, opened from disk the way people use it.
 * `npm run screenshots` builds it first. The reviewer name and source are made up.
 */
const root = resolve(import.meta.dirname, '../..');
const toolkitUrl = pathToFileURL(
  resolve(root, 'packages/rule-toolkit/dist/OpenBridge-Rule-Toolkit.html'),
).href;
const sampleFixture = resolve(root, 'data/states/oh/fixtures/family-with-children.json');

test.beforeEach(async ({ page }) => {
  await prepare(page);
  await page.goto(toolkitUrl);
  await expect(
    page.getByRole('heading', { level: 1, name: 'OpenBridge Rule Toolkit' }),
  ).toBeVisible();
});

test('home', async ({ page }) => {
  await shoot(page, 'toolkit-home');
});

test('review a state', async ({ page }) => {
  await page.getByRole('button', { name: "Open Review a state's rules" }).click();
  await page.getByLabel('State').selectOption('OH');
  const gross = page.getByRole('group', { name: 'Income limit before deductions' });
  await gross.getByLabel('Matches the source').check();
  await gross.getByLabel('Note (optional)').fill('Checked against the published table.');
  await page.getByLabel('Your name').fill('Pat Example');
  await page.evaluate(() => window.scrollTo(0, 0));
  await shoot(page, 'toolkit-review', false);
});

test('propose a change', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Propose a rule change' }).click();
  await page.getByLabel('State').selectOption('OH');
  await page.getByLabel('Program').selectOption('tanf');
  await page.getByLabel('Rule value').selectOption('tanf.baseMonthlyLimitCents');
  await page.getByLabel('New dollar amount').fill('$650.00');
  await page.getByLabel('Name of the source').fill('Example agency standards table');
  await page.getByLabel('Web address of the source').fill('https://example.org/standards');
  await page.getByLabel('Date the source was published').fill('2025-10-01');
  await page.getByLabel('Why should this change?').fill('This is a made-up example.');
  await expect(page.getByText('Your proposal is ready.')).toBeVisible();
  await shoot(page, 'toolkit-propose');
});

test('check a test case', async ({ page }) => {
  await page.getByRole('button', { name: 'Open Check a test case' }).click();
  await page.getByLabel('Test case file').setInputFiles(sampleFixture);
  await expect(page.getByText(/All \d+ checks pass/)).toBeVisible();
  await shoot(page, 'toolkit-check');
});
