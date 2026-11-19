import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTimeline, HULL_END, DRIFT_PEAK } from '../../src/core/hazard-timeline.js';
import { closestApproach, missDistanceKm } from '../../src/lib/orbit.js';

const ids = [
  'launch',
  'belt',
  'argus',
  'blackwater',
  'beetlejuice',
  'theredarmy',
  'deadletter',
  'europa',
  'cargo',
  'crew',
  'contact',
];
const timeline = createTimeline((id) => ids.indexOf(id));
const at = (param) => timeline.evaluate(param);

test('the hull starts at 100, drops at each hazard and never goes up', () => {
  assert.equal(at(0).hull, 100);
  assert.equal(at(1.5).hull, 94);
  let previous = 100;
  for (let p = 0; p <= 10; p += 0.01) {
    const hull = at(p).hull;
    assert.ok(hull <= previous, `hull rose at ${p}`);
    previous = hull;
  }
  assert.equal(at(10).hull, HULL_END);
});

test('the gravity well is zero away from BlackWater, peaks at it and slows the clock', () => {
  assert.equal(at(1.5).gravity, 0);
  assert.equal(at(4.5).gravity, 0);
  assert.equal(at(3).gravity, 1);
  assert.ok(at(3).timeScale < 0.2);
  assert.equal(at(1.5).timeScale, 1);
});

test('colour fringing only happens at the peak of the well', () => {
  assert.equal(at(2.4).chroma, 0);
  assert.equal(at(3).chroma, 1);
});

test('BlackWater alerts follow the real incident lifecycle, in order', () => {
  const order = [];
  for (let p = 1.9; p < 3.7; p += 0.01) {
    const key = at(p).alert?.key;
    if (key?.startsWith('incident') || key === 'well-detected') {
      if (order.at(-1) !== key) order.push(key);
    }
  }
  assert.deepEqual(order, [
    'well-detected',
    'incident-triggered',
    'incident-acknowledged',
    'incident-resolved',
    'incident-closed',
  ]);
});

test('drift grows to its peak, then a star fix brings it back to zero', () => {
  assert.equal(at(3.4).drift, 0);
  assert.ok(at(4.05).drift > 0.5 * DRIFT_PEAK);
  assert.ok(at(4.1).drift > 0.7 * DRIFT_PEAK);
  assert.equal(at(5).drift, 0);
  assert.equal(at(4.2).alert.key, 'star-fix');
});

test('flicker is only near the deadLetter stop', () => {
  assert.equal(at(3).flicker, 0);
  assert.equal(at(6).flicker, 1);
  assert.equal(at(8).flicker, 0);
});

test('the timeline is a pure function: scrubbing back gives identical answers', () => {
  const forward = [];
  for (let p = 0; p <= 10; p += 0.5) forward.push(JSON.stringify(at(p)));
  const backward = [];
  for (let p = 10; p >= 0; p -= 0.5) backward.unshift(JSON.stringify(at(p)));
  assert.deepEqual(backward, forward);
});

test('every hazard has an alert, and the flight ends with the arrival line', () => {
  const keys = new Set();
  for (let p = 0; p <= 10; p += 0.02) {
    const alert = at(p).alert;
    if (alert) keys.add(alert.key);
  }
  for (const key of [
    'belt-contacts',
    'belt-hull',
    'well-detected',
    'drift',
    'star-fix',
    'msg-hostile',
    'signal-quarantined',
    'conjunction',
    'arrived',
  ]) {
    assert.ok(keys.has(key), `missing ${key}`);
  }
  assert.equal(at(10).alert.key, 'arrived');
});

test('closestApproach finds the nearest point on a straight track', () => {
  const result = closestApproach([-10, 3, 0], [1, 0, 0], [0, 0, 0]);
  assert.equal(result.time, 10);
  assert.ok(Math.abs(result.distance - 3) < 1e-9);
});

test('missDistanceKm scales units to kilometres', () => {
  const km = missDistanceKm([-10, 12, 0], [1, 0, 0], [0, 0, 0]);
  assert.ok(Math.abs(km - 12 * 0.35) < 1e-9);
});
