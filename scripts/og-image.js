// Renders the social card, public/og.jpg (1200x630), from scripts/og-card.html: the hero's
// headline, the name and role, and one refusal quoted from the code, in the site's own fonts and
// colours. Run it by hand and commit the picture; it is not part of the build.
// Usage: node scripts/og-image.js
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const card = new URL('./og-card.html', import.meta.url);

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
await page.goto(card.href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({
  path: fileURLToPath(new URL('../public/og.jpg', import.meta.url)),
  type: 'jpeg',
  quality: 88,
});
await browser.close();
console.log('Saved public/og.jpg');
