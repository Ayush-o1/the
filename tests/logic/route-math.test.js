import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stopScrolls, stopParam, nearestStop, jumpIntensity } from '../../src/core/route-math.js';

const rects = [
  { top: 0, bottom: 800 },
  { top: 800, bottom: 2000 },
  { top: 2000, bottom: 3000 },
];

test('stopScrolls centres each rectangle in the viewport and stays increasing', () => {
  const scrolls = stopScrolls(rects, 800);
  assert.deepEqual(scrolls, [0, 1000, 2100]);
  for (let i = 1; i < scrolls.length; i += 1) assert.ok(scrolls[i] > scrolls[i - 1]);
});

test('stopScrolls fixes overlapping rectangles', () => {
  const scrolls = stopScrolls(
    [
      { top: 0, bottom: 100 },
      { top: 0, bottom: 100 },
    ],
    100,
  );
  assert.ok(scrolls[1] > scrolls[0]);
});

test('stopParam clamps before the first and after the last stop', () => {
  const scrolls = [100, 1000, 2000];
  assert.equal(stopParam(scrolls, -50), 0);
  assert.equal(stopParam(scrolls, 5000), 2);
});

test('stopParam holds still near a stop and travels in the middle', () => {
  const scrolls = [0, 1000];
  assert.equal(stopParam(scrolls, 100), 0);
  assert.equal(stopParam(scrolls, 900), 1);
  assert.equal(stopParam(scrolls, 500), 0.5);
});

test('stopParam never goes backwards when scrolling forward', () => {
  const scrolls = [0, 700, 1900, 2500];
  let previous = -1;
  for (let y = -100; y <= 2700; y += 7) {
    const value = stopParam(scrolls, y);
    assert.ok(value >= previous);
    previous = value;
  }
});

test('stopParam is a pure function of scroll, so scrolling back returns the same value', () => {
  const scrolls = [0, 700, 1900];
  const forward = stopParam(scrolls, 1234);
  stopParam(scrolls, 50);
  assert.equal(stopParam(scrolls, 1234), forward);
});

test('nearestStop picks the closest centre', () => {
  const scrolls = [0, 1000, 3000];
  assert.equal(nearestStop(scrolls, 400), 0);
  assert.equal(nearestStop(scrolls, 700), 1);
  assert.equal(nearestStop(scrolls, 2500), 2);
});

test('jumpIntensity is zero outside a jump and at both ends, and peaks half way', () => {
  const jumps = [[2, 3]];
  assert.equal(jumpIntensity(1.9, jumps), 0);
  assert.equal(jumpIntensity(2, jumps), 0);
  assert.equal(jumpIntensity(3, jumps), 0);
  assert.equal(jumpIntensity(3.4, jumps), 0);
  assert.equal(jumpIntensity(2.5, jumps), 1);
  assert.ok(jumpIntensity(2.25, jumps) > 0 && jumpIntensity(2.25, jumps) < 1);
});

test('jumpIntensity depends only on progress, so scrubbing back gives the same value', () => {
  const jumps = [
    [2, 3],
    [3, 4],
  ];
  const forward = jumpIntensity(3.7, jumps);
  jumpIntensity(1, jumps);
  assert.equal(jumpIntensity(3.7, jumps), forward);
});
