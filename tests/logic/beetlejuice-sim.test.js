import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  reconcile,
  createWorkflow,
  propose,
  decide,
  expectedFee,
  formatRupees,
  USERS,
} from '../../src/sims/beetlejuice-logic.js';

const user = (id) => USERS.find((u) => u.id === id);
const outcomeOf = (ref) => reconcile().find((r) => r.ref === ref);

test('rupee formatting from whole paise', () => {
  assert.equal(formatRupees(125000), '₹1,250.00');
  assert.equal(formatRupees(-5000), '-₹50.00');
  assert.equal(formatRupees(5), '₹0.05');
});

test('expected fee rounds half up using integers', () => {
  assert.equal(expectedFee(500000), 10000);
  assert.equal(expectedFee(25), 1); // 2% of 25 paise is 0.5, which rounds up
  assert.equal(expectedFee(24), 0);
});

test('each reference gets exactly one explained outcome, with the right rule', () => {
  const results = reconcile();
  assert.equal(new Set(results.map((r) => r.ref)).size, results.length);
  assert.deepEqual(
    results.map((r) => [r.ref, r.outcome, r.type ?? null, r.rule]),
    [
      ['PAY-1001', 'MATCHED', null, 'R01'],
      ['PAY-1002', 'BREAK', 'AMOUNT_MISMATCH', 'R02'],
      ['PAY-1003', 'BREAK', 'DUPLICATE_SETTLEMENT', 'R03'],
      ['PAY-1004', 'BREAK', 'MISSING_IN_SETTLEMENT', 'R06'],
      ['PAY-1005', 'PENDING', null, 'R04'],
      ['PAY-1006', 'BREAK', 'FEE_VARIANCE', 'R08'],
      ['PAY-9009', 'BREAK', 'MISSING_IN_LEDGER', 'R05'],
    ],
  );
  for (const r of results) assert.ok(r.why.length > 10);
});

test('the amount mismatch explanation matches the rules document example', () => {
  assert.match(outcomeOf('PAY-1002').why, /Difference \+₹50\.00/);
});

test('pending is not a break, and a later as-of date makes it one', () => {
  assert.equal(outcomeOf('PAY-1005').outcome, 'PENDING');
  const later = reconcile(undefined, undefined, {
    asOf: '2026-11-12',
    windowDays: 2,
    feeRateBp: 200,
    feeTolerancePaise: 1,
  });
  assert.equal(later.find((r) => r.ref === 'PAY-1005').type, 'MISSING_IN_SETTLEMENT');
});

test('a ledger entry and two different settlement lines is ambiguous, not guessed', () => {
  const results = reconcile(
    [{ ref: 'X', paise: 100, date: '2026-11-08' }],
    [
      { ref: 'X', paise: 150, feePaise: 3 },
      { ref: 'X', paise: 150, feePaise: 3 },
    ],
  );
  assert.equal(results[0].type, 'AMBIGUOUS_REFERENCE');
});

test('only breaks enter the workflow and they start open', () => {
  const workflow = createWorkflow();
  assert.equal(workflow.breaks.length, 5);
  assert.ok(workflow.breaks.every((b) => b.status === 'open'));
});

const proposal = { code: 'CORRECT_LEDGER', note: 'Ledger typed 1,200 instead of 1,250.' };

test('an analyst proposes and the break moves to pending_review', () => {
  const workflow = createWorkflow();
  assert.equal(propose(workflow, user('asha'), 'PAY-1002', proposal).ok, true);
  assert.equal(workflow.breaks.find((b) => b.ref === 'PAY-1002').status, 'pending_review');
});

test('a supervisor cannot propose unless the simulation switch is on', () => {
  const workflow = createWorkflow();
  assert.equal(
    propose(workflow, user('ravi'), 'PAY-1002', proposal).error,
    'Only analysts can propose a resolution.',
  );
});

test('a proposal needs a code and a note of at least 10 characters', () => {
  const workflow = createWorkflow();
  assert.equal(
    propose(workflow, user('asha'), 'PAY-1002', { code: 'CORRECT_LEDGER', note: 'short' }).ok,
    false,
  );
  assert.equal(
    propose(workflow, user('asha'), 'PAY-1002', { code: 'NOPE', note: 'long enough note' }).ok,
    false,
  );
});

test('only one proposal at a time per break', () => {
  const workflow = createWorkflow();
  propose(workflow, user('asha'), 'PAY-1002', proposal);
  assert.equal(
    propose(workflow, user('dev'), 'PAY-1002', proposal).error,
    'This break already has a proposal awaiting review.',
  );
});

test('an analyst cannot decide, because the role rule stops them first', () => {
  const workflow = createWorkflow();
  propose(workflow, user('asha'), 'PAY-1002', proposal);
  const result = decide(workflow, user('asha'), 'PAY-1002', { decision: 'approved' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'ROLE');
});

test('with supervisors allowed to propose, approving your own proposal is blocked and audited', () => {
  const workflow = createWorkflow();
  workflow.supervisorsMayPropose = true;
  propose(workflow, user('ravi'), 'PAY-1002', proposal);
  const result = decide(workflow, user('ravi'), 'PAY-1002', { decision: 'approved' });
  assert.equal(result.error, 'You cannot approve or reject a resolution you proposed.');
  assert.equal(result.code, 'SELF_DECISION_FORBIDDEN');
  assert.equal(workflow.breaks.find((b) => b.ref === 'PAY-1002').status, 'pending_review');
  assert.equal(workflow.audit.at(-1).action, 'proposal.self_decision_blocked');
});

test('a different supervisor can approve, which resolves the break', () => {
  const workflow = createWorkflow();
  propose(workflow, user('asha'), 'PAY-1002', proposal);
  assert.equal(decide(workflow, user('meera'), 'PAY-1002', { decision: 'approved' }).ok, true);
  assert.equal(workflow.breaks.find((b) => b.ref === 'PAY-1002').status, 'resolved');
  assert.deepEqual(
    workflow.audit.map((a) => a.action),
    ['proposal.created', 'proposal.approved', 'break.resolved'],
  );
});

test('a rejection needs a reason and reopens the break', () => {
  const workflow = createWorkflow();
  propose(workflow, user('asha'), 'PAY-1002', proposal);
  assert.equal(
    decide(workflow, user('ravi'), 'PAY-1002', { decision: 'rejected', note: 'no' }).ok,
    false,
  );
  assert.equal(
    decide(workflow, user('ravi'), 'PAY-1002', {
      decision: 'rejected',
      note: 'Needs the bank file.',
    }).ok,
    true,
  );
  assert.equal(workflow.breaks.find((b) => b.ref === 'PAY-1002').status, 'open');
  assert.equal(workflow.audit.at(-1).action, 'break.reopened');
});

test('a decided proposal cannot be decided again', () => {
  const workflow = createWorkflow();
  propose(workflow, user('asha'), 'PAY-1002', proposal);
  decide(workflow, user('ravi'), 'PAY-1002', { decision: 'approved' });
  assert.equal(
    decide(workflow, user('meera'), 'PAY-1002', { decision: 'approved' }).error,
    'This proposal was already approved.',
  );
});
