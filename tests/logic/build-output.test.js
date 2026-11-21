import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// The look-dev page (dev/lookdev.html) is for development only and must never be deployed.
// These checks run on the built site in dist/ (npm run check builds before testing).
function listFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...listFiles(path));
    else out.push(path);
  }
  return out;
}

const built = existsSync('dist/index.html');

test('the look-dev page is not in the built site', { skip: !built && 'dist/ not built' }, () => {
  const files = listFiles('dist');
  const leaks = files.filter((file) => /lookdev|[\\/]dev[\\/]/i.test(file));
  assert.deepEqual(leaks, []);
});

test(
  'only index.html and 404.html are pages in the built site',
  { skip: !built && 'dist/ not built' },
  () => {
    const pages = listFiles('dist').filter((file) => file.endsWith('.html'));
    assert.deepEqual(pages.map((file) => file.replace(/\\/g, '/')).sort(), [
      'dist/404.html',
      'dist/index.html',
    ]);
  },
);
