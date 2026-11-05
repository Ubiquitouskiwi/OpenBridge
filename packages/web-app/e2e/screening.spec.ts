import { test, expect } from '@playwright/test';

/** Full screening flow across the intake wizard to results (task 13.1). */
test('individual can screen and reach results', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'OpenBridge' })).toBeVisible();

  await page.getByRole('button', { name: 'Start', exact: true }).click();

  // Location
  await page.getByLabel(/^State/).selectOption('OH');
  await page.getByLabel(/^County/).fill('Franklin');
  await page.getByRole('button', { name: 'Next' }).click();

  // Household
  await page.getByRole('button', { name: 'Add a person' }).click();
  await page.getByLabel(/Age \(if/).fill('30');
  await page.getByRole('button', { name: 'Next' }).click();

  // Income
  await page.getByRole('button', { name: 'Add income' }).click();
  await page.getByLabel('Amount (before taxes)').fill('1200');
  await page.getByRole('button', { name: 'Next' }).click();

  // Expenses (optional) -> review
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'See my results' }).click();

  await expect(page.getByRole('heading', { name: 'Your results' })).toBeVisible();
  await expect(page.getByRole('heading', { name: /SNAP/ })).toBeVisible();
});

test('language can be switched to Spanish', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Language', { exact: true }).selectOption('es');
  await expect(page.getByRole('button', { name: 'Comenzar' })).toBeVisible();
});

test('clear-data button returns to the welcome screen', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByRole('button', { name: /Clear my data/ }).click();
  await expect(page.getByRole('heading', { name: 'OpenBridge' })).toBeVisible();
});
