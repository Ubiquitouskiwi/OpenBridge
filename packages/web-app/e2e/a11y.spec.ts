import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/** Automated accessibility checks on key screens (task 13.2, WCAG 2.2 AA target). */
const pages = ['/', '/screen', '/help', '/resume', '/terms'];

for (const path of pages) {
  test(`no serious axe violations on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious).toEqual([]);
  });
}
