import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCommand, COMMANDS } from '../../src/core/commands.js';
import { pickRepos, daysAgo, describeDays, lastTransmission } from '../../src/core/github.js';
import { createKonami } from '../../src/core/konami.js';

const context = {
  missions: [
    { id: 'argus', name: 'Argus', status: 'Complete' },
    { id: 'theredarmy', name: 'theRedArmy', status: 'Active' },
  ],
  stackCounts: [
    ['Node.js', 4],
    ['Redis', 1],
  ],
  about: 'Ayush Kumar. Final-year B.Tech CS.',
  hasResume: false,
  uptimeSeconds: 75,
};

test('help lists every command', () => {
  const text = runCommand('help', context).lines.join('\n');
  for (const name of COMMANDS) assert.ok(text.includes(name), name);
});

test('missions lists names with status', () => {
  const { lines } = runCommand('missions', context);
  assert.equal(lines.length, 2);
  assert.match(lines[1], /theRedArmy\s+Active/);
});

test('open goes to a mission by id or by name, in any case', () => {
  assert.deepEqual(runCommand('open argus', context).action, { type: 'goto', id: 'argus' });
  assert.deepEqual(runCommand('OPEN theRedArmy', context).action, {
    type: 'goto',
    id: 'theredarmy',
  });
});

test('open without a name or with an unknown name explains itself and does nothing', () => {
  assert.equal(runCommand('open', context).action, undefined);
  const unknown = runCommand('open nowhere', context);
  assert.equal(unknown.action, undefined);
  assert.match(unknown.lines[0], /No mission called "nowhere"/);
});

test('resume opens only when there is one, otherwise says so', () => {
  assert.match(runCommand('resume', context).lines[0], /no resume on this site yet/);
  assert.deepEqual(runCommand('resume', { ...context, hasResume: true }).action, {
    type: 'resume',
  });
});

test('contact, stack, uptime, whoami', () => {
  assert.deepEqual(runCommand('contact', context).action, { type: 'goto', id: 'contact' });
  assert.match(runCommand('stack', context).lines[0], /Node\.js\s+4 missions/);
  assert.match(runCommand('stack', context).lines[1], /Redis\s+1 mission$/);
  assert.deepEqual(runCommand('uptime', context).lines, ['T+01:15']);
  assert.deepEqual(runCommand('whoami', context).lines, ['Ayush Kumar. Final-year B.Tech CS.']);
});

test('blank input does nothing and unknown input points to help', () => {
  assert.deepEqual(runCommand('   ', context).lines, []);
  assert.match(runCommand('sudo', context).lines[0], /Unknown command "sudo". Try: help/);
});

const repo = (name, extra = {}) => ({
  name,
  description: 'd',
  language: 'JavaScript',
  html_url: `https://github.com/x/${name}`,
  pushed_at: '2026-11-10T00:00:00Z',
  fork: false,
  archived: false,
  ...extra,
});

test('pickRepos skips forks, archived repos, the deny-list and mission repositories', () => {
  const picked = pickRepos(
    [
      repo('Argus'),
      repo('Cadentra'),
      repo('arrow', { fork: true }),
      repo('Old', { archived: true }),
      repo('Secret'),
      repo('NightJar', { description: null, language: null }),
    ],
    { deny: ['secret'], missionIds: ['argus'] },
  );
  assert.deepEqual(
    picked.map((r) => r.name),
    ['Cadentra', 'NightJar'],
  );
  assert.equal(picked[1].description, '');
});

test('days ago and its wording', () => {
  const now = Date.parse('2026-11-19T12:00:00Z');
  assert.equal(daysAgo('2026-11-19T01:00:00Z', now), 0);
  assert.equal(daysAgo('2026-11-17T11:00:00Z', now), 2);
  assert.equal(describeDays(0), 'today');
  assert.equal(describeDays(1), '1 day ago');
  assert.equal(describeDays(2), '2 days ago');
});

test('lastTransmission uses the newest push, and is null with nothing to go on', () => {
  const now = Date.parse('2026-11-19T12:00:00Z');
  assert.equal(
    lastTransmission(
      [
        repo('a', { pushed_at: '2026-11-09T00:00:00Z' }),
        repo('b', { pushed_at: '2026-11-17T00:00:00Z' }),
      ],
      now,
    ),
    '2 days ago',
  );
  assert.equal(lastTransmission([], now), null);
});

test('the Konami code matches once, and a wrong key starts it over', () => {
  let hits = 0;
  const feed = createKonami(() => (hits += 1));
  const keys = [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
    'b',
    'a',
  ];
  keys.forEach(feed);
  assert.equal(hits, 1);
  ['ArrowUp', 'ArrowUp', 'x'].forEach(feed);
  keys.forEach(feed);
  assert.equal(hits, 2);
  // Capital letters count.
  keys.map((k) => (k.length === 1 ? k.toUpperCase() : k)).forEach(feed);
  assert.equal(hits, 3);
});

test('feed says when a key moved the code forward', () => {
  const feed = createKonami(() => {});
  assert.equal(feed('ArrowUp'), true);
  assert.equal(feed('x'), false);
  assert.equal(feed('b'), false);
});
