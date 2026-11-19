import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PROMPT_V1,
  PROMPT_V2,
  CASES,
  renderPrompt,
  evaluateCheck,
  runSuite,
  compareRuns,
  evaluateGate,
  createVersions,
  saveVersion,
} from '../../src/sims/redarmy-logic.js';

test('templates fill {{name}} placeholders and leave nothing behind', () => {
  assert.equal(renderPrompt('Hi {{a}} and {{b}}', { a: 'x', b: 'y' }), 'Hi x and y');
  assert.equal(renderPrompt('Hi {{missing}}.', {}), 'Hi .');
});

test('checks: contains is case-insensitive, not_contains and max_length work', () => {
  assert.equal(evaluateCheck({ type: 'contains', value: 'MM-1' }, 'order mm-1 here').passed, true);
  assert.equal(evaluateCheck({ type: 'contains', value: 'MM-2' }, 'order mm-1 here').passed, false);
  assert.equal(evaluateCheck({ type: 'not_contains', value: 'guaranteed' }, 'maybe').passed, true);
  assert.equal(evaluateCheck({ type: 'max_length', value: 5 }, 'abcdef').passed, false);
});

test('version 1 passes all 8 cases, as in the project demo', () => {
  const run = runSuite(PROMPT_V1);
  assert.equal(run.results.length, 8);
  assert.equal(run.failedCases, 0);
});

test('version 2 (order number dropped) regresses 7 cases and the eighth still passes', () => {
  const base = runSuite(PROMPT_V1);
  const head = runSuite(PROMPT_V2);
  const comparison = compareRuns(base, head);
  assert.equal(comparison.summary.regressed, 7);
  assert.equal(comparison.summary.still_passing, 1);
  assert.equal(head.results.find((r) => r.id === 'c8').status, 'PASSED');
});

test('the gate fails on regressions and passes when nothing regressed', () => {
  const base = runSuite(PROMPT_V1);
  const bad = runSuite(PROMPT_V2);
  const gate = evaluateGate(bad, compareRuns(base, bad));
  assert.equal(gate.status, 'failed');
  assert.deepEqual(gate.reasons, ['7 case(s) regressed against the baseline']);
  const same = runSuite(PROMPT_V1);
  assert.equal(evaluateGate(same, compareRuns(base, same)).status, 'passed');
});

test('with a baseline, a case that was already failing is tolerated', () => {
  const failingBase = { results: [{ id: 'x', name: 'x', status: 'FAILED' }], failedCases: 1 };
  const stillFailing = { results: [{ id: 'x', name: 'x', status: 'FAILED' }], failedCases: 1 };
  const comparison = compareRuns(failingBase, stillFailing);
  assert.equal(comparison.summary.still_failing, 1);
  assert.equal(evaluateGate(stillFailing, comparison).status, 'passed');
  // Without a baseline the same run fails the gate.
  assert.equal(evaluateGate(stillFailing, null).status, 'failed');
});

test('a fixed case is reported as fixed, a new case as added, a missing case as removed', () => {
  const base = {
    results: [
      { id: 'a', name: 'a', status: 'FAILED' },
      { id: 'b', name: 'b', status: 'PASSED' },
    ],
    failedCases: 1,
  };
  const head = {
    results: [
      { id: 'a', name: 'a', status: 'PASSED' },
      { id: 'c', name: 'c', status: 'PASSED' },
    ],
    failedCases: 0,
  };
  const { items } = compareRuns(base, head);
  const category = (id) => items.find((i) => i.id === id).category;
  assert.equal(category('a'), 'fixed');
  assert.equal(category('b'), 'removed');
  assert.equal(category('c'), 'added');
});

test('versions are immutable and numbered, and an unchanged prompt is refused', () => {
  const versions = createVersions();
  assert.equal(saveVersion(versions, PROMPT_V1).ok, false);
  assert.equal(saveVersion(versions, PROMPT_V2).version.number, 2);
  assert.equal(versions[0].text, PROMPT_V1);
  assert.equal(versions.length, 2);
});

test('every case has at least one check', () => {
  for (const testCase of CASES) assert.ok(testCase.checks.length > 0);
});
