import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { markVisited } from './helpers.js';

// A small stand-in for GitHub's answer. Names and dates are made up for the test.
const REPOS = [
  {
    name: 'Argus',
    fork: false,
    archived: false,
    html_url: 'https://github.com/x/Argus',
    description: 'mission repo',
    language: 'Python',
    pushed_at: '2026-11-17T00:00:00Z',
  },
  {
    name: 'Cadentra',
    fork: false,
    archived: false,
    html_url: 'https://github.com/x/Cadentra',
    description: 'Outbound marketing backend.',
    language: 'TypeScript',
    pushed_at: '2026-11-12T00:00:00Z',
  },
  {
    name: 'arrow',
    fork: true,
    archived: false,
    html_url: 'https://github.com/x/arrow',
    description: 'a fork',
    language: 'C++',
    pushed_at: '2026-11-18T00:00:00Z',
  },
  {
    name: 'NightJar',
    fork: false,
    archived: false,
    html_url: 'https://github.com/x/NightJar',
    description: null,
    language: null,
    pushed_at: '2026-11-01T00:00:00Z',
  },
];

test.beforeEach(async ({ page }) => {
  await markVisited(page);
});

test.describe('mission map', () => {
  test('M opens the map with every sector and every shortcut, and Esc returns focus', async ({
    page,
  }) => {
    await page.goto('/?lite=1');
    const trigger = page.locator('header [data-open-dialog="map"]');
    await trigger.focus();
    await page.keyboard.press('m');
    const map = page.locator('#map');
    await expect(map).toBeVisible();
    await expect(map.locator('[data-map-list] li')).toHaveCount(11);
    await expect(map.locator('.map__keys > div')).toHaveCount(7);
    for (const key of ['B', 'M', '`', 'J', 'L', 'S', 'Esc']) {
      await expect(map.locator('.map__keys')).toContainText(key);
    }
    await page.keyboard.press('Escape');
    await expect(map).toBeHidden();
    await expect(trigger).toBeFocused();
  });

  test('picking a sector closes the map, updates the address and focuses its heading', async ({
    page,
  }) => {
    await page.goto('/?lite=1');
    await page.keyboard.press('m');
    await page.locator('#map').getByRole('link', { name: 'M3 BeetleJuice' }).click();
    await expect(page.locator('#map')).toBeHidden();
    await expect(page).toHaveURL(/#beetlejuice$/);
    await expect(page.locator('#beetlejuice-title')).toBeFocused();
  });
});

test.describe('mission console', () => {
  test('backtick opens it, commands answer, open flies to a mission', async ({ page }) => {
    await page.goto('/?lite=1');
    await page.keyboard.press('`');
    const dialog = page.locator('#console');
    await expect(dialog).toBeVisible();
    const input = dialog.getByLabel(/Command/);
    await expect(input).toBeFocused();
    await input.fill('missions');
    await input.press('Enter');
    await expect(dialog.locator('[data-console-log]')).toContainText('theRedArmy');
    await input.fill('stack');
    await input.press('Enter');
    await expect(dialog.locator('[data-console-log]')).toContainText('Node.js');
    await input.fill('resume');
    await input.press('Enter');
    await expect(dialog.locator('[data-console-log]')).toContainText('no resume on this site yet');
    await input.fill('whoami');
    await input.press('Enter');
    await expect(dialog.locator('[data-console-log]')).toContainText('Ayush Kumar');
    await input.fill('open europa');
    await input.press('Enter');
    await expect(dialog).toBeHidden();
    await expect(page).toHaveURL(/#europa$/);
  });

  test('unknown commands point to help, and the up arrow recalls the last command', async ({
    page,
  }) => {
    await page.goto('/?lite=1');
    await page.keyboard.press('`');
    const input = page.locator('#console').getByLabel(/Command/);
    await input.fill('sudo');
    await input.press('Enter');
    await expect(page.locator('#console [data-console-log]')).toContainText(
      'Unknown command "sudo". Try: help',
    );
    await input.press('ArrowUp');
    await expect(input).toHaveValue('sudo');
  });
});

test.describe('keyboard', () => {
  test('J and K move between missions', async ({ page }) => {
    await page.goto('/?lite=1');
    await page.keyboard.press('j');
    await expect(page).toHaveURL(/#argus$/);
    await page.keyboard.press('j');
    await expect(page).toHaveURL(/#blackwater$/);
    await page.keyboard.press('k');
    await expect(page).toHaveURL(/#argus$/);
  });

  test('shortcuts do not fire while typing or while a dialog is open', async ({ page }) => {
    await page.goto('/?lite=1');
    await page.locator('#cf-message').fill('mjkbl');
    // Typing "b" while the box has focus must not open the Briefing.
    await page.locator('#cf-message').press('b');
    await expect(page.locator('#map')).toBeHidden();
    await expect(page.locator('#briefing')).toBeHidden();
    await page.locator('#cf-message').blur();
    await page.keyboard.press('b');
    await expect(page.locator('#briefing')).toBeVisible();
    await page.keyboard.press('m');
    await expect(page.locator('#map')).toBeHidden();
    await page.keyboard.press('Escape');
    await expect(page.locator('#briefing')).toBeHidden();
  });

  test('every control in the header can be reached with Tab', async ({ page, browserName }) => {
    // Safari does not Tab to buttons unless a system setting is on, so this runs in Chromium.
    test.skip(browserName !== 'chromium');
    await page.goto('/?lite=1');
    const seen = new Set();
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press('Tab');
      const label = await page.evaluate(
        () =>
          document.activeElement?.getAttribute('aria-label') ||
          document.activeElement?.textContent?.trim(),
      );
      seen.add(label);
    }
    for (const name of ['Briefing', 'Map', 'Sound']) {
      expect(
        [...seen].some((label) => String(label).startsWith(name)),
        name,
      ).toBe(true);
    }
  });
});

test.describe('deep links', () => {
  test('a link with a hash opens at that mission', async ({ page }) => {
    await page.goto('/?lite=1#blackwater');
    await expect(page.locator('#blackwater-title')).toBeInViewport();
  });

  test('scrolling updates the address to the sector on screen', async ({ page }) => {
    await page.goto('/?lite=1');
    await page.evaluate(() => {
      const rect = document.getElementById('europa').getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + rect.top + 200, behavior: 'instant' });
    });
    await expect(page).toHaveURL(/#europa$/);
  });
});

test.describe('GitHub data', () => {
  test('nothing is requested from GitHub until the Cargo hold is near', async ({ page }) => {
    let calls = 0;
    await page.route('https://api.github.com/**', (route) => {
      calls += 1;
      return route.fulfill({ json: REPOS });
    });
    await page.goto('/?lite=1');
    await page.waitForTimeout(800);
    expect(calls).toBe(0);
  });

  test('the Cargo hold skips forks and mission repositories, and the footer shows the last push', async ({
    page,
  }) => {
    await page.route('https://api.github.com/**', (route) => route.fulfill({ json: REPOS }));
    await page.goto('/?lite=1');
    // The request waits until the Cargo hold is near the screen.
    await page.locator('#cargo').scrollIntoViewIfNeeded();
    const cargo = page.locator('[data-cargo] li');
    await expect(cargo).toHaveCount(2);
    await expect(cargo.first()).toContainText('Cadentra');
    await expect(cargo.first()).toContainText('TypeScript');
    await expect(page.locator('[data-cargo]')).not.toContainText('Argus');
    await expect(page.locator('[data-cargo]')).not.toContainText('arrow');
    await expect(page.locator('[data-telemetry]')).toContainText(
      /Last transmission: \d+ days? ago|today/,
    );
  });

  test('when GitHub fails, the telemetry and the list stay hidden and the console is clean', async ({
    page,
  }) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route('https://api.github.com/**', (route) => route.abort());
    await page.goto('/?lite=1');
    await page.locator('#cargo').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(page.locator('[data-telemetry]')).toBeHidden();
    await expect(page.locator('[data-cargo] li')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('the answer is cached, so a reload does not ask again', async ({ page }) => {
    let calls = 0;
    await page.route('https://api.github.com/**', (route) => {
      calls += 1;
      return route.fulfill({ json: REPOS });
    });
    await page.goto('/?lite=1');
    await page.locator('#cargo').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-cargo] li')).toHaveCount(2);
    await page.reload();
    await page.locator('#cargo').scrollIntoViewIfNeeded();
    await expect(page.locator('[data-cargo] li')).toHaveCount(2);
    expect(calls).toBe(1);
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
    await expect(page).toHaveTitle('Signal lost');
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await expect(page).toHaveTitle(original);
  });

  test('the Konami code shows a toast, and says there is no probe on the plain page', async ({
    page,
  }) => {
    await page.goto('/?lite=1');
    for (const key of [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ]) {
      await page.keyboard.press(key);
    }
    await expect(page.locator('#toast')).toContainText(
      'Barrel roll. There is no probe on the plain page.',
    );
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
  test(`axe finds no violations with the map and console open at ${size.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    await page.goto('/?lite=1');
    await page.keyboard.press('m');
    let results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
    await page.keyboard.press('Escape');
    await page.keyboard.press('`');
    results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
  });
}
