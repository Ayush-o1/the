import { test } from 'node:test';
import assert from 'node:assert/strict';

// Real logic tests arrive with the simulations. This one guards the test runner wiring.
test('test runner is wired up', () => {
  assert.equal(1 + 1, 2);
});
