// theRedArmy simulation logic: prompt regression testing with a CI gate.
//   - the deterministic checks: theRedArmy src/engine/assertions.js
//   - run comparison and gate:  src/modules/runs/compare.js (classify, evaluateGate)
//   - the simulated provider echoes the prompt back, as the real one does (README)
// The eight tickets are made up. The prompt text is plain templating with {{name}} placeholders.

export const PROMPT_V1 = [
  'You are the support assistant for Monsoon Market. Reply to the customer ticket below.',
  "Quote the customer's order number ({{order}}) in your reply.",
  'Ticket: {{ticket}}',
].join('\n');

export const PROMPT_V2 = 'Reply briefly to this ticket: {{ticket}}';

const withOrder = (id, order, ticket) => ({
  id,
  name: ticket.slice(0, 34).trim() + '...',
  vars: { order, ticket },
  checks: [{ type: 'contains', value: order }],
});

export const CASES = [
  withOrder('c1', 'MM-10421', 'My parcel is six days late. Can I get a refund?'),
  withOrder('c2', 'MM-10433', 'The kettle arrived with a cracked lid.'),
  withOrder('c3', 'MM-10458', 'I was charged twice for the same order.'),
  withOrder('c4', 'MM-10462', 'Please change my delivery address to Pune.'),
  withOrder('c5', 'MM-10475', 'Where is my order? The tracking page is empty.'),
  withOrder('c6', 'MM-10490', 'I ordered the wrong size. How do I exchange it?'),
  withOrder('c7', 'MM-10502', 'The invoice shows the wrong GST number.'),
  {
    id: 'c8',
    name: 'Do you deliver to 560103?...',
    vars: { order: '', ticket: 'Do you deliver to pincode 560103?' },
    checks: [
      { type: 'not_contains', value: 'guaranteed' },
      { type: 'max_length', value: 900 },
    ],
  },
];

export function renderPrompt(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, name) => vars[name] ?? '');
}

// One deterministic check. Returns { type, passed, message }, like the real engine.
export function evaluateCheck(check, output) {
  const text = String(output);
  switch (check.type) {
    case 'contains': {
      const passed = text.toLowerCase().includes(check.value.toLowerCase());
      return {
        type: check.type,
        passed,
        message: passed
          ? `Output contains "${check.value}".`
          : `Output does not contain "${check.value}".`,
      };
    }
    case 'not_contains': {
      const passed = !text.toLowerCase().includes(check.value.toLowerCase());
      return {
        type: check.type,
        passed,
        message: passed
          ? `Output does not contain "${check.value}".`
          : `Output contains "${check.value}".`,
      };
    }
    case 'max_length': {
      const passed = text.length <= check.value;
      return {
        type: check.type,
        passed,
        message: `Output is ${text.length} characters. Limit ${check.value}.`,
      };
    }
    default:
      return { type: check.type, passed: false, message: `Unknown check ${check.type}.` };
  }
}

// Runs the whole suite against one prompt version. The simulated provider echoes the rendered prompt.
export function runSuite(promptText, cases = CASES) {
  const results = cases.map((testCase) => {
    const output = renderPrompt(promptText, testCase.vars);
    const assertionResults = testCase.checks.map((check) => evaluateCheck(check, output));
    return {
      id: testCase.id,
      name: testCase.name,
      status: assertionResults.every((r) => r.passed) ? 'PASSED' : 'FAILED',
      output,
      assertionResults,
    };
  });
  return { results, failedCases: results.filter((r) => r.status === 'FAILED').length };
}

// Same categories and order as the real comparison.
function classify(base, head) {
  if (!base) return 'added';
  if (!head) return 'removed';
  if (base.status === 'PASSED' && head.status === 'FAILED') return 'regressed';
  if (base.status === 'FAILED' && head.status === 'PASSED') return 'fixed';
  if (base.status === 'FAILED' && head.status === 'FAILED') return 'still_failing';
  return 'still_passing';
}

export function compareRuns(baseRun, headRun) {
  const base = new Map(baseRun.results.map((r) => [r.id, r]));
  const head = new Map(headRun.results.map((r) => [r.id, r]));
  const ids = [...new Set([...base.keys(), ...head.keys()])];
  const items = ids.map((id) => ({
    id,
    name: (head.get(id) ?? base.get(id)).name,
    category: classify(base.get(id), head.get(id)),
  }));
  const summary = {};
  for (const item of items) summary[item.category] = (summary[item.category] ?? 0) + 1;
  return { items, summary };
}

// The CI decision. With a baseline, a case that was already failing is tolerated and only a
// regression fails the gate. Without one, any failed case fails it.
export function evaluateGate(run, comparison) {
  const reasons = [];
  if (comparison) {
    const regressed = comparison.summary.regressed ?? 0;
    if (regressed > 0) reasons.push(`${regressed} case(s) regressed against the baseline`);
  } else if (run.failedCases > 0) {
    reasons.push(`${run.failedCases} case(s) failed`);
  }
  return reasons.length ? { status: 'failed', reasons } : { status: 'passed', reasons: [] };
}

// Versions are immutable. Saving creates the next number, and an unchanged prompt is refused.
export function createVersions() {
  return [{ number: 1, text: PROMPT_V1 }];
}

export function saveVersion(versions, text) {
  const latest = versions[versions.length - 1];
  if (text.trim() === latest.text.trim()) {
    return { ok: false, error: 'Nothing changed, so there is no new version.' };
  }
  const version = { number: latest.number + 1, text: text.trim() };
  versions.push(version);
  return { ok: true, version };
}
