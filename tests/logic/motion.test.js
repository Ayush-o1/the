import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFollower, springStep, omegaFor, CAMERA_HALF_LIFE } from '../../src/core/motion.js';

function run(fps, seconds, target) {
  const follower = createFollower(0);
  const dt = 1 / fps;
  const samples = [];
  for (let i = 0; i < seconds * fps; i += 1) samples.push(follower.step(target, dt));
  return { follower, samples };
}

test('the follower never overshoots a fixed target', () => {
  const { samples } = run(60, 6, 10);
  for (const x of samples) assert.ok(x <= 10 + 1e-9);
  assert.ok(samples.at(-1) > 9.999);
});

test('it covers half the distance in about the half-life', () => {
  const { samples } = run(1000, 1, 1);
  const halfIndex = samples.findIndex((x) => x >= 0.5);
  const seconds = halfIndex / 1000;
  assert.ok(Math.abs(seconds - CAMERA_HALF_LIFE) < 0.02, `took ${seconds}s`);
});

test('the result is the same at 30, 60 and 144 frames per second', () => {
  const at30 = run(30, 1, 5).samples.at(-1);
  const at60 = run(60, 1, 5).samples.at(-1);
  const at144 = run(144, 1, 5).samples.at(-1);
  assert.ok(Math.abs(at30 - at60) < 1e-9);
  assert.ok(Math.abs(at60 - at144) < 1e-9);
});

test('when the target reverses, the position stays continuous and the speed changes smoothly', () => {
  const follower = createFollower(0);
  const dt = 1 / 60;
  const positions = [];
  const speeds = [];
  for (let i = 0; i < 90; i += 1) {
    follower.step(i < 45 ? 10 : 0, dt);
    positions.push(follower.value);
    speeds.push(follower.velocity);
  }
  // Speed can only change as fast as the spring pulls: omega squared times the distance, per frame.
  // An exponential ease would flip its speed in one frame at the reversal. This cannot.
  const pull = omegaFor(CAMERA_HALF_LIFE) ** 2 * 10 * dt;
  for (let i = 1; i < positions.length; i += 1) {
    assert.ok(Math.abs(positions[i] - positions[i - 1]) < 0.4);
    assert.ok(Math.abs(speeds[i] - speeds[i - 1]) <= pull + 1e-9, `jump at frame ${i}`);
  }
  // At the reversal frame the speed is still forward, and it comes back through zero.
  assert.ok(speeds[45] > 0);
  assert.ok(speeds[89] <= 0);
  // It was still travelling forward a moment after the reversal: it slowed down, it did not snap.
  assert.ok(positions[46] > positions[44]);
});

test('scrubbing forward and back follows the same curve in mirror image', () => {
  const forward = run(60, 3, 8).samples;
  const back = createFollower(8);
  const dt = 1 / 60;
  const mirrored = [];
  for (let i = 0; i < 180; i += 1) mirrored.push(8 - back.step(0, dt));
  for (let i = 0; i < 180; i += 1) assert.ok(Math.abs(forward[i] - mirrored[i]) < 1e-9);
});

test('a zero step changes nothing', () => {
  const state = { x: 3, v: 2 };
  springStep(state, 5, omegaFor(0.35), 0);
  assert.equal(state.x, 3);
  assert.equal(state.v, 2);
});
