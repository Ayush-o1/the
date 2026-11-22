import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { markVisited } from './helpers.js';

// The flight needs WebGL. Only the Chromium project is started with software-GL flags.
test.skip(({ browserName }) => browserName !== 'chromium', 'scene tests run in Chromium');

async function waitForScene(page) {
  // The software renderer in CI draws every world once before the first frame, which takes a while.
  await page.waitForSelector('html.scene', { timeout: 90_000 });
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
    // Three times the usual time: the flight draws every world before it starts.
    test.slow();
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
    await expect(page.locator('p.visually-hidden[aria-live="polite"]')).toHaveText(
      'Section: Launch',
    );
    expect(errors).toEqual([]);
  });

  test('the HUD sector label and live region follow the scroll, forwards and back', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForScene(page);
    await scrollToSection(page, 'blackwater');
    await expect(page.locator('p.visually-hidden[aria-live="polite"]')).toContainText(
      'M2 BlackWater',
    );
    await scrollToSection(page, 'contact');
    await expect(page.locator('p.visually-hidden[aria-live="polite"]')).toHaveText(
      'Section: Contact',
    );
    await scrollToSection(page, 'launch');
    await expect(page.locator('p.visually-hidden[aria-live="polite"]')).toHaveText(
      'Section: Launch',
    );
  });

  test('the progress line fills as the flight goes on and the menu links reach a project', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForScene(page);
    const fill = page.locator('.hud-progress__fill');
    await expect(fill).toHaveCount(1);
    const start = await fill.evaluate((el) => el.style.transform);
    await scrollToSection(page, 'europa');
    await expect
      .poll(async () => fill.evaluate((el) => parseFloat(el.style.transform.slice(7))), {
        timeout: 45_000,
      })
      .toBeGreaterThan(0.5);
    expect(start).toContain('scaleX');
    await page.keyboard.press('m');
    await page.locator('#menu').getByRole('link', { name: 'BlackWater' }).click();
    await expect(page.locator('#blackwater-title')).toBeFocused();
  });

  test('the header button switches to the plain page and back, and removes and restores the canvas', async ({
    page,
  }) => {
    await page.goto('/');
    await waitForScene(page);
    const toggle = page.locator('[data-mode-toggle]');
    await expect(toggle).toHaveText('Skip the flight');
    await toggle.click();
    await expect(page.locator('html')).toHaveClass(/lite/);
    await expect(toggle).toHaveText('Start the flight');
    await expect(page.locator('canvas.scene-canvas')).toHaveCount(0);
    await expect(page.locator('.hud-progress')).toHaveCount(0);
    await expect(page.locator('#argus .dossier__objective')).toBeVisible();
    await toggle.click();
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
    for (const id of ['argus', 'europa', 'about', 'education', 'contact', 'launch']) {
      await scrollToSection(page, id);
      await page.setViewportSize({ width: id === 'about' ? 390 : 1280, height: 800 });
    }
    await page.waitForTimeout(300);
    expect(errors).toEqual([]);
  });

  test('?debug shows stats within the draw-call and triangle budgets', async ({ page }) => {
    await page.goto('/?debug');
    await waitForScene(page);
    await expect(page.locator('.debug')).toContainText('draw calls', { timeout: 5000 });
    // The overlay refreshes every 250 ms; on a slow machine its first text can still show the
    // warm-up renders. Read it until it shows a flight frame.
    const read = async (name) => {
      const text = await page.locator('.debug').textContent();
      return Number(text.match(new RegExp(`${name} (\\d+)`))[1]);
    };
    await expect.poll(() => read('draw calls'), { timeout: 10_000 }).toBeLessThanOrEqual(200);
    expect(await read('triangles')).toBeLessThanOrEqual(300_000);
  });

  test('a full flight forwards and back leaves no extra GPU memory behind', async ({ page }) => {
    test.setTimeout(420_000);
    // Pin the tier: on a slow machine the adaptive tier would change mid-test and change the counts.
    await page.goto('/?debug&tier=mid');
    await waitForScene(page);
    const read = async () => {
      await page.waitForTimeout(350);
      const text = await page.locator('.debug').textContent();
      return {
        geometries: Number(text.match(/geometries (\d+)/)[1]),
        textures: Number(text.match(/textures (\d+)/)[1]),
        worlds: text.match(/worlds (.*)/)[1],
      };
    };
    const ids = [
      'argus',
      'blackwater',
      'beetlejuice',
      'theredarmy',
      'deadletter',
      'europa',
      'about',
      'education',
      'contact',
    ];
    const route = [...ids, ...ids.slice(0, -1).reverse(), 'launch'];
    let peak = 0;
    async function flyEverywhere() {
      for (const id of route) {
        await scrollToSection(page, id);
        await page.waitForTimeout(500);
        peak = Math.max(peak, (await read()).geometries);
      }
      await expect.poll(async () => (await read()).worlds, { timeout: 60_000 }).toBe('earth');
    }

    // The first flight uploads things that are created lazily (the jump tunnel, for example). On a
    // slow machine a frame may even skip one of them, so two warm-up flights come first. After
    // that, a further flight must end exactly where the previous one did.
    await flyEverywhere();
    await flyEverywhere();
    const before = await read();
    await flyEverywhere();
    const after = await read();
    expect(after.geometries).toBe(before.geometries);
    expect(after.textures).toBe(before.textures);
    // No world piles up: even at the busiest moment the count stays well below "everything at once".
    expect(peak).toBeLessThan(60);
  });

  // The only image files the flight fetches are the six planet maps (NASA and USGS imagery), and
  // only on tiers that use them. No models, no HDR environments, nothing else.
  const MAPS = ['earth-day', 'earth-night', 'earth-clouds', 'mars', 'europa', 'jupiter'];
  function watchDownloads(page) {
    const downloaded = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.endsWith('favicon.svg')) return;
      if (
        ['image', 'media'].includes(request.resourceType()) ||
        /\.(png|jpe?g|webp|gif|ktx2?|glb|gltf|hdr|exr)(\?|$)/i.test(url)
      ) {
        downloaded.push(url);
      }
    });
    return downloaded;
  }

  test('the flight downloads only the six planet maps, and no model files', async ({ page }) => {
    const downloaded = watchDownloads(page);
    await page.goto('/?tier=high');
    await waitForScene(page);
    for (const id of ['argus', 'blackwater', 'europa', 'contact']) {
      await scrollToSection(page, id);
      await page.waitForTimeout(300);
    }
    const names = downloaded.map((url) =>
      url
        .split('/')
        .pop()
        .replace(/-[\w-]{8}\.webp$/, ''),
    );
    expect(downloaded.every((url) => /\.webp(\?|$)/.test(url))).toBe(true);
    expect([...new Set(names)].sort()).toEqual([...MAPS].sort());
  });

  test('the low tier downloads no images at all', async ({ page }) => {
    const downloaded = watchDownloads(page);
    await page.goto('/?tier=low');
    await waitForScene(page);
    await scrollToSection(page, 'europa');
    await page.waitForTimeout(500);
    expect(downloaded).toEqual([]);
  });

  for (const tier of ['low', 'high']) {
    test(`the ${tier} tier flies the whole route without errors`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (err) => errors.push(err.message));
      page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
      await page.goto(`/?debug&tier=${tier}`);
      await waitForScene(page);
      for (const id of [
        'argus',
        'blackwater',
        'beetlejuice',
        'theredarmy',
        'deadletter',
        'europa',
        'contact',
      ]) {
        await scrollToSection(page, id);
        await page.waitForTimeout(400);
      }
      await expect(page.locator('.debug')).toContainText(`tier ${tier}`);
      expect(errors).toEqual([]);
    });
  }

  for (const size of [
    { width: 360, height: 740 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    test(`axe finds no violations in flight mode at ${size.width}px`, async ({ page }) => {
      await page.setViewportSize(size);
      // The low tier draws straight to the screen with no post-processing. Axe checks the page, not
      // the picture, and the software renderer in CI takes over a minute per frame at 1920 px.
      await page.goto('/?tier=low');
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

test('first visit: the boot cover shows, any key skips it, and it does not return', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.boot')).toBeVisible();
  await page.keyboard.press('x');
  await expect(page.locator('.boot')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.boot')).toHaveCount(0);
});

test('in flight the S key toggles sound and the choice shows on the page', async ({ page }) => {
  await markVisited(page);
  await page.goto('/');
  await waitForScene(page);
  await expect(page.locator('html')).toHaveAttribute('data-sound', 'off');
  await page.keyboard.press('s');
  await expect(page.locator('html')).toHaveAttribute('data-sound', 'on');
});
