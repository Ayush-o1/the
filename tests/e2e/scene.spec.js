import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { markVisited } from './helpers.js';

// The flight needs WebGL. Only the Chromium project is started with software-GL flags.
test.skip(({ browserName }) => browserName !== 'chromium', 'scene tests run in Chromium');

async function waitForScene(page) {
  await page.waitForSelector('html.scene', { timeout: 20_000 });
}

async function scrollToSection(page, id) {
  await page.evaluate((target) => {
    const rect = document.getElementById(target).getBoundingClientRect();
    window.scrollTo({
      top: window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2,
      behavior: 'instant',
    });
  }, id);
}

test.describe('with a returning visitor', () => {
  test.beforeEach(async ({ page }) => {
    await markVisited(page);
  });

  test('the flight starts, the canvas is hidden from screen readers and the console is clean', async ({
    page,
  }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
    await page.goto('/');
    await waitForScene(page);
    await expect(page.locator('canvas.scene-canvas')).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('.hud-sector')).toHaveText('Launch');
    expect(errors).toEqual([]);
  });

  test('the HUD sector label and live region follow the scroll, forwards and back', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForScene(page);
    await scrollToSection(page, 'blackwater');
    await expect(page.locator('.hud-sector')).toHaveText('M2 BlackWater');
    await expect(page.locator('[aria-live="polite"]')).toContainText('M2 BlackWater');
    await scrollToSection(page, 'contact');
    await expect(page.locator('.hud-sector')).toHaveText('Contact');
    await scrollToSection(page, 'launch');
    await expect(page.locator('.hud-sector')).toHaveText('Launch');
  });

  test('flight path dots are links and moving to one focuses its heading', async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await expect(page.locator('.hud-path__link')).toHaveCount(6);
    await page.locator('.hud-path__link').nth(1).click();
    await expect(page.locator('#blackwater-title')).toBeFocused();
  });

  test('the L key switches to lite and back, and removes and restores the canvas', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForScene(page);
    await page.keyboard.press('l');
    await expect(page.locator('html')).toHaveClass(/lite/);
    await expect(page.locator('canvas.scene-canvas')).toHaveCount(0);
    await expect(page.locator('.hud-path')).toHaveCount(0);
    await expect(page.locator('#argus .dossier__objective')).toBeVisible();
    await page.keyboard.press('l');
    await waitForScene(page);
    await expect(page.locator('canvas.scene-canvas')).toHaveCount(1);
    await expect(page.locator('html')).not.toHaveClass(/lite/);
  });

  test('a lost graphics context falls back to lite and keeps the content', async ({ page }) => {
    await page.goto('/');
    await waitForScene(page);
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas.scene-canvas');
      canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();
    });
    await expect(page.locator('html')).toHaveClass(/lite/);
    await expect(page.locator('canvas.scene-canvas')).toHaveCount(0);
    await expect(page.locator('#europa .dossier__objective')).toBeVisible();
  });

  test('resizing and scrubbing mid-flight causes no errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.goto('/');
    await waitForScene(page);
    for (const id of ['argus', 'europa', 'crew', 'belt', 'contact', 'launch']) {
      await scrollToSection(page, id);
      await page.setViewportSize({ width: id === 'crew' ? 390 : 1280, height: 800 });
    }
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test('?debug shows stats within the draw-call and triangle budgets', async ({ page }) => {
    await page.goto('/?debug');
    await waitForScene(page);
    await expect(page.locator('.debug')).toContainText('draw calls', { timeout: 5000 });
    const text = await page.locator('.debug').textContent();
    expect(Number(text.match(/draw calls (\d+)/)[1])).toBeLessThanOrEqual(200);
    expect(Number(text.match(/triangles (\d+)/)[1])).toBeLessThanOrEqual(300_000);
  });

  for (const size of [
    { width: 360, height: 740 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    test(`axe finds no violations in flight mode at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await waitForScene(page);
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
    });
  }
});

test('reduced motion starts lite with no canvas', async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();
  await markVisited(page);
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lite/);
  await expect(page.locator('canvas.scene-canvas')).toHaveCount(0);
  await context.close();
});

test('without WebGL 2 the page starts lite and hides the flight toggle', async ({ page }) => {
  await markVisited(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
      return type === 'webgl2' ? null : original.call(this, type, ...rest);
    };
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/lite/);
  await expect(page.locator('[data-mode-toggle]')).toHaveCount(0);
});

test('first visit: boot lines, any key skips, role chooser, choice is remembered', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.boot')).toBeVisible();
  await expect(page.locator('.boot__text')).toContainText('AK-01 FLIGHT COMPUTER');
  await page.keyboard.press('x');
  await expect(page.locator('.boot')).toHaveCount(0);
  const role = page.locator('#role');
  await expect(role).toBeVisible();
  await role.getByRole('button', { name: /Engineer/ }).click();
  await expect(role).toBeHidden();
  await expect(page.locator('#argus [data-recorder]')).toHaveJSProperty('open', true);

  await page.reload();
  await expect(page.locator('.boot')).toHaveCount(0);
  await expect(page.locator('#role')).toBeHidden();
  await expect(page.locator('#argus [data-recorder]')).toHaveJSProperty('open', true);
});

test('Esc skips the role chooser', async ({ page }) => {
  await page.goto('/?lite=1');
  await expect(page.locator('#role')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#role')).toBeHidden();
  await expect(page.locator('html')).toHaveAttribute('data-role', 'curious');
});
