import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { markVisited } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await markVisited(page);
});

test.describe('menu', () => {
  test('the Menu button opens the list of places, a link goes there, and Esc returns focus', async ({
    page,
  }) => {
    await page.goto('/?lite=1');
    const button = page.locator('header [data-open-dialog="menu"]');
    await button.click();
    const menu = page.locator('#menu');
    await expect(menu).toBeVisible();
    await menu.getByRole('link', { name: 'Europa' }).click();
    await expect(menu).toBeHidden();
    await expect(page).toHaveURL(/#europa$/);

    await button.focus();
    await page.keyboard.press('Enter');
    await expect(menu).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
  });

  test('M opens the menu, Esc closes it, and M does nothing while typing', async ({ page }) => {
    await page.goto('/?lite=1');
    await page.keyboard.press('m');
    await expect(page.locator('#menu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#menu')).toBeHidden();
    await page.locator('#cf-message').fill('m');
    await expect(page.locator('#menu')).toBeHidden();
  });

  test('the menu opens the summary, which carries real text and three projects', async ({
    page,
  }) => {
    await page.goto('/?lite=1');
    await page.keyboard.press('m');
    await page.locator('#menu').getByRole('button', { name: '60-second summary' }).click();
    const summary = page.locator('#summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('software engineer');
    await expect(summary.locator('ol a')).toHaveCount(3);
    await expect(summary.getByRole('link', { name: 'GitHub' })).toBeVisible();
  });

  test('every control in the header can be reached with Tab', async ({ page, browserName }) => {
    test.skip(browserName === 'webkit', 'WebKit skips buttons when tabbing by default');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?lite=1');
    const reached = new Set();
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(() => document.activeElement?.textContent?.trim());
      reached.add(label);
    }
    for (const name of ['Ayush Kumar', 'Projects', 'About', 'Education', 'Contact', 'Menu']) {
      expect([...reached].some((text) => text?.includes(name))).toBe(true);
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the summary and menu text are in the page, not added by script', async ({ page }) => {
    await page.goto('/?lite=1');
    const summary = await page.locator('#summary').evaluate((el) => el.textContent);
    expect(summary).toContain('software engineer');
    expect(summary).toContain('BlackWater');
    expect(summary).toContain('ayushh.pvt10@gmail.com');
    expect(await page.locator('#menu a').count()).toBeGreaterThanOrEqual(9);
  });
});

test.describe('deep links', () => {
  test('a link with a hash opens at that project', async ({ page }) => {
    await page.goto('/?lite=1#blackwater');
    await expect(page.locator('#blackwater-title')).toBeInViewport();
  });

  test('scrolling updates the address to the section on screen', async ({ page }) => {
    await page.goto('/?lite=1');
    await page.evaluate(() => {
      const rect = document.getElementById('europa').getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + rect.top + 200, behavior: 'instant' });
    });
    await expect(page).toHaveURL(/#europa$/);
  });
});

test.describe('small touches', () => {
  test('the tab title changes when the tab is hidden and comes back', async ({ page }) => {
    await page.goto('/?lite=1');
    const original = await page.title();
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page).toHaveTitle('Still here: Ayush Kumar');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page).toHaveTitle(original);
  });
});

test.describe('sound', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'audio is checked in Chromium');

  test('it is off by default, S turns it on and off, and the choice is saved', async ({ page }) => {
    await page.goto('/?lite=1');
    const button = page.locator('[data-sound-toggle]');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('html')).toHaveAttribute('data-sound', 'off');
    await page.keyboard.press('s');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('html')).toHaveAttribute('data-sound', 'on');
    expect(await page.evaluate(() => localStorage.getItem('ak-sound'))).toBe('on');
    await page.keyboard.press('s');
    await expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => localStorage.getItem('ak-sound'))).toBe('off');
  });
});

for (const size of [
  { width: 360, height: 740 },
  { width: 1440, height: 900 },
]) {
  test(`axe finds no violations with the menu and summary open at ${size.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto('/?lite=1');
    await page.keyboard.press('m');
    let results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
    await page.locator('#menu').getByRole('button', { name: '60-second summary' }).click();
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
  });
}
