import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  burstCount,
  meanAndStd,
  buildWorld,
  detect,
  injectAnomaly,
  layout,
  BURST_SIZE,
  Z_THRESHOLD,
} from '../../src/sims/argus-logic.js';

test('burstCount finds the most events in any 6 hour window', () => {
  assert.equal(burstCount([]), 0);
  assert.equal(burstCount([1]), 1);
  assert.equal(burstCount([0, 1, 2, 30, 31]), 3);
  // Exactly 6 hours apart is outside the window, 5.99 is inside.
  assert.equal(burstCount([0, 6]), 1);
  assert.equal(burstCount([0, 5.99]), 2);
});

test('burstCount does not care about input order', () => {
  assert.equal(burstCount([31, 2, 0, 30, 1]), 3);
});

test('meanAndStd of a known set', () => {
  const { mean, std } = meanAndStd([2, 4, 4, 4, 5, 5, 7, 9]);
  assert.equal(mean, 5);
  assert.equal(std, 2);
});

test('the baseline world has no flagged accounts', () => {
  const world = buildWorld();
  assert.equal(detect(world).flagged.length, 0);
});

test('injecting an anomaly flags exactly that account with a burst of at least 35', () => {
  const world = buildWorld();
  const index = injectAnomaly(world);
  const { flagged } = detect(world);
  assert.equal(flagged.length, 1);
  assert.equal(flagged[0].index, index);
  assert.ok(flagged[0].burst >= BURST_SIZE);
  assert.ok(flagged[0].z >= Z_THRESHOLD);
});

test('the same seed gives the same world, anomaly and flag', () => {
  const a = buildWorld(11);
  const b = buildWorld(11);
  assert.equal(injectAnomaly(a), injectAnomaly(b));
  assert.deepEqual(detect(a).flagged, detect(b).flagged);
});

test('several injections each flag a new account', () => {
  const world = buildWorld();
  const used = new Set();
  for (let i = 0; i < 3; i += 1) used.add(injectAnomaly(world));
  assert.equal(used.size, 3);
  assert.equal(detect(world).flagged.length, 3);
});

test('layout stays inside the unit square and is repeatable', () => {
  const world = buildWorld();
  const first = layout(world);
  const second = layout(world);
  assert.deepEqual(first, second);
  for (const { x, y } of first) {
    assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1);
  }
});
