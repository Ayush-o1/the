import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  joinLabels,
  evaluateSend,
  evaluateRead,
  run,
  SCENARIOS,
} from '../../src/sims/deadletter-logic.js';

const trustedPublic = { trusted: true, readers: null };
const untrustedPrivate = { trusted: false, readers: [] };

test('joining labels only makes them stricter', () => {
  assert.deepEqual(joinLabels(trustedPublic, untrustedPrivate), { trusted: false, readers: [] });
  assert.deepEqual(joinLabels(trustedPublic, trustedPublic), { trusted: true, readers: null });
  assert.deepEqual(
    joinLabels({ trusted: true, readers: ['a', 'b'] }, { trusted: true, readers: ['b', 'c'] }),
    { trusted: true, readers: ['b'] },
  );
  // Two disjoint reader lists give "the user only", never public.
  assert.deepEqual(
    joinLabels({ trusted: true, readers: ['a'] }, { trusted: true, readers: ['c'] }).readers,
    [],
  );
});

test('the policy matrix from the documentation', () => {
  const named = { label: trustedPublic, namedByUser: true };
  const trusted = { label: trustedPublic, namedByUser: false };
  const untrusted = { label: { trusted: false, readers: null }, namedByUser: false };
  const priv = untrustedPrivate;
  const pub = { trusted: true, readers: null };
  assert.equal(evaluateSend(named, priv).decision, 'allow');
  assert.equal(evaluateSend(trusted, priv).decision, 'ask');
  assert.equal(evaluateSend(trusted, pub).decision, 'allow');
  assert.equal(evaluateSend(untrusted, pub).decision, 'ask');
  assert.equal(evaluateSend(untrusted, priv).decision, 'deny');
  assert.equal(evaluateSend(untrusted, priv).rule, 'untrusted_destination_private_data');
});

test('a read chosen by untrusted text asks, a read you chose is allowed', () => {
  assert.equal(evaluateRead(true).decision, 'ask');
  assert.equal(evaluateRead(false).decision, 'allow');
});

test('no defence: both injection attacks work and the task runs', () => {
  assert.equal(run('forward-inbox', 'none').worked, true);
  assert.equal(run('steal-file', 'none').worked, true);
  assert.equal(run('ordinary', 'none').worked, false);
  assert.equal(run('ordinary', 'none').completed, true);
});

test('session taint blocks the attacks and also your own task', () => {
  for (const scenario of SCENARIOS) {
    const result = run(scenario.id, 'taint');
    assert.equal(result.worked, false);
    assert.equal(result.completed, false);
  }
});

test('deadLetter stops the injected calls, denies the private send and completes the task', () => {
  for (const id of ['forward-inbox', 'steal-file']) {
    const result = run(id, 'deadletter');
    assert.equal(result.worked, false);
    assert.equal(result.completed, true);
    const hypothetical = result.steps.filter((s) => s.hypothetical && s.verdict === 'deny');
    assert.equal(hypothetical.length, 1);
    assert.equal(hypothetical[0].rule, 'untrusted_destination_private_data');
  }
});

test('the swapped address asks you; rejecting stops it, approving lets it through', () => {
  const rejected = run('swapped-address', 'deadletter', { approve: false });
  assert.equal(rejected.asks, true);
  assert.equal(rejected.worked, false);
  const approved = run('swapped-address', 'deadletter', { approve: true });
  assert.equal(approved.worked, true);
});

test('the misleading summary is allowed, and the simulation says deadLetter does not stop it', () => {
  const result = run('misleading', 'deadletter');
  assert.equal(result.worked, true);
  assert.match(result.outcome, /does not claim to stop this one/);
});

test('the ordinary task completes with deadLetter and no attack is reported', () => {
  const result = run('ordinary', 'deadletter');
  assert.equal(result.completed, true);
  assert.equal(result.outcome, 'Task completed.');
});
