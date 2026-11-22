// Checks the deployed site with a real browser. Not part of CI: it needs the network and the live URL.
// Usage: node scripts/live-check.js [url]
import { chromium } from '@playwright/test';

const base = (process.argv[2] ?? 'https://ayush-o1.github.io/the/').replace(/\/?$/, '/');
const failures = [];
const check = (name, ok, detail = '') => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
  if (!ok) failures.push(name);
};

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'],
});

// 1. Plain page: content, simulations, no errors.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    localStorage.setItem('ak-visited', '1');
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  const response = await page.goto(`${base}?lite=1`);
  check('page answers 200', response?.status() === 200, String(response?.status()));
  check(
    'h1 says software engineer',
    ((await page.locator('h1').textContent()) ?? '').includes('Software engineer'),
  );
  check(
    'page title says software engineer',
    (await page.title()) === 'Ayush Kumar | Software engineer',
  );
  check('six missions present', (await page.locator('[data-mission]').count()) === 6);
  await page
    .locator('[data-sim="blackwater"] canvas, [data-sim="blackwater"] .bw__views')
    .first()
    .waitFor({ timeout: 15000 })
    .catch(() => {});
  check(
    'BlackWater simulation mounted',
    (await page.locator('[data-sim="blackwater"] .sim__app').count()) === 1,
  );
  check(
    'Europa simulation mounted',
    (await page.locator('[data-sim="europa"] .sim__app').count()) === 1,
  );
  await page.locator('[data-sim="europa"]').getByLabel('Note for entry 3').fill('changed');
  await page.keyboard.press('Tab');
  check(
    'Europa tamper is caught',
    (await page.locator('[data-sim="europa"] .sim__outcome').textContent()).includes('sequence 3'),
  );
  check('no console errors on the plain page', errors.length === 0, errors.join(' | '));
  await context.close();
}

// 2. Flight: starts, HUD present, still no errors.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // This browser draws WebGL in software, which the site sends to the plain page; the saved choice
  // asks for the flight, as a visitor would with the toggle.
  await context.addInitScript(() => {
    localStorage.setItem('ak-visited', '1');
    localStorage.setItem('ak-lite', '0');
  });
  const page = await context.newPage();
  const errors = [];
  const maps = new Set();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('response', (response) => {
    if (/\.webp$/.test(response.url()) && response.ok()) maps.add(response.url());
  });
  await page.goto(base);
  const started = await page.waitForSelector('html.scene', { timeout: 20000 }).then(
    () => true,
    () => false,
  );
  check('flight starts', started);
  check('progress line is drawn', (await page.locator('.hud-progress__fill').count()) === 1);
  await page.evaluate(() => document.getElementById('europa').scrollIntoView());
  await page.waitForTimeout(3000);
  check(
    'section is announced',
    (await page.locator('p.visually-hidden[aria-live]').textContent())?.includes('Europa'),
  );
  check('the six planet maps are served', maps.size === 6, String(maps.size));
  check('no console errors in flight', errors.length === 0, errors.join(' | '));
  await context.close();
}

// 3. Files other tools fetch.
for (const [path, type] of [
  ['og.jpg', 'image/jpeg'],
  ['robots.txt', 'text/plain'],
  ['sitemap.xml', 'xml'],
  ['favicon.svg', 'svg'],
]) {
  const response = await fetch(`${base}${path}`);
  check(
    `${path} is served`,
    response.ok && (response.headers.get('content-type') ?? '').includes(type),
    `${response.status} ${response.headers.get('content-type')}`,
  );
}
const missing = await fetch(`${base}no-such-page`);
check(
  'unknown address gives the 404 page',
  missing.status === 404 && (await missing.text()).includes('Nothing out here.'),
);

await browser.close();
console.log(failures.length ? `\n${failures.length} check(s) failed` : '\nAll live checks passed');
process.exit(failures.length ? 1 : 0);
