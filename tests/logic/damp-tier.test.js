import { test } from 'node:test';
import assert from 'node:assert/strict';
import { damp } from '../../src/core/damp.js';
import { createTierMonitor } from '../../src/core/tier.js';
import { decideMode } from '../../src/core/capabilities.js';

test('damp covers the same distance in the same time at 30 and 120 fps', () => {
  function run(fps) {
    let value = 0;
    const dt = 1 / fps;
    for (let i = 0; i < fps; i += 1) value = damp(value, 100, 6, dt);
    return value;
  }
  assert.ok(Math.abs(run(30) - run(120)) < 1e-9);
});

test('damp moves toward the target and never overshoots', () => {
  let value = 0;
  for (let i = 0; i < 200; i += 1) {
    value = damp(value, 10, 6, 1 / 60);
    assert.ok(value <= 10);
  }
  assert.ok(value > 9.99);
});

test('tier monitor drops from mid to low after 90 slow frames', () => {
  const monitor = createTierMonitor('mid');
  for (let i = 0; i < 89; i += 1) assert.equal(monitor.sample(30), null);
  assert.equal(monitor.sample(30), 'low');
});

test('tier monitor ignores a single slow frame and huge gaps', () => {
  const monitor = createTierMonitor('mid');
  for (let i = 0; i < 500; i += 1) assert.equal(monitor.sample(i % 2 ? 30 : 16), null);
  for (let i = 0; i < 500; i += 1) assert.equal(monitor.sample(2000), null);
});

test('tier monitor rises from mid to high after 300 fast frames', () => {
  const monitor = createTierMonitor('mid');
  let result = null;
  for (let i = 0; i < 300; i += 1) result = monitor.sample(16.7, 3);
  assert.equal(result, 'high');
});

test('tier monitor does not rise when frames are late or the work is heavy', () => {
  const monitor = createTierMonitor('mid');
  for (let i = 0; i < 600; i += 1) assert.equal(monitor.sample(16.7, 10), null);
  for (let i = 0; i < 600; i += 1) assert.equal(monitor.sample(22, 3), null);
});

const base = {
  webgl2: true,
  reducedMotion: false,
  saveData: false,
  queryLite: null,
  savedLite: null,
};

test('decideMode: default is the scene', () => {
  assert.equal(decideMode(base).mode, 'scene');
});

test('decideMode: lite for reduced motion, data saver, no WebGL 2, saved choice, ?lite=1', () => {
  assert.equal(decideMode({ ...base, reducedMotion: true }).mode, 'lite');
  assert.equal(decideMode({ ...base, saveData: true }).mode, 'lite');
  assert.equal(decideMode({ ...base, webgl2: false }).mode, 'lite');
  assert.equal(decideMode({ ...base, savedLite: '1' }).mode, 'lite');
  assert.equal(decideMode({ ...base, queryLite: '1' }).mode, 'lite');
});

test('decideMode: ?lite=0 forces the scene except without WebGL 2', () => {
  assert.equal(decideMode({ ...base, reducedMotion: true, queryLite: '0' }).mode, 'scene');
  assert.equal(decideMode({ ...base, webgl2: false, queryLite: '0' }).mode, 'lite');
});
