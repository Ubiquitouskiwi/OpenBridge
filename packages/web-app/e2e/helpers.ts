import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Screens a made-up Ohio household (one adult, $1,200 a month) and lands on results. */
export async function screenSampleHousehold(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByLabel(/^State/).selectOption('OH');
  await page.getByLabel(/^County/).fill('Franklin');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Add a person' }).click();
  await page.getByLabel(/Age \(if/).fill('30');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Add income' }).click();
  await page.getByLabel('Amount (before taxes)').fill('1200');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'See my results' }).click();
  await expect(page.getByRole('heading', { name: 'Your results' })).toBeVisible();
}

/** Same bar as a11y.spec.ts: no serious or critical WCAG 2.x A/AA violations. */
export async function expectNoSeriousAxeViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious).toEqual([]);
}
