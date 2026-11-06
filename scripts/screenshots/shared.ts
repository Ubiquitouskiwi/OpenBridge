import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Locator, Page } from '@playwright/test';

/** Where every capture lands. The README, docs/, and wiki/ link to these files by name. */
export const SHOTS_DIR = resolve(import.meta.dirname, '../../docs/screenshots');
mkdirSync(SHOTS_DIR, { recursive: true });

/**
 * A fixed clock so dates in the pictures (and the rules picked for that date) do not change
 * from one run to the next. Any date inside the current federal tables works.
 */
export const CAPTURE_DATE = new Date('2026-03-02T10:00:00-05:00');

/**
 * Hides the blinking text cursor and stops focus and hover transitions mid-fade, so re-runs
 * produce the same pixels.
 */
const STEADY_CSS =
  '*, *::before, *::after { caret-color: transparent !important; transition: none !important; }';

export async function prepare(page: Page): Promise<void> {
  await page.clock.setFixedTime(CAPTURE_DATE);
  await page.addInitScript((css) => {
    document.addEventListener('DOMContentLoaded', () => {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    });
  }, STEADY_CSS);
}

/** Saves the whole page (or just the viewport) as docs/screenshots/<name>.png. */
export async function shoot(page: Page, name: string, fullPage = true): Promise<void> {
  await page.evaluate(async () => {
    (document.activeElement as HTMLElement | null)?.blur();
    await document.fonts.ready;
  });
  // Let React finish the render that the last action started.
  await page.waitForLoadState('networkidle');
  await page.screenshot({
    path: resolve(SHOTS_DIR, `${name}.png`),
    fullPage,
    animations: 'disabled',
  });
}

/** Scrolls so `target` sits near the top, then saves what fits on one screen. */
export async function shootFrom(page: Page, target: Locator, name: string): Promise<void> {
  await target.evaluate((el) => {
    el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -24);
  });
  await shoot(page, name, false);
}

/** Saves one part of the page. */
export async function shootPart(target: Locator, name: string): Promise<void> {
  await target.scrollIntoViewIfNeeded();
  await target.screenshot({ path: resolve(SHOTS_DIR, `${name}.png`), animations: 'disabled' });
}
