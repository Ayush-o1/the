// Loads the built site with the 3D scene on, scrolls to each sector and saves a screenshot.
// Also prints console errors and the ?debug numbers. Needs `npm run preview` running.
// Usage: node scripts/scene-check.js [width] [height] [outDir] [cpuThrottle]
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

// Software rendering flags that make WebGL work in headless Chromium.
const SOFTWARE_FLAGS = [
  '--use-gl=angle',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];
// GL=metal uses the Mac's real GPU, which is the only way to judge frame rate.
const GL_FLAGS =
  process.env.GL === 'metal'
    ? ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist']
    : SOFTWARE_FLAGS;

const width = Number(process.argv[2] ?? 1440);
const height = Number(process.argv[3] ?? 900);
const outDir = process.argv[4] ?? 'shots';
const throttle = Number(process.argv[5] ?? 1);
const stopsToShoot = [
  'launch',
  'belt',
  'argus',
  'blackwater',
  'beetlejuice',
  'theredarmy',
  'deadletter',
  'europa',
  'crew',
  'contact',
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: GL_FLAGS });
const context = await browser.newContext({ viewport: { width, height } });
await context.addInitScript(() => {
  localStorage.setItem('ak-visited', '1');
  localStorage.setItem('ak-role', 'curious');
});
const page = await context.newPage();
const errors = [];
page.on('console', (msg) => ['error', 'warning'].includes(msg.type()) && errors.push(msg.text()));
page.on('pageerror', (err) => errors.push(err.message));

if (throttle > 1) {
  const session = await context.newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: throttle });
}

await page.goto('http://localhost:4173/?debug');
await page.waitForSelector('html.scene', { timeout: 20000 });
for (const id of stopsToShoot) {
  await page.evaluate((target) => {
    const el = document.getElementById(target);
    const rect = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + rect.top + rect.height / 2 - window.innerHeight / 2);
  }, id);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${outDir}/scene-${id}-${width}.png` });
  const stats = await page.locator('.debug').textContent();
  console.log(id, stats.replace(/\n/g, ' | '));
}
console.log('console errors/warnings:', errors);
await browser.close();
