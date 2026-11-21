// Generates the social card, public/og.jpg (1200x630), from the real hero: the name and role line,
// the headline, the planet and the probe, with the buttons and header left out. It starts the built
// site, loads the flight on the Mac's GPU and takes one screenshot. Run it once and commit the picture; it is not part of the build.
// Usage: npm run build && npm run preview, then in another terminal: node scripts/og-image.js
import { chromium } from '@playwright/test';

const url = process.argv[2] ?? 'http://localhost:4173/?tier=high';

const browser = await chromium.launch({
  args: ['--use-gl=angle', '--use-angle=metal', '--ignore-gpu-blocklist'],
});
const context = await browser.newContext({ viewport: { width: 1200, height: 700 } });
await context.addInitScript(() => {
  localStorage.setItem('ak-visited', '1');
});
const page = await context.newPage();
await page.goto(url);
await page.waitForSelector('html.scene');
await page.addStyleTag({
  content: `
    .site-header, .hud-path, .debug, .hero__actions, .hero__lede, .hero__status { display: none !important; }
    .hero { min-height: 100svh; justify-content: center; }
  `,
});
await page.waitForTimeout(3000);
// The page is rendered a little taller and cropped, so the edge of the hero is not in the picture.
await page.screenshot({
  path: 'public/og.jpg',
  type: 'jpeg',
  quality: 82,
  clip: { x: 0, y: 20, width: 1200, height: 630 },
});
await browser.close();
console.log('Saved public/og.jpg');
