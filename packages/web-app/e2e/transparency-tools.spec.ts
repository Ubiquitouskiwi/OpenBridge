import { readFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { expectNoSeriousAxeViolations, screenSampleHousehold } from './helpers.js';

/** Show the math, the what-if tool, and the rule-reviewer fixture recorder. */
test('show the math expands on a program detail page', async ({ page }) => {
  await screenSampleHousehold(page);
  await page.getByRole('link', { name: /^SNAP/ }).click();
  await page.getByText('Show the math', { exact: true }).click();
  const table = page.getByRole('table', { name: 'How we worked out this result' });
  await expect(table).toBeVisible();
  await expect(table.getByRole('rowheader', { name: 'Monthly income limit' })).toBeVisible();
  await expect(table.getByText('Limit:', { exact: false }).first()).toBeVisible();
  await expectNoSeriousAxeViolations(page);

  await page.getByRole('link', { name: /Your results/ }).click();
  await page.getByRole('link', { name: /^Medicaid/ }).click();
  await page.getByText(/^Show the math for Person 1/).click();
  await expect(page.getByRole('table', { name: 'How we worked out this result' })).toBeVisible();
  await expectNoSeriousAxeViolations(page);
});

test('what-if tool shows changes and where things may change', async ({ page }) => {
  await screenSampleHousehold(page);
  await page.getByRole('link', { name: 'What if my income changes?' }).click();
  await expect(page.getByRole('heading', { name: 'What if my income changes?' })).toBeVisible();
  await page.getByRole('button', { name: '$250 more' }).click();
  await expect(page.getByRole('status').filter({ hasText: '$250 more each month' })).toBeVisible();
  const table = page.getByRole('table', { name: 'Your results now and with this change' });
  await expect(table.getByRole('rowheader', { name: /^SNAP/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Where things may change' })).toBeVisible();
  await expect(page.getByText(/talk with a navigator or the agency/)).toBeVisible();
  expect(page.url()).not.toContain('250');
  await expectNoSeriousAxeViolations(page);
});

test('review page gates the download behind the made-up confirmation', async ({ page }) => {
  await screenSampleHousehold(page);
  await page.getByRole('link', { name: /save this as a test case/ }).click();
  const download = page.getByRole('button', { name: 'Download test case' });
  await page.getByLabel(/Test case name/).fill('Single adult, part-time work');
  await expect(download).toBeDisabled();
  await expectNoSeriousAxeViolations(page);

  await page.getByLabel(/This family is made up/).check();
  await expect(download).toBeEnabled();
  const [file] = await Promise.all([page.waitForEvent('download'), download.click()]);
  expect(file.suggestedFilename()).toBe('single-adult-part-time-work.json');
  const fixture = JSON.parse(await readFile(await file.path(), 'utf8')) as Record<string, unknown>;
  expect(fixture.name).toBe('Single adult, part-time work');
  expect(fixture).toHaveProperty('expected.snap');
  expect(fixture.profile).not.toHaveProperty('grossMonthlyIncomeCents');
  await expect(page.getByRole('status').filter({ hasText: 'Saved' })).toBeVisible();
});
