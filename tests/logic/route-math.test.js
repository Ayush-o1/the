import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  stopScrolls,
  stopParam,
  nearestStop,
  jumpIntensity,
  wellStrength,
  probePresence,
} from '../../src/core/route-math.js';

// Three sections, 800 px viewport. The title margin is 12% of the viewport (96 px).
const rects = [
  { top: 0, bottom: 800 },
  { top: 1400, bottom: 3000 },
  { top: 3600, bottom: 4000 },
];
const VIEWPORT = 800;

test('stopScrolls holds each stop from its title to its bottom edge, and stays increasing', () => {
  const ranges = stopScrolls(rects, VIEWPORT);
  // Section 2: from 1400 - 96 = 1304 to 3000 - 704 = 2296.
  assert.deepEqual(ranges[1], { from: 1304, to: 2296 });
  // Section 3 is only 400 px tall, shorter than the screen, so it is a single point.
  assert.equal(ranges[2].from, ranges[2].to);
  for (let i = 1; i < ranges.length; i += 1) assert.ok(ranges[i].from > ranges[i - 1].to);
});

test('stopScrolls fixes overlapping rectangles', () => {
  const ranges = stopScrolls(
    [
      { top: 0, bottom: 100 },
      { top: 0, bottom: 100 },
    ],
    100,
  );
  assert.ok(ranges[1].from > ranges[0].to);
});

test('stopParam clamps before the first and after the last stop', () => {
  const ranges = stopScrolls(rects, VIEWPORT);
  assert.equal(stopParam(ranges, -500), 0);
  assert.equal(stopParam(ranges, 9000), 2);
});

test('stopParam holds still for the whole time a section is on screen', () => {
  const ranges = stopScrolls(rects, VIEWPORT);
  for (const y of [1304, 1800, 2296]) assert.equal(stopParam(ranges, y), 1);
});

test('stopParam travels only in the gap between sections, and is eased at both ends', () => {
  const ranges = stopScrolls(rects, VIEWPORT);
  const gapStart = ranges[1].to;
  const gapEnd = ranges[2].from;
  assert.equal(stopParam(ranges, gapStart), 1);
  assert.equal(stopParam(ranges, gapEnd), 2);
  const middle = stopParam(ranges, (gapStart + gapEnd) / 2);
  assert.ok(Math.abs(middle - 1.5) < 1e-9);
  // Eased: the first and last tenth of the gap cover less than a tenth of the distance each.
  const tenth = (gapEnd - gapStart) / 10;
  assert.ok(stopParam(ranges, gapStart + tenth) - 1 < 0.1);
  assert.ok(2 - stopParam(ranges, gapEnd - tenth) < 0.1);
});

test('stopParam never goes backwards when scrolling forward', () => {
  const ranges = stopScrolls(rects, VIEWPORT);
  let previous = -1;
  for (let y = -100; y <= 4500; y += 7) {
    const value = stopParam(ranges, y);
    assert.ok(value >= previous);
    previous = value;
  }
});

test('stopParam is a pure function of scroll, so scrolling back returns the same value', () => {
  const ranges = stopScrolls(rects, VIEWPORT);
  const forward = stopParam(ranges, 3000);
  stopParam(ranges, 50);
  assert.equal(stopParam(ranges, 3000), forward);
});

test('nearestStop picks the stop whose range is closest', () => {
  const ranges = stopScrolls(rects, VIEWPORT);
  assert.equal(nearestStop(ranges, 0), 0);
  assert.equal(nearestStop(ranges, 1900), 1);
  assert.equal(nearestStop(ranges, 3500), 2);
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

test('wellStrength is 1 at the stop, 0 one stop away, and the same coming or going', () => {
  assert.equal(wellStrength(2, 2), 1);
  assert.equal(wellStrength(1, 2), 0);
  assert.equal(wellStrength(3.5, 2), 0);
  assert.equal(wellStrength(1.4, 2), wellStrength(2.6, 2));
  assert.ok(wellStrength(1.5, 2) > 0 && wellStrength(1.5, 2) < 1);
});

test('the probe is absent at a project, present in the gaps, and the same going and coming', () => {
  const projects = [2, 3];
  assert.equal(probePresence(2, projects), 0);
  assert.equal(probePresence(3.05, projects), 0);
  assert.equal(probePresence(2.5, projects), 1);
  assert.equal(probePresence(0, projects), 1);
  assert.ok(Math.abs(probePresence(2.3, projects) - probePresence(1.7, projects)) < 1e-9);
  assert.ok(probePresence(2.2, projects) > 0 && probePresence(2.2, projects) < 1);
});
