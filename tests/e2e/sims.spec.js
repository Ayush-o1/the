import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { markVisited } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await markVisited(page);
  await page.goto('/?lite=1');
});

test.describe('Argus simulation', () => {
  test('injecting an anomaly flags one account and says so in text', async ({ page }) => {
    const sim = page.locator('[data-sim="argus"]');
    await expect(sim.locator('canvas')).toBeVisible();
    await expect(sim.locator('.sim__static')).toBeHidden();
    await expect(sim.locator('.sim__outcome')).toContainText('No account stands out');
    await sim.getByRole('button', { name: 'Inject anomaly' }).click();
    await expect(sim.locator('.sim__outcome')).toContainText(
      /Flagged A-\d\d: \d+ transactions inside 6 hours/,
    );
    await expect(sim.locator('.argus__list')).toContainText('FLAGGED');
    await expect(sim.locator('canvas')).toHaveAttribute('aria-label', /1 flagged/);
  });

  test('keyboard: the account buttons select an account and Reset clears the flag', async ({
    page,
  }) => {
    const sim = page.locator('[data-sim="argus"]');
    await sim.getByRole('button', { name: 'Inject anomaly' }).focus();
    await page.keyboard.press('Enter');
    const first = sim.locator('.argus__list button').first();
    await first.focus();
    await page.keyboard.press('Enter');
    await expect(sim.locator('.argus__detail')).toContainText(/flagged/);
    await sim.getByRole('button', { name: 'Reset' }).click();
    await expect(sim.locator('canvas')).toHaveAttribute('aria-label', /0 flagged/);
  });
});

test.describe('BlackWater simulation', () => {
  test('a private incident changes the internal view but not the public page', async ({ page }) => {
    const sim = page.locator('[data-sim="blackwater"]');
    await expect(sim.locator('.sim__static')).toBeHidden();
    await sim.getByRole('button', { name: 'Declare incident' }).click();
    const internal = sim.locator('section[aria-label="Internal view"]');
    const publicPage = sim.locator('section[aria-label="Public status page"]');
    await expect(internal).toContainText('major outage');
    await expect(publicPage).not.toContainText('major outage');
    await expect(sim.locator('.sim__outcome')).toContainText('incident is private');
    await sim.getByRole('button', { name: 'Private' }).click();
    await expect(publicPage).toContainText('major outage');
  });

  test('the lifecycle refuses moves that are not in the table and writes an audit entry for real ones', async ({
    page,
  }) => {
    const sim = page.locator('[data-sim="blackwater"]');
    await sim.getByRole('button', { name: 'Declare incident' }).click();
    // The button is aria-disabled but still clickable, so the visitor can see the refusal.
    await sim.getByRole('button', { name: 'CLOSED' }).click({ force: true });
    await expect(sim.locator('.sim__outcome')).toHaveText(
      'Refused: Invalid state transition from TRIGGERED to CLOSED.',
    );
    await expect(sim.locator('.bw__audit li')).toHaveCount(1);
    await sim.getByRole('button', { name: 'ACKNOWLEDGED' }).click();
    await expect(sim.locator('.bw__audit li')).toHaveCount(2);
    await expect(sim.locator('.bw__audit li').last()).toContainText('TRIGGERED to ACKNOWLEDGED');
    await expect(sim.locator('.chip').first()).toHaveText('ACKNOWLEDGED');
  });

  test('keyboard focus stays on the control after it is used', async ({ page }) => {
    const sim = page.locator('[data-sim="blackwater"]');
    await sim.getByRole('button', { name: 'Declare incident' }).focus();
    await page.keyboard.press('Enter');
    await expect(sim.getByRole('button', { name: 'Declare incident' })).toBeFocused();
    const acknowledge = sim.getByRole('button', { name: 'ACKNOWLEDGED' });
    await acknowledge.focus();
    await page.keyboard.press('Enter');
    await expect(sim.locator('.chip').first()).toHaveText('ACKNOWLEDGED');
    // The pressed button is gone (it became the current status), so focus moved to a control in the same simulation.
    const stillInside = await page.evaluate(
      () => document.activeElement?.closest('[data-sim]') !== null,
    );
    expect(stillInside).toBe(true);
  });
});

for (const size of [
  { width: 360, height: 740 },
  { width: 1440, height: 900 },
]) {
  test(`axe finds no violations with both simulations in use at ${size.width}px`, async ({
    page,
  }) => {
    await page.setViewportSize(size);
    const bw = page.locator('[data-sim="blackwater"]');
    await bw.getByRole('button', { name: 'Declare incident' }).click();
    await bw.getByRole('button', { name: 'ACKNOWLEDGED' }).click();
    await page
      .locator('[data-sim="argus"]')
      .getByRole('button', { name: 'Inject anomaly' })
      .click();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
  });
}
