import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  missScore,
  timeScore,
  probabilityScore,
  freshnessScore,
  pairKey,
  assess,
  screen,
  EVENTS,
  canonicalStringify,
  sha256Hex,
  seedLog,
  appendEntry,
  verifyLog,
  GENESIS_PREV_HASH,
} from '../../src/sims/europa-logic.js';

test('miss distance bands match the real thresholds', () => {
  assert.equal(missScore(0.3), 50);
  assert.equal(missScore(0.5), 40);
  assert.equal(missScore(1.5), 30);
  assert.equal(missScore(4.2), 20);
  assert.equal(missScore(8), 10);
  assert.equal(missScore(10), 0);
});

test('time, probability and freshness scores', () => {
  assert.equal(timeScore(10), 30);
  assert.equal(timeScore(30), 20);
  assert.equal(timeScore(60), 10);
  assert.equal(timeScore(100), 0);
  assert.equal(timeScore(-1), 0);
  assert.equal(probabilityScore(3e-4), 15);
  assert.equal(probabilityScore(2e-5), 10);
  assert.equal(probabilityScore(3e-6), 5);
  assert.equal(probabilityScore(1e-7), 0);
  assert.equal(freshnessScore(0.5), 5);
  assert.equal(freshnessScore(2), 3);
  assert.equal(freshnessScore(5), 0);
});

test('pairKey is the same in either order', () => {
  assert.equal(pairKey(91001, 91017), '91001:91017');
  assert.equal(pairKey(91017, 91001), '91001:91017');
});

test('assessment gives the expected scores and urgency levels', () => {
  const byId = (id) => assess(EVENTS.find((e) => e.id === id));
  assert.deepEqual([byId('e1').score, byId('e1').urgency], [100, 'CRITICAL']);
  assert.deepEqual([byId('e2').score, byId('e2').urgency], [63, 'HIGH']);
  assert.deepEqual([byId('e4').score, byId('e4').urgency], [48, 'MEDIUM']);
  assert.deepEqual([byId('e5').score, byId('e5').urgency], [20, 'LOW']);
});

test('anything under 0.5 km and 24 hours is critical', () => {
  const result = assess({ primary: 1, secondary: 2, missKm: 0.4, hours: 20, maxProb: 0, dse: 9 });
  // With the default weights this is also 75 points or more, so the extra rule never has to act on its own.
  assert.equal(result.urgency, 'CRITICAL');
});

test('screening merges the same pair listed in the other order and sorts by priority', () => {
  const rows = screen();
  assert.equal(rows.length, 4);
  assert.deepEqual(rows[0].listings, ['e1', 'e3']);
  const scores = rows.map((r) => r.score);
  assert.deepEqual(
    scores,
    [...scores].sort((a, b) => b - a),
  );
});

test('canonicalStringify sorts keys at every level', () => {
  assert.equal(
    canonicalStringify({ b: 1, a: { d: 2, c: [3, { z: 1, y: 2 }] } }),
    '{"a":{"c":[3,{"y":2,"z":1}],"d":2},"b":1}',
  );
});

test('sha256Hex agrees with Node crypto', async () => {
  assert.equal(await sha256Hex('abc'), createHash('sha256').update('abc').digest('hex'));
});

test('a fresh log verifies and starts from the genesis hash', async () => {
  const log = await seedLog();
  assert.equal(log[0].prevHash, GENESIS_PREV_HASH);
  assert.equal(log[1].prevHash, log[0].hash);
  const result = await verifyLog(log);
  assert.equal(result.valid, true);
  assert.equal(result.total, 5);
});

test('changing one old entry breaks the chain at exactly that entry', async () => {
  const log = await seedLog();
  log[2].payload = { ...log[2].payload, note: 'Nothing to see here.' };
  const result = await verifyLog(log);
  assert.equal(result.valid, false);
  assert.equal(result.failedAt, 3);
  assert.match(result.error, /Entry hash verification failed at sequence 3/);
});

test('rewriting the entry hash too just moves the failure to the next link', async () => {
  const log = await seedLog();
  log[1].payload = { ...log[1].payload, note: 'edited' };
  const { entryHash } = await import('../../src/sims/europa-logic.js');
  log[1].hash = await entryHash(log[1]);
  const result = await verifyLog(log);
  assert.equal(result.failedAt, 3);
  assert.match(result.error, /Predecessor hash mismatch at sequence 3/);
});

test('removing an entry is a sequence gap, and appending keeps the chain valid', async () => {
  const log = await seedLog();
  await appendEntry(log, { action: 'ACKNOWLEDGE', payload: { pair: '1:2', note: 'ok' } });
  assert.equal((await verifyLog(log)).valid, true);
  log.splice(1, 1);
  const result = await verifyLog(log);
  assert.equal(result.valid, false);
  assert.match(result.error, /Sequence gap detected/);
});
