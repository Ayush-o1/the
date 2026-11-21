// Fails when the built site goes over the size budgets set in BUDGET below.
// "First load" means what index.html pulls in before anything lazy: its HTML, its stylesheets
// and the scripts it loads or preloads. Everything else in dist/ is lazy or on demand.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const KB = 1024;
const BUDGET = {
  firstLoadKb: 60,
  totalJsKb: 350,
  fontsKb: 150,
  totalTransferKb: 700,
  // Planet maps (NASA and USGS imagery, WebP). Fetched only after the flight has started, never
  // on slow connections, Save-Data or the low tier, so they are not part of the page's own weight.
  planetMapsKb: 1536,
};

function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...listFiles(path));
    else out.push(path);
  }
  return out;
}

function gzipSize(path) {
  return gzipSync(readFileSync(path)).length;
}

// Fonts are already compressed (woff2), so gzip would not shrink them. Count raw bytes.
function transferSize(path) {
  return extname(path) === '.woff2' ? statSync(path).size : gzipSize(path);
}

function firstLoadFiles(html) {
  const refs = [...html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)].map((m) => m[1]);
  return refs
    .filter((ref) => /\.(js|css)$/.test(ref))
    .map((ref) => join(DIST, ref))
    .filter((path) => existsSync(path));
}

if (!existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

// The social card is only fetched by link previews, never by a visitor loading the page.
const isMap = (file) => extname(file) === '.webp';
const allFiles = listFiles(DIST).filter(
  (file) => !file.endsWith('og.jpg') && !file.endsWith('.map'),
);
const files = allFiles.filter((file) => !isMap(file));
const planetMaps = allFiles.filter(isMap);
const htmlPath = join(DIST, 'index.html');
const firstLoad = [htmlPath, ...firstLoadFiles(readFileSync(htmlPath, 'utf8'))];

const sum = (paths, size) => paths.reduce((total, p) => total + size(p), 0);
const jsFiles = files.filter((f) => extname(f) === '.js');
const fontFiles = files.filter((f) => ['.woff2', '.woff'].includes(extname(f)));

const result = {
  firstLoadKb: sum(firstLoad, gzipSize) / KB,
  totalJsKb: sum(jsFiles, gzipSize) / KB,
  fontsKb: sum(fontFiles, transferSize) / KB,
  totalTransferKb: sum(files, transferSize) / KB,
  // WebP is already compressed, like the fonts: raw bytes.
  planetMapsKb: sum(planetMaps, (path) => statSync(path).size) / KB,
};

let failed = false;
for (const [name, limit] of Object.entries(BUDGET)) {
  const value = result[name];
  const ok = value <= limit;
  if (!ok) failed = true;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}: ${value.toFixed(1)} KB (limit ${limit})`);
}
process.exit(failed ? 1 : 0);
