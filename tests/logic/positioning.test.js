import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// C11: the site presents Ayush as a software engineer open to software engineer roles.
// C12: student status (degree, semester, graduation, university, CGPA) appears only in the
// Education section. Both are checked on the built page, so the head, the JSON-LD, the dialogs and
// every attribute are covered, not just the visible text.
const BUILT = 'dist/index.html';
const STUDENT_TERMS = [
  /\bstudent/i,
  /\bb\.?\s?tech\b/i,
  /\bsemester\b/i,
  /\b\d+(st|nd|rd|th)\s+sem\b/i,
  /\bfinal[- ]year\b/i,
  /\bgraduat/i,
  /\buniversity\b/i,
  /\bdeemed\b/i,
  /\bcgpa\b/i,
  /\bgpa\b/i,
];

function built() {
  assert.ok(existsSync(BUILT), 'dist/index.html is missing. Run npm run build first.');
  return readFileSync(BUILT, 'utf8');
}

// Removes the Education section, the one place where these terms are allowed.
function withoutEducation(html) {
  const match = html.match(/<section\s+id="education"[\s\S]*?<\/section>/);
  assert.ok(match, 'the Education section is missing');
  return html.replace(match[0], '');
}

function textFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...textFiles(path));
    else if (/\.(js|css|html|svg|txt|xml|md)$/.test(name)) out.push(path);
  }
  return out;
}

test('the built page has a software engineer title, description and social tags', () => {
  const html = built();
  assert.match(html, /<title>Ayush Kumar \| Software engineer<\/title>/);
  for (const tag of [
    /name="description"\s+content="[^"]*software engineer[^"]*"/i,
    /property="og:title"\s+content="[^"]*Software engineer[^"]*"/i,
    /name="twitter:title"\s+content="[^"]*Software engineer[^"]*"/i,
    /property="og:description"\s+content="[^"]*software engineer[^"]*"/i,
  ]) {
    assert.match(html, tag);
  }
});

test('the JSON-LD is valid and names a software engineer', () => {
  const html = built();
  const raw = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
  assert.ok(raw, 'JSON-LD block is missing');
  const data = JSON.parse(raw);
  assert.equal(data['@type'], 'Person');
  assert.equal(data.jobTitle, 'Software engineer');
});

test('the hero says software engineer and the status chip says what he is open to', () => {
  const html = built();
  assert.match(html, /Software engineer · Bengaluru/);
  assert.match(html, /Open to software engineer roles/);
});

test('no title or tag calls him a backend developer or uses SDE alone', () => {
  const html = built();
  const head = html.slice(0, html.indexOf('</head>'));
  assert.doesNotMatch(head, /backend developer/i);
  assert.doesNotMatch(html, /\bSDE\b/);
});

test('student status appears only in the Education section of the built page', () => {
  const rest = withoutEducation(built());
  const hits = STUDENT_TERMS.filter((term) => term.test(rest)).map(String);
  assert.deepEqual(hits, []);
});

test('the Education section states the degree, university, semester and year', () => {
  const html = built();
  const section = html.match(/<section\s+id="education"[\s\S]*?<\/section>/)[0];
  const text = section.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.match(text, /B\.Tech in Computer Science/);
  assert.match(text, /Jain \(Deemed-to-be University\)/);
  assert.match(text, /7th semester/);
  assert.match(text, /2027/);
});

test('the Education section has a heading and a link in the main navigation', () => {
  const html = built();
  assert.match(html, /<h2 id="education-title">Education<\/h2>/);
  assert.match(html, /<a href="#education">Education<\/a>/);
});

test('source files, README and notes in the repo carry no student status', () => {
  const files = ['README.md', 'ARCHITECTURE.md', ...textFiles('src'), ...textFiles('public')];
  const allowed = new Set(['src/config.js', 'src/ui/education.js']); // the CGPA switch, no values
  const hits = [];
  for (const file of files.filter((f) => existsSync(f) && !allowed.has(f))) {
    const text = readFileSync(file, 'utf8');
    for (const term of STUDENT_TERMS) if (term.test(text)) hits.push(`${file}: ${term}`);
  }
  assert.deepEqual(hits, []);
});
