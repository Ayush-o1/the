import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Voice rules from docs/PLAN.md section 7.1. The fourteen Belt phrases exist to mock these words,
// so the Belt list in index.html is the only place they may appear.
const BANNED = [
  'passionate',
  'leverage',
  'seamless',
  'cutting-edge',
  'innovative',
  'robust',
  'synergy',
  'delve',
  'tapestry',
  'elevate',
  'unlock',
  'empower',
  'game-changer',
  'journey',
  'solutions',
  "in today's world",
  'lorem ipsum',
  'todo',
];

function textFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...textFiles(path));
    else if (/\.(js|css|html|svg|txt|xml)$/.test(name)) out.push(path);
  }
  return out;
}

function withoutBeltList(html) {
  return html.replace(/<ul class="belt__rocks"[\s\S]*?<\/ul>/, '');
}

test('no banned words or filler text in shipped files', () => {
  const files = ['index.html', ...textFiles('src'), ...textFiles('public')];
  const hits = [];
  for (const file of files) {
    let text = readFileSync(file, 'utf8');
    if (file === 'index.html') text = withoutBeltList(text);
    // Whole words only, so "resolutions" in a file path does not count as "solutions".
    for (const word of BANNED) {
      const pattern = new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(text)) hits.push(`${file}: ${word}`);
    }
    // No dashes used as pauses in the copy (plan 7.1: no em-dash chains).
    if (/\u2014/.test(text)) hits.push(`${file}: em dash`);
    if (file === 'index.html' && /!(?!--|doctype)/i.test(text.replace(/<!--[\s\S]*?-->/g, ''))) {
      hits.push(`${file}: exclamation mark`);
    }
  }
  assert.deepEqual(hits, []);
});

test('the Belt list has fourteen phrases', () => {
  const html = readFileSync('index.html', 'utf8');
  const list = html.match(/<ul class="belt__rocks"[\s\S]*?<\/ul>/)[0];
  assert.equal((list.match(/<li>/g) || []).length, 14);
});
