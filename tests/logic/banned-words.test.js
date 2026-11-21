import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// Voice rules for site copy: words and sentence shapes that make text read as generated.
const BANNED_WORDS = [
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
  'pivotal',
  'crucial',
  'underscore',
  'showcase',
  'realm',
  'harness',
  'facilitate',
  'bolster',
  'streamline',
  'testament',
  'evolving landscape',
  'ever-changing',
  'at its core',
  'that being said',
  'stands as',
  'serves as',
  'dive into',
  'world of',
  "in today's world",
  "i'm excited",
  'i thrive',
  'lorem ipsum',
  'todo',
];

// Sentence shapes. Each is a regular expression over visible text.
const BANNED_SHAPES = [
  [/\bnot just\b[^.]{0,80}\bbut\b/i, 'not just X but Y'],
  [/\bnot only\b[^.]{0,80}\bbut\b/i, 'not only X but Y'],
  [/\bit'?s not\b[^.]{0,60},\s*it'?s\b/i, "it's not X, it's Y"],
  [/\bpassion for\b/i, 'passion for'],
  [/\bfirm believer\b/i, 'firm believer'],
];

function textFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...textFiles(path));
    else if (/\.(js|css|html|svg|txt|xml|md)$/.test(name)) out.push(path);
  }
  return out;
}

const FILES = [
  'index.html',
  'README.md',
  'ARCHITECTURE.md',
  ...textFiles('src'),
  ...textFiles('public'),
].filter((file) => existsSync(file));

function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

test('no banned words or filler text in shipped files', () => {
  const hits = [];
  for (const file of FILES) {
    const text = readFileSync(file, 'utf8');
    for (const word of BANNED_WORDS) {
      // Whole words only, so "resolutions" in a file path does not count as "solutions".
      const pattern = new RegExp(`\\b${word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      if (pattern.test(text)) hits.push(`${file}: ${word}`);
    }
    // No dashes used as pauses in the copy.
    if (/—/.test(text)) hits.push(`${file}: em dash`);
  }
  assert.deepEqual(hits, []);
});

test('no banned sentence shapes or exclamation marks in the page text', () => {
  const hits = [];
  for (const file of ['index.html', 'README.md']) {
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, 'utf8');
    const text = file.endsWith('.html') ? visibleText(raw) : raw;
    for (const [pattern, name] of BANNED_SHAPES) {
      if (pattern.test(text)) hits.push(`${file}: ${name}`);
    }
    if (/!/.test(text.replace(/!\[/g, ''))) hits.push(`${file}: exclamation mark`);
  }
  assert.deepEqual(hits, []);
});
