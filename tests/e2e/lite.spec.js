import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { markVisited } from './helpers.js';

test.beforeEach(async ({ page }) => {
  await markVisited(page);
});

const MISSIONS = ['argus', 'blackwater', 'beetlejuice', 'theredarmy', 'deadletter', 'europa'];
// The five viewports every page is checked at.
const SIZES = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

test('every section renders and the console is clean', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(err.message));
  await page.goto('/?lite=1');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Software engineer');
  for (const id of ['launch', 'projects', 'fleet', 'more', 'about', 'education', 'contact']) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  for (const id of MISSIONS) await expect(page.locator(`#${id} .dossier__callsign`)).toBeVisible();
  expect(errors).toEqual([]);
});

test('every link has a real target', async ({ page }) => {
  await page.goto('/?lite=1');
  const hrefs = await page
    .locator('a')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href')));
  for (const href of hrefs) {
    expect(href, 'link without href').toBeTruthy();
    expect(href).not.toBe('#');
    if (href.startsWith('#')) {
      expect(await page.locator(href).count(), `missing anchor ${href}`).toBe(1);
    }
  }
});

test('resume links are removed when there is no resume.pdf', async ({ page }) => {
  await page.goto('/?lite=1');
  const resumeLinks = await page.locator('a[href$="resume.pdf"]').count();
  const response = await page.request.get('/resume.pdf');
  // The preview server answers unknown paths with index.html, so check the file type too.
  const isPdf = response.ok() && (response.headers()['content-type'] ?? '').includes('pdf');
  // Either both exist or neither does. A link to a missing file is the failure.
  expect(resumeLinks > 0).toBe(isPdf);
});

for (const size of SIZES) {
  test(`axe finds no violations at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/?lite=1');
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
  });

  test(`no horizontal scroll at ${size.width}px`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto('/?lite=1');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all content is readable and the JS-only buttons are hidden', async ({ page }) => {
    await page.goto('/?lite=1');
    await expect(page.locator('#argus .dossier__objective')).toBeVisible();
    await expect(page.locator('#europa .hazards li')).toHaveCount(3);
    await expect(page.locator('#contact-form')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Menu' })).toHaveCount(0);
  });
});

test('contact form falls back to a mailto link', async ({ page }) => {
  await page.goto('/?lite=1');
  await page.locator('#cf-name').fill('Test Person');
  await page.locator('#cf-email').fill('test@example.com');
  await page.locator('#cf-message').fill('Hello');
  await page.getByRole('button', { name: 'Send' }).click();
  await expect(page.locator('#contact-note')).toContainText('mail app');
});

test.describe('with a software renderer and no saved choice', () => {
  // Chromium here renders WebGL with SwiftShader, on the CPU. Without the saved choice the
  // Chromium project starts with, the page must start plain and say why.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('the page starts lite with the reason "software graphics"', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'only the Chromium project renders in software');
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-lite-reason', 'software graphics');
    await expect(page.locator('canvas.scene-canvas')).toHaveCount(0);
  });
});
