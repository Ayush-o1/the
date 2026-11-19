// Generates the social card, public/og.png (1200x630), from the real hero.
// It starts the built site, loads the flight on the Mac's GPU, hides the page chrome and takes
// one screenshot. Run it once and commit the picture; it is not part of the build.
// Usage: npm run build && npm run preview, then in another terminal: node scripts/og-image.js
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:4173/?tier=high';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: { width: 1200, height: 630 } });
await context.addInitScript(() => {
  localStorage.setItem('ak-visited', '1');
  localStorage.setItem('ak-role', 'curious');
});
const page = await context.newPage();
await page.route('https://api.github.com/**', (route) => route.abort());
await page.goto(url);
await page.waitForSelector('html.scene');
await page.addStyleTag({
  content: `
    .site-header, .hud-frame, .hud-path, .hud-alert, .debug, .hero__actions, .hero .chip, .hero__eyebrow { display: none !important; }
    .hero { min-height: 100svh; justify-content: center; }
  `,
});
await page.waitForTimeout(3000);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('Saved public/og.png');
