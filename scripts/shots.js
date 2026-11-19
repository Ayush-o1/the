// Takes screenshots of the built site at three widths, for looking at by eye:
// the top of the page plus one picture per section.
// Usage: node scripts/shots.js [url] [outDir]   (start `npm run preview` first)
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const url = process.argv[2] ?? 'http://localhost:4173/';
const outDir = process.argv[3] ?? 'shots';
const sizes = [
  { name: '360', width: 360, height: 740 },
  { name: '768', width: 768, height: 1024 },
  { name: '1440', width: 1440, height: 900 },
];
const sections = [
  'belt',
  'argus',
  'blackwater',
  'beetlejuice',
  'deadletter',
  'europa',
  'crew',
  'contact',
];

mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
for (const size of sizes) {
  const page = await browser.newPage({ viewport: { width: size.width, height: size.height } });
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${outDir}/top-${size.name}.png` });
  for (const id of sections) {
    await page.locator(`#${id}`).screenshot({ path: `${outDir}/${id}-${size.name}.png` });
  }
  await page.close();
}
await browser.close();
console.log(`Screenshots saved in ${outDir}/`);
