import { expect, test, type Page } from '@playwright/test';
import { prepare, shoot, shootFrom, shootPart } from './shared.js';

/**
 * Screenshots of the screening app. Every household here is made up (testing.md: synthetic data
 * only): one adult, age 30, with a 3-year-old child, earning $1,800 a month in Ohio.
 */

test.beforeEach(async ({ page }) => {
  await prepare(page);
});

async function startScreening(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByLabel(/^State/).selectOption('OH');
  await page.getByLabel(/^County/).fill('Franklin');
}

async function fillHousehold(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Add a person' }).click();
  await page
    .getByLabel(/Age \(if/)
    .first()
    .fill('30');
  await page.getByRole('button', { name: 'Add a person' }).click();
  await page
    .getByLabel(/Age \(if/)
    .nth(1)
    .fill('3');
}

async function fillIncome(page: Page, dollars = '1800'): Promise<void> {
  await page.getByRole('button', { name: 'Add income' }).click();
  await page.getByLabel('Amount (before taxes)').fill(dollars);
}

/** Answers every step from the welcome page already on screen and lands on the results. */
async function screenFamilyFromWelcome(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await page.getByLabel(/^State/).selectOption('OH');
  await page.getByLabel(/^County/).fill('Franklin');
  await page.getByRole('button', { name: 'Next' }).click();
  await fillHousehold(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await fillIncome(page);
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'See my results' }).click();
  await expect(page.getByRole('heading', { name: 'Your results' })).toBeVisible();
}

async function screenFamily(page: Page): Promise<void> {
  await page.goto('/');
  await screenFamilyFromWelcome(page);
}

test('welcome', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'OpenBridge' })).toBeVisible();
  await shoot(page, 'welcome', false);
});

test('screening steps', async ({ page }) => {
  await startScreening(page);
  await shoot(page, 'screen-1-location', false);
  await page.getByRole('button', { name: 'Next' }).click();
  await fillHousehold(page);
  await shoot(page, 'screen-2-household');
  await page.getByRole('button', { name: 'Next' }).click();
  await fillIncome(page);
  await shoot(page, 'screen-3-income', false);
  await page.getByRole('button', { name: 'Next' }).click();
  await shoot(page, 'screen-4-expenses', false);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByRole('button', { name: 'See my results' })).toBeVisible();
  await shoot(page, 'screen-5-review');
});

test('results and their parts', async ({ page }) => {
  await screenFamily(page);
  await shoot(page, 'results');
  await shoot(page, 'results-top', false);
  await shootPart(page.locator('.download-forms'), 'results-documents');
  await page.getByText('Save my progress to a file').click();
  await shootPart(page.locator('.save-progress'), 'results-save-progress');
});

test('show the math', async ({ page }) => {
  await screenFamily(page);
  await page.getByRole('link', { name: /^SNAP/ }).click();
  await page.getByText('Show the math', { exact: true }).click();
  await expect(page.getByRole('table', { name: 'How we worked out this result' })).toBeVisible();
  await shoot(page, 'program-snap-show-the-math');
  await shoot(page, 'program-snap-top', false);

  await page.getByRole('link', { name: /Your results/ }).click();
  await page.getByRole('link', { name: /^Medicaid/ }).click();
  await shoot(page, 'program-medicaid-per-person');
});

test('what if my income changes', async ({ page }) => {
  await screenFamily(page);
  await page.getByRole('link', { name: 'What if my income changes?' }).click();
  await page.getByRole('button', { name: '$250 more' }).click();
  await expect(page.getByRole('heading', { name: 'Where things may change' })).toBeVisible();
  await shoot(page, 'what-if');
  await shootFrom(page, page.getByText('Showing your results with $250 more'), 'what-if-changes');
});

test('get help', async ({ page }) => {
  await screenFamily(page);
  await page.getByRole('link', { name: 'Get help' }).first().click();
  await expect(page.getByRole('heading', { name: 'Get help' })).toBeVisible();
  await shoot(page, 'get-help');
});

test('record a test case', async ({ page }) => {
  await screenFamily(page);
  await page.getByRole('link', { name: /save this as a test case/ }).click();
  await page.getByLabel(/Test case name/).fill('Parent and young child, full-time work');
  await page.getByLabel(/This family is made up/).check();
  await shoot(page, 'review-test-case');
});

test('resume from a saved file', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'I have a saved file' }).click();
  await expect(page.getByRole('heading', { name: 'Resume from a saved file' })).toBeVisible();
  await shoot(page, 'resume', false);
});

test('navigator dashboard', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel("I'm helping others (navigator)").check();
  await screenFamilyFromWelcome(page);
  // Use the app's own link: loading /dashboard by URL would reload the page and clear memory.
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('button', { name: 'Screen a new client' }).click();
  await page.getByLabel(/^State/).selectOption('OH');
  await page.getByLabel(/^County/).fill('Franklin');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Add a person' }).click();
  await page.getByLabel(/Age \(if/).fill('67');
  await page.getByRole('button', { name: 'Next' }).click();
  await fillIncome(page, '1400');
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'Next' }).click();
  await page.getByRole('button', { name: 'See my results' }).click();
  await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Navigator dashboard' })).toBeVisible();
  await shoot(page, 'navigator-dashboard', false);
});

test('spanish', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Language', { exact: true }).selectOption('es');
  await expect(page.getByRole('button', { name: 'Comenzar' })).toBeVisible();
  await shoot(page, 'welcome-spanish', false);
});

test('phone size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await screenFamily(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shoot(page, 'phone-results', false);
});
