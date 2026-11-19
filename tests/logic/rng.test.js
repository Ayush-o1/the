import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../src/lib/rng.js';

test('same seed gives the same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 20; i += 1) assert.equal(a(), b());
});

test('values stay in [0, 1) and different seeds differ', () => {
  const a = createRng(1);
  const b = createRng(2);
  let different = false;
  for (let i = 0; i < 100; i += 1) {
    const x = a();
    assert.ok(x >= 0 && x < 1);
    if (x !== b()) different = true;
  }
  assert.ok(different);
});
